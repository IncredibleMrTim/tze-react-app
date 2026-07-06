import { NextRequest, NextResponse } from 'next/server'
import { getContacts, searchContacts } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (query) {
      const contacts = await searchContacts(query)
      return NextResponse.json(contacts)
    }

    const contacts = await getContacts()
    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}
