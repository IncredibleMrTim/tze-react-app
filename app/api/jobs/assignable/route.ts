import { NextResponse } from 'next/server'
import { getAssignableJobs } from '@/lib/db'

// CORS headers for dev mode
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const jobs = await getAssignableJobs()
    return NextResponse.json(jobs, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching assignable jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch assignable jobs' }, { status: 500, headers: corsHeaders })
  }
}
