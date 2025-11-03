// All Product Hunt related types, parsers, and helpers in ONE place

export interface Product {
  name: string
  tagline: string
  votes: number
  comments: number
  topics?: string[]
  website?: string
  description?: string
}

export interface SentimentData {
  product: string
  score: number
  positive: string[]
  negative: string[]
  analyzedComments: number
}

export interface AgentResponse {
  answer: string
  toolsUsed?: any[]
  responseType?: 'products' | 'single-product' | 'sentiment' | 'general'
  data?: {
    products?: Product[]
    product?: Product
    sentiment?: SentimentData
  }
}

// Parse products from agent's text - handles ALL formats
export function parseProductsFromText(text: string): Product[] {
  const products: Product[] = []
  
  // Format 1: Single product "best/hottest"
  const singleMatch = text.match(/(?:best|hottest)\s+product.*?is\s+\*\*(.*?)\*\*/i)
  if (singleMatch) {
    const name = singleMatch[1]
    
    // Look for all numbers in text and match with votes/comments
    const numbers = text.match(/\d+/g) || []
    let votes = 0, comments = 0
    
    // Find votes - look for number before/after "votes"
    const votesIndex = text.toLowerCase().indexOf('vote')
    if (votesIndex > -1) {
      const beforeVotes = text.substring(Math.max(0, votesIndex - 20), votesIndex)
      const votesMatch = beforeVotes.match(/(\d+)(?!.*\d)/) || text.substring(votesIndex, votesIndex + 20).match(/(\d+)/)
      votes = votesMatch ? parseInt(votesMatch[1]) : 0
    }
    
    // Find comments - look for number before/after "comments"
    const commentsIndex = text.toLowerCase().indexOf('comment')
    if (commentsIndex > -1) {
      const beforeComments = text.substring(Math.max(0, commentsIndex - 20), commentsIndex)
      const commentsMatch = beforeComments.match(/(\d+)(?!.*\d)/) || text.substring(commentsIndex, commentsIndex + 20).match(/(\d+)/)
      comments = commentsMatch ? parseInt(commentsMatch[1]) : 0
    }
    
    // Extract description/tagline
    const descPatterns = [
      /focusing on\s+(.*?)(?:\.|,|\n|$)/i,
      /provides?\s+(.*?)(?:\.|,|\n|$)/i,
      /which is an?\s+(.*?)(?:\.|,|\n|$)/i,
      /that\s+(.*?)(?:\.|,|\n|$)/i,
      /It\s+(.*?)(?:\.|,|\n|$)/i
    ]
    
    let tagline = ''
    for (const pattern of descPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        tagline = match[1].trim()
        break
      }
    }
    
    return [{
      name,
      tagline,
      votes,
      comments,
      topics: []
    }]
  }
  
  // Format 2: Multiple products list
  const productBlocks = text.split(/\n(?=\d+\.)/);
  
  for (const block of productBlocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l)
    
    // Extract product name
    const nameMatch = lines[0]?.match(/^\d+\.\s*\*\*(.*?)\*\*/)
    if (!nameMatch) continue
    
    const product: Product = {
      name: nameMatch[1],
      tagline: '',
      votes: 0,
      comments: 0,
      topics: []
    }
    
    // Process each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      
      // Tagline (usually second line or after dash)
      if (i === 1 && !line.includes(':') && !line.match(/\d+\s*(votes?|comments?)/i)) {
        product.tagline = line.replace(/^[-–]\s*/, '').replace(/\*\*/g, '').trim()
      } else if (line.startsWith('Tagline:')) {
        product.tagline = line.substring(8).replace(/\*\*/g, '').trim()
      }
      
      // Votes
      if (line.toLowerCase().includes('vote')) {
        const match = line.match(/(\d+)/)
        if (match) product.votes = parseInt(match[1])
      }
      
      // Comments
      if (line.toLowerCase().includes('comment') && !line.toLowerCase().includes('vote')) {
        const match = line.match(/(\d+)/)
        if (match) product.comments = parseInt(match[1])
      }
      
      // Topics
      if (line.toLowerCase().includes('topic')) {
        const topicsText = line.split(/topics?:/i)[1]?.trim()
        if (topicsText) {
          product.topics = topicsText
            .split(/[,，]/)
            .map(t => t.replace(/\*\*/g, '').trim())
            .filter(t => t && t !== 'undefined')
        }
      }
    }
    
    products.push(product)
  }
  
  return products
}

// Parse sentiment from agent's text
export function parseSentimentFromText(text: string): SentimentData | null {
  // Extract product name
  let productName = ''
  const namePatterns = [
    /^(.*?)\s+has received/i,
    /sentiment for\s+["']?([^"'\n]+?)["']?/i,
    /about\s+["']?([^"'\n]+?)["']?\s*[:，]/i,
    /^(.*?)\s+sentiment analysis/i,
    /feedback from users about\s+["']?([^"'\n]+?)["']?/i
  ]
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      productName = match[1].trim()
      break
    }
  }
  
  // Calculate score from counts
  const posMatch = text.match(/[Pp]ositive\s*(?:[Cc]omments?|[Ff]eedback)?[:\s]*(\d+)/i)
  const negMatch = text.match(/[Nn]egative\s*(?:[Cc]omments?|[Ff]eedback)?[:\s]*(\d+)/i)
  const neutralMatch = text.match(/[Nn]eutral\s*(?:[Cc]omments?|[Ii]nquiries)?[:\s]*(\d+)/i)
  
  const posCount = parseInt(posMatch?.[1] || '0')
  const negCount = parseInt(negMatch?.[1] || '0')
  const neutralCount = parseInt(neutralMatch?.[1] || '0')
  const total = posCount + negCount + neutralCount
  
  const score = total > 0 ? Math.round((posCount / total) * 100) : 75
  
  // Extract feedback quotes - better regex
  const positive: string[] = []
  const negative: string[] = []
  
  // Find sections
  const sections = text.split(/(?=[A-Z][\w\s]+:)/);
  
  for (const section of sections) {
    const isPositive = section.toLowerCase().includes('positive')
    const isNegative = section.toLowerCase().includes('negative') || section.toLowerCase().includes('improve')
    
    if (!isPositive && !isNegative) continue
    
    // Extract quotes with multiple patterns
    const quotePatterns = [
      /[""]([^""]{20,}?)[""](?:\s|$|,|\.|;)/g,
      /stating,?\s*[""]([^""]+?)[""](?:\s|$|,|\.|;)/g,
      /said,?\s*[""]([^""]+?)[""](?:\s|$|,|\.|;)/g,
      /[-•]\s*(?:One user\s*)?(?:expressed|stated|said|mentioned)?\s*[""]?([^"""\n]{20,})[""]?(?:\s|$|,|\.|;)/g
    ]
    
    for (const pattern of quotePatterns) {
      let match
      const regex = new RegExp(pattern.source, pattern.flags)
      while ((match = regex.exec(section)) !== null) {
        const quote = match[1].trim()
        if (quote.length > 20 && quote.length < 300) {
          if (isPositive && positive.length < 3) {
            positive.push(quote)
          } else if (isNegative && negative.length < 2) {
            negative.push(quote)
          }
        }
      }
    }
    
    // Also try bullet points
    const bulletMatches = section.match(/(?:[-•]\s*|^\d+\.\s*)([^-•\n]{20,})/gm)
    if (bulletMatches && (positive.length === 0 || negative.length === 0)) {
      bulletMatches.forEach(bullet => {
        const cleaned = bullet.replace(/^[-•\d+.\s]*/, '').trim()
        if (cleaned.length > 20 && cleaned.length < 300) {
          if (isPositive && positive.length < 3) {
            positive.push(cleaned)
          } else if (isNegative && negative.length < 2) {
            negative.push(cleaned)
          }
        }
      })
    }
  }
  
  const analyzedComments = total || parseInt(text.match(/(\d+)\s+comments?\s+analyzed/i)?.[1] || '10')
  
  return productName ? {
    product: productName,
    score,
    positive: positive.filter(p => !p.includes('Positive') && !p.includes('Negative')),
    negative: negative.filter(n => !n.includes('Positive') && !n.includes('Negative')),
    analyzedComments
  } : null
}

// Determine response type from agent's answer
export function detectResponseType(answer: string): AgentResponse['responseType'] {
  const lower = answer.toLowerCase()
  
  // Single product indicators
  if (lower.includes('best product') || lower.includes('hottest product') || 
      lower.includes('top product is') || lower.includes('leading product')) {
    return 'single-product'
  }
  
  // Multiple products indicators
  if (lower.includes('trending') || lower.includes('here are') || 
      lower.includes('products launched') || lower.includes('top products')) {
    return 'products'
  }
  
  // Sentiment indicators
  if (lower.includes('sentiment') || lower.includes('% positive') || 
      lower.includes('feedback') || lower.includes('users think') ||
      lower.includes('positive comments') || lower.includes('negative comments')) {
    return 'sentiment'
  }
  
  // Check if it's a numbered list
  if (answer.match(/^\d+\.\s*\*\*/m)) {
    return 'products'
  }
  
  return 'general'
}

// All styles in one place
export const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
    color: '#1d1d1f',
    lineHeight: '1.47059',
    fontWeight: 400,
    letterSpacing: '-0.022em',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  
  productCard: {
    background: 'rgba(255, 97, 84, 0.03)',
    padding: '24px',
    border: '1px solid rgba(255, 97, 84, 0.06)',
    borderRadius: '12px',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    cursor: 'pointer',
  },
  
  productCardHover: {
    transform: 'translateY(-2px)',
    background: 'rgba(255, 97, 84, 0.08)',
    boxShadow: '0 4px 12px rgba(255, 97, 84, 0.1)',
    borderColor: 'rgba(255, 97, 84, 0.12)',
  },
  
  button: {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid #d2d2d7',
    borderRadius: '100px',
    fontSize: '15px',
    color: '#1d1d1f',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap' as const,
  },
  
  buttonHover: {
    background: '#FF6154',
    color: 'white',
    borderColor: '#FF6154',
  }
}
