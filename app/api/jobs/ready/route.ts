import { NextRequest, NextResponse } from 'next/server'
import { getReadyToDispatchJobs } from '@/lib/db'

// Always hit the DB fresh — this list is invalidated/refetched on every
// job_updates event, so a cached response here would silently serve stale
// data (observed: a job sent back to dispatch not reappearing).
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

    const result = await getReadyToDispatchJobs({ cursor, take, search })
    return NextResponse.json(result, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching ready-to-dispatch jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch ready-to-dispatch jobs' }, { status: 500, headers: corsHeaders })
  }
}
