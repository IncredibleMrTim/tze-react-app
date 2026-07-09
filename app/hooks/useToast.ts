import { toast } from 'sonner'

export function useToast() {
  return {
    showToast: (message: string) => {
      toast(message)
    }
  }
}
