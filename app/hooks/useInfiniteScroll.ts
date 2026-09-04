import { useEffect, useState } from "react"

/**
 * Fetches the next page of a paginated list once a sentinel element
 * scrolls into view. Returns a callback ref to attach to that sentinel.
 *
 * Uses a callback ref (state) rather than a plain ref because callers
 * whose sentinel can unmount and remount (e.g. behind a tab) need the
 * observer effect to re-run when the real DOM node reappears — a plain
 * ref wouldn't trigger that.
 */
export function useInfiniteScroll(
  hasNextPage: boolean | undefined,
  isFetchingNextPage: boolean,
  fetchNextPage: () => void,
  disabled = false,
) {
  const [node, setNode] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!node || !hasNextPage || disabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: "200px" },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [node, hasNextPage, isFetchingNextPage, disabled, fetchNextPage])

  return setNode
}
