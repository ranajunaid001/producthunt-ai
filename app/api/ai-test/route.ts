import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { traceLLMCall } from '../../../lib/langsmith'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const result = await traceLLMCall(
      'test-ai-chat',
      async () => {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant for Product Hunt queries.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 200,
        })

        return {
          response: completion.choices[0].message.content,
          model: completion.model,
          usage: completion.usage,
        }
      },
      {
        inputs: { message },
        userId: 'test-user',
        metadata: {
          endpoint: '/api/ai-test',
          timestamp: new Date().toISOString()
        }
      }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
