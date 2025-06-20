// Performance optimization utilities for the Challenz platform

/**
 * Debounce function to limit the rate of function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Throttle function to limit function calls to once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Memoization function for expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)!
    }
    
    const result = func(...args)
    cache.set(key, result)
    
    return result
  }) as T
}

/**
 * Lazy loading utility for components
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFunc)
  
  return (props: React.ComponentProps<T>) => (
    <React.Suspense fallback={fallback ? React.createElement(fallback) : <div>Loading...</div>}>
      <LazyComponent {...props} />
    </React.Suspense>
  )
}

/**
 * Image optimization utility
 */
export interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  blur?: boolean
}

export function optimizeImageUrl(
  src: string,
  options: ImageOptimizationOptions = {}
): string {
  const {
    width,
    height,
    quality = 75,
    format = 'webp',
    blur = false
  } = options

  // For Next.js Image optimization
  const params = new URLSearchParams()
  
  if (width) params.append('w', width.toString())
  if (height) params.append('h', height.toString())
  if (quality) params.append('q', quality.toString())
  if (format) params.append('f', format)
  if (blur) params.append('blur', '20')

  return `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`
}

/**
 * Virtual scrolling utility for large lists
 */
export interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
) {
  const [scrollTop, setScrollTop] = React.useState(0)
  const { itemHeight, containerHeight, overscan = 5 } = options

  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2)

  const visibleItems = items.slice(startIndex, endIndex)
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    startIndex,
    endIndex
  }
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false)
  const [hasIntersected, setHasIntersected] = React.useState(false)
  const elementRef = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      options
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [options, hasIntersected])

  return { elementRef, isIntersecting, hasIntersected }
}

/**
 * Preload resources utility
 */
export function preloadResource(href: string, as: string, type?: string) {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  if (type) link.type = type

  document.head.appendChild(link)
}

/**
 * Prefetch pages utility
 */
export function prefetchPage(href: string) {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = href

  document.head.appendChild(link)
}

/**
 * Bundle splitting utility
 */
export function createAsyncChunk<T>(
  importFunc: () => Promise<T>,
  chunkName?: string
): () => Promise<T> {
  return () => importFunc()
}

/**
 * Service Worker registration
 */
export function registerServiceWorker(swPath: string = '/sw.js') {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null)
  }

  return navigator.serviceWorker
    .register(swPath)
    .then((registration) => {
      console.log('SW registered: ', registration)
      return registration
    })
    .catch((registrationError) => {
      console.log('SW registration failed: ', registrationError)
      return null
    })
}

/**
 * Critical CSS inlining utility
 */
export function inlineCriticalCSS(css: string) {
  if (typeof window === 'undefined') return

  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
}

/**
 * Resource hints utility
 */
export function addResourceHints(hints: Array<{
  rel: 'dns-prefetch' | 'preconnect' | 'prefetch' | 'preload'
  href: string
  as?: string
  type?: string
  crossorigin?: boolean
}>) {
  if (typeof window === 'undefined') return

  hints.forEach(hint => {
    const link = document.createElement('link')
    link.rel = hint.rel
    link.href = hint.href
    
    if (hint.as) link.setAttribute('as', hint.as)
    if (hint.type) link.type = hint.type
    if (hint.crossorigin) link.crossOrigin = 'anonymous'

    document.head.appendChild(link)
  })
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTiming(label: string): void {
    this.metrics.set(`${label}_start`, performance.now())
  }

  endTiming(label: string): number {
    const startTime = this.metrics.get(`${label}_start`)
    if (!startTime) {
      console.warn(`No start time found for ${label}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.metrics.set(label, duration)
    this.metrics.delete(`${label}_start`)

    return duration
  }

  getMetric(label: string): number | undefined {
    return this.metrics.get(label)
  }

  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics.entries())
  }

  logMetrics(): void {
    console.table(this.getAllMetrics())
  }

  // Web Vitals monitoring
  measureWebVitals(): void {
    if (typeof window === 'undefined') return

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      console.log('LCP:', lastEntry.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        console.log('FID:', entry.processingStart - entry.startTime)
      })
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let clsValue = 0
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      console.log('CLS:', clsValue)
    }).observe({ entryTypes: ['layout-shift'] })
  }
}

// React import for lazy component utility
import React from 'react'
