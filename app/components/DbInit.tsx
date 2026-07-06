'use client'

import { useEffect } from 'react'
import { useStore } from '@/store/useStore'

export function DbInit() {
  const { setJobs, setJigA, setInvSeq, setSettings, setItems, setContacts } = useStore()

  useEffect(() => {
    let mounted = true

    async function loadFromDb() {
      try {
        // Load items
        const itemsRes = await fetch('/api/items')
        if (itemsRes.ok && mounted) {
          const items = await itemsRes.json()
          setItems(items)
          console.log(`✓ Loaded ${items.length} items from database`)
        }

        // Load contacts
        const contactsRes = await fetch('/api/contacts')
        if (contactsRes.ok && mounted) {
          const contacts = await contactsRes.json()
          setContacts(contacts)
          console.log(`✓ Loaded ${contacts.length} contacts from database`)
        }

        // Load jobs
        const jobsRes = await fetch('/api/jobs')
        if (jobsRes.ok && mounted) {
          const jobs = await jobsRes.json()
          setJobs(jobs)
          console.log(`✓ Loaded ${jobs.length} jobs from database`)
        }

        // Load jig assignments
        const jigsRes = await fetch('/api/jigs')
        if (jigsRes.ok && mounted) {
          const jigs = await jigsRes.json()
          setJigA(jigs)
          console.log(`✓ Loaded ${jigs.length} jig assignments from database`)
        }

        // Load settings
        const settingsRes = await fetch('/api/settings')
        if (settingsRes.ok && mounted) {
          const settings = await settingsRes.json()
          setSettings({
            apiKey: settings.apiKey,
            silverKg: settings.silverKg,
            goldKg: settings.goldKg,
            silverJig: settings.silverJig,
            goldJig: settings.goldJig,
            dueDays: settings.dueDays,
            jigCount: settings.jigCount,
            invSeqStart: settings.invSeqStart,
            stringRate: settings.stringRate,
          })
          setInvSeq(settings.invSeq)
          console.log('✓ Loaded settings from database')
        }

        console.log('✅ All data loaded from database')
      } catch (error) {
        console.error('Error loading data from database:', error)
        console.log('ℹ If database is not set up, run: npm run db:push && npm run db:seed')
      }
    }

    loadFromDb()

    return () => {
      mounted = false
    }
  }, [setJobs, setJigA, setInvSeq, setSettings, setItems, setContacts])

  return null
}
