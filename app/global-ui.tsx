'use client'

import { useApp } from '@/context/AppContext'
import { Toast } from '@/components/Toast'
import { Lightbox } from '@/components/Lightbox'

export function GlobalUI() {
  const { toast, lightbox, showToast, closeLightbox } = useApp()

  return (
    <>
      {toast && <Toast message={toast} onClose={() => showToast('')} />}
      {lightbox && <Lightbox src={lightbox} onClose={closeLightbox} />}
    </>
  )
}
