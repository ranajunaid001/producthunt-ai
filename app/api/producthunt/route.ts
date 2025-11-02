import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { query, date } = await request.json()
    
    // We'll scrape the public Product Hunt API that their website uses
    // This endpoint is public and doesn't require authentication
    const today = new Date().toISOString().split('T')[0]
    const apiUrl = `https://www.producthunt.com/frontend/daily_feed?date=${date || today}`
    
    console.log('Fetching from:', apiUrl)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Extract products from the response
    const products = data.data?.edges?.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
      tagline: edge.node.tagline,
      votesCount: edge.node.votesCount || 0,
      url: `https://www.producthunt.com/posts/${edge.node.slug}`,
      website: edge.node.website || '#',
      thumbnail: edge.node.thumbnail?.url,
      topics: edge.node.topics?.map((t: any) => t.name) || []
    })) || []
    
    return NextResponse.json({
      products: products.slice(0, 10), // Return top 10
      query: query,
      date: date || today,
      count: products.length
    })
  } catch (error: any) {
    console.error('Product Hunt API Error:', error)
    
    // If real API fails, return mock data so the app still works
    const mockProducts = [
      {
        id: '1',
        name: 'Error fetching real data',
        tagline: 'Using mock data instead. Error: ' + error.message,
        votesCount: 0,
        url: '#',
        website: '#'
      }
    ]
    
    return NextResponse.json({
      products: mockProducts,
      query: '', // Fixed: removed undefined variable
      error: error.message,
      mock: true
    })
  }
}
