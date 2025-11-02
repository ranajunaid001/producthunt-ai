import { NextResponse } from 'next/server'

// Product Hunt doesn't require API key for basic public data
const PRODUCTHUNT_API = 'https://www.producthunt.com/frontend/graphql'

export async function POST(request: Request) {
  try {
    const { query } = await request.json()
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Simple query to get today's products
    const graphqlQuery = `
      query {
        posts(order: VOTES, first: 5) {
          nodes {
            id
            name
            tagline
            votesCount
            url
            website
          }
        }
      }
    `

    const response = await fetch(PRODUCTHUNT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: graphqlQuery
      })
    })

    const data = await response.json()
    
    return NextResponse.json({
      products: data.data?.posts?.nodes || [],
      query: query
    })
  } catch (error) {
    console.error('Product Hunt API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Product Hunt data' },
      { status: 500 }
    )
  }
}
