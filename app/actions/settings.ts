'use server'

import { revalidatePath } from 'next/cache'
import { updateSettings, getSettings } from '@/lib/db'
import type { ISettings } from '@/types/interfaces'

export async function updateSettingsAction(updates: Partial<ISettings>) {
  try {
    const result = await updateSettings(updates)
    revalidatePath('/settings')
    revalidatePath('/jig')
    return { success: true, settings: result }
  } catch (error) {
    console.error('Failed to update settings:', error)
    return { success: false, error: 'Failed to update settings' }
  }
}

export async function getSettingsAction() {
  try {
    const settings = await getSettings()
    return { success: true, settings }
  } catch (error) {
    console.error('Failed to get settings:', error)
    return { success: false, settings: null, error: 'Failed to get settings' }
  }
}
