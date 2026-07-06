import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting database seed...')

  // Seed Items
  console.log('Seeding items...')
  const itemsPath = path.join(process.cwd(), 'app/data/items.json')
  const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))

  // Delete existing items first
  await prisma.item.deleteMany({})

  // Batch insert items (500 at a time)
  const batchSize = 500
  for (let i = 0; i < itemsData.length; i += batchSize) {
    const batch = itemsData.slice(i, i + batchSize)
    await prisma.item.createMany({
      data: batch.map((item: any) => ({
        code: item.code,
        desc: item.desc,
        price: item.price,
        customer: item.customer,
      })),
      skipDuplicates: true,
    })
    console.log(`Seeded ${Math.min(i + batchSize, itemsData.length)} / ${itemsData.length} items...`)
  }
  console.log(`✓ Seeded ${itemsData.length} items`)

  // Seed Contacts
  console.log('Seeding contacts...')
  const contactsPath = path.join(process.cwd(), 'app/data/contacts.json')
  const contactsData = JSON.parse(fs.readFileSync(contactsPath, 'utf-8'))

  // Delete existing contacts first
  await prisma.contact.deleteMany({})

  // Batch insert contacts
  await prisma.contact.createMany({
    data: contactsData.map((contact: any) => ({
      name: contact.name,
      account: contact.account,
      email: contact.email,
      alias: contact.alias,
    })),
    skipDuplicates: true,
  })
  console.log(`✓ Seeded ${contactsData.length} contacts`)

  // Create default settings if not exists
  console.log('Creating default settings...')
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      jigCount: 6, // Update to 6 jigs
    },
    create: {
      id: 1,
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      silverKg: 2.60,
      goldKg: 2.90,
      silverJig: 360,
      goldJig: 400,
      dueDays: 20,
      jigCount: 6,
      invSeqStart: 1,
      stringRate: 25,
      invSeq: 1,
    },
  })
  console.log('✓ Created default settings')

  console.log('✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
