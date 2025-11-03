'use client'

import { useState, useEffect, useRef } from 'react'

interface Product {
  name: string
  tagline: string
  votes: number
  comments: number
  topics?: string[]
  website?: string
  description?: string
}

interface SentimentData {
  product: string
  score: number
  positive: string[]
  negative: string[]
  analyzedComments: number
}

interface AgentResponse {
  answer: string
  toolsUsed?: any[]
  responseType?: 'products' | 'single-product' | 'sentiment' | 'general'
  data?: {
    products?: Product[]
    product?: Product
    sentiment?: SentimentData
  }
}

// Parser function to extract products from agent's text response
function parseProductsFromText(text: string): Product[] {
  const products: Product[] = []
  const lines = text.split('\n')
  let currentProduct: Partial<Product> = {}
  let currentTopics: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Match product name (e.g., "1. **Maillayer**")
    const nameMatch = line.match(/^\d+\.\s*\*\*(.*?)\*\*/)
    if (nameMatch) {
      // Save previous product if exists
      if (currentProduct.name) {
        currentProduct.topics = currentTopics
        products.push(currentProduct as Product)
      }
      // Start new product
      currentProduct = { name: nameMatch[1] }
      currentTopics = []
      continue
    }
    
    // Match tagline
    if (line.includes('Tagline:') || line.includes('tagline:')) {
      currentProduct.tagline = line.split(/[Tt]agline:/)[1]?.trim()
      continue
    }
    
    // Match votes
    if (line.includes('Votes:') || line.includes('votes:')) {
      const votesMatch = line.match(/(\d+)/)
      if (votesMatch) {
        currentProduct.votes = parseInt(votesMatch[1])
      }
      continue
    }
    
    // Match comments
    if (line.includes('Comments') || line.includes('comments')) {
      const commentsMatch = line.match(/(\d+)/)
      if (commentsMatch) {
        currentProduct.comments = parseInt(commentsMatch[1])
      }
      continue
    }
    
    // Match topics
    if (line.includes('Topics:') || line.includes('topics:')) {
      const topicsText = line.split(/[Tt]opics:/)[1]?.trim()
      if (topicsText) {
        currentTopics = topicsText.split(',').map(t => t.trim())
      }
      continue
    }
  }
  
  // Don't forget the last product
  if (currentProduct.name) {
    currentProduct.topics = currentTopics
    products.push(currentProduct as Product)
  }
  
  return products
}

// Parser for sentiment data
function parseSentimentFromText(text: string): SentimentData | null {
  const lines = text.split('\n')
  let productName = ''
  let score = 0
  let positive: string[] = []
  let negative: string[] = []
  let inPositive = false
  let inNegative = false
  
  // Extract product name and score
  const scoreMatch = text.match(/(\d+)%\s*(positive|Positive)/i)
  if (scoreMatch) {
    score = parseInt(scoreMatch[1])
  }
  
  // Look for product name in various formats
  const productMatch = text.match(/(?:for\s+|about\s+|of\s+)["']?([^"'\n]+?)["']?(?:\s+is\s+|\s+shows\s+|\:)/i)
  if (productMatch) {
    productName = productMatch[1].trim()
  }
  
  // Extract positive and negative feedback
  for (const line of lines) {
    if (line.toLowerCase().includes('positive') && line.toLowerCase().includes('feedback')) {
      inPositive = true
      inNegative = false
      continue
    }
    if (line.toLowerCase().includes('negative') || line.toLowerCase().includes('improvement')) {
      inPositive = false
      inNegative = true
      continue
    }
    
    // Extract bullet points or numbered items
    const itemMatch = line.match(/^[\-•\d+\.]\s*(.+)/)
    if (itemMatch) {
      const item = itemMatch[1].replace(/['"]/g, '').trim()
      if (inPositive && item.length > 5) {
        positive.push(item)
      } else if (inNegative && item.length > 5) {
        negative.push(item)
      }
    }
  }
  
  // Extract comment count
  const commentMatch = text.match(/[Bb]ased on (\d+) comments/)
  const analyzedComments = commentMatch ? parseInt(commentMatch[1]) : positive.length + negative.length
  
  if (productName && score > 0) {
    return {
      product: productName,
      score,
      positive: positive.slice(0, 5), // Limit to 5 items
      negative: negative.slice(0, 5),
      analyzedComments
    }
  }
  
  return null
}

export default function ChatV2() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [response, setResponse] = useState<AgentResponse | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showResults && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showResults])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || loading) return

    setLoading(true)
    
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: searchQuery })
      })

      const data: AgentResponse = await res.json()
      
      // Parse the agent's text response to extract structured data
      const answerLower = data.answer.toLowerCase()
      
      // Determine response type and parse accordingly
      if (answerLower.includes('trending') || answerLower.includes('top') || 
          answerLower.includes('here are') || answerLower.includes('products')) {
        
        const products = parseProductsFromText(data.answer)
        if (products.length > 0) {
          data.responseType = 'products'
          data.data = { products }
        } else {
          data.responseType = 'general'
        }
        
      } else if (answerLower.includes('sentiment') || answerLower.includes('% positive') || 
                 answerLower.includes('feedback')) {
        
        const sentiment = parseSentimentFromText(data.answer)
        if (sentiment) {
          data.responseType = 'sentiment'
          data.data = { sentiment }
        } else {
          data.responseType = 'general'
        }
        
      } else {
        data.responseType = 'general'
      }

      setResponse(data)
      setShowResults(true)
      setQuery('')
    } catch (error) {
      console.error('Error:', error)
      setResponse({
        answer: 'Sorry, I encountered an error. Please try again.',
        responseType: 'general'
      })
      setShowResults(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    performSearch(query)
  }

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery)
    performSearch(exampleQuery)
  }

  const goHome = () => {
    setShowResults(false)
    setResponse(null)
    setQuery('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
      color: '#1d1d1f',
      lineHeight: '1.47059',
      fontWeight: 400,
      letterSpacing: '-0.022em',
      display: 'flex',
      flexDirection: 'column',
    }}>
      
      {/* Hero Section */}
      <section style={{
        flex: 1,
        display: showResults ? 'none' : 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '80px 20px',
        textAlign: 'center',
        animation: showResults ? 'fadeOut 0.5s ease-out' : 'fadeIn 0.8s ease-out',
      }}>
        <h1 style={{
          fontSize: 'clamp(40px, 8vw, 64px)',
          fontWeight: 600,
          letterSpacing: '-0.003em',
          lineHeight: 1.08,
          marginBottom: '16px',
        }}>
          Product Hunt <span style={{ color: '#FF6154' }}>AI</span>
        </h1>
        
        <p style={{
          fontSize: 'clamp(17px, 2.5vw, 21px)',
          color: '#86868b',
          fontWeight: 400,
          marginBottom: '48px',
          maxWidth: '600px',
        }}>
          Ask anything about today's products. Get insights, analysis, and sentiment in seconds.
        </p>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} style={{
          width: '100%',
          maxWidth: '620px',
        }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What would you like to know?"
            disabled={loading}
            style={{
              width: '100%',
              padding: '20px 24px',
              fontSize: '17px',
              border: 'none',
              outline: 'none',
              backgroundColor: '#f5f5f7',
              borderRadius: '12px',
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              opacity: loading ? 0.7 : 1,
            }}
            onFocus={(e) => {
              e.target.style.backgroundColor = '#f9f9f9'
              e.target.style.boxShadow = '0 0 0 1px rgba(255, 97, 84, 0.3)'
            }}
            onBlur={(e) => {
              e.target.style.backgroundColor = '#f5f5f7'
              e.target.style.boxShadow = 'none'
            }}
          />
        </form>
        
        {/* Example Queries */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '24px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <button
            onClick={() => handleExampleClick("What's trending today?")}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid #d2d2d7',
              borderRadius: '100px',
              fontSize: '15px',
              color: '#1d1d1f',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#FF6154'
                e.currentTarget.style.color = 'white'
                e.currentTarget.style.borderColor = '#FF6154'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#1d1d1f'
              e.currentTarget.style.borderColor = '#d2d2d7'
            }}
          >
            What's trending today?
          </button>
          
          <button
            onClick={() => handleExampleClick("Show me AI tools")}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid #d2d2d7',
              borderRadius: '100px',
              fontSize: '15px',
              color: '#1d1d1f',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#FF6154'
                e.currentTarget.style.color = 'white'
                e.currentTarget.style.borderColor = '#FF6154'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#1d1d1f'
              e.currentTarget.style.borderColor = '#d2d2d7'
            }}
          >
            Show me AI tools
          </button>
          
          <button
            onClick={() => handleExampleClick("What do people think about Maillayer?")}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid #d2d2d7',
              borderRadius: '100px',
              fontSize: '15px',
              color: '#1d1d1f',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#FF6154'
                e.currentTarget.style.color = 'white'
                e.currentTarget.style.borderColor = '#FF6154'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#1d1d1f'
              e.currentTarget.style.borderColor = '#d2d2d7'
            }}
          >
            Analyze sentiment
          </button>
        </div>
        
        {loading && (
          <div style={{
            marginTop: '40px',
            display: 'flex',
            gap: '8px',
          }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#FF6154',
                  animation: `pulse 1.4s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}
      </section>
      
      {/* Results Section */}
      {showResults && response && (
        <div
          ref={contentRef}
          style={{
            maxWidth: '980px',
            margin: '0 auto',
            padding: '60px 20px 80px',
            minHeight: 'calc(100vh - 100px)',
            animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {/* Back Button */}
          <header style={{ marginBottom: '40px' }}>
            <button
              onClick={goHome}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: 'none',
                fontSize: '15px',
                color: '#86868b',
                cursor: 'pointer',
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FF6154'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#86868b'
              }}
            >
              ← New Search
            </button>
          </header>
          
          {/* Dynamic Content Based on Response Type */}
          {response.responseType === 'products' && response.data?.products && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
            }}>
              {response.data.products.map((product, idx) => (
                <article
                  key={idx}
                  style={{
                    background: 'rgba(255, 97, 84, 0.03)',
                    padding: '24px',
                    border: '1px solid rgba(255, 97, 84, 0.06)',
                    borderRadius: '12px',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.background = 'rgba(255, 97, 84, 0.08)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 97, 84, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(255, 97, 84, 0.12)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.background = 'rgba(255, 97, 84, 0.03)'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.borderColor = 'rgba(255, 97, 84, 0.06)'
                  }}
                >
                  <h2 style={{
                    fontSize: '19px',
                    fontWeight: 500,
                    letterSpacing: '-0.021em',
                    marginBottom: '4px',
                  }}>
                    {product.name}
                  </h2>
                  <p style={{
                    fontSize: '15px',
                    color: '#86868b',
                    marginBottom: '16px',
                  }}>
                    {product.tagline}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '20px',
                    fontSize: '13px',
                    color: '#86868b',
                  }}>
                    <span>{product.votes} votes</span>
                    <span>{product.comments} comments</span>
                  </div>
                  {product.topics && product.topics.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '12px',
                    }}>
                      {product.topics.slice(0, 3).map((topic, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            backgroundColor: 'rgba(255, 97, 84, 0.1)',
                            color: '#FF6154',
                            borderRadius: '4px',
                          }}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
          
          {response.responseType === 'sentiment' && response.data?.sentiment && (
            <div style={{ maxWidth: '780px', margin: '0 auto' }}>
              <header style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h1 style={{
                  fontSize: '48px',
                  fontWeight: 600,
                  letterSpacing: '-0.003em',
                  marginBottom: '20px',
                }}>
                  {response.data.sentiment.product}
                </h1>
                <div style={{
                  fontSize: '96px',
                  fontWeight: 600,
                  letterSpacing: '-0.003em',
                  margin: '20px 0 8px',
                  color: '#FF6154',
                }}>
                  {response.data.sentiment.score}%
                </div>
                <p style={{
                  fontSize: '17px',
                  color: '#1d1d1f',
                  marginBottom: '4px',
                }}>
                  positive sentiment
                </p>
                <p style={{
                  fontSize: '15px',
                  color: '#86868b',
                }}>
                  Based on {response.data.sentiment.analyzedComments} comments
                </p>
              </header>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '32px',
              }}>
                {response.data.sentiment.positive.length > 0 && (
                  <section style={{
                    padding: '32px',
                    borderRadius: '16px',
                    background: 'rgba(255, 97, 84, 0.04)',
                    border: '1px solid rgba(255, 97, 84, 0.08)',
                  }}>
                    <h3 style={{
                      fontSize: '19px',
                      fontWeight: 500,
                      marginBottom: '24px',
                      letterSpacing: '-0.021em',
                    }}>
                      Positive Feedback
                    </h3>
                    {response.data.sentiment.positive.map((item, idx) => (
                      <div key={idx} style={{
                        padding: idx === 0 ? '0 0 16px' : '16px 0',
                        borderBottom: idx === response.data.sentiment.positive.length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.05)',
                        fontSize: '15px',
                        lineHeight: 1.6,
                      }}>
                        {item}
                      </div>
                    ))}
                  </section>
                )}
                
                {response.data.sentiment.negative.length > 0 && (
                  <section style={{
                    padding: '32px',
                    borderRadius: '16px',
                    background: 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                  }}>
                    <h3 style={{
                      fontSize: '19px',
                      fontWeight: 500,
                      marginBottom: '24px',
                      letterSpacing: '-0.021em',
                    }}>
                      Areas for Improvement
                    </h3>
                    {response.data.sentiment.negative.map((item, idx) => (
                      <div key={idx} style={{
                        padding: idx === 0 ? '0 0 16px' : '16px 0',
                        borderBottom: idx === response.data.sentiment.negative.length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.05)',
                        fontSize: '15px',
                        lineHeight: 1.6,
                      }}>
                        {item}
                      </div>
                    ))}
                  </section>
                )}
              </div>
            </div>
          )}
          
          {response.responseType === 'general' && (
            <div style={{
              maxWidth: '720px',
              margin: '0 auto',
              padding: '40px',
              background: '#f5f5f7',
              borderRadius: '16px',
            }}>
              <p style={{
                fontSize: '17px',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {response.answer}
              </p>
            </div>
          )}
          
          {/* Tools Used */}
          {response.toolsUsed && response.toolsUsed.length > 0 && (
            <div style={{
              marginTop: '40px',
              textAlign: 'center',
              fontSize: '13px',
              color: '#86868b',
            }}>
              Tools used: {response.toolsUsed.map(t => t.tool).join(', ')}
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          40% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  )
}
