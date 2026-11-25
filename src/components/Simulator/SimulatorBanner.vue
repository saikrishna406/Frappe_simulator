<template>
  <div
    class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-outline-gray-1 bg-surface-blue-1 px-3 py-1.5 text-xs text-ink-gray-8"
  >
    <div class="flex items-center gap-2">
      <span class="rounded bg-surface-blue-3 px-1.5 py-0.5 font-semibold text-ink-white">
        SIMULATOR
      </span>
      <span>
        creat8rlabs Interactive Preview (Vercel Static Mode · changes save in your browser)
      </span>
    </div>
    <div class="flex items-center gap-2">
      <Button size="sm" variant="subtle" label="Architecture Patterns" @click="showGuide = true" />
      <Button size="sm" variant="subtle" label="Reset Demo" @click="handleReset" />
    </div>

    <Dialog v-model="showGuide" :options="{ title: 'creat8rlabs SaaS Platform — Patterns Guide', size: '2xl' }">
      <template #body-content>
        <div class="space-y-4 text-sm text-ink-gray-7">
          <p>
            This simulator runs the real Vue 3 + <code>frappe-ui</code> CRM interface against an in-browser state store so you can explore every workflow without Docker or MariaDB.
          </p>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-outline-gray-1 p-3">
              <div class="font-semibold text-ink-gray-9">1. Unified CRM + ERPNext Shell</div>
              <p class="mt-1 text-xs">
                CRM owns Leads, Deals, Contacts, and Campaigns. ERPNext owns Customers, live <code>Bin</code> stock, Quotations, Sales Orders, Invoices, and General Ledger under one sidebar.
              </p>
            </div>
            <div class="rounded-lg border border-outline-gray-1 p-3">
              <div class="font-semibold text-ink-gray-9">2. Multi-Tenant Isolation</div>
              <p class="mt-1 text-xs">
                Each tenant runs as an isolated Frappe site + MariaDB database resolved by host. <code>creat8r_control</code> manages plans, provisioning, and usage ledgers.
              </p>
            </div>
            <div class="rounded-lg border border-outline-gray-1 p-3">
              <div class="font-semibold text-ink-gray-9">3. ERPNext Adapter Pattern</div>
              <p class="mt-1 text-xs">
                Before creating Quotations, <code>customer_adapter.py</code> deduplicates Customers via <code>External ID Map</code> and queries live ERPNext stock instead of stale caches.
              </p>
            </div>
            <div class="rounded-lg border border-outline-gray-1 p-3">
              <div class="font-semibold text-ink-gray-9">4. WhatsApp, Consent & Odoo Cutover</div>
              <p class="mt-1 text-xs">
                Outbound campaigns verify opt-in + suppression before queuing in Redis. Odoo migration uses cutover opening stock and AR/AP reconciliation checks.
              </p>
            </div>
          </div>
          <div class="rounded bg-surface-gray-1 p-3 text-xs text-ink-gray-6">
            Try creating a Lead, converting it to a Deal, and opening <strong>ERPNext & Finance &rarr; Quotations</strong> to create a Quotation &rarr; Sales Order &rarr; Invoice &rarr; Payment.
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Button, Dialog } from 'frappe-ui'
import { resetSimulatorState } from '@/simulator/mockBackend'

const showGuide = ref(false)

function handleReset() {
  resetSimulatorState()
  window.location.reload()
}
</script>
