import { useEffect, useRef, useState } from "react"

/**
 * Measures the rendered height of an element via ResizeObserver, re-measuring
 * whenever any value in `deps` changes. Used to pad sibling content that sits
 * below a `position: fixed` element, which doesn't occupy layout flow space.
 */
export function useMeasuredHeight<T extends HTMLElement>(
  deps: unknown[] = [],
) {
  const ref = useRef<T>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const updateHeight = () => setHeight(node.offsetHeight)
    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(node)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return [ref, height] as const
}
