// Service Worker for CRAM PWA
const CACHE_NAME = 'cram-v1.0.0'
const STATIC_CACHE = 'cram-static-v1'
const DYNAMIC_CACHE = 'cram-dynamic-v1'

// Resources to cache immediately
const STATIC_ASSETS = [
  '/cram/',
  '/cram/index.html',
  '/cram/manifest.json',
  // Will be populated with actual built assets by build process
]

// API endpoints to cache with network-first strategy
const API_CACHE_PATTERNS = [
  /\/api\/questions\//,
  /\/api\/profile\//,
  /\/api\/achievements\//
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        return self.clients.claim()
      })
  )
})

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  const { url, method } = request
  
  // Only handle GET requests
  if (method !== 'GET') {
    return
  }

  // Handle API requests with network-first strategy
  if (isAPIRequest(url)) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // Handle navigation requests with network-first, cache fallback
  if (isNavigationRequest(request)) {
    event.respondWith(navigationStrategy(request))
    return
  }

  // Default strategy for other requests
  event.respondWith(networkFirstStrategy(request))
})

// Check if request is for API
function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url)) ||
         url.includes('supabase.co') ||
         url.includes('api/')
}

// Check if request is for static asset
function isStaticAsset(url) {
  return url.includes('.js') || 
         url.includes('.css') || 
         url.includes('.png') || 
         url.includes('.jpg') || 
         url.includes('.ico') ||
         url.includes('/assets/')
}

// Check if request is navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'))
}

// Cache-first strategy - good for static assets
async function cacheFirstStrategy(request) {
  try {
    const cacheResponse = await caches.match(request)
    if (cacheResponse) {
      return cacheResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Cache-first strategy failed:', error)
    return new Response('Asset not available offline', { status: 503 })
  }
}

// Network-first strategy - good for API requests
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache:', request.url)
    
    const cacheResponse = await caches.match(request)
    if (cacheResponse) {
      return cacheResponse
    }
    
    // Return offline fallback for API requests
    if (isAPIRequest(request.url)) {
      return new Response(JSON.stringify({
        error: 'Offline',
        message: 'Você está offline. Algumas funcionalidades podem não estar disponíveis.',
        cached: false
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response('Conteúdo não disponível offline', { status: 503 })
  }
}

// Navigation strategy - for page requests
async function navigationStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    console.log('Navigation offline, serving cached app shell')
    
    // Serve cached app shell for navigation requests when offline
    const cacheResponse = await caches.match('/cram/')
    if (cacheResponse) {
      return cacheResponse
    }
    
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CRAM - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              max-width: 400px;
              background: white;
              color: #333;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            h1 { color: #667eea; margin-bottom: 20px; }
            p { margin-bottom: 20px; line-height: 1.6; }
            .retry-btn {
              background: #667eea;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📚 CRAM</h1>
            <p>Você está offline. Verifique sua conexão com a internet.</p>
            <p>Algumas funcionalidades podem estar disponíveis quando você voltar online.</p>
            <button class="retry-btn" onclick="window.location.reload()">
              Tentar Novamente
            </button>
          </div>
        </body>
      </html>
    `, {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag)
  
  if (event.tag === 'study-session-sync') {
    event.waitUntil(syncStudySessions())
  }
})

// Sync study sessions when back online
async function syncStudySessions() {
  try {
    // Get pending study sessions from IndexedDB
    const pendingSessions = await getPendingStudySessions()
    
    for (const session of pendingSessions) {
      try {
        const response = await fetch('/api/study-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(session)
        })
        
        if (response.ok) {
          await removePendingStudySession(session.id)
          console.log('Synced study session:', session.id)
        }
      } catch (error) {
        console.error('Failed to sync study session:', error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingStudySessions() {
  // Implementation would use IndexedDB to store offline data
  return []
}

async function removePendingStudySession(sessionId) {
  // Implementation would remove synced data from IndexedDB
  console.log('Removed pending session:', sessionId)
}

// Push notifications (optional)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received')
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do CRAM!',
    icon: '/cram/icon-192x192.png',
    badge: '/cram/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Estudar Agora',
        icon: '/cram/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/cram/icon-192x192.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('CRAM - Direito Penal', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received')
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/cram/subjects')
    )
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/cram/')
    )
  }
})