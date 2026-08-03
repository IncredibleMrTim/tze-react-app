import { NextRequest, NextResponse } from 'next/server'
import type { IJob } from '@/types/interfaces'

// CORS headers for dev mode
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const PYTHON_API_URL = process.env.PYTHON_API_URL

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const response = await fetch(`${PYTHON_API_URL}/api/jobs`, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`Python API responded with ${response.status}`)
    }
    const jobs = await response.json()
    return NextResponse.json(jobs, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500, headers: corsHeaders })
  }
}

export async function POST(request: NextRequest) {
  try {
    const job: IJob = await request.json()
    const response = await fetch(`${PYTHON_API_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    })
    if (!response.ok) {
      throw new Error(`Python API responded with ${response.status}`)
    }
    const newJob = await response.json()
    return NextResponse.json(newJob, { status: 201, headers: corsHeaders })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500, headers: corsHeaders })
  }
}
