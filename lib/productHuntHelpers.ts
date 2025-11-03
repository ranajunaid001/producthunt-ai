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
      /It\s+(.*?)(?:\.|,|\n|Here)/i,
      /allows?\s+(.*?)(?:\.|,|\n|$)/i
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
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const nextLine = lines[i + 1] || ''
      
      // Look for tagline in multiple places
      // 1. Line after product name (most common)
      if (i === 0 && nextLine && !nextLine.includes(':') && !nextLine.match(/\d+\s*(votes?|comments?)/i)) {
        // Check line after product name
        product.tagline = nextLine.replace(/^[-–]\s*/, '').replace(/\*\*/g, '').trim()
      }
      
      // 2. After "Tagline:"
      if (line.toLowerCase().includes('tagline:')) {
        product.tagline = line.substring(line.indexOf(':') + 1).replace(/\*\*/g, '').trim()
      }
      
      // 3. After dash on same line as product
      if (i === 0 && line.includes(' - ')) {
        const dashPart = line.substring(line.indexOf(' - ') + 3).replace(/\*\*/g, '').trim()
        if (dashPart) product.tagline = dashPart
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
        const topicsText = line.split(/topics?:/i)[1]?.trim() || ''
        product.topics = topicsText
          .split(/[,，]/)
          .map(t => t.replace(/\*\*/g, '').trim())
          .filter(t => t && t !== 'undefined' && t.length > 0)
      }
    }
    
    // If no tagline found, try to extract from the block
    if (!product.tagline) {
      const blockText = block.replace(/^\d+\.\s*\*\*.*?\*\*/, '').trim()
      const firstSentence = blockText.match(/^([^.!?\n]+)/)
      if (firstSentence && !firstSentence[1].includes(':')) {
        product.tagline = firstSentence[1].replace(/^[-–]\s*/, '').trim()
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
  const nameMatch = text.match(/^(.*?)\s+(?:has received|sentiment)/i) || 
                    text.match(/about\s+["']?([^"'\n]+?)["']?/i) ||
                    text.match(/feedback.*?for\s+["']?([^"'\n]+?)["']?/i)
  productName = nameMatch?.[1]?.trim() || ''
  
  // Calculate score
  const posMatch = text.match(/[Pp]ositive.*?:\s*(\d+)/i)
  const negMatch = text.match(/[Nn]egative.*?:\s*(\d+)/i)
  const posCount = parseInt(posMatch?.[1] || '0')
  const negCount = parseInt(negMatch?.[1] || '0')
  const total = posCount + negCount + (parseInt(text.match(/[Nn]eutral.*?:\s*(\d+)/i)?.[1] || '0'))
  const score = total > 0 ? Math.round((posCount / total) * 100) : 85
  
  // Extract actual feedback content
  const positive: string[] = []
  const negative: string[] = []
  
  // Split text into sections
  const lines = text.split('\n')
  let inPositiveSection = false
  let inNegativeSection = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Detect sections
    if (line.match(/positive\s*feedback/i) || line.match(/highlights.*?comments/i)) {
      inPositiveSection = true
      inNegativeSection = false
      continue
    }
    
    if (line.match(/negative|areas.*?improvement|neutral\s*inquiries/i)) {
      inPositiveSection = false
      inNegativeSection = true
      continue
    }
    
    // Skip metadata lines
    if (line.match(/^\*?\*?[A-Za-z]+\s*[Cc]omments?\*?\*?:\s*\d+/i) ||
        line.match(/^[A-Za-z]+:\s*\d+$/i) ||
        !line || line.length < 10) {
      continue
    }
    
    // Extract feedback from numbered items or quotes
    if (inPositiveSection || inNegativeSection) {
      let feedbackText = ''
      
      // Handle quoted text
      const quoteMatch = line.match(/[""](.+?)[""]|(?:stating|saying|expressed)\s*,?\s*["'](.+?)["']/)
      if (quoteMatch) {
        feedbackText = quoteMatch[1] || quoteMatch[2]
      } 
      // Handle numbered items
      else if (line.match(/^\d+\.\s*/)) {
        feedbackText = line.replace(/^\d+\.\s*/, '').trim()
        // Look for quote in this item
        const innerQuote = feedbackText.match(/[""](.+?)[""]/)
        if (innerQuote) {
          feedbackText = innerQuote[1]
        }
      }
      // Handle bullet points
      else if (line.match(/^[-•]\s*/)) {
        feedbackText = line.replace(/^[-•]\s*/, '').trim()
      }
      
      // Clean and add to appropriate array
      if (feedbackText && feedbackText.length > 20) {
        // Remove any user attribution
        feedbackText = feedbackText.replace(/^(One user|Another user|A user|Users?)\s*(expressed|stated|said|mentioned)?\s*:?\s*/i, '')
        feedbackText = feedbackText.replace(/,?\s*(stating|saying).*$/, '')
        feedbackText = feedbackText.trim()
        
        if (inPositiveSection && positive.length < 3 && !feedbackText.includes('Comments:')) {
          positive.push(feedbackText)
        } else if (inNegativeSection && negative.length < 3 && !feedbackText.includes('Comments:')) {
          negative.push(feedbackText)
        }
      }
    }
  }
  
  const analyzedComments = total || parseInt(text.match(/(\d+)\s+comments?\s+analyzed/i)?.[1] || '10')
  
  return productName ? {
    product: productName,
    score,
    positive,
    negative,
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
      lower.includes('positive comments') || lower.includes('negative comments') ||
      lower.includes('has received') || lower.includes('mix of feedback')) {
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
