export interface TrackingOptions {
  /** Your Minilytics site ID */
  siteId: string
  /** API endpoint (default: https://minilytics.app/api/track) */
  apiUrl?: string
  /** Respect Do Not Track header (default: true) */
  respectDnt?: boolean
  /** Enable debug logging (default: false) */
  debug?: boolean
}

export interface PageViewData {
  /** Current page URL */
  url?: string
  /** Page title */
  title?: string
  /** Referrer URL */
  referrer?: string
  /** Custom properties */
  properties?: Record<string, any>
}

class MinilyticsTracker {
  private options: Required<TrackingOptions>
  private initialized = false

  constructor(options: TrackingOptions) {
    this.options = {
      apiUrl: 'https://minilytics.app/api/track',
      respectDnt: true,
      debug: false,
      ...options,
    }
  }

  /**
   * Initialize the tracker and send initial page view
   */
  init(): void {
    if (this.initialized) {
      this.log('Already initialized')
      return
    }

    // Check Do Not Track
    if (this.options.respectDnt && this.isDntEnabled()) {
      this.log('Do Not Track is enabled, tracking disabled')
      return
    }

    this.initialized = true
    this.trackPageView()

    // Track SPA navigation
    if (typeof window !== 'undefined') {
      // History API (for SPAs)
      const originalPushState = history.pushState
      const originalReplaceState = history.replaceState

      history.pushState = (...args) => {
        originalPushState.apply(history, args)
        this.trackPageView()
      }

      history.replaceState = (...args) => {
        originalReplaceState.apply(history, args)
        this.trackPageView()
      }

      // Handle popstate (back/forward)
      window.addEventListener('popstate', () => {
        this.trackPageView()
      })
    }

    this.log('Tracker initialized')
  }

  /**
   * Track a page view
   */
  trackPageView(data: Partial<PageViewData> = {}): void {
    if (!this.initialized && !data.url) {
      this.log('Tracker not initialized, call init() first')
      return
    }

    if (this.options.respectDnt && this.isDntEnabled()) {
      return
    }

    const payload = {
      url: data.url || window.location.href,
      title: data.title || document.title,
      referrer: data.referrer || document.referrer || null,
      ...data.properties,
    }

    this.send(payload)
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.initialized) {
      this.log('Tracker not initialized, call init() first')
      return
    }

    if (this.options.respectDnt && this.isDntEnabled()) {
      return
    }

    const payload = {
      event: eventName,
      url: window.location.href,
      ...properties,
    }

    this.send(payload)
  }

  /**
   * Send tracking data to the API
   */
  private send(data: any): void {
    const url = new URL(window.location.href)
    
    const payload = {
      domain: url.hostname,
      path: url.pathname + url.search,
      referrer: data.referrer,
      title: data.title,
      event: data.event,
      properties: data.properties,
      site_id: this.options.siteId,
    }

    this.log('Sending:', payload)

    // Use fetch with keepalive instead of sendBeacon to avoid credentials issue
    fetch(this.options.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: 'omit', // Don't send credentials (cookies)
    }).catch((err) => {
      this.log('Failed to send tracking data:', err)
    })
  }

  /**
   * Check if Do Not Track is enabled
   */
  private isDntEnabled(): boolean {
    if (typeof navigator === 'undefined') return false
    return (
      navigator.doNotTrack === '1' ||
      // @ts-ignore
      window.doNotTrack === '1' ||
      // @ts-ignore
      navigator.msDoNotTrack === '1'
    )
  }

  /**
   * Log debug messages
   */
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[Minilytics]', ...args)
    }
  }
}

/**
 * Create and initialize a Minilytics tracker
 */
export function createTracker(options: TrackingOptions): MinilyticsTracker {
  return new MinilyticsTracker(options)
}

/**
 * Default export for convenience
 */
export default {
  createTracker,
}
