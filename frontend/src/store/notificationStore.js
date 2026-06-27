import { create } from 'zustand'

export const useNotificationStore = create((set) => ({
  unreadCount: 3,
  alerts: [],

  setAlerts: (alerts) => set({ alerts }),

  markAllRead: () => set({ unreadCount: 0 }),

  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),
}))