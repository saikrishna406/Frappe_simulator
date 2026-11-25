<template>
  <div class="flex h-full flex-col overflow-y-auto bg-surface-gray-1 p-4 sm:p-6">
    <!-- Top Section Nav Tabs for Quick Exploration -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-outline-gray-1 bg-surface-white p-3">
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="rounded px-2.5 py-1.5 text-sm font-medium transition-colors"
          :class="
            section === tab.key
              ? 'bg-surface-gray-7 text-ink-white'
              : 'text-ink-gray-7 hover:bg-surface-gray-2'
          "
          @click="emit('navigate', tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>
      <span class="rounded-full bg-surface-blue-2 px-2.5 py-1 text-xs font-medium text-ink-blue-3">
        Simulated ERPNext v15 · Local Browser State
      </span>
    </div>

    <!-- DESK HOME: Unified CRM -> ERPNext Flow -->
    <div v-if="section === 'home'" class="space-y-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-lg border border-outline-gray-1 bg-surface-white p-4">
          <div class="text-xs text-ink-gray-5">Quotations</div>
          <div class="mt-1 text-2xl font-semibold text-ink-gray-9">{{ erp.quotations.length }}</div>
          <div class="mt-1 text-xs text-ink-gray-6">Synced with CRM Deals</div>
        </div>
        <div class="rounded-lg border border-outline-gray-1 bg-surface-white p-4">
          <div class="text-xs text-ink-gray-5">Sales Orders</div>
          <div class="mt-1 text-2xl font-semibold text-ink-gray-9">{{ erp.salesOrders.length }}</div>
          <div class="mt-1 text-xs text-ink-gray-6">Authoritative in ERPNext</div>
        </div>
        <div class="rounded-lg border border-outline-gray-1 bg-surface-white p-4">
          <div class="text-xs text-ink-gray-5">Receivables Outstanding</div>
          <div class="mt-1 text-2xl font-semibold text-ink-gray-9">{{ formatInr(totalOutstanding) }}</div>
          <div class="mt-1 text-xs text-ink-gray-6">Across {{ erp.invoices.length }} Sales Invoices</div>
        </div>
        <div class="rounded-lg border border-outline-gray-1 bg-surface-white p-4">
          <div class="text-xs text-ink-gray-5">Stock Units (Bins)</div>
          <div class="mt-1 text-2xl font-semibold text-ink-gray-9">{{ totalProjectedStock }}</div>
          <div class="mt-1 text-xs text-ink-gray-6">Live Bin availability across 3 warehouses</div>
        </div>
      </div>

      <div class="rounded-lg border border-outline-gray-1 bg-surface-white p-5">
        <h3 class="text-base font-semibold text-ink-gray-9">
          creat8rlabs Architecture: CRM to ERPNext Adapter Flow
        </h3>
        <p class="mt-1 text-sm text-ink-gray-6">
          CRM owns Leads, Deals, Contacts, and Marketing Opt-outs. ERPNext owns Customer deduplication, live Bin stock, Quotations, Sales Orders, Invoices, and General Ledger.
        </p>
        <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <div
            v-for="step in flowSteps"
            :key="step.title"
            class="cursor-pointer rounded-lg border border-outline-gray-1 bg-surface-gray-1 p-3 hover:border-outline-gray-3"
            @click="step.route ? router.push(step.route) : emit('navigate', step.section)"
          >
            <div class="text-xs font-semibold uppercase tracking-wide text-ink-blue-3">
              {{ step.owner }}
            </div>
            <div class="mt-1 text-sm font-medium text-ink-gray-9">{{ step.title }}</div>
            <div class="mt-1 text-xs text-ink-gray-6">{{ step.desc }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- QUOTATIONS -->
    <div v-else-if="section === 'quotation'" class="rounded-lg border border-outline-gray-1 bg-surface-white p-4">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 class="text-base font-semibold text-ink-gray-9">ERPNext Quotations</h3>
          <p class="text-xs text-ink-gray-6">
            Created via customer_adapter.py / External ID Map and linked back to CRM Deals.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <select
            v-model="selectedDealForQuotation"
            class="rounded border border-outline-gray-2 bg-surface-white px-2.5 py-1.5 text-sm text-ink-gray-9"
          >
            <option v-for="deal in state.deals" :key="deal.name" :value="deal.name">
              {{ deal.name }} · {{ deal.organization }}
            </option>
          </select>
          <Button variant="solid" label="New Quotation from Deal" @click="handleCreateQuotation" />
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-outline-gray-1 text-xs uppercase text-ink-gray-5">
            <tr>
              <th class="py-2 pr-4">Quotation</th>
              <th class="py-2 pr-4">Customer</th>
              <th class="py-2 pr-4">Linked Deal</th>
              <th class="py-2 pr-4">Status</th>
              <th class="py-2 pr-4 text-right">Grand Total</th>
              <th class="py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-gray-1">
            <tr v-for="q in erp.quotations" :key="q.name">
              <td class="py-2.5 pr-4 font-medium text-ink-gray-9">{{ q.name }}</td>
              <td class="py-2.5 pr-4 text-ink-gray-7">{{ q.customer_name }}</td>
              <td class="py-2.5 pr-4 text-ink-blue-3">{{ q.crm_deal }}</td>
              <td class="py-2.5 pr-4">
                <Badge :label="q.status" :theme="statusTheme(q.status)" variant="subtle" />
              </td>
              <td class="py-2.5 pr-4 text-right tabular-nums text-ink-gray-9">
                {{ formatInr(q.grand_total) }}
              </td>
              <td class="py-2.5 text-right">
                <Button
                  v-if="q.status !== 'Ordered'"
                  size="sm"
                  label="Create Sales Order"
                  @click="handleConvertToOrder(q.name)"
                />
                <span v-else class="text-xs text-ink-gray-5">Converted</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SALES ORDERS -->
    <div v-else-if="section === 'sales-order'" class="rounded-lg border border-outline-gray-1 bg-surface-white p-4">
      <div class="mb-4">
        <h3 class="text-base font-semibold text-ink-gray-9">Sales Orders</h3>
        <p class="text-xs text-ink-gray-6">Confirmed customer orders converted from ERPNext Quotations.</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-outline-gray-1 text-xs uppercase text-ink-gray-5">
            <tr>
              <th class="py-2 pr-4">Sales Order</th>
              <th class="py-2 pr-4">Customer</th>
              <th class="py-2 pr-4">Quotation</th>
              <th class="py-2 pr-4">Status</th>
              <th class="py-2 pr-4 text-right">Grand Total</th>
              <th class="py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-gray-1">
            <tr v-for="so in erp.salesOrders" :key="so.name">
              <td class="py-2.5 pr-4 font-medium text-ink-gray-9">{{ so.name }}</td>
              <td class="py-2.5 pr-4 text-ink-gray-7">{{ so.customer_name }}</td>
              <td class="py-2.5 pr-4 text-ink-gray-6">{{ so.quotation }}</td>
              <td class="py-2.5 pr-4">
                <Badge :label="so.status" :theme="so.status === 'Completed' ? 'green' : 'amber'" variant="subtle" />
              </td>
              <td class="py-2.5 pr-4 text-right tabular-nums text-ink-gray-9">{{ formatInr(so.grand_total) }}</td>
              <td class="py-2.5 text-right">
                <Button
                  v-if="so.status !== 'Completed'"
                  size="sm"
                  label="Create Sales Invoice"
                  @click="handleCreateInvoice(so.name)"
                />
                <span v-else class="text-xs text-ink-gray-5">Billed</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SALES INVOICES -->
    <div v-else-if="section === 'sales-invoice'" class="rounded-lg border border-outline-gray-1 bg-surface-white p-4">
      <div class="mb-4">
        <h3 class="text-base font-semibold text-ink-gray-9">Sales Invoices</h3>
        <p class="text-xs text-ink-gray-6">Validated ERPNext invoices (posts GL Entries automatically on submit).</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-outline-gray-1 text-xs uppercase text-ink-gray-5">
            <tr>
              <th class="py-2 pr-4">Invoice</th>
              <th class="py-2 pr-4">Customer</th>
              <th class="py-2 pr-4">Status</th>
              <th class="py-2 pr-4 text-right">Grand Total</th>
              <th class="py-2 pr-4 text-right">Outstanding</th>
              <th class="py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-gray-1">
            <tr v-for="inv in erp.invoices" :key="inv.name">
              <td class="py-2.5 pr-4 font-medium text-ink-gray-9">{{ inv.name }}</td>
              <td class="py-2.5 pr-4 text-ink-gray-7">{{ inv.customer_name }}</td>
              <td class="py-2.5 pr-4">
                <Badge :label="inv.status" :theme="inv.status === 'Paid' ? 'green' : 'amber'" variant="subtle" />
              </td>
              <td class="py-2.5 pr-4 text-right tabular-nums">{{ formatInr(inv.grand_total) }}</td>
              <td class="py-2.5 pr-4 text-right tabular-nums">{{ formatInr(inv.outstanding_amount) }}</td>
              <td class="py-2.5 text-right">
                <Button
                  v-if="inv.outstanding_amount > 0"
                  size="sm"
                  label="Record Payment"
                  @click="handleRecordPayment(inv.name)"
                />
                <span v-else class="text-xs text-ink-green-3">Settled</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- PAYMENTS -->
    <div v-else-if="section === 'payment-entry'" class="rounded-lg border border-outline-gray-1 bg-surface-white p-4">
      <h3 class="mb-3 text-base font-semibold text-ink-gray-9">Payment Entries</h3>
      <table class="w-full text-left text-sm">
        <thead class="border-b border-outline-gray-1 text-xs uppercase text-ink-gray-5">
          <tr>
            <th class="py-2 pr-4">Payment Entry</th>
            <th class="py-2 pr-4">Customer</th>
            <th class="py-2 pr-4">Against Invoice</th>
            <th class="py-2 pr-4">Mode</th>
            <th class="py-2 text-right">Paid Amount</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-gray-1">
          <tr v-for="p in erp.payments" :key="p.name">
            <td class="py-2.5 pr-4 font-medium text-ink-gray-9">{{ p.name }}</td>
            <td class="py-2.5 pr-4 text-ink-gray-7">{{ p.party_name }}</td>
            <td class="py-2.5 pr-4 text-ink-gray-6">{{ p.invoice }}</td>
            <td class="py-2.5 pr-4 text-ink-gray-6">{{ p.mode_of_payment }}</td>
            <td class="py-2.5 text-right tabular-nums text-ink-gray-9">{{ formatInr(p.paid_amount) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- CUSTOMERS -->
    <div v-else-if="section === 'customer'" class="rounded-lg border border-outline-gray-1 bg-surface-white p-4">
      <div class="mb-3">
        <h3 class="text-base font-semibold text-ink-gray-9">ERPNext Customers</h3>
        <p class="text-xs text-ink-gray-6">Deduplicated via External ID Map from CRM Organizations.</p>
      </div>
      <table class="w-full text-left text-sm">
        <thead class="border-b border-outline-gray-1 text-xs uppercase text-ink-gray-5">
          <tr>
            <th class="py-2 pr-4">Customer ID</th>
            <th class="py-2 pr-4">Customer Name</th>
            <th class="py-2 pr-4">Group</th>
            <th class="py-2 pr-4">Territory</th>
            <th class="py-2 text-right">Outstanding</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-gray-1">
          <tr v-for="c in erp.customers" :key="c.name">
            <td class="py-2.5 pr-4 font-medium text-ink-gray-9">{{ c.name }}</td>
            <td class="py-2.5 pr-4 text-ink-gray-7">{{ c.customer_name }}</td>
            <td class="py-2.5 pr-4 text-ink-gray-6">{{ c.customer_group }}</td>
            <td class="py-2.5 pr-4 text-ink-gray-6">{{ c.territory }}</td>
            <td class="py-2.5 text-right tabular-nums">{{ formatInr(c.outstanding_amount) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ITEMS & PRICING -->
    <div v-else-if="section === 'item'" class="rounded-lg border border-outline-gray-1 bg-surface-white p-4">
      <h3 class="mb-3 text-base font-semibold text-ink-gray-9">Items & Pricing</h3>
      <table class="w-full text-left text-sm">
        <thead class="border-b border-outline-gray-1 text-xs uppercase text-ink-gray-5">
          <tr>
            <th class="py-2 pr-4">Item Code</th>
            <th class="py-2 pr-4">Item Name</th>
            <th class="py-2 pr-4">Group</th>
            <th class="py-2 pr-4">Stock Item</th>
            <th class="py-2 text-right">Standard Rate</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-gray-1">
          <tr v-for="item in erp.items" :key="item.item_code">
            <td class="py-2.5 pr-4 font-medium text-ink-gray-9">{{ item.item_code }}</td>
            <td class="py-2.5 pr-4 text-ink-gray-7">{{ item.item_name }}</td>
            <td class="py-2.5 pr-4 text-ink-gray-6">{{ item.item_group }}</td>
            <td class="py-2.5 pr-4">
              <Badge :label="item.is_stock_item ? 'Stocked' : 'Service / SaaS'" variant="subtle" />
            </td>
            <td class="py-2.5 text-right tabular-nums">{{ formatInr(item.standard_rate) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- STOCK & WAREHOUSES -->
    <div v-else-if="section === 'stock'" class="rounded-lg border border-outline-gray-1 bg-surface-white p-4">
      <div class="mb-3">
        <h3 class="text-base font-semibold text-ink-gray-9">Live Stock Availability (ERPNext Bin)</h3>
        <p class="text-xs text-ink-gray-6">
          CRM queries ERPNext Bin live instead of caching inventory counts in CRM.
        </p>
      </div>
      <table class="w-full text-left text-sm">
        <thead class="border-b border-outline-gray-1 text-xs uppercase text-ink-gray-5">
          <tr>
            <th class="py-2 pr-4">Item Code</th>
            <th class="py-2 pr-4">Warehouse</th>
            <th class="py-2 pr-4 text-right">Actual Qty</th>
            <th class="py-2 pr-4 text-right">Reserved Qty</th>
            <th class="py-2 pr-4 text-right">Projected Qty</th>
            <th class="py-2 text-right">Valuation Rate</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-gray-1">
          <tr v-for="b in erp.bins" :key="`${b.item_code}-${b.warehouse}`">
            <td class="py-2.5 pr-4 font-medium text-ink-gray-9">{{ b.item_code }}</td>
            <td class="py-2.5 pr-4 text-ink-gray-7">{{ b.warehouse }}</td>
            <td class="py-2.5 pr-4 text-right tabular-nums">{{ b.actual_qty }}</td>
            <td class="py-2.5 pr-4 text-right tabular-nums text-ink-amber-3">{{ b.reserved_qty }}</td>
            <td class="py-2.5 pr-4 text-right font-semibold tabular-nums text-ink-green-3">{{ b.projected_qty }}</td>
            <td class="py-2.5 text-right tabular-nums">{{ formatInr(b.valuation_rate) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ACCOUNTING -->
    <div v-else class="space-y-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="rounded-lg border border-outline-gray-1 bg-surface-white p-4">
          <div class="text-xs text-ink-gray-5">Total Billed (Sales Invoices)</div>
          <div class="mt-1 text-2xl font-semibold text-ink-gray-9">{{ formatInr(totalInvoiced) }}</div>
        </div>
        <div class="rounded-lg border border-outline-gray-1 bg-surface-white p-4">
          <div class="text-xs text-ink-gray-5">Total Collected (Payments)</div>
          <div class="mt-1 text-2xl font-semibold text-ink-green-3">{{ formatInr(totalCollected) }}</div>
        </div>
        <div class="rounded-lg border border-outline-gray-1 bg-surface-white p-4">
          <div class="text-xs text-ink-gray-5">Accounts Receivable</div>
          <div class="mt-1 text-2xl font-semibold text-ink-amber-3">{{ formatInr(totalOutstanding) }}</div>
        </div>
      </div>
      <div class="rounded-lg border border-outline-gray-1 bg-surface-white p-4 text-sm text-ink-gray-7">
        <div class="font-semibold text-ink-gray-9">General Ledger Guardrail</div>
        <p class="mt-1">
          In creat8rlabs production, custom apps never write directly to <code>GL Entry</code> or <code>Stock Ledger Entry</code>. All accounting entries come from validated ERPNext Sales Invoices and Payment Entries.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Badge, Button, toast } from 'frappe-ui'
import {
  convertQuotationToOrder,
  createErpQuotationFromDeal,
  createInvoiceFromOrder,
  getSimulatorState,
  recordInvoicePayment,
} from '@/simulator/mockBackend'

const props = defineProps({
  section: { type: String, default: 'home' },
})

const emit = defineEmits(['navigate'])
const router = useRouter()
const state = ref(getSimulatorState())
const selectedDealForQuotation = ref(state.value.deals[0]?.name || '')

const erp = computed(() => state.value.erp)
const totalProjectedStock = computed(() =>
  erp.value.bins.reduce((sum, b) => sum + Number(b.projected_qty || 0), 0),
)
const totalInvoiced = computed(() =>
  erp.value.invoices.reduce((sum, i) => sum + Number(i.grand_total || 0), 0),
)
const totalOutstanding = computed(() =>
  erp.value.invoices.reduce((sum, i) => sum + Number(i.outstanding_amount || 0), 0),
)
const totalCollected = computed(() =>
  erp.value.payments.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0),
)

const tabs = [
  { key: 'home', label: 'Desk Home' },
  { key: 'quotation', label: 'Quotations' },
  { key: 'sales-order', label: 'Sales Orders' },
  { key: 'sales-invoice', label: 'Sales Invoices' },
  { key: 'payment-entry', label: 'Payments' },
  { key: 'customer', label: 'Customers' },
  { key: 'item', label: 'Items & Pricing' },
  { key: 'stock', label: 'Stock & Warehouses' },
  { key: 'accounting', label: 'Accounting' },
]

const flowSteps = [
  { owner: 'CRM', title: '1. Leads & Deals', desc: 'Capture & qualify deals', route: '/deals' },
  { owner: 'Adapter', title: '2. Quotations', desc: 'Deduplicate Customer & price', section: 'quotation' },
  { owner: 'ERPNext', title: '3. Sales Order', desc: 'Reserve stock from Bin', section: 'sales-order' },
  { owner: 'ERPNext', title: '4. Sales Invoice', desc: 'Bill customer & post GL', section: 'sales-invoice' },
  { owner: 'Finance', title: '5. Payments', desc: 'Settle AR balance', section: 'payment-entry' },
]

function refresh() {
  state.value = { ...getSimulatorState() }
}

function handleCreateQuotation() {
  const q = createErpQuotationFromDeal(selectedDealForQuotation.value)
  refresh()
  if (q) toast.success(`Created ${q.name} linked to ${q.crm_deal}`)
}

function handleConvertToOrder(name) {
  const so = convertQuotationToOrder(name)
  refresh()
  if (so) toast.success(`Converted ${name} to ${so.name}`)
}

function handleCreateInvoice(orderName) {
  const inv = createInvoiceFromOrder(orderName)
  refresh()
  if (inv) toast.success(`Created ${inv.name} from ${orderName}`)
}

function handleRecordPayment(invoiceName) {
  const pay = recordInvoicePayment(invoiceName)
  refresh()
  if (pay) toast.success(`Recorded ${pay.name} for ${invoiceName}`)
}

function statusTheme(status) {
  if (status === 'Ordered' || status === 'Paid' || status === 'Completed') return 'green'
  if (status === 'Open' || status === 'Partly Paid') return 'amber'
  return 'gray'
}

function formatInr(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))
}
</script>
