import { NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { productHuntTools } from '@/lib/productHuntTools'

// Initialize LangSmith tracing
if (process.env.LANGCHAIN_TRACING_V2) {
  console.log('LangSmith tracing enabled')
}

// System prompt for the agent
const SYSTEM_PROMPT = `You are a Product Hunt expert assistant. You help users discover and analyze products launched on Product Hunt.

Your capabilities:
- Find trending and popular products
- Search for products by category or keyword
- Analyze user sentiment from comments
- Provide insights about what users like or dislike
- Compare products based on votes and feedback

When answering questions:
1. Use the appropriate tools to fetch real data
2. Analyze the data thoroughly
3. Provide specific examples from the data
4. If analyzing sentiment, quote actual comments
5. Be concise but comprehensive

Remember: You have access to real Product Hunt data. Always fetch fresh data rather than making assumptions.`

export async function POST(request: Request) {
  try {
    const { question } = await request.json()
    
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    // Initialize the LLM with GPT-4o-mini for cost effectiveness
    const llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    })

    // Create the prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ])

    // Create the agent
    const agent = await createOpenAIFunctionsAgent({
      llm,
      tools: productHuntTools,
      prompt,
    })

    // Create the agent executor
    const agentExecutor = new AgentExecutor({
      agent,
      tools: productHuntTools,
      verbose: true, // This will log to console for debugging
      maxIterations: 5, // Prevent infinite loops
    })

    // Set up environment URL for tools to use
    process.env.NEXT_PUBLIC_APP_URL = new URL(request.url).origin

    // Execute the agent with the user's question
    console.log('Executing agent with question:', question)
    
    const result = await agentExecutor.invoke({
      input: question,
    })

    console.log('Agent execution complete')

    // Extract tool usage information
    const toolsUsed = result.intermediateSteps?.map((step: any) => ({
      tool: step.action.tool,
      input: step.action.toolInput,
      output: step.observation?.substring(0, 100) + '...' // Truncate for response
    })) || []

    return NextResponse.json({
      answer: result.output,
      toolsUsed,
      executionTime: new Date().toISOString(),
    })
    
  } catch (error: any) {
    console.error('Agent execution error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process question', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
