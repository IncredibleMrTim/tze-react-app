'use client'

import { useStore } from '@/store/useStore'
import { Toast } from '@/components/Toast'
import { Lightbox } from '@/components/Lightbox'

export function GlobalUI() {
  const toast = useStore((state) => state.toast)
  const lightbox = useStore((state) => state.lightbox)
  const setToast = useStore((state) => state.setToast)
  const closeLightbox = useStore((state) => state.closeLightbox)

  return (
    <>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {lightbox && <Lightbox src={lightbox} onClose={closeLightbox} />}
    </>
  )
}
