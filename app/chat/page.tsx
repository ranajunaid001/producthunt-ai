'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolsUsed?: any[]
  timestamp: Date
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        toolsUsed: data.toolsUsed,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(0, 0, 0, 0.1)',
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <h1 style={{
          fontSize: '1.125rem',
          fontWeight: 500,
          margin: 0,
          letterSpacing: '-0.02em',
          color: '#1d1d1f',
        }}>
          Product Hunt AI
        </h1>
        <p style={{
          fontSize: '0.875rem',
          color: '#86868b',
          margin: '0.25rem 0 0 0',
          fontWeight: 400,
        }}>
          Ask anything about today's products
        </p>
      </header>

      {/* Messages Area */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: '2rem',
        maxWidth: '48rem',
        width: '100%',
        margin: '0 auto',
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            marginTop: '4rem',
            color: '#86868b',
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              filter: 'grayscale(100%)',
            }}>
              🚀
            </div>
            <p style={{ fontSize: '1.125rem', marginBottom: '2rem' }}>
              Ask me about Product Hunt
            </p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              justifyContent: 'center',
              marginTop: '2rem',
            }}>
              {[
                "What's trending today?",
                "Show me AI tools",
                "What do people think of the top product?",
                "Find productivity apps"
              ].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '100px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: '#1d1d1f',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f7'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ paddingBottom: '2rem' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '1.5rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: message.role === 'user' ? '#007AFF' : '#F5F5F7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  flexShrink: 0,
                }}>
                  {message.role === 'user' ? '👤' : '🚀'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#86868b',
                    marginBottom: '0.25rem',
                    fontWeight: 500,
                  }}>
                    {message.role === 'user' ? 'You' : 'Product Hunt AI'}
                  </div>
                  <div style={{
                    fontSize: '0.9375rem',
                    lineHeight: '1.5',
                    color: '#1d1d1f',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {message.content}
                  </div>
                  {message.toolsUsed && message.toolsUsed.length > 0 && (
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#86868b',
                    }}>
                      Used: {message.toolsUsed.map(t => t.tool).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{
                display: 'flex',
                gap: '0.25rem',
                justifyContent: 'center',
                padding: '1rem',
              }}>
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#86868b',
                      animation: `pulse 1.4s ease-in-out infinite`,
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderTop: '0.5px solid rgba(0, 0, 0, 0.1)',
        padding: '1.5rem 2rem',
        position: 'sticky',
        bottom: 0,
      }}>
        <div style={{
          maxWidth: '48rem',
          margin: '0 auto',
          display: 'flex',
          gap: '0.75rem',
        }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Product Hunt..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.875rem 1.25rem',
              fontSize: '0.9375rem',
              backgroundColor: 'white',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '100px',
              outline: 'none',
              transition: 'all 0.2s ease',
              color: '#1d1d1f',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#007AFF'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 122, 255, 0.2)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            style={{
              padding: '0 1.5rem',
              fontSize: '0.9375rem',
              fontWeight: 500,
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '100px',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              opacity: input.trim() && !isLoading ? 1 : 0.5,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (input.trim() && !isLoading) {
                e.currentTarget.style.backgroundColor = '#0051D5'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#007AFF'
            }}
          >
            Send
          </button>
        </div>
      </form>

      <style jsx>{`
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
