import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'Product Hunt AI Agent API is working!',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  
  return NextResponse.json({
    message: 'POST request received',
    received: body,
    timestamp: new Date().toISOString()
  })
}
