import { initSimulatorEnvironment, isSimulatorMode } from './mode'
import { simulatorRequest } from './mockBackend'

function installFetchInterceptor() {
  if (typeof window === 'undefined' || window.__creat8rSimulatorFetchInstalled) {
    return
  }
  window.__creat8rSimulatorFetchInstalled = true

  const nativeFetch = window.fetch.bind(window)
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || ''
    if (url.includes('/api/method/')) {
      const parsedUrl = new URL(url, window.location.origin)
      let params = {}
      if (init?.body && typeof init.body === 'string') {
        try {
          params = JSON.parse(init.body)
        } catch {
          params = {}
        }
      } else {
        for (const [k, v] of parsedUrl.searchParams.entries()) {
          params[k] = v
        }
      }

      const result = await simulatorRequest({
        url: parsedUrl.pathname,
        method: init?.method || 'POST',
        params,
      })

      const body =
        result && typeof result === 'object' && ('docs' in result || 'home_page' in result)
          ? result
          : { message: result }

      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    return nativeFetch(input, init)
  }
}

if (isSimulatorMode()) {
  initSimulatorEnvironment()
  installFetchInterceptor()
}
