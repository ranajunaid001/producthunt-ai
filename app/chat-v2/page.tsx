'use client'

import { useState } from 'react'

export default function ChatV2() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)

  // Mock data for demo
  const mockResponses = {
    trending: {
      type: 'products',
      products: [
        { name: 'Maillayer', tagline: 'Email marketing without subscriptions', votes: 308, comments: 29, topics: ['Email', 'Marketing'] },
        { name: 'Sidemail 2.0', tagline: 'All-in-one email platform for SaaS', votes: 217, comments: 15, topics: ['Email', 'SaaS'] },
        { name: 'Pickle', tagline: 'Screenshot, redact, and share privately', votes: 195, comments: 6, topics: ['Mac', 'Privacy'] }
      ]
    },
    single: {
      type: 'single-product',
      product: {
        name: 'Maillayer',
        tagline: 'Email marketing without subscriptions',
        description: 'One-time payment email platform that lets you send unlimited emails via Amazon SES at just $0.10/1000 emails',
        votes: 308,
        comments: 29,
        topics: ['Email', 'Marketing', 'Self-hosted'],
        website: 'https://maillayer.com'
      }
    },
    sentiment: {
      type: 'sentiment',
      product: 'Maillayer',
      score: 78,
      positive: [
        'One-time payment is a game changer',
        'Finally, I own my email infrastructure',
        'Saves hundreds per month'
      ],
      negative: [
        'Documentation could be better',
        'Initial setup is complex'
      ],
      summary: 'Users love the cost savings and ownership, but want better docs'
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Demo: set different responses based on query
    if (query.includes('trending') || query.includes('top')) {
      setResponse(mockResponses.trending)
    } else if (query.includes('hottest')) {
      setResponse(mockResponses.single)
    } else if (query.includes('think about')) {
      setResponse(mockResponses.sentiment)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      padding: '2rem',
    }}>
      {/* Search Bar */}
      <form onSubmit={handleSubmit} style={{
        maxWidth: '800px',
        margin: '0 auto 3rem',
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          backgroundColor: 'white',
          padding: '0.75rem',
          borderRadius: '16px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
        }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about Product Hunt..."
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              fontSize: '1rem',
              border: 'none',
              outline: 'none',
              backgroundColor: '#f5f5f7',
              borderRadius: '12px',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Ask
          </button>
        </div>
      </form>

      {/* Dynamic Response Area */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Multiple Products Grid */}
        {response?.type === 'products' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {response.products.map((product: any, idx: number) => (
              <div key={idx} style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 20px rgba(0,0,0,0.08)'
              }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>{product.name}</h3>
                <p style={{ color: '#6e6e73', margin: '0 0 1rem', fontSize: '0.95rem' }}>{product.tagline}</p>
                
                <div style={{ display: 'flex', gap: '1.5rem', margin: '1rem 0' }}>
                  <span style={{ fontSize: '1.1rem' }}>🔥 {product.votes}</span>
                  <span style={{ fontSize: '1.1rem' }}>💬 {product.comments}</span>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                  {product.topics.map((topic: string) => (
                    <span key={topic} style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#f5f5f7',
                      borderRadius: '100px',
                      fontSize: '0.8rem',
                      color: '#6e6e73',
                    }}>#{topic}</span>
                  ))}
                </div>
                
                <button style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  color: '#007AFF',
                  border: '1px solid #007AFF',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>
                  Analyze →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Single Product Hero */}
        {response?.type === 'single-product' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '3rem',
            boxShadow: '0 2px 40px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
            <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem' }}>{response.product.name}</h1>
            <p style={{ fontSize: '1.25rem', color: '#6e6e73', margin: '0 0 2rem' }}>{response.product.tagline}</p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '3rem',
              margin: '2rem 0',
            }}>
              <div style={{
                padding: '1rem 2rem',
                backgroundColor: '#fff3e0',
                borderRadius: '12px',
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>🔥 {response.product.votes}</div>
                <div style={{ color: '#6e6e73', marginTop: '0.25rem' }}>votes</div>
              </div>
              <div style={{
                padding: '1rem 2rem',
                backgroundColor: '#e3f2fd',
                borderRadius: '12px',
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>💬 {response.product.comments}</div>
                <div style={{ color: '#6e6e73', marginTop: '0.25rem' }}>comments</div>
              </div>
            </div>
            
            <p style={{ fontSize: '1.1rem', color: '#1d1d1f', lineHeight: 1.6, margin: '2rem auto', maxWidth: '600px' }}>
              {response.product.description}
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', margin: '2rem 0' }}>
              {response.product.topics.map((topic: string) => (
                <span key={topic} style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f5f5f7',
                  borderRadius: '100px',
                  fontSize: '0.9rem',
                  color: '#6e6e73',
                }}>📁 {topic}</span>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
              <button style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}>Visit Website</button>
              <button style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
                color: '#007AFF',
                border: '2px solid #007AFF',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}>Analyze Sentiment</button>
            </div>
          </div>
        )}

        {/* Sentiment Analysis */}
        {response?.type === 'sentiment' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '2rem',
            boxShadow: '0 2px 40px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem', textAlign: 'center' }}>
              {response.product} Sentiment Analysis
            </h2>
            
            <div style={{
              textAlign: 'center',
              fontSize: '3rem',
              fontWeight: 'bold',
              color: '#34c759',
              margin: '1rem 0',
            }}>
              ⭐ {response.score}% Positive
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
              {/* Positive */}
              <div style={{
                padding: '2rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '16px',
                border: '1px solid #bbf7d0',
              }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.5rem' }}>😊 What Users Love</h3>
                {response.positive.map((item: string, idx: number) => (
                  <div key={idx} style={{
                    padding: '0.75rem',
                    margin: '0.5rem 0',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    borderLeft: '4px solid #34c759',
                  }}>
                    "{item}"
                  </div>
                ))}
              </div>
              
              {/* Negative */}
              <div style={{
                padding: '2rem',
                backgroundColor: '#fef2f2',
                borderRadius: '16px',
                border: '1px solid #fecaca',
              }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.5rem' }}>😕 Areas for Improvement</h3>
                {response.negative.map((item: string, idx: number) => (
                  <div key={idx} style={{
                    padding: '0.75rem',
                    margin: '0.5rem 0',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    borderLeft: '4px solid #ff3b30',
                  }}>
                    "{item}"
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              backgroundColor: '#f5f5f7',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <strong>Summary:</strong> {response.summary}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
