const SIMULATOR_HOSTS = ['.vercel.app']

export function isSimulatorMode() {
  if (import.meta.env.VITE_SIMULATOR === 'true') return true
  if (typeof window === 'undefined') return false
  const host = window.location.hostname || ''
  if (SIMULATOR_HOSTS.some((suffix) => host.endsWith(suffix))) return true
  return new URLSearchParams(window.location.search).get('simulator') === '1'
}

export function initSimulatorEnvironment() {
  if (!isSimulatorMode() || typeof window === 'undefined') return false

  // Session cookie read by sessionStore()
  if (!document.cookie.includes('user_id=')) {
    document.cookie = 'user_id=Administrator; path=/; SameSite=Lax'
  }
  localStorage.setItem('crm_setup_completed', '1')

  window.site_name = window.site_name || 'simulator.creat8rlabs.local'
  window.demo_data_created = true
  window.translated_messages = window.translated_messages || {}
  window.sysdefaults = window.sysdefaults || {
    currency: 'INR',
    country: 'India',
    date_format: 'dd-mm-yyyy',
    number_format: '#,##,###.##',
    float_precision: 2,
  }
  window.timezone = window.timezone || {
    system: 'Asia/Kolkata',
    user: 'Asia/Kolkata',
  }

  return true
}
