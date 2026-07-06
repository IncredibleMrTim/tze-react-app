import { NextRequest, NextResponse } from 'next/server'
import { getJobs, createJob } from '@/lib/db'
import type { IJob } from '@/types/interfaces'

export async function GET() {
  try {
    const jobs = await getJobs()
    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const job: IJob = await request.json()
    const newJob = await createJob(job)
    return NextResponse.json(newJob, { status: 201 })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}
