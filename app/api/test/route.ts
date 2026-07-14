import { NextResponse } from 'next/server'

export async function GET() {
  console.log('TEST endpoint called')
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now(),
    message: 'Test endpoint works!'
  })
}
