'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Intake page error:', error)
    console.error('Error digest:', error.digest)
    console.error('Error stack:', error.stack)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-red-50 border-2 border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-900 mb-4">
          Something went wrong!
        </h2>

        <div className="mb-4">
          <p className="text-sm font-semibold text-red-800 mb-2">Error:</p>
          <p className="text-sm text-red-700 font-mono bg-white p-3 rounded border border-red-200 overflow-auto">
            {error.message}
          </p>
        </div>

        {error.digest && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-red-800 mb-2">Digest:</p>
            <p className="text-xs text-red-600 font-mono bg-white p-3 rounded border border-red-200">
              {error.digest}
            </p>
          </div>
        )}

        {error.stack && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-red-800 mb-2">Stack:</p>
            <pre className="text-xs text-red-600 font-mono bg-white p-3 rounded border border-red-200 overflow-auto max-h-40">
              {error.stack}
            </pre>
          </div>
        )}

        <button
          onClick={reset}
          className="w-full bg-red-600 text-white rounded-lg py-3 font-semibold hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
