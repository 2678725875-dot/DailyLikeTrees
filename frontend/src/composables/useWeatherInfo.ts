/** Real-time weather + time composable.
 *
 *  Uses the free Open-Meteo API (no API key required) to fetch
 *  current weather based on browser geolocation.
 *  Falls back gracefully when location is denied or API is unreachable.
 */

import { ref, onMounted, onUnmounted } from 'vue'

export interface WeatherInfo {
  temperature: number | null   // °C
  weatherCode: number | null   // WMO code
  weatherIcon: string          // mapped to our weather types
  locationName: string         // city or coordinates
  loading: boolean
  error: string | null
}

/** WMO weather code → internal weather type */
function wmoToWeatherType(code: number): string {
  if (code === 0) return 'sunny'
  if (code <= 3) return 'cloudy'
  if (code <= 48) return 'cloudy'
  if (code <= 55) return 'rainy'
  if (code <= 65) return 'rainy'
  if (code <= 75) return 'cloudy'   // snow → cloudy (no snow in our types)
  if (code <= 82) return 'rainy'
  if (code <= 86) return 'cloudy'   // snow showers
  if (code >= 95) return 'thunderstorm'
  return 'sunny'
}

export function useWeatherInfo() {
  const temperature = ref<number | null>(null)
  const weatherType = ref<string>('sunny')
  const locationName = ref<string>('')
  const loading = ref(true)
  const error = ref<string | null>(null)
  const currentTime = ref('')

  let timeTimer: ReturnType<typeof setInterval> | null = null

  // ── Clock ──
  function updateTime() {
    const now = new Date()
    const h = now.getHours().toString().padStart(2, '0')
    const m = now.getMinutes().toString().padStart(2, '0')
    currentTime.value = `${h}:${m}`
  }

  // ── Geolocation + weather ──
  function fetchWeatherByCoords(lat: number, lon: number) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current_weather=true`
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data?.current_weather) {
          const w = data.current_weather
          temperature.value = Math.round(w.temperature)
          weatherType.value = wmoToWeatherType(w.weathercode ?? 0)
        }
        loading.value = false
      })
      .catch(err => {
        console.warn('Weather fetch failed:', err)
        error.value = '天气数据不可用'
        loading.value = false
      })
  }

  // ── Reverse geocode for city name ──
  function fetchCityName(lat: number, lon: number) {
    // Use Open-Meteo's geocoding API (also free)
    fetch(`https://geocoding-api.open-meteo.com/v1/search?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&count=1&language=zh`)
      .then(res => res.json())
      .then(data => {
        if (data?.results?.length > 0) {
          locationName.value = data.results[0].name || data.results[0].admin1 || ''
        }
        if (!locationName.value) {
          locationName.value = `${lat.toFixed(1)}°N, ${lon.toFixed(1)}°E`
        }
      })
      .catch(() => {
        locationName.value = `${lat.toFixed(1)}°N, ${lon.toFixed(1)}°E`
      })
  }

  function requestLocation() {
    if (!('geolocation' in navigator)) {
      console.warn('[Weather] Geolocation API not available, using IP fallback')
      useFallbackLocation()
      return
    }

    // Check permission state first (supported in all modern browsers & WebView2)
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(perm => {
        console.log('[Weather] Geolocation permission state:', perm.state)
        if (perm.state === 'denied') {
          console.warn('[Weather] Geolocation denied, skipping to IP fallback')
          useFallbackLocation()
          return
        }
        // 'granted' or 'prompt' — try browser geolocation
        doBrowserGeolocation()
      }).catch(() => {
        // permissions.query itself failed (e.g. not supported) — just try
        doBrowserGeolocation()
      })
    } else {
      doBrowserGeolocation()
    }
  }

  function doBrowserGeolocation() {
    let resolved = false

    // Safety timeout: if geolocation hangs (dialog never shown), fall back after 6 s
    const fallbackTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        console.warn('[Weather] Geolocation timed out, using IP fallback')
        useFallbackLocation()
      }
    }, 6000)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (resolved) return
        resolved = true
        clearTimeout(fallbackTimer)
        console.log('[Weather] Browser geolocation success:', pos.coords.latitude, pos.coords.longitude)
        const { latitude, longitude } = pos.coords
        fetchWeatherByCoords(latitude, longitude)
        fetchCityName(latitude, longitude)
      },
      (err) => {
        if (resolved) return
        resolved = true
        clearTimeout(fallbackTimer)
        console.warn('[Weather] Geolocation error:', err.message, '(code:', err.code, ')')
        useFallbackLocation()
      },
      { timeout: 8000, maximumAge: 600_000 }  // cache 10 min
    )
  }

  /** Try a single IP geolocation API, returns true on success. */
  function tryIPApi(url: string, extract: (data: any) => { lat: number; lon: number; name: string } | null): Promise<boolean> {
    return fetch(url)
      .then(res => res.json())
      .then(data => {
        const result = extract(data)
        if (result) {
          locationName.value = result.name
          fetchWeatherByCoords(result.lat, result.lon)
          return true
        }
        return false
      })
      .catch(() => false)
  }

  /** Fallback: try multiple IP geolocation APIs in parallel.
   *  First one to respond wins. If all fail, use hardcoded city. */
  async function fetchLocationByIP() {
    console.log('[Weather] Trying IP geolocation...')

    // Race multiple free IP geolocation APIs — first success wins
    const results = await Promise.allSettled([
      // ipapi.co — HTTPS, free, no key
      tryIPApi('https://ipapi.co/json/', (d) => {
        if (d?.latitude && d?.longitude) {
          return { lat: d.latitude, lon: d.longitude, name: d.city || d.region || '' }
        }
        return null
      }),
      // ip-api.com — free, no key (HTTP only for free tier, but works)
      tryIPApi('http://ip-api.com/json/?fields=lat,lon,city,regionName', (d) => {
        if (d?.lat && d?.lon) {
          return { lat: d.lat, lon: d.lon, name: d.city || d.regionName || '' }
        }
        return null
      }),
    ])

    const anySuccess = results.some(r => r.status === 'fulfilled' && r.value === true)
    if (anySuccess) {
      console.log('[Weather] IP geolocation succeeded')
      return
    }

    // All IP APIs failed — last resort
    console.warn('[Weather] All IP geolocation APIs failed, using hardcoded Beijing')
    useHardcodedFallback()
  }

  /** Last resort: hardcoded Beijing so weather always shows. */
  function useHardcodedFallback() {
    const DEFAULT_LAT = 39.9042
    const DEFAULT_LON = 116.4074
    locationName.value = '北京'
    fetchWeatherByCoords(DEFAULT_LAT, DEFAULT_LON)
  }

  /** Fallback chain: try IP geolocation first, then hardcoded city. */
  function useFallbackLocation() {
    fetchLocationByIP()
  }

  onMounted(() => {
    updateTime()
    timeTimer = setInterval(updateTime, 1000)
    requestLocation()
  })

  onUnmounted(() => {
    if (timeTimer) clearInterval(timeTimer)
  })

  return { temperature, weatherType, locationName, loading, error, currentTime }
}
