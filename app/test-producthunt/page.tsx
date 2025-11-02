'use client'

import { useState } from 'react'

export default function TestProductHunt() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/producthunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'top products today' })
      })

      const data = await res.json()
      setProducts(data.products || [])
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

      {products.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Today's Top Products:</h2>
          {products.map((product: any) => (
            <div key={product.id} style={{
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px'
            }}>
              <h3>{product.name}</h3>
              <p>{product.tagline}</p>
              <p>🔺 {product.votesCount} votes</p>
              <a href={product.website} target="_blank" rel="noopener noreferrer" 
                 style={{ color: '#FF6154' }}>
                Visit Website →
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
