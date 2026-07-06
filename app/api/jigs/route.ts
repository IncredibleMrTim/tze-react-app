import { NextRequest, NextResponse } from 'next/server'
import { getJigAssignments, createJigAssignment } from '@/lib/db'
import type { IJigAssignment } from '@/types/interfaces'

export async function GET() {
  try {
    const assignments = await getJigAssignments()
    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching jig assignments:', error)
    return NextResponse.json({ error: 'Failed to fetch jig assignments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const assignment: IJigAssignment = await request.json()
    const newAssignment = await createJigAssignment(assignment)
    return NextResponse.json(newAssignment, { status: 201 })
  } catch (error) {
    console.error('Error creating jig assignment:', error)
    return NextResponse.json({ error: 'Failed to create jig assignment' }, { status: 500 })
  }
}
