import { NextRequest, NextResponse } from 'next/server'
import { getDispatchedJobs } from '@/lib/db'

// Always hit the DB fresh — see app/api/jobs/ready/route.ts for why.
export const dynamic = 'force-dynamic'

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
    const search = searchParams.get('search') ?? undefined

    const result = await getDispatchedJobs({ cursor, take, search })
    return NextResponse.json(result, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching dispatched jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch dispatched jobs' }, { status: 500, headers: corsHeaders })
  }
}
