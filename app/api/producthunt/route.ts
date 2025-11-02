import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { query, productCount = 10 } = await request.json()
    
    // Get token from environment variable
    const DEVELOPER_TOKEN = process.env.PRODUCTHUNT_TOKEN
    
    if (!DEVELOPER_TOKEN) {
      throw new Error('Product Hunt API token not configured')
    }
    
    // Get products with 50 comments each
    const graphqlQuery = {
      query: `
        {
          posts(first: ${productCount}, order: RANKING) {
            edges {
              node {
                id
                name
                tagline
                description
                votesCount
                website
                slug
                commentsCount
                reviewsRating
                createdAt
                featuredAt
                topics {
                  edges {
                    node {
                      name
                    }
                  }
                }
                makers {
                  name
                  headline
                }
                comments(first: 10) {
                  edges {
                    node {
                      body
                      votesCount
                      createdAt
                      user {
                        name
                        headline
                      }
                    }
                  }
                }
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
        'Authorization': `Bearer ${DEVELOPER_TOKEN}`
      },
      body: JSON.stringify(graphqlQuery)
    })
    
    const data = await response.json()
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors)
      throw new Error(data.errors[0]?.message || 'GraphQL error')
    }
    
    // Transform with all data including 50 comments per product
    const products = data.data?.posts?.edges?.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
      tagline: edge.node.tagline,
      description: edge.node.description || 'No description available',
      votesCount: edge.node.votesCount || 0,
      commentsCount: edge.node.commentsCount || 0,
      reviewsRating: edge.node.reviewsRating || null,
      url: `https://www.producthunt.com/posts/${edge.node.slug}`,
      website: edge.node.website || '#',
      createdAt: edge.node.createdAt,
      featuredAt: edge.node.featuredAt,
      topics: edge.node.topics?.edges?.map((t: any) => t.node.name) || [],
      makers: edge.node.makers || [],
      comments: edge.node.comments?.edges?.map((c: any) => ({
        body: c.node.body,
        votes: c.node.votesCount,
        createdAt: c.node.createdAt,
        author: c.node.user?.name || 'Anonymous',
        authorHeadline: c.node.user?.headline || ''
      })) || []
    })) || []
    
    return NextResponse.json({
      products: products,
      query: query,
      source: 'Product Hunt Live Data',
      timestamp: new Date().toISOString(),
      commentsFetched: products.reduce((sum, p) => sum + p.comments.length, 0)
    })
  } catch (error: any) {
    console.error('Product Hunt API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Product Hunt data', details: error.message },
      { status: 500 }
    )
  }
}
