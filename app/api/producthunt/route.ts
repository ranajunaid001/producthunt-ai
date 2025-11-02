import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { query } = await request.json()
    
    // Use Product Hunt's actual GraphQL API
    const graphqlQuery = {
      query: `
        {
          posts(first: 10, order: RANKING) {
            edges {
              node {
                id
                name
                tagline
                votesCount
                website
                slug
              }
            }
          }
        }
      `
    }
    
    const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(graphqlQuery)
    })
    
    const data = await response.json()
    
    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'GraphQL error')
    }
    
    const products = data.data?.posts?.edges?.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
      tagline: edge.node.tagline,
      votesCount: edge.node.votesCount || 0,
      url: `https://www.producthunt.com/posts/${edge.node.slug}`,
      website: edge.node.website || '#'
    })) || []
    
    return NextResponse.json({
      products: products,
      query: query
    })
  } catch (error: any) {
    console.error('Product Hunt API Error:', error)
    
    // Return mock data as fallback
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
      }
    ]
    
    return NextResponse.json({
      products: mockProducts,
      error: error.message,
      mock: true
    })
  }
}
