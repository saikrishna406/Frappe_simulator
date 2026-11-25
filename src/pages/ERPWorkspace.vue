<template>
  <div class="flex h-full flex-col overflow-hidden">
    <LayoutHeader>
      <template #left-header>
        <div class="flex items-center gap-2 text-base font-medium text-ink-gray-9">
          <span class="text-ink-gray-5">{{ __('ERPNext') }}</span>
          <span class="text-ink-gray-4">/</span>
          <span>{{ __(currentSection.label) }}</span>
        </div>
      </template>
      <template v-if="!simulator" #right-header>
        <Button
          :label="__('Refresh')"
          :iconLeft="LucideRefreshCcw"
          @click="reloadFrame"
        />
        <Button
          :label="__('Full Screen')"
          :iconLeft="LucideExternalLink"
          @click="openInTab"
        />
      </template>
    </LayoutHeader>

    <ErpSimulatorView
      v-if="simulator"
      :section="section"
      @navigate="navigateSection"
    />
    <div v-else class="relative flex-1 overflow-hidden bg-surface-white">
      <div
        v-if="loading"
        class="absolute inset-0 z-10 flex items-center justify-center bg-surface-white/80 text-sm text-ink-gray-6"
      >
        {{ __('Loading ERPNext...') }}
      </div>
      <iframe
        ref="frameRef"
        :key="targetUrl"
        :src="targetUrl"
        class="h-full w-full border-0"
        title="ERPNext Workspace"
        @load="onFrameLoad"
      />
    </div>
  </div>
</template>

<script setup>
import LayoutHeader from '@/components/LayoutHeader.vue'
import ErpSimulatorView from '@/components/Simulator/ErpSimulatorView.vue'
import { getSettings } from '@/stores/settings'
import { isSimulatorMode } from '@/simulator/mode'
import { Button, usePageMeta } from 'frappe-ui'
import LucideRefreshCcw from '~icons/lucide/refresh-ccw'
import LucideExternalLink from '~icons/lucide/external-link'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  section: {
    type: String,
    default: 'home',
  },
})

const router = useRouter()
const { brand } = getSettings()
const simulator = isSimulatorMode()
const frameRef = ref(null)
const loading = ref(true)

function navigateSection(nextSection) {
  router.push(`/erp/${nextSection}`)
}

const ERP_SECTIONS = {
  home: { label: 'Desk Home', path: '/app/home' },
  quotation: { label: 'Quotations', path: '/app/quotation' },
  'sales-order': { label: 'Sales Orders', path: '/app/sales-order' },
  'sales-invoice': { label: 'Sales Invoices', path: '/app/sales-invoice' },
  'payment-entry': { label: 'Payments', path: '/app/payment-entry' },
  customer: { label: 'Customers', path: '/app/customer' },
  item: { label: 'Items & Pricing', path: '/app/item' },
  stock: { label: 'Stock & Warehouses', path: '/app/stock' },
  accounting: { label: 'Accounting', path: '/app/accounting' },
}

const currentSection = computed(
  () => ERP_SECTIONS[props.section] || ERP_SECTIONS.home,
)
const targetUrl = computed(() => currentSection.value.path)

watch(targetUrl, () => {
  loading.value = true
})

function onFrameLoad() {
  try {
    const win = frameRef.value?.contentWindow
    const iframePath = win?.location?.pathname || ''

    // Never render a nested /crm shell inside the embedded frame if Desk redirects back to /crm
    if (iframePath.startsWith('/crm')) {
      const targetSubPath = iframePath.replace(/^\/crm/, '') || '/'
      if (targetSubPath.startsWith('/erp/')) {
        win.location.replace(targetUrl.value)
      } else {
        router.replace(targetSubPath)
      }
      return
    }

    loading.value = false

    const doc = frameRef.value?.contentDocument
    if (!doc || doc.getElementById('creat8r-embed-style')) return
    const style = doc.createElement('style')
    style.id = 'creat8r-embed-style'
    style.textContent = [
      ':root { --navbar-height: 0px !important; }',
      'header.navbar { display: none !important; }',
      '[data-page-route="Workspaces"] .layout-side-section,',
      '[data-page-route="Workspaces"] .sidebar-toggle-btn { display: none !important; }',
      '[data-page-route="Workspaces"] .layout-main-section-wrapper {',
      '  flex: 0 0 100% !important;',
      '  max-width: 100% !important;',
      '}',
    ].join('\n')
    doc.head?.appendChild(style)
  } catch {
    loading.value = false
  }
}

function reloadFrame() {
  loading.value = true
  frameRef.value?.contentWindow?.location.reload()
}

function openInTab() {
  window.open(targetUrl.value, '_blank')
}

usePageMeta(() => ({
  title: `${currentSection.value.label} - ${brand.name || 'creat8rlabs'}`,
  icon: brand.favicon,
}))
</script>
