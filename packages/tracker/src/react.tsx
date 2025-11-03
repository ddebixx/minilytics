import React, { createContext, useContext, useEffect } from 'react'
import { createTracker, PageViewData } from './index'

const MinilyticsContext = createContext<ReturnType<typeof createTracker> | null>(null)

export interface MinilyticsProviderProps {
  children?: any
  siteId: string
  apiUrl?: string
  respectDnt?: boolean
  debug?: boolean
}

/**
 * Provider component for React applications
 */
export function MinilyticsProvider({
  children,
  siteId,
  apiUrl,
  respectDnt,
  debug,
}: MinilyticsProviderProps): React.ReactElement {
  const tracker = createTracker({
    siteId,
    apiUrl,
    respectDnt,
    debug,
  })

  useEffect(() => {
    tracker.init()
  }, [tracker])

  return (
    <MinilyticsContext.Provider value={tracker}>
      {children}
    </MinilyticsContext.Provider>
  )
}

/**
 * Hook to access the Minilytics tracker instance
 */
export function useMinilytics() {
  const tracker = useContext(MinilyticsContext)
  
  if (!tracker) {
    throw new Error('useMinilytics must be used within MinilyticsProvider')
  }

  return {
    /**
     * Track a page view
     */
    trackPageView: (data?: Partial<PageViewData>) => {
      tracker.trackPageView(data)
    },
    
    /**
     * Track a custom event
     */
    trackEvent: (eventName: string, properties?: Record<string, any>) => {
      tracker.trackEvent(eventName, properties)
    },
  }
}

/**
 * Hook to track page views automatically in React Router or Next.js
 */
export function usePageTracking() {
  const { trackPageView } = useMinilytics()

  useEffect(() => {
    trackPageView()
  }, [trackPageView])
}
