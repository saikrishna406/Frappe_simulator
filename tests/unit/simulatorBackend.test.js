import { beforeEach, describe, expect, it } from 'vitest'
import {
  convertQuotationToOrder,
  createErpQuotationFromDeal,
  createInvoiceFromOrder,
  getSimulatorState,
  recordInvoicePayment,
  resetSimulatorState,
  simulatorRequest,
} from '@/simulator/mockBackend'

describe('simulator mockBackend', () => {
  beforeEach(() => {
    resetSimulatorState()
  })

  it('serves lead list, kanban, and dashboard metrics', async () => {
    const listRes = await simulatorRequest({
      url: 'crm.api.doc.get_data',
      params: { doctype: 'CRM Lead', filters: {}, order_by: 'modified desc' },
    })
    expect(listRes.data.length).toBeGreaterThan(0)
    expect(listRes.columns.length).toBeGreaterThan(0)

    const kanbanRes = await simulatorRequest({
      url: 'crm.api.doc.get_data',
      params: {
        doctype: 'CRM Deal',
        filters: {},
        order_by: 'modified desc',
        view: { view_type: 'kanban' },
      },
    })
    expect(kanbanRes.data.some((col) => col.column.name === 'Won')).toBe(true)

    const dashboard = await simulatorRequest({
      url: 'crm.api.dashboard.get_dashboard',
    })
    expect(dashboard.length).toBeGreaterThan(0)
  })

  it('converts a lead to a deal and runs the ERPNext quotation-to-payment flow', async () => {
    const beforeDeals = getSimulatorState().deals.length
    const dealName = await simulatorRequest({
      url: 'crm.fcrm.doctype.crm_lead.crm_lead.convert_to_deal',
      params: { lead: 'CRM-LEAD-2026-0001' },
    })
    expect(dealName).toMatch(/^CRM-DEAL-2026-/)
    expect(getSimulatorState().deals.length).toBe(beforeDeals + 1)

    const qtn = createErpQuotationFromDeal(dealName)
    expect(qtn.crm_deal).toBe(dealName)

    const so = convertQuotationToOrder(qtn.name)
    expect(so.quotation).toBe(qtn.name)

    const inv = createInvoiceFromOrder(so.name)
    expect(inv.sales_order).toBe(so.name)
    expect(inv.status).toBe('Unpaid')

    const pay = recordInvoicePayment(inv.name)
    expect(pay.invoice).toBe(inv.name)
    expect(inv.status).toBe('Paid')
    expect(inv.outstanding_amount).toBe(0)
  })
})
