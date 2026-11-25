import {
  erpNavigationItems,
  getNavigationItems,
  navigationItems,
} from '@/utils/navigation'

describe('navigationItems', () => {
  it('uses unique route names', () => {
    const routes = navigationItems.map((item) => item.route)
    expect(new Set(routes).size).toBe(routes.length)
  })

  it('omits desktop-only destinations on mobile', () => {
    const mobileRoutes = getNavigationItems({ mobile: true }).map(
      (item) => item.route,
    )
    expect(mobileRoutes).not.toContain('Dashboard')
    expect(mobileRoutes).not.toContain('Calendar')
    expect(mobileRoutes).toContain('Leads')
  })
})

describe('erpNavigationItems', () => {
  it('uses unique ERPNext sections including core sales and accounting routes', () => {
    const sections = erpNavigationItems.map((item) => item.section)
    expect(new Set(sections).size).toBe(sections.length)
    expect(sections).toContain('quotation')
    expect(sections).toContain('sales-order')
    expect(sections).toContain('sales-invoice')
    expect(sections).toContain('accounting')
  })
})
