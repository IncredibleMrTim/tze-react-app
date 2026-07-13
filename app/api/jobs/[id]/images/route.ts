import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        poPages: true,
        partsOnArrivalPhotos: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({
      poPages: job.poPages || [],
      partsOnArrivalPhotos: job.partsOnArrivalPhotos || [],
    })
  } catch (error) {
    console.error('Error fetching job images:', error)
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}
