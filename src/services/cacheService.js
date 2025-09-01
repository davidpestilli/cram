// Cache service for optimizing data fetching and reducing API calls
class CacheService {
  constructor() {
    this.cache = new Map()
    this.timestamps = new Map()
    this.DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes default TTL
  }

  // Generate a cache key from parameters
  generateKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    return sortedParams ? `${prefix}:${sortedParams}` : prefix
  }

  // Set item in cache with optional TTL
  set(key, value, ttl = this.DEFAULT_TTL) {
    this.cache.set(key, value)
    this.timestamps.set(key, Date.now() + ttl)
    
    // Clean expired items periodically
    if (this.cache.size % 10 === 0) {
      this.cleanup()
    }
  }

  // Get item from cache
  get(key) {
    const timestamp = this.timestamps.get(key)
    
    if (!timestamp || Date.now() > timestamp) {
      this.cache.delete(key)
      this.timestamps.delete(key)
      return null
    }
    
    return this.cache.get(key)
  }

  // Check if key exists and is not expired
  has(key) {
    return this.get(key) !== null
  }

  // Remove specific key
  delete(key) {
    this.cache.delete(key)
    this.timestamps.delete(key)
  }

  // Clear all cache
  clear() {
    this.cache.clear()
    this.timestamps.clear()
  }

  // Remove expired items
  cleanup() {
    const now = Date.now()
    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now > timestamp) {
        this.cache.delete(key)
        this.timestamps.delete(key)
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  // Cached async function wrapper
  async cachedCall(key, asyncFn, ttl = this.DEFAULT_TTL) {
    // Check if we have cached data
    const cached = this.get(key)
    if (cached !== null) {
      return cached
    }

    try {
      // Fetch new data
      const result = await asyncFn()
      this.set(key, result, ttl)
      return result
    } catch (error) {
      console.error('Cache service error:', error)
      throw error
    }
  }
}

// Singleton instance
const cacheService = new CacheService()

// Specific cache methods for common operations
export const questionCache = {
  // Cache questions for a specific section
  getQuestions: (sectionId, count) => {
    const key = cacheService.generateKey('questions', { sectionId, count })
    return cacheService.get(key)
  },
  
  setQuestions: (sectionId, count, questions) => {
    const key = cacheService.generateKey('questions', { sectionId, count })
    cacheService.set(key, questions, 10 * 60 * 1000) // 10 minutes TTL
  }
}

export const userCache = {
  // Cache user profile
  getProfile: (userId) => {
    const key = cacheService.generateKey('profile', { userId })
    return cacheService.get(key)
  },
  
  setProfile: (userId, profile) => {
    const key = cacheService.generateKey('profile', { userId })
    cacheService.set(key, profile, 15 * 60 * 1000) // 15 minutes TTL
  },

  // Cache user stats
  getStats: (userId) => {
    const key = cacheService.generateKey('stats', { userId })
    return cacheService.get(key)
  },
  
  setStats: (userId, stats) => {
    const key = cacheService.generateKey('stats', { userId })
    cacheService.set(key, stats, 2 * 60 * 1000) // 2 minutes TTL
  }
}

export const achievementCache = {
  // Cache achievements
  getAchievements: (userId) => {
    const key = cacheService.generateKey('achievements', { userId })
    return cacheService.get(key)
  },
  
  setAchievements: (userId, achievements) => {
    const key = cacheService.generateKey('achievements', { userId })
    cacheService.set(key, achievements, 5 * 60 * 1000) // 5 minutes TTL
  }
}

export const shopCache = {
  // Cache shop items
  getItems: () => {
    const key = cacheService.generateKey('shop_items')
    return cacheService.get(key)
  },
  
  setItems: (items) => {
    const key = cacheService.generateKey('shop_items')
    cacheService.set(key, items, 30 * 60 * 1000) // 30 minutes TTL
  }
}

export default cacheService