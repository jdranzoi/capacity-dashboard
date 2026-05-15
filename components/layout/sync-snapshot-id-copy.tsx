'use client'

import { Button } from '@/components/ui/button'
import { Check, Copy } from 'lucide-react'
import { useCallback, useState, type MouseEvent } from 'react'

export function SyncSnapshotIdCopy({ snapshotId }: { snapshotId: string }) {
  const [copied, setCopied] = useState(false)

  const onCopy = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()
      try {
        await navigator.clipboard.writeText(snapshotId)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      } catch {
        // Clipboard API unavailable (permissions / non-secure context)
      }
    },
    [snapshotId]
  )

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="-mr-0.5 text-current opacity-70 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
      onClick={onCopy}
      aria-label={copied ? 'Snapshot ID copied to clipboard' : 'Copy snapshot ID'}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </Button>
  )
}
