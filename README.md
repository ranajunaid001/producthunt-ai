# Product Hunt AI Agent

An intelligent AI agent built with LangChain that can answer any question about Product Hunt products, analyze user sentiment, and provide insights about trending products.

## 🚀 Features

- **Natural Language Understanding**: Ask questions in plain English about Product Hunt
- **Real-time Data**: Fetches live data from Product Hunt's GraphQL API
- **Sentiment Analysis**: Analyzes user comments to understand product reception
- **Smart Tool Selection**: Agent automatically chooses the right tool based on your question
- **LangSmith Integration**: Full observability of agent decision-making process
- **Jony Ive-inspired UI**: Minimal, clean interface focused on content

## 📁 Complete File Structure & Descriptions

### 🎯 Core Agent Files

#### `/app/api/agent/route.ts`
**Purpose**: Main LangChain agent endpoint that processes user questions
**Key Functions**:
- Initializes the ChatOpenAI LLM (GPT-4o-mini)
- Creates the ReAct agent using `createOpenAIFunctionsAgent`
- Manages agent execution with `AgentExecutor`
- Contains the SYSTEM_PROMPT that defines agent behavior
- Returns answers with tool usage information

**Customization Points**:
- `SYSTEM_PROMPT`: Change agent personality and behavior
- `modelName`: Switch between GPT models
- `temperature`: Control creativity (0 = deterministic, 1 = creative)
- `verbose`: Set to true for debugging (false in production)

#### `/lib/productHuntTools.ts`
**Purpose**: Defines 4 LangChain tools that the agent can use
**Tools**:
1. `getTrendingProductsTool`: Fetches top 10 products without comments
2. `searchProductsTool`: Searches products by keywords/categories
3. `getProductDetailsTool`: Gets one product with all comments
4. `analyzeCommentsTool`: Analyzes sentiment from comments

**Key Functions**:
- `callProductHuntAPI()`: Helper function to call Product Hunt GraphQL
- Each tool has a schema (using Zod) defining its parameters
- Tools return JSON strings for agent consumption

### 📊 API Routes

#### `/app/api/producthunt/route.ts`
**Purpose**: Direct Product Hunt GraphQL API endpoint for testing
**Features**:
- Fetches products with comments (10 comments per product)
- Uses PRODUCTHUNT_TOKEN from environment variables
- Returns structured JSON with products, comments, and metadata
- Handles GraphQL errors

#### `/app/api/ai-test/route.ts`
**Purpose**: Simple OpenAI test endpoint (no LangChain)
**Features**:
- Direct OpenAI API integration
- Tests if OpenAI API key is working
- Simple chat completion without agent logic

### 💬 User Interface Files

#### `/app/chat/page.tsx`
**Purpose**: Main chat interface for interacting with the AI agent
**Features**:
- Jony Ive-inspired minimal design
- Real-time message display
- Shows which tools were used
- Example prompts for new users
- Loading animation
- Smooth scrolling
- Glassmorphism effects

**UI Components**:
- Header with app title
- Message area with user/assistant messages
- Input form with send button
- Tool usage display

#### `/app/test-producthunt/page.tsx`
**Purpose**: Debug interface to test Product Hunt API directly
**Features**:
- Fetches and displays raw Product Hunt data
- Shows all comments with metadata
- Expandable sections for comments and descriptions
- Useful for verifying API integration

#### `/app/test-ai/page.tsx`
**Purpose**: Simple test interface for OpenAI integration
**Features**:
- Tests basic AI responses without agent logic
- Simple input/output interface
- Used to verify OpenAI API key is working

### 🏠 Layout & Entry Files

#### `/app/layout.tsx`
**Purpose**: Root layout wrapper for all pages
**Features**:
- Defines HTML structure
- Sets up global styles
- Wraps all pages with consistent layout

#### `/app/page.tsx`
**Purpose**: Home page (landing page)
**Features**:
- Simple welcome message
- Links to main features

### 🔧 Configuration Files

#### `/package.json`
**Purpose**: Node.js project configuration
**Key Dependencies**:
- `next`: 14.0.4 - React framework
- `langchain`: ^0.1.36 - Agent orchestration
- `@langchain/openai`: ^0.0.25 - OpenAI integration
- `@langchain/core`: ^0.1.40 - Core utilities
- `langsmith`: ^0.1.0 - Monitoring
- `openai`: ^4.20.1 - Direct OpenAI API
- `zod`: ^3.22.4 - Schema validation

#### `/tsconfig.json`
**Purpose**: TypeScript configuration
**Key Settings**:
- Path aliases (`@/` maps to root)
- Strict mode enabled
- JSX preservation for Next.js

#### `/next.config.js`
**Purpose**: Next.js configuration
**Features**:
- Basic Next.js settings
- Can add custom webpack config here

#### `/.env.example`
**Purpose**: Example environment variables (not the actual values)
**Variables**:
- `OPENAI_API_KEY`: OpenAI API key
- `PRODUCTHUNT_TOKEN`: Product Hunt developer token
- `LANGCHAIN_TRACING_V2`: Enable LangSmith
- `LANGCHAIN_API_KEY`: LangSmith API key
- `LANGCHAIN_PROJECT`: Project name in LangSmith
- `LANGCHAIN_ENDPOINT`: LangSmith API endpoint

#### `/.gitignore`
**Purpose**: Files to exclude from Git
**Excludes**:
- `node_modules/`
- `.next/`
- `.env` files
- Build outputs

### 📚 Utility Files

#### `/lib/langsmith.ts`
**Purpose**: LangSmith tracing utilities (currently minimal)
**Features**:
- Initializes LangSmith client
- Wrapper for tracing LLM calls
- Currently not actively used (tracing is automatic)

#### `/lib-old`
**Purpose**: Renamed original lib file (legacy)
**Note**: Can be deleted if not needed

## 🎯 How to Customize Agent Behavior

### 1. Modify System Prompt
In `/app/api/agent/route.ts`, edit `SYSTEM_PROMPT`:
```typescript
const SYSTEM_PROMPT = `You are a Product Hunt expert assistant...`
```

Add instructions like:
- Response style (formal/casual)
- What to emphasize (technical details/user benefits)
- Constraints (don't show unrelated products)
- Special behaviors (always quote comments)

### 2. Improve Tool Descriptions
In `/lib/productHuntTools.ts`, edit tool descriptions:
```typescript
description: "Use this when user asks about popular, hot, trending, or top products."
```

Better descriptions = better tool selection. Include:
- Trigger words (trending, popular, hot)
- Use cases
- What the tool returns

### 3. Change Analysis Logic
In `/lib/productHuntTools.ts`, modify `analyzeCommentsTool`:
- Add sentiment keywords
- Change scoring logic
- Extract specific themes
- Implement ML-based analysis

## 🚀 Quick Start for New Developers

1. **Understand the flow**:
   User → Chat UI → Agent API → LangChain Agent → Tools → Product Hunt API

2. **Key files to modify**:
   - Agent behavior: `/app/api/agent/route.ts` (system prompt)
   - Tool logic: `/lib/productHuntTools.ts`
   - UI: `/app/chat/page.tsx`

3. **Testing**:
   - Use `/test-producthunt` to verify API
   - Use `/test-ai` to verify OpenAI
   - Use `/chat` for full agent testing

4. **Monitoring**:
   - Check Railway logs for errors
   - Use LangSmith to see agent decisions

## 🔮 Future Architecture (Multi-Agent)

When expanding to multiple agents:
1. **Query Planner Agent**: Understands user intent
2. **Data Fetcher Agent**: Gets data from multiple sources
3. **Analyzer Agent**: Deep analysis of data
4. **Writer Agent**: Formats final response

Each agent will have its own file in `/lib/agents/` with specialized prompts and tools.

---

This structure makes it easy to:
- Add new tools
- Modify agent behavior  
- Add new data sources
- Expand to multi-agent system
