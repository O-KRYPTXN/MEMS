export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_DEVICES: '/admin/devices',
  ADMIN_ADD_DEVICE: '/admin/devices/add',
  ADMIN_WORK_ORDERS: '/admin/work-orders',
  ADMIN_PM: '/admin/preventive-maintenance',
  ADMIN_INVENTORY: '/admin/inventory',
  ADMIN_USERS: '/admin/users',
  ADMIN_REPORTS: '/admin/reports',

  // Supervisor
  SUPERVISOR_DASHBOARD: '/supervisor/dashboard',
  SUPERVISOR_TEAM: '/supervisor/team',
  SUPERVISOR_WORK_ORDERS: '/supervisor/work-orders',
  SUPERVISOR_DEVICES: '/supervisor/devices',
  SUPERVISOR_INVENTORY: '/supervisor/inventory',

  // Technician
  TECH_DASHBOARD: '/technician/dashboard',
  TECH_WORK_ORDERS: '/technician/work-orders',
  TECH_DEVICES: '/technician/devices',
  TECH_NOTIFICATIONS: '/technician/notifications',
  TECH_INVENTORY: '/technician/inventory',

  // Department
  DEPT_DASHBOARD: '/department/dashboard',
  DEPT_REQUESTS: '/department/requests',

  // Store
  STORE_DASHBOARD: '/store/dashboard',
  STORE_INVENTORY: '/store/inventory',
  STORE_REQUESTS: '/store/requests',
  STORE_ORDERS: '/store/orders',
  STORE_CREATE_ORDER: '/store/orders/create',
  STORE_REJECTED: '/store/orders/rejected',
  STORE_EMAIL_LOG: '/store/email-log',

  // Shared
  PROFILE: '/profile',
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '*',
}