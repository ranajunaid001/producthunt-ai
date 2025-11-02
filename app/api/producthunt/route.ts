import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { query } = await request.json()
    
    // Return mock data for now to test the connection
    const mockProducts = [
      {
        id: '1',
        name: 'Claude 3',
        tagline: 'The most capable AI assistant',
        votesCount: 523,
        url: 'https://producthunt.com/products/claude-3',
        website: 'https://claude.ai'
      },
      {
        id: '2',
        name: 'Linear',
        tagline: 'The new standard for modern software development',
        votesCount: 412,
        url: 'https://producthunt.com/products/linear',
        website: 'https://linear.app'
      },
      {
        id: '3',
        name: 'Cursor',
        tagline: 'The AI-first code editor',
        votesCount: 389,
        url: 'https://producthunt.com/products/cursor',
        website: 'https://cursor.sh'
      }
    ]
    
    return NextResponse.json({
      products: mockProducts,
      query: query,
      mock: true // indicator that this is mock data
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
