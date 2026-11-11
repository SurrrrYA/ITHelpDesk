import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { getToken } from './api'

declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

window.Pusher = Pusher

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'
const authEndpoint = `${apiBaseUrl.replace(/\/api\/v1\/?$/, '')}/broadcasting/auth`

let echo: Echo<'reverb'> | null = null
let activeToken: string | null = null

export function getEcho(): Echo<'reverb'> | null {
  const token = getToken()

  if (!token) {
    disconnectEcho()
    return null
  }

  if (echo && activeToken === token) {
    return echo
  }

  disconnectEcho()
  activeToken = token

  echo = new Echo<'reverb'>({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  })

  return echo
}

export function disconnectEcho(): void {
  if (echo) {
    echo.disconnect()
    echo = null
  }

  activeToken = null
}
