import { NextRequest, NextResponse } from 'next/server'
import { getJobs, createJob } from '@/lib/db'
import type { IJob } from '@/types/interfaces'

// Always hit the DB fresh — see app/api/jobs/ready/route.ts for why.
export const dynamic = 'force-dynamic'

// CORS headers for dev mode
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const jobs = await getJobs()
    return NextResponse.json(jobs, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500, headers: corsHeaders })
  }
}

export async function POST(request: NextRequest) {
  try {
    const job: IJob = await request.json()
    const newJob = await createJob(job)
    return NextResponse.json(newJob, { status: 201, headers: corsHeaders })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500, headers: corsHeaders })
  }
}
