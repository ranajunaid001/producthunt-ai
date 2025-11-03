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
  
  // Format 1: "The best/hottest product is **Name**"
  const singleMatch = text.match(/(?:best|hottest)\s+product.*?is\s+\*\*(.*?)\*\*/i)
  if (singleMatch) {
    const name = singleMatch[1]
    const votesMatch = text.match(/[Vv]otes[:\s]+(\d+)/i)
    const commentsMatch = text.match(/[Cc]omments.*?[:\s]+(\d+)/i)
    const descMatch = text.match(/(?:focuses on|provides?|which is an?)\s+(.*?)(?:\.|,)/i)
    
    return [{
      name,
      tagline: descMatch?.[1] || '',
      votes: parseInt(votesMatch?.[1] || '0'),
      comments: parseInt(commentsMatch?.[1] || '0'),
      topics: []
    }]
  }
  
  // Format 2: Numbered list "1. **Name**"
  const lines = text.split('\n')
  let currentProduct: Partial<Product> = {}
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // New product line
    const nameMatch = line.match(/^\d+\.\s*\*\*(.*?)\*\*/)
    if (nameMatch) {
      if (currentProduct.name) {
        // Save previous product with defaults for missing values
        products.push({
          name: currentProduct.name,
          tagline: currentProduct.tagline || '',
          votes: currentProduct.votes || 0,
          comments: currentProduct.comments || 0,
          topics: currentProduct.topics || []
        })
      }
      currentProduct = { name: nameMatch[1] }
      
      // Check if tagline is on same line after dash
      const dashMatch = line.match(/\*\*.*?[-–]\s*(.+)/)
      if (dashMatch) {
        currentProduct.tagline = dashMatch[1].replace(/\*/g, '').trim()
      }
    }
    
    // Tagline on next line
    else if (line.match(/^[-–]\s*\*\*(.+)\*\*/) || line.match(/[Tt]agline:\s*\*\*(.+)\*\*/)) {
      const taglineMatch = line.match(/\*\*(.+?)\*\*/)
      if (taglineMatch && currentProduct.name) {
        currentProduct.tagline = taglineMatch[1].replace(/\*/g, '').trim()
      }
    }
    
    // Extract votes and comments (more flexible)
    if (currentProduct.name) {
      const votesMatch = line.match(/(\d+)\s*votes?/i)
      const commentsMatch = line.match(/(\d+)\s*comments?/i)
      
      if (votesMatch && !currentProduct.votes) {
        currentProduct.votes = parseInt(votesMatch[1])
      }
      if (commentsMatch && !currentProduct.comments) {
        currentProduct.comments = parseInt(commentsMatch[1])
      }
      
      // Topics - remove all asterisks
      const topicsMatch = line.match(/[Tt]opics?:\s*(.+)/)
      if (topicsMatch) {
        currentProduct.topics = topicsMatch[1]
          .split(',')
          .map(t => t.replace(/\*/g, '').trim())
          .filter(t => t.length > 0)
      }
    }
  }
  
  // Don't forget last product
  if (currentProduct.name) {
    products.push({
      name: currentProduct.name,
      tagline: currentProduct.tagline || '',
      votes: currentProduct.votes || 0,
      comments: currentProduct.comments || 0,
      topics: currentProduct.topics || []
    })
  }
  
  return products
}

// Parse sentiment from agent's text
export function parseSentimentFromText(text: string): SentimentData | null {
  // Extract product name
  let productName = ''
  const namePatterns = [
    /^(.*?)\s+has received/i,
    /sentiment for\s+["']?(.+?)["']?/i,
    /about\s+["']?(.+?)["']?\s*:/i,
    /^(.*?)\s+sentiment analysis/i
  ]
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match) {
      productName = match[1].trim()
      break
    }
  }
  
  // Calculate score from counts
  const posMatch = text.match(/[Pp]ositive.*?[:\s]+(\d+)/i)
  const negMatch = text.match(/[Nn]egative.*?[:\s]+(\d+)/i)
  const neutralMatch = text.match(/[Nn]eutral.*?[:\s]+(\d+)/i)
  
  const posCount = parseInt(posMatch?.[1] || '0')
  const negCount = parseInt(negMatch?.[1] || '0')
  const neutralCount = parseInt(neutralMatch?.[1] || '0')
  const total = posCount + negCount + neutralCount
  
  const score = total > 0 ? Math.round((posCount / total) * 100) : 0
  
  // Extract feedback quotes
  const positive: string[] = []
  const negative: string[] = []
  
  // Find all quoted text
  const quotes = [...text.matchAll(/[""]([^""]+)[""]|saying,\s*[""]([^""]+)[""]|stated,\s*[""]([^""]+)[""]|:\s*[""]([^""]+)[""]|•\s*[""]([^""]+)[""]|-\s*[""]([^""]+)[""]|(\d+\.\s*[""][^""]+[""])/g)]
  
  // Simple heuristic: first half are positive, second half negative
  // Or look for section markers
  let inPositiveSection = text.toLowerCase().indexOf('positive') < text.toLowerCase().indexOf('negative')
  
  quotes.forEach(match => {
    const quote = (match[1] || match[2] || match[3] || match[4] || match[5] || match[6] || match[7] || '').trim()
    if (quote && quote.length > 20) {
      if (inPositiveSection && positive.length < 3) {
        positive.push(quote)
      } else if (!inPositiveSection && negative.length < 2) {
        negative.push(quote)
      }
      // Switch sections if we have enough
      if (positive.length >= 3) inPositiveSection = false
    }
  })
  
  // If no quotes found, look for bullet points
  if (positive.length === 0 && negative.length === 0) {
    const bulletPoints = text.match(/[-•]\s*(.+?)(?=[-•\n]|$)/g) || []
    bulletPoints.forEach((point, i) => {
      const cleaned = point.replace(/^[-•]\s*/, '').trim()
      if (cleaned.length > 10) {
        if (i < bulletPoints.length / 2) positive.push(cleaned)
        else negative.push(cleaned)
      }
    })
  }
  
  const analyzedComments = parseInt(text.match(/(\d+)\s+comments?\s+analyzed/i)?.[1] || String(total))
  
  return productName && (score > 0 || positive.length > 0) ? {
    product: productName,
    score: score || 75, // Default to 75% if we can't calculate
    positive: positive.slice(0, 3),
    negative: negative.slice(0, 2),
    analyzedComments: analyzedComments || total || 10
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
      lower.includes('products') || lower.includes('launched')) {
    return 'products'
  }
  
  // Sentiment indicators
  if (lower.includes('sentiment') || lower.includes('% positive') || 
      lower.includes('feedback') || lower.includes('users think')) {
    return 'sentiment'
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
