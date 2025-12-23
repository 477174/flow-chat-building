import { useState, useEffect, useRef, type RefObject } from 'react'

/**
 * Hook to detect if an element is in the viewport using Intersection Observer
 * Automatically loads when in view and unloads when out of view
 *
 * @param options - Intersection Observer options
 * @returns [ref, isInView] - Ref to attach to element and visibility state
 */
export function useInViewport<T extends HTMLElement>(
  options?: IntersectionObserverInit
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      {
        // Default: trigger when any part is visible
        threshold: 0,
        // Add some margin to preload slightly before entering viewport
        rootMargin: '100px',
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [options])

  return [ref, isInView]
}
