import { NextRequest, NextResponse } from 'next/server'
import { getItems, searchItems } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (query) {
      const items = await searchItems(query)
      return NextResponse.json(items)
    }

    const items = await getItems()
    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}
