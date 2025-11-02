'use client'

import { useState } from 'react'

export default function TestProductHunt() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/producthunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'top products today' })
      })

      const data = await res.json()
      console.log('Full API Response:', data) // Log to console
      setProducts(data.products || [])
      setStats({
        totalComments: data.commentsFetched,
        timestamp: data.timestamp
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ 
      padding: '2rem', 
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>Product Hunt Data Test</h1>
      
      <button
        onClick={fetchProducts}
        disabled={loading}
        style={{
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          backgroundColor: '#FF6154',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Loading...' : 'Fetch Today\'s Products'}
      </button>

      {stats && (
        <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#e8f4f8', borderRadius: '4px' }}>
          <small>Total comments fetched: {stats.totalComments} | Last updated: {new Date(stats.timestamp).toLocaleTimeString()}</small>
        </div>
      )}

      {products.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Today's Top Products:</h2>
          {products.map((product: any) => (
            <div key={product.id} style={{
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <h3>{product.name}</h3>
              <p>{product.tagline}</p>
              <p>🔺 {product.votesCount} votes | 💬 {product.commentsCount} total comments</p>
              <p>📊 {product.comments?.length || 0} comments fetched</p>
              <a href={product.website} target="_blank" rel="noopener noreferrer" 
                 style={{ color: '#FF6154' }}>
                Visit Website →
              </a>
              
              {product.comments && product.comments.length > 0 && (
                <details style={{ marginTop: '1rem' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    View Comments ({product.comments.length} fetched)
                  </summary>
                  <div style={{ marginTop: '0.5rem' }}>
                    {product.comments.map((comment: any, idx: number) => (
                      <div key={idx} style={{ 
                        padding: '0.75rem', 
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        marginTop: '0.5rem',
                        borderLeft: '3px solid #FF6154'
                      }}>
                        <p style={{ margin: '0 0 0.5rem 0' }}>{comment.body}</p>
                        <div style={{ fontSize: '0.85em', color: '#666' }}>
                          <strong>{comment.author}</strong>
                          {comment.authorHeadline && <span> - {comment.authorHeadline}</span>}
                          <br />
                          👍 {comment.votes} votes • {new Date(comment.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
              
              {product.description && (
                <details style={{ marginTop: '0.5rem' }}>
                  <summary style={{ cursor: 'pointer' }}>View Description</summary>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9em' }}>{product.description}</p>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
