import { SIMULATOR_SCHEMAS } from './schemas'
import { createSeedState } from './seedData'

const STORAGE_KEY = 'creat8r_simulator_state_v1'
const SIMULATOR_API_PREFIX = '/api/method/'

const DOCTYPE_TO_KEY = {
  'CRM Lead': 'leads',
  'CRM Deal': 'deals',
  'CRM Organization': 'organizations',
  Contact: 'contacts',
  'FCRM Note': 'notes',
  'CRM Task': 'tasks',
  'CRM Call Log': 'callLogs',
  'CRM Lead Status': 'leadStatuses',
  'CRM Deal Status': 'dealStatuses',
  'CRM Communication Status': 'commStatuses',
  User: 'users',
  Comment: 'comments',
  'CRM Notification': 'notifications',
  'CRM View Settings': 'views',
}

const DOCTYPE_PREFIX = {
  'CRM Lead': 'CRM-LEAD-2026-',
  'CRM Deal': 'CRM-DEAL-2026-',
  Contact: 'CONT-',
  'FCRM Note': 'NOTE-',
  'CRM Task': 'TASK-',
  'CRM Call Log': 'CALL-',
  Comment: 'COMM-',
  'CRM View Settings': 'VIEW-',
}

let memoryState = null

function clone(val) {
  return JSON.parse(JSON.stringify(val))
}

function nowStamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

export function getSimulatorState() {
  if (memoryState) return memoryState
  try {
    const raw =
      typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (raw) {
      memoryState = JSON.parse(raw)
      return memoryState
    }
  } catch {
    // Ignore storage read errors and initialize fresh state
  }
  memoryState = createSeedState()
  persistState()
  return memoryState
}

function persistState() {
  if (!memoryState || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState))
  } catch {
    // Ignore quota errors in sandboxed tabs
  }
}

export function resetSimulatorState() {
  memoryState = createSeedState()
  persistState()
  return memoryState
}

function getCollection(doctype) {
  const state = getSimulatorState()
  if (doctype === 'CRM Lead Status') return SIMULATOR_SCHEMAS.leadStatuses
  if (doctype === 'CRM Deal Status') return SIMULATOR_SCHEMAS.dealStatuses
  if (doctype === 'CRM Communication Status') return SIMULATOR_SCHEMAS.commStatuses
  if (doctype === 'CRM Availability Status') {
    return [
      { name: 'Available', category: 'Active', color: 'green', enabled: 1, position: 1 },
      { name: 'Away', category: 'Away', color: 'yellow', enabled: 1, position: 2 },
      { name: 'Busy', category: 'Unavailable', color: 'red', enabled: 1, position: 3 },
    ]
  }
  const key = DOCTYPE_TO_KEY[doctype]
  return key ? state[key] || [] : []
}

function nextName(doctype, list) {
  const prefix = DOCTYPE_PREFIX[doctype] || `${doctype.toUpperCase().replace(/\s+/g, '-')}-`
  const n = (list?.length || 0) + 1
  return `${prefix}${String(n).padStart(4, '0')}`
}

function parseJson(val, fallback) {
  if (val === undefined || val === null || val === '') return fallback
  if (typeof val !== 'string') return val
  try {
    return JSON.parse(val)
  } catch {
    return fallback
  }
}

function matchesFilter(doc, field, cond) {
  const val = doc[field]
  if (Array.isArray(cond)) {
    const [op, target] = cond
    const normOp = String(op || '=').toLowerCase()
    const targetVal = target === '@me' ? 'Administrator' : target
    if (normOp === '=' || normOp === 'is') return (val ?? '') == (targetVal ?? '')
    if (normOp === '!=' || normOp === 'is not') return (val ?? '') != (targetVal ?? '')
    if (normOp === 'like') {
      const needle = String(targetVal || '').replace(/%/g, '').toLowerCase()
      return String(val || '').toLowerCase().includes(needle)
    }
    if (normOp === 'not like') {
      const needle = String(targetVal || '').replace(/%/g, '').toLowerCase()
      return !String(val || '').toLowerCase().includes(needle)
    }
    if (normOp === 'in' && Array.isArray(targetVal)) return targetVal.includes(val)
    if (normOp === 'not in' && Array.isArray(targetVal)) return !targetVal.includes(val)
    return true
  }
  const targetVal = cond === '@me' ? 'Administrator' : cond
  return (val ?? '') == (targetVal ?? '')
}

function applyFilters(rows, rawFilters) {
  const filters = parseJson(rawFilters, {})
  if (!filters || typeof filters !== 'object') return rows
  if (Array.isArray(filters)) {
    return rows.filter((doc) =>
      filters.every((tuple) => {
        if (!Array.isArray(tuple)) return true
        const [f, op, v] = tuple.length >= 4 ? tuple.slice(1) : tuple
        return matchesFilter(doc, f, [op, v])
      }),
    )
  }
  return rows.filter((doc) =>
    Object.entries(filters).every(([field, cond]) => matchesFilter(doc, field, cond)),
  )
}

function sortRows(rows, orderBy = 'modified desc') {
  if (!orderBy) return rows
  const [field, dir = 'asc'] = String(orderBy).split(',')[0].trim().split(/\s+/)
  const mult = dir.toLowerCase() === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const va = a?.[field] ?? ''
    const vb = b?.[field] ?? ''
    if (va < vb) return -1 * mult
    if (va > vb) return 1 * mult
    return 0
  })
}

function enrichFieldObj(field) {
  const f = { ...field }
  f.placeholder = f.placeholder || `Add ${f.label || f.fieldname}...`
  if (f.fieldtype === 'Link' || f.fieldtype === 'Select') {
    f.placeholder = `Select ${f.label || f.fieldname}...`
  }
  if (f.fieldtype === 'Select' && typeof f.options === 'string') {
    f.options = f.options.split('\n').map((o) => ({ label: o, value: o }))
  }
  if (f.read_only) {
    f.tooltip = 'This field is read only and cannot be edited.'
  }
  return f
}

function hydrateLayout(doctype, layoutTabs) {
  const schema = SIMULATOR_SCHEMAS.doctypes[doctype]
  if (!schema || !layoutTabs) return []
  const byName = Object.fromEntries(schema.fields.map((f) => [f.fieldname, f]))
  return clone(layoutTabs).map((tab) => ({
    ...tab,
    sections: (tab.sections || []).map((sec) => ({
      ...sec,
      columns: (sec.columns || []).map((col) => ({
        ...col,
        fields: (col.fields || [])
          .map((fn) => (byName[fn] ? enrichFieldObj(byName[fn]) : null))
          .filter(Boolean),
      })),
    })),
  }))
}

function buildDocinfo(doctype, name) {
  const state = getSimulatorState()
  const comments = state.comments.filter(
    (c) => c.reference_doctype === doctype && c.reference_name === name,
  )
  return {
    comments,
    communications: [],
    attachments: [],
    assignments: [],
    versions: [],
    shared: [],
    views: [],
    attachment_logs: [],
    permissions: { read: 1, write: 1, create: 1, delete: 1 },
  }
}

function handleGetData(params = {}) {
  const doctype = params.doctype
  const viewType = params.view?.view_type || 'list'
  const schema = SIMULATOR_SCHEMAS.doctypes[doctype] || {
    fields: [],
    columns: [{ label: 'Name', type: 'Data', key: 'name', width: '16rem' }],
    rows: ['name'],
  }

  let filters = parseJson(params.filters, {})
  const defaultFilters = parseJson(params.default_filters, null)
  if (defaultFilters && typeof defaultFilters === 'object') {
    filters = { ...filters, ...defaultFilters }
  }

  const allDocs = getCollection(doctype)
  const filtered = sortRows(applyFilters(allDocs, filters), params.order_by || 'modified desc')
  const pageLength = Number(params.page_length || 20)
  const fieldsMeta = schema.fields
    .filter((f) => f.label && f.fieldname)
    .map((f) => ({
      label: f.label,
      fieldtype: f.fieldtype,
      fieldname: f.fieldname,
      options: f.options,
    }))

  let data = clone(filtered.slice(0, pageLength))
  let columnField = params.column_field || null
  let titleField = params.title_field || null
  let kanbanColumns = parseJson(params.kanban_columns, []) || []
  let kanbanFields = parseJson(params.kanban_fields, []) || []

  if (viewType === 'kanban') {
    columnField = columnField || 'status'
    titleField = titleField || (doctype === 'CRM Lead' ? 'lead_name' : 'organization')
    if (!kanbanFields.length) {
      kanbanFields =
        doctype === 'CRM Lead'
          ? ['organization', 'email', 'mobile_no', '_assign', 'modified']
          : ['annual_revenue', 'email', 'mobile_no', '_assign', 'modified']
    }
    if (!kanbanColumns.length) {
      const statuses =
        doctype === 'CRM Lead'
          ? SIMULATOR_SCHEMAS.leadStatuses
          : SIMULATOR_SCHEMAS.dealStatuses
      kanbanColumns = statuses.map((s) => ({ name: s.name }))
    }
    data = kanbanColumns.map((kc) => {
      const colDocs = filtered.filter((d) => d[columnField] === kc.name)
      return {
        column: { ...kc, all_count: colDocs.length, count: colDocs.length },
        fields: kanbanFields,
        data: clone(colDocs.slice(0, kc.page_length || 20)),
      }
    })
  }

  let groupByField = params.view?.group_by_field || null
  if (groupByField && viewType === 'group_by') {
    const fMeta = fieldsMeta.find((f) => f.fieldname === groupByField) || {
      label: groupByField,
      fieldname: groupByField,
      fieldtype: 'Data',
    }
    const opts =
      fMeta.fieldtype === 'Select' && typeof fMeta.options === 'string'
        ? fMeta.options.split('\n')
        : Array.from(new Set(filtered.map((d) => d[groupByField] || '')))
    groupByField = {
      label: fMeta.label,
      fieldname: fMeta.fieldname,
      fieldtype: fMeta.fieldtype,
      options: opts,
    }
  }

  return {
    data,
    columns: clone(params.columns ? parseJson(params.columns, schema.columns) : schema.columns),
    rows: clone(params.rows ? parseJson(params.rows, schema.rows) : schema.rows),
    fields: fieldsMeta,
    column_field: columnField,
    title_field: titleField,
    kanban_columns: kanbanColumns,
    kanban_fields: kanbanFields,
    group_by_field: groupByField,
    page_length: pageLength,
    page_length_count: Number(params.page_length_count || 20),
    is_default: true,
    views: getSimulatorState().views.filter((v) => !doctype || v.dt === doctype),
    total_count: filtered.length,
    row_count: Array.isArray(data) ? data.length : 0,
    form_script: null,
    list_script: null,
    view_type: viewType,
  }
}

function handleGetDashboard() {
  const state = getSimulatorState()
  const leads = state.leads
  const deals = state.deals
  const wonDeals = deals.filter((d) => d.status === 'Won')
  const lostDeals = deals.filter((d) => d.status === 'Lost')
  const ongoingDeals = deals.filter((d) => d.status !== 'Won' && d.status !== 'Lost')
  const avg = (arr) =>
    arr.length ? Math.round(arr.reduce((s, d) => s + Number(d.deal_value || 0), 0) / arr.length) : 0

  const stageCounts = SIMULATOR_SCHEMAS.dealStatuses.map((s) => ({
    stage: s.name,
    count: deals.filter((d) => d.status === s.name).length,
  }))

  const groupCounts = (rows, key, outKey) => {
    const map = {}
    for (const r of rows) {
      const label = r[key] || 'Direct'
      map[label] = (map[label] || 0) + 1
    }
    return Object.entries(map).map(([k, count]) => ({ [outKey]: k, count }))
  }

  const territoryMap = {}
  for (const d of deals) {
    const t = d.territory || 'India'
    if (!territoryMap[t]) territoryMap[t] = { territory: t, deals: 0, value: 0 }
    territoryMap[t].deals += 1
    territoryMap[t].value += Number(d.deal_value || 0)
  }

  const salespersonMap = {}
  for (const d of deals) {
    const user = state.users.find((u) => u.name === d.deal_owner)?.full_name || d.deal_owner || 'Unassigned'
    if (!salespersonMap[user]) salespersonMap[user] = { salesperson: user, deals: 0, value: 0 }
    salespersonMap[user].deals += 1
    salespersonMap[user].value += Number(d.deal_value || 0)
  }

  const chartData = {
    total_leads: { title: 'Total leads', tooltip: 'Total number of leads', value: leads.length, delta: 24, deltaSuffix: '%' },
    ongoing_deals: { title: 'Ongoing deals', tooltip: 'Total number of non won/lost deals', value: ongoingDeals.length, delta: 15, deltaSuffix: '%' },
    won_deals: { title: 'Won deals', tooltip: 'Total number of won deals based on its closure date', value: wonDeals.length, delta: 50, deltaSuffix: '%' },
    average_won_deal_value: { title: 'Avg. won deal value', tooltip: 'Average deal value of won deals', value: avg(wonDeals), delta: 120000, prefix: '₹' },
    average_deal_value: { title: 'Avg. deal value', tooltip: 'Average deal value of ongoing & won deals', value: avg([...ongoingDeals, ...wonDeals]), prefix: '₹', delta: 12, deltaSuffix: '%' },
    average_time_to_close_a_lead: { title: 'Avg. time to close a lead', tooltip: 'Average time taken from lead creation to deal closure', value: 4.2, suffix: ' days', delta: -1.1, deltaSuffix: ' days', negativeIsBetter: true },
    average_time_to_close_a_deal: { title: 'Avg. time to close a deal', tooltip: 'Average time taken from deal creation to deal closure', value: 11.5, suffix: ' days', delta: -2.0, deltaSuffix: ' days', negativeIsBetter: true },
    sales_trend: {
      title: 'Sales trend',
      subtitle: 'Daily performance of leads, deals, and wins',
      xAxis: { title: 'Date', key: 'date', type: 'time', timeGrain: 'day' },
      yAxis: { title: 'Count' },
      series: [
        { name: 'leads', type: 'line', showDataPoints: true },
        { name: 'deals', type: 'line', showDataPoints: true },
        { name: 'won_deals', type: 'line', showDataPoints: true },
      ],
      data: [
        { date: todayDate(), leads: leads.length, deals: deals.length, won_deals: wonDeals.length },
      ],
    },
    forecasted_revenue: {
      title: 'Forecasted revenue',
      subtitle: 'Projected vs actual revenue based on deal probability',
      xAxis: { title: 'Month', key: 'month', type: 'time', timeGrain: 'month' },
      yAxis: { title: 'Revenue (₹)' },
      series: [
        { name: 'forecasted', type: 'line', showDataPoints: true },
        { name: 'actual', type: 'line', showDataPoints: true },
      ],
      data: [
        {
          month: todayDate().slice(0, 7) + '-01',
          forecasted: ongoingDeals.reduce((s, d) => s + Number(d.expected_deal_value || 0), 0),
          actual: wonDeals.reduce((s, d) => s + Number(d.deal_value || 0), 0),
        },
      ],
    },
    funnel_conversion: {
      title: 'Funnel conversion',
      subtitle: 'Lead to deal conversion pipeline',
      xAxis: { title: 'Stage', key: 'stage', type: 'category' },
      yAxis: { title: 'Count' },
      swapXY: true,
      series: [{ name: 'count', type: 'bar', echartOptions: { colorBy: 'data' } }],
      data: [
        { stage: 'Leads', count: leads.length },
        { stage: 'Qualified', count: leads.filter((l) => l.status === 'Qualified' || l.converted).length },
        { stage: 'Deals', count: deals.length },
        { stage: 'Won', count: wonDeals.length },
      ],
    },
    deals_by_stage_donut: {
      title: 'Deals by stage',
      subtitle: 'Current pipeline distribution',
      categoryColumn: 'stage',
      valueColumn: 'count',
      data: stageCounts.filter((s) => s.count > 0),
    },
    lost_deal_reasons: {
      title: 'Lost deal reasons',
      subtitle: 'Common reasons for losing deals',
      xAxis: { title: 'Reason', key: 'reason', type: 'category' },
      yAxis: { title: 'Count' },
      series: [{ name: 'count', type: 'bar' }],
      data: groupCounts(lostDeals, 'lost_reason', 'reason'),
    },
    leads_by_source: {
      title: 'Leads by source',
      subtitle: 'Lead generation channel analysis',
      categoryColumn: 'source',
      valueColumn: 'count',
      data: groupCounts(leads, 'source', 'source'),
    },
    deals_by_source: {
      title: 'Deals by source',
      subtitle: 'Deal generation channel analysis',
      categoryColumn: 'source',
      valueColumn: 'count',
      data: groupCounts(deals, 'source', 'source'),
    },
    deals_by_territory: {
      title: 'Deals by territory',
      subtitle: 'Geographic distribution of deals and revenue',
      xAxis: { title: 'Territory', key: 'territory', type: 'category' },
      yAxis: { title: 'Number of deals' },
      y2Axis: { title: 'Deal value (₹)' },
      series: [
        { name: 'deals', type: 'bar' },
        { name: 'value', type: 'line', showDataPoints: true, axis: 'y2' },
      ],
      data: Object.values(territoryMap),
    },
    deals_by_salesperson: {
      title: 'Deals by salesperson',
      subtitle: 'Number of deals and total value per salesperson',
      xAxis: { title: 'Salesperson', key: 'salesperson', type: 'category' },
      yAxis: { title: 'Number of deals' },
      y2Axis: { title: 'Deal value (₹)' },
      series: [
        { name: 'deals', type: 'bar' },
        { name: 'value', type: 'line', showDataPoints: true, axis: 'y2' },
      ],
      data: Object.values(salespersonMap),
    },
  }

  return {
    layout: SIMULATOR_SCHEMAS.dashboardLayout.map((item) => ({
      ...item,
      data: item.name === 'spacer' ? null : chartData[item.name] || null,
    })),
    chartData,
  }
}

function handleGetActivities(name) {
  const state = getSimulatorState()
  const comments = state.comments
    .filter((c) => c.reference_name === name)
    .map((c) => ({
      name: c.name,
      activity_type: 'comment',
      creation: c.creation,
      owner: c.owner,
      content: c.content,
      attachments: [],
      is_lead: name.startsWith('CRM-LEAD'),
    }))
  const calls = state.callLogs.filter((c) => c.reference_docname === name)
  const notes = state.notes.filter((n) => n.reference_docname === name)
  const tasks = state.tasks.filter((t) => t.reference_docname === name)
  const doc =
    state.leads.find((l) => l.name === name) || state.deals.find((d) => d.name === name)

  const timeline = [
    ...comments,
    {
      activity_type: 'creation',
      creation: doc?.creation || nowStamp(),
      owner: doc?.owner || 'Administrator',
      data: name.startsWith('CRM-DEAL')
        ? 'created this deal'
        : 'created this lead',
      is_lead: name.startsWith('CRM-LEAD'),
    },
  ]

  return [timeline, calls, notes, tasks, []]
}

function dispatchMethod(methodName, params = {}) {
  const state = getSimulatorState()

  switch (methodName) {
    case 'crm.api.session.get_users':
      return [state.users, state.users]

    case 'crm.api.session.get_user_info': {
      const requested = parseJson(params.users, [])
      return state.users.filter((u) => !requested.length || requested.includes(u.name))
    }

    case 'crm.api.session.get_organizations':
      return clone(state.organizations)

    case 'crm.api.views.get_views':
      return clone(state.views.filter((v) => !params.doctype || v.dt === params.doctype))

    case 'crm.api.doc.get_data':
      return handleGetData(params)

    case 'crm.api.doc.get_fields': {
      const schema = SIMULATOR_SCHEMAS.doctypes[params.doctype]
      return schema ? clone(schema.fields.filter((f) => f.label && f.fieldname)) : []
    }

    case 'crm.api.doc.sort_options': {
      const schema = SIMULATOR_SCHEMAS.doctypes[params.doctype]
      const opts = (schema?.fields || [])
        .filter((f) => f.label && f.fieldname)
        .map((f) => ({ label: f.label, value: f.fieldname, fieldname: f.fieldname }))
      return [
        ...opts,
        { label: 'Name', value: 'name', fieldname: 'name' },
        { label: 'Created On', value: 'creation', fieldname: 'creation' },
        { label: 'Last Modified', value: 'modified', fieldname: 'modified' },
      ]
    }

    case 'crm.api.doc.get_filterable_fields': {
      const schema = SIMULATOR_SCHEMAS.doctypes[params.doctype]
      return (schema?.fields || []).filter((f) => f.label && f.fieldname)
    }

    case 'crm.api.doc.get_quick_filters':
      return state.quickFilters[params.doctype] || []

    case 'crm.api.doc.update_quick_filters':
      state.quickFilters[params.doctype] = parseJson(params.quick_filters, [])
      persistState()
      return state.quickFilters[params.doctype]

    case 'crm.api.doc.get_group_by_fields': {
      const schema = SIMULATOR_SCHEMAS.doctypes[params.doctype]
      return (schema?.fields || [])
        .filter((f) => ['Select', 'Link'].includes(f.fieldtype) && f.label)
        .map((f) => ({ label: f.label, value: f.fieldname, fieldname: f.fieldname }))
    }

    case 'crm.api.doc.add_seen':
    case 'frappe.utils.telemetry.pulse.client.boot_config':
    case 'frappe.onboarding.update_user_onboarding_status':
      return null

    case 'crm.api.doc.delete_bulk_docs': {
      const dt = params.doctype
      const items = parseJson(params.items, [])
      const col = getCollection(dt)
      const remaining = col.filter((d) => !items.includes(d.name))
      const key = DOCTYPE_TO_KEY[dt]
      if (key) state[key] = remaining
      persistState()
      return true
    }

    case 'crm.api.doc.get_assigned_users': {
      const col = getCollection(params.doctype)
      const doc = col.find((d) => d.name === params.name)
      return parseJson(doc?._assign, [])
    }

    case 'crm.api.doc.get_linked_docs_of_document':
      return {}

    case 'crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_fields_layout': {
      const schema = SIMULATOR_SCHEMAS.doctypes[params.doctype]
      if (!schema) return []
      if (params.type === 'Side Panel') {
        return hydrateLayout(params.doctype, schema.sidePanelLayout)
      }
      return hydrateLayout(params.doctype, schema.quickEntryLayout)
    }

    case 'crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_sidepanel_sections': {
      const schema = SIMULATOR_SCHEMAS.doctypes[params.doctype]
      return hydrateLayout(params.doctype, schema?.sidePanelLayout || [])
    }

    case 'crm.api.activities.get_activities':
      return handleGetActivities(params.name)

    case 'crm.api.comment.add_comment': {
      const doc = {
        name: nextName('Comment', state.comments),
        reference_doctype: params.reference_doctype,
        reference_name: params.reference_name,
        comment_by: 'Administrator',
        owner: 'Administrator',
        content: params.content || '',
        creation: nowStamp(),
      }
      state.comments.unshift(doc)
      persistState()
      return doc
    }

    case 'crm.api.notifications.get_notifications':
      return clone(state.notifications)

    case 'crm.api.notifications.mark_as_read':
      state.notifications.forEach((n) => {
        if (!params.doc || n.reference_name === params.doc) n.read = 1
      })
      persistState()
      return true

    case 'crm.api.dashboard.get_dashboard':
      return handleGetDashboard().layout

    case 'crm.api.dashboard.get_chart':
      return handleGetDashboard().chartData[params.name] || { error: 'Unknown chart' }

    case 'crm.api.onboarding.get_first_lead':
      return state.leads[0]?.name || null

    case 'crm.api.onboarding.get_first_deal':
      return state.deals[0]?.name || null

    case 'frappe.onboarding.get_onboarding_status':
      return {}

    case 'crm.api.whatsapp.is_whatsapp_enabled':
    case 'crm.api.whatsapp.is_whatsapp_installed':
    case 'crm.integrations.api.is_call_integration_enabled':
      return false

    case 'crm.api.whatsapp.get_whatsapp_messages':
      return []

    case 'crm.fcrm.doctype.erpnext_crm_settings.erpnext_crm_settings.can_view_quotations':
      return true

    case 'crm.fcrm.doctype.erpnext_crm_settings.erpnext_crm_settings.get_deal_quotations':
      return state.erp.quotations
        .filter((q) => q.crm_deal === params.crm_deal)
        .map((q) => ({ ...q, url: `/erp/quotation` }))

    case 'crm.fcrm.doctype.erpnext_crm_settings.erpnext_crm_settings.get_product_sync_status':
      return { enabled: true, sync_products: true }

    case 'crm.fcrm.doctype.crm_deal.api.get_deal_contacts': {
      const deal = state.deals.find((d) => d.name === params.deal)
      if (!deal?.contact) return []
      const contact = state.contacts.find((c) => c.name === deal.contact)
      return contact ? [{ ...contact, is_primary: 1 }] : []
    }

    case 'crm.fcrm.doctype.crm_lead.crm_lead.convert_to_deal': {
      const lead = state.leads.find((l) => l.name === params.lead)
      if (!lead) throw new Error('Lead not found')
      const dealName = nextName('CRM Deal', state.deals)
      const dealInput = typeof params.deal === 'object' ? params.deal : {}
      const newDeal = {
        name: dealName,
        organization: dealInput.organization || lead.organization || lead.lead_name,
        organization_name: dealInput.organization || lead.organization || lead.lead_name,
        status: dealInput.status || 'Qualification',
        deal_value: Number(dealInput.deal_value || lead.annual_revenue || 250000),
        annual_revenue: Number(dealInput.annual_revenue || lead.annual_revenue || 250000),
        probability: 25,
        expected_deal_value: Number(dealInput.deal_value || lead.annual_revenue || 250000) * 0.25,
        currency: 'INR',
        exchange_rate: 1,
        email: lead.email,
        mobile_no: lead.mobile_no,
        lead: lead.name,
        lead_name: lead.lead_name,
        source: lead.source,
        territory: lead.territory,
        deal_owner: lead.lead_owner || 'Administrator',
        _assign: lead._assign || JSON.stringify(['Administrator']),
        creation: nowStamp(),
        modified: nowStamp(),
        owner: 'Administrator',
        modified_by: 'Administrator',
      }
      state.deals.unshift(newDeal)
      lead.converted = 1
      lead.status = 'Converted'
      lead.modified = nowStamp()
      persistState()
      return dealName
    }

    case 'crm.fcrm.doctype.crm_deal.crm_deal.create_deal': {
      const data = parseJson(params.args, params) || {}
      const dealName = nextName('CRM Deal', state.deals)
      const newDeal = {
        name: dealName,
        status: 'Qualification',
        currency: 'INR',
        exchange_rate: 1,
        deal_owner: 'Administrator',
        _assign: JSON.stringify(['Administrator']),
        creation: nowStamp(),
        modified: nowStamp(),
        owner: 'Administrator',
        ...data,
      }
      state.deals.unshift(newDeal)
      persistState()
      return dealName
    }

    case 'crm.fcrm.doctype.fcrm_note.fcrm_note.set_pinned': {
      const note = state.notes.find((n) => n.name === params.name)
      if (note) {
        note.pinned = params.pinned ? 1 : 0
        persistState()
      }
      return note
    }

    case 'crm.api.command_palette.search': {
      const q = String(params.query || '').toLowerCase()
      const results = []
      for (const l of state.leads) {
        if (!q || `${l.lead_name} ${l.organization} ${l.email}`.toLowerCase().includes(q)) {
          results.push({ doctype: 'CRM Lead', name: l.name, title: l.lead_name, subtitle: l.organization })
        }
      }
      for (const d of state.deals) {
        if (!q || `${d.organization} ${d.lead_name}`.toLowerCase().includes(q)) {
          results.push({ doctype: 'CRM Deal', name: d.name, title: d.organization, subtitle: d.status })
        }
      }
      return results.slice(0, 12)
    }

    case 'crm.demo.api.clear_demo_data':
      resetSimulatorState()
      return true

    case 'frappe.apps.get_apps':
      return [
        { name: 'crm', title: 'creat8rlabs', route: '/' },
        { name: 'erpnext', title: 'ERPNext', route: '/erp/home' },
      ]

    case 'frappe.desk.form.load.getdoctype': {
      const schema = SIMULATOR_SCHEMAS.doctypes[params.doctype]
      return {
        docs: [
          {
            name: params.doctype,
            fields: clone(schema?.fields || []),
            permissions: [{ read: 1, write: 1, create: 1, delete: 1 }],
          },
        ],
        user_settings: '{}',
      }
    }

    case 'frappe.desk.form.load.getdoc': {
      const doc = getCollection(params.doctype).find((d) => d.name === params.name)
      if (!doc) throw new Error(`${params.doctype} ${params.name} not found`)
      return {
        docs: [clone(doc)],
        docinfo: buildDocinfo(params.doctype, params.name),
      }
    }

    case 'frappe.client.get': {
      if (params.doctype === 'FCRM Settings') return clone(state.settings)
      if (params.doctype === 'ERPNext CRM Settings') return clone(state.erpSettings)
      const doc = getCollection(params.doctype).find((d) => d.name === params.name)
      return doc ? clone(doc) : null
    }

    case 'frappe.client.get_single_value': {
      if (params.doctype === 'FCRM Settings') return state.settings[params.field] ?? null
      if (params.doctype === 'ERPNext CRM Settings') return state.erpSettings[params.field] ?? null
      return null
    }

    case 'frappe.client.get_value': {
      const doc = getCollection(params.doctype).find((d) => d.name === params.fieldname || d.name === params.filters?.name)
      return doc || {}
    }

    case 'frappe.client.get_list': {
      const rows = applyFilters(getCollection(params.doctype), params.filters)
      return clone(sortRows(rows, params.order_by).slice(0, Number(params.limit_page_length || 50)))
    }

    case 'frappe.client.get_count':
      return applyFilters(getCollection(params.doctype), params.filters).length

    case 'frappe.client.get_doc_permissions':
      return { permissions: { read: 1, write: 1, create: 1, delete: 1 } }

    case 'frappe.client.insert': {
      const payload = parseJson(params.doc, params.doc) || {}
      const doctype = payload.doctype
      const col = getCollection(doctype)
      const name = payload.name || nextName(doctype, col)
      const created = {
        creation: nowStamp(),
        modified: nowStamp(),
        owner: 'Administrator',
        modified_by: 'Administrator',
        ...payload,
        name,
      }
      if (doctype === 'CRM Lead' && !created.lead_name) {
        created.lead_name = [created.first_name, created.last_name].filter(Boolean).join(' ') || name
      }
      col.unshift(created)
      persistState()
      return clone(created)
    }

    case 'frappe.client.save':
    case 'frappe.client.set_value': {
      const isSetVal = methodName === 'frappe.client.set_value'
      const doctype = isSetVal ? params.doctype : params.doc?.doctype
      const name = isSetVal ? params.name : params.doc?.name
      if (doctype === 'FCRM Settings') {
        Object.assign(state.settings, isSetVal ? { [params.fieldname]: params.value } : params.doc)
        persistState()
        return clone(state.settings)
      }
      const col = getCollection(doctype)
      const target = col.find((d) => d.name === name)
      if (!target) return null
      if (isSetVal) {
        if (typeof params.fieldname === 'object') Object.assign(target, params.fieldname)
        else target[params.fieldname] = params.value
      } else {
        Object.assign(target, params.doc)
      }
      target.modified = nowStamp()
      persistState()
      return clone(target)
    }

    case 'frappe.client.delete': {
      const key = DOCTYPE_TO_KEY[params.doctype]
      if (key) {
        state[key] = state[key].filter((d) => d.name !== params.name)
        persistState()
      }
      return 'ok'
    }

    case 'frappe.desk.search.search_link': {
      const txt = String(params.txt || '').toLowerCase()
      const dt = params.doctype
      const rows = getCollection(dt)
      return rows
        .map((r) => ({
          value: r.name,
          description: r.full_name || r.lead_name || r.organization_name || r.email || '',
        }))
        .filter((o) => !txt || `${o.value} ${o.description}`.toLowerCase().includes(txt))
        .slice(0, 20)
    }

    case 'frappe.desk.form.assign_to.add':
    case 'frappe.desk.form.assign_to.add_multiple': {
      const assignees = parseJson(params.assign_to, [params.assign_to].filter(Boolean))
      const doc = getCollection(params.doctype).find((d) => d.name === params.name)
      if (doc) {
        const current = new Set(parseJson(doc._assign, []))
        assignees.forEach((a) => current.add(a))
        doc._assign = JSON.stringify([...current])
        persistState()
      }
      return assignees
    }

    case 'frappe.desk.like.toggle_like': {
      const doc = getCollection(params.doctype).find((d) => d.name === params.name)
      if (doc) {
        const likes = new Set(parseJson(doc._liked_by, []))
        if (likes.has('Administrator')) likes.delete('Administrator')
        else likes.add('Administrator')
        doc._liked_by = JSON.stringify([...likes])
        persistState()
      }
      return true
    }

    case 'frappe.model.utils.user_settings.save':
      return {}

    default:
      return null
  }
}

export async function simulatorRequest(options = {}) {
  const rawUrl = String(options.url || '')
  const methodName = rawUrl.startsWith(SIMULATOR_API_PREFIX)
    ? rawUrl.slice(SIMULATOR_API_PREFIX.length).split('?')[0]
    : rawUrl.replace(/^\/+/, '').split('?')[0]
  return dispatchMethod(methodName, options.params || {})
}

// Interactive ERPNext simulator helpers for ERPWorkspace.vue
export function createErpQuotationFromDeal(dealName) {
  const state = getSimulatorState()
  const deal = state.deals.find((d) => d.name === dealName) || state.deals[0]
  if (!deal) return null
  const num = String(state.erp.quotations.length + 16).padStart(5, '0')
  const qtn = {
    name: `SAL-QTN-2026-${num}`,
    customer_name: deal.organization_name || deal.organization || deal.lead_name || 'Walk-in Customer',
    party_name: deal.organization || 'CUST-ACME',
    crm_deal: deal.name,
    status: 'Open',
    transaction_date: todayDate(),
    valid_till: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    currency: deal.currency || 'INR',
    grand_total: Number(deal.deal_value || 360000),
    items: [
      {
        item_code: 'C8-CRM-ENT',
        item_name: 'creat8rlabs Enterprise SaaS License (Annual)',
        qty: 1,
        rate: Number(deal.deal_value || 360000),
      },
    ],
  }
  state.erp.quotations.unshift(qtn)
  persistState()
  return qtn
}

export function convertQuotationToOrder(quotationName) {
  const state = getSimulatorState()
  const qtn = state.erp.quotations.find((q) => q.name === quotationName)
  if (!qtn) return null
  qtn.status = 'Ordered'
  const num = String(state.erp.salesOrders.length + 10).padStart(5, '0')
  const so = {
    name: `SAL-ORD-2026-${num}`,
    customer_name: qtn.customer_name,
    crm_deal: qtn.crm_deal,
    quotation: qtn.name,
    status: 'To Deliver and Bill',
    transaction_date: todayDate(),
    delivery_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    currency: qtn.currency,
    grand_total: qtn.grand_total,
  }
  state.erp.salesOrders.unshift(so)
  persistState()
  return so
}

export function createInvoiceFromOrder(orderName) {
  const state = getSimulatorState()
  const so = state.erp.salesOrders.find((o) => o.name === orderName)
  if (!so) return null
  so.status = 'Completed'
  const num = String(state.erp.invoices.length + 7).padStart(5, '0')
  const inv = {
    name: `ACC-SINV-2026-${num}`,
    customer_name: so.customer_name,
    sales_order: so.name,
    status: 'Unpaid',
    posting_date: todayDate(),
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    currency: so.currency,
    grand_total: so.grand_total,
    outstanding_amount: so.grand_total,
  }
  state.erp.invoices.unshift(inv)
  persistState()
  return inv
}

export function recordInvoicePayment(invoiceName) {
  const state = getSimulatorState()
  const inv = state.erp.invoices.find((i) => i.name === invoiceName)
  if (!inv || inv.outstanding_amount <= 0) return null
  const num = String(state.erp.payments.length + 5).padStart(5, '0')
  const pay = {
    name: `ACC-PAY-2026-${num}`,
    party_name: inv.customer_name,
    invoice: inv.name,
    mode_of_payment: 'UPI / NEFT',
    posting_date: todayDate(),
    paid_amount: inv.outstanding_amount,
    currency: inv.currency,
    status: 'Submitted',
  }
  inv.outstanding_amount = 0
  inv.status = 'Paid'
  state.erp.payments.unshift(pay)
  persistState()
  return pay
}
