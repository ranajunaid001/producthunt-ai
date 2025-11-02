'use client'

import { useState } from 'react'

export default function TestAI() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/ai-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })

      const data = await res.json()
      
      if (res.ok) {
        setResponse(data.response)
      } else {
        setResponse(`Error: ${data.error}`)
      }
    } catch (error) {
      setResponse('Failed to connect to API')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ 
      padding: '2rem', 
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h1>Test AI Integration</h1>
      
      <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask something..."
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </form>

      {response && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px'
        }}>
          <strong>AI Response:</strong>
          <p>{response}</p>
        </div>
      )}
    </main>
  )
}
