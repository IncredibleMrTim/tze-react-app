import { NextRequest, NextResponse } from 'next/server'
import { updateJigAssignment, deleteJigAssignment } from '@/lib/db'
import type { IJigAssignment } from '@/types/interfaces'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updates: Partial<IJigAssignment> = await request.json()
    const updatedAssignment = await updateJigAssignment(id, updates)
    return NextResponse.json(updatedAssignment)
  } catch (error) {
    console.error('Error updating jig assignment:', error)
    return NextResponse.json({ error: 'Failed to update jig assignment' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteJigAssignment(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting jig assignment:', error)
    return NextResponse.json({ error: 'Failed to delete jig assignment' }, { status: 500 })
  }
}
