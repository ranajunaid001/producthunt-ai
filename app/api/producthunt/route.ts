import { NextResponse } from 'next/server'

const DEVELOPER_TOKEN = '9aiZygx2ZjK5NfLMBaTZq9IkfcYLaMEMK51CBxpIDpg'

export async function POST(request: Request) {
  try {
    const { query } = await request.json()
    
    // Enhanced GraphQL query with more data
    const graphqlQuery = {
      query: `
        {
          posts(first: 10, order: RANKING) {
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
                comments(first: 3) {
                  edges {
                    node {
                      body
                      votesCount
                      user {
                        name
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
    
    // Transform with all the data
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
      topics: edge.node.topics?.edges?.map((t: any) => t.node.name) || [],
      makers: edge.node.makers || [],
      topComments: edge.node.comments?.edges?.map((c: any) => ({
        body: c.node.body,
        votes: c.node.votesCount,
        user: c.node.user?.name || 'Anonymous'
      })) || []
    })) || []
    
    return NextResponse.json({
      products: products,
      query: query,
      source: 'Product Hunt Live Data'
    })
  } catch (error: any) {
    console.error('Product Hunt API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Product Hunt data', details: error.message },
      { status: 500 }
    )
  }
}
