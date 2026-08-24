import { NextRequest, NextResponse } from 'next/server'
import { getOnFloorJobs } from '@/lib/db'

// CORS headers for dev mode
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor') ?? undefined
    const takeParam = searchParams.get('take')
    const take = takeParam ? Number(takeParam) : undefined

    const result = await getOnFloorJobs({ cursor, take })
    return NextResponse.json(result, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching on-floor jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch on-floor jobs' }, { status: 500, headers: corsHeaders })
  }
}
