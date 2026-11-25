import ContactsIcon from '@/components/Icons/ContactsIcon.vue'
import DealsIcon from '@/components/Icons/DealsIcon.vue'
import LeadsIcon from '@/components/Icons/LeadsIcon.vue'
import NoteIcon from '@/components/Icons/NoteIcon.vue'
import OrganizationsIcon from '@/components/Icons/OrganizationsIcon.vue'
import PhoneIcon from '@/components/Icons/PhoneIcon.vue'
import TaskIcon from '@/components/Icons/TaskIcon.vue'
import LucideLayoutDashboard from '~icons/lucide/layout-dashboard'
import LucideFileText from '~icons/lucide/file-text'
import LucideShoppingCart from '~icons/lucide/shopping-cart'
import LucideReceipt from '~icons/lucide/receipt'
import LucideUsers from '~icons/lucide/users'
import LucidePackage from '~icons/lucide/package'
import LucideBoxes from '~icons/lucide/boxes'
import LucideLandmark from '~icons/lucide/landmark'
import LucideLayoutGrid from '~icons/lucide/layout-grid'
import router from '@/router'

export const navigationItems = [
  {
    label: 'Dashboard',
    icon: LucideLayoutDashboard,
    route: 'Dashboard',
    desktopOnly: true,
  },
  { label: 'Leads', icon: LeadsIcon, route: 'Leads' },
  { label: 'Deals', icon: DealsIcon, route: 'Deals' },
  { label: 'Contacts', icon: ContactsIcon, route: 'Contacts' },
  { label: 'Organizations', icon: OrganizationsIcon, route: 'Organizations' },
  { label: 'Notes', icon: NoteIcon, route: 'Notes' },
  { label: 'Tasks', icon: TaskIcon, route: 'Tasks' },
  { label: 'Call Logs', icon: PhoneIcon, route: 'Call Logs' },
]

export const erpNavigationItems = [
  { label: 'Quotations', icon: LucideFileText, section: 'quotation' },
  { label: 'Sales Orders', icon: LucideShoppingCart, section: 'sales-order' },
  { label: 'Sales Invoices', icon: LucideReceipt, section: 'sales-invoice' },
  { label: 'Customers', icon: LucideUsers, section: 'customer' },
  { label: 'Items & Pricing', icon: LucidePackage, section: 'item' },
  { label: 'Stock & Warehouses', icon: LucideBoxes, section: 'stock' },
  { label: 'Accounting', icon: LucideLandmark, section: 'accounting' },
  { label: 'ERPNext Desk', icon: LucideLayoutGrid, section: 'home' },
]

export function getNavigationItems({ mobile = false } = {}) {
  return navigationItems.filter(
    (item) => router.hasRoute(item.route) && (!mobile || !item.desktopOnly),
  )
}
