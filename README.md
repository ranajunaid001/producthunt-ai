# Product Hunt AI Agent

An intelligent AI agent built with LangChain that can answer any question about Product Hunt products, analyze user sentiment, and provide insights about trending products.

## 🚀 Features

- **Natural Language Understanding**: Ask questions in plain English about Product Hunt
- **Real-time Data**: Fetches live data from Product Hunt's GraphQL API
- **Sentiment Analysis**: Analyzes user comments to understand product reception
- **Smart Tool Selection**: Agent automatically chooses the right tool based on your question
- **LangSmith Integration**: Full observability of agent decision-making process
- **Jony Ive-inspired UI**: Minimal, clean interface focused on content

## 🏗️ Architecture

This project uses:
- **Next.js 14**: React framework with App Router
- **LangChain**: Agent orchestration and tool management
- **OpenAI GPT-4o-mini**: Cost-effective LLM for agent reasoning
- **Product Hunt GraphQL API**: Direct data access
- **LangSmith**: Monitoring and debugging
- **Railway**: Deployment platform

## 📁 Project Structure
```
producthunt-ai/
├── app/
│   ├── api/
│   │   ├── agent/
│   │   │   └── route.ts         # LangChain agent endpoint
│   │   ├── producthunt/
│   │   │   └── route.ts         # Product Hunt data fetcher
│   │   └── ai-test/
│   │       └── route.ts         # Simple AI test endpoint
│   ├── chat/
│   │   └── page.tsx             # Main chat interface (Jony Ive design)
│   ├── test-producthunt/
│   │   └── page.tsx             # Test page for Product Hunt data
│   ├── test-ai/
│   │   └── page.tsx             # Test page for AI integration
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── lib/
│   ├── productHuntTools.ts      # LangChain tools for Product Hunt
│   └── langsmith.ts             # LangSmith tracing utilities
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript configuration
├── next.config.js              # Next.js configuration
└── README.md                   # This file
```

## 🔧 File Descriptions

### Core Agent Files

#### `app/api/agent/route.ts`
The main LangChain agent endpoint. This is where the AI magic happens.

**Key components:**
- Agent system prompt (customize this for different behaviors)
- LLM configuration (model selection)
- Tool registration
- Agent executor setup

**To modify agent behavior, edit the system prompt:**
```typescript
const SYSTEM_PROMPT = `You are a Product Hunt expert assistant...`
```

#### `lib/productHuntTools.ts`
Defines 4 tools the agent can use:

1. **get_trending_products**: Fetches top products without comments
2. **search_products**: Searches by keywords/categories
3. **get_product_details**: Gets one product with comments
4. **analyze_comments**: Extracts sentiment from comments

**To improve tool selection, modify tool descriptions:**
```typescript
description: "Use this when user asks about popular, hot, trending, or top products."
```

### API Endpoints

#### `app/api/producthunt/route.ts`
Direct Product Hunt GraphQL API integration:
- Fetches products with comments (max 10 per product due to complexity limits)
- Configurable product count
- Returns structured data

### UI Components

#### `app/chat/page.tsx`
Main chat interface with:
- Jony Ive-inspired minimal design
- Real-time message streaming
- Tool usage display
- Example prompts for new users

#### `app/test-producthunt/page.tsx`
Debug interface to:
- Test Product Hunt API directly
- View raw product data and comments
- Verify data fetching

## 🎯 Customizing the Agent

### 1. Change Agent Personality/Behavior

Edit the system prompt in `app/api/agent/route.ts`:
```typescript
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

IMPORTANT: When searching for specific categories or keywords:
- If no products match the search criteria, simply state that no products were found for that category
- DO NOT show unrelated trending products as a fallback
- Only show products that match what the user asked for

Remember: You have access to real Product Hunt data. Always fetch fresh data rather than making assumptions.`
```

**Tips for better prompts:**
- Be specific about desired behavior
- Include examples of good/bad responses
- Set clear boundaries (what NOT to do)
- Define the tone and style

### 2. Change LLM Model

In `app/api/agent/route.ts`:
```typescript
const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',  // Change to 'gpt-4' for better reasoning
  temperature: 0,            // Increase for more creative responses
  openAIApiKey: process.env.OPENAI_API_KEY,
})
```

Model options:
- `gpt-4`: Best reasoning, most expensive
- `gpt-4o-mini`: Good balance (current)
- `gpt-3.5-turbo`: Fastest, cheapest, less accurate

### 3. Improve Tool Selection

Edit tool descriptions in `lib/productHuntTools.ts`:
```typescript
description: "Search for products by keywords or categories. Use this when user asks about specific types of products like 'AI tools', 'video editors', 'legal tech', etc."
```

Better descriptions = better tool selection by the agent.

### 4. Add Custom Analysis

Modify the `analyzeCommentsTool` in `lib/productHuntTools.ts` to:
- Add more sentiment keywords
- Implement more sophisticated analysis
- Extract specific themes (pricing, features, UX)

## 🚀 Setup Instructions

### Environment Variables

Create these in Railway or `.env.local`:
```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Product Hunt
PRODUCTHUNT_TOKEN=your_developer_token

# LangSmith (optional but recommended)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__...
LANGCHAIN_PROJECT=producthunt-ai
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
```

### Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Visit http://localhost:3000/chat
```

### Deployment (Railway)

1. Push to GitHub
2. Connect Railway to your repo
3. Add environment variables
4. Deploy automatically

## 📊 Monitoring with LangSmith

1. Go to [smith.langchain.com](https://smith.langchain.com)
2. View traces of your agent's execution
3. See:
   - Which tools were called
   - Agent's reasoning process
   - Token usage and costs
   - Execution time

## 🧪 Testing the Agent

Try these example queries:

**Basic Queries:**
- "What's trending today?"
- "Show me the hottest products"
- "What products launched today?"

**Category Searches:**
- "Find AI tools"
- "Show me productivity apps"
- "What video editing software launched?"

**Sentiment Analysis:**
- "What do people think about Maillayer?"
- "What are the complaints about the top product?"
- "Which products have the most positive feedback?"

**Complex Queries:**
- "Compare sentiment between the top 3 products"
- "Find AI tools and tell me which one users love most"
- "What features do users want in the productivity apps?"

## 🔄 Future Enhancements

1. **Multi-Agent System** (with LangGraph):
   - Query Planner Agent
   - Data Fetcher Agent
   - Sentiment Analyzer Agent
   - Report Writer Agent

2. **Additional Data Sources**:
   - Reddit discussions
   - Twitter mentions
   - Tech blog reviews

3. **Enhanced Analysis**:
   - Competitor comparison
   - Trend prediction
   - Feature extraction from comments

4. **Caching Layer**:
   - Redis for API responses
   - Reduce API calls
   - Faster responses

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Test with various queries
4. Monitor in LangSmith
5. Submit a pull request

## 📄 License

MIT License - feel free to use this for learning or building your own agents!

## 🙏 Acknowledgments

- Product Hunt for the API access
- LangChain team for the amazing framework
- OpenAI for GPT models
- Jony Ive for design inspiration

---

Built with ❤️ to learn LangChain, LangSmith, and multi-agent systems.
