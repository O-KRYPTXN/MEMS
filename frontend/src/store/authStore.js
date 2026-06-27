import { create } from 'zustand'
import { ROLES } from '../constants/roles'
import { ROUTES } from '../constants/routes'

export const useAuthStore = create((set) => ({
  user: {
    id: '1',
    name: 'Ahmed Hassan',
    email: 'ahmed@hospital.com',
    role: ROLES.ADMIN,
    department: 'Administration',
    initials: 'AH',
  },

  login: (userData) => set({ user: userData }),

  logout: () => set({ user: null }),
}))

// Helper: returns the home route for a given role
export const getHomeRoute = (role) => {
  const map = {
    [ROLES.ADMIN]: ROUTES.ADMIN_DASHBOARD,
    [ROLES.SUPERVISOR]: ROUTES.SUPERVISOR_DASHBOARD,
    [ROLES.TECHNICIAN]: ROUTES.TECH_DASHBOARD,
    [ROLES.DEPARTMENT]: ROUTES.DEPT_DASHBOARD,
    [ROLES.STORE]: ROUTES.STORE_DASHBOARD,
  }
  return map[role] ?? ROUTES.LOGIN
}