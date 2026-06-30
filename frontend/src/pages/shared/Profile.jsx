import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { ROLES } from '../../constants/roles'
import clsx from 'clsx'

const roleMap = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.SUPERVISOR]: 'Supervisor',
  [ROLES.TECHNICIAN]: 'Biomedical Technician',
  [ROLES.DEPARTMENT]: 'Department Staff',
  [ROLES.STORE]: 'Storekeeper'
}

const inputCls = "w-full bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#3B72F6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
const labelCls = "block text-[12px] text-[#94A3B8] font-semibold mb-1.5"

const Toggle = ({ id, checked, onChange }) => (
  <label htmlFor={id} className="relative inline-flex items-center cursor-pointer shrink-0">
    <input type="checkbox" id={id} className="sr-only peer" checked={checked} onChange={onChange} />
    <div className="w-11 h-6 bg-[#1F2A40] rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-[#3B72F6]"></div>
  </label>
)

export default function Profile() {
  const user = useAuthStore(state => state.user)
  const { showToast } = useToastStore()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [avatar, setAvatar] = useState(null)
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '' })
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [toggles, setToggles] = useState({ 
    emailAlerts: true, smsAlerts: false, pmReminders: true, lowStock: true, 
    twoFactor: false, darkTheme: true, compactView: false 
  })
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (user) {
      const parts = (user.name || '').split(' ')
      const first = parts[0] || ''
      const last = parts.slice(1).join(' ') || ''
      setProfileForm({ firstName: first, lastName: last, email: user.email || '' })
    }
  }, [user])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (evt) => setAvatar(evt.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleProfileSave = (e) => {
    e.preventDefault()
    showToast('✓ Profile updated successfully.', TOAST_COLORS.success)
  }

  const handlePasswordUpdate = (e) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      showToast('❌ New passwords do not match.', TOAST_COLORS.error)
      return
    }
    showToast('✓ Password updated successfully.', TOAST_COLORS.success)
    setPasswords({ current: '', new: '', confirm: '' })
  }

  const toggleSetting = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /> },
    { id: 'notif', label: 'Notifications', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /> },
    { id: 'security', label: 'Security', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /> },
    { id: 'app', label: 'Application', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /> }
  ]

  const readableRole = user?.role ? (roleMap[user.role] || user.role) : 'Unknown Role'

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">Profile</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">Manage your account, notification preferences, and application settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 mt-2">
        <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl p-3 flex flex-col gap-1 self-start">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 text-sm rounded-lg cursor-pointer transition-colors text-left",
                activeTab === t.id ? "bg-[rgba(59,114,246,0.12)] text-[#5E8FFF] font-semibold" : "text-[#94A3B8] hover:bg-[#1A2235] hover:text-[#E2E8F0]"
              )}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d={t.icon} /></svg>
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl px-7 py-6 min-h-[400px]">
          {activeTab === 'profile' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-white">My Profile</h2>
              <p className="text-xs text-[#5A6A85] mt-1 mb-6 pb-4 border-b border-[#1F2A40]">Update your personal information and profile photo.</p>
              
              <div className="flex flex-wrap sm:flex-nowrap justify-between items-center mb-8 gap-4 w-full">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-full bg-[#1F2A40] flex items-center justify-center text-xl font-bold text-[#94A3B8] overflow-hidden border border-[#2A3441]"
                    style={avatar ? { backgroundImage: `url(${avatar})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    {!avatar && user?.initials}
                  </div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border border-[#1F2A40] rounded-lg text-[#94A3B8] text-[13px] hover:border-[#94A3B8] hover:text-[#E2E8F0] font-bold transition-colors">
                    Change Photo
                  </button>
                </div>
                {avatar && (
                  <button type="button" onClick={() => setAvatar(null)} className="px-4 py-2 bg-transparent border border-red-500/25 rounded-md text-[#F87171] text-[13px] font-bold hover:bg-red-500/10 transition-colors">
                    Remove
                  </button>
                )}
              </div>

              <form onSubmit={handleProfileSave} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>First Name</label>
                  <input type="text" value={profileForm.firstName} onChange={e => setProfileForm(f => ({...f, firstName: e.target.value}))} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Last Name</label>
                  <input type="text" value={profileForm.lastName} onChange={e => setProfileForm(f => ({...f, lastName: e.target.value}))} className={inputCls} required />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Email Address</label>
                  <input type="email" value={profileForm.email} onChange={e => setProfileForm(f => ({...f, email: e.target.value}))} className={inputCls} required />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Role</label>
                  <input type="text" value={readableRole} disabled className={inputCls} />
                </div>
                <div className="sm:col-span-2 mt-2">
                  <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-[#3B72F6] hover:bg-[#2563EB] text-white rounded-lg text-[13px] font-bold transition-colors min-w-[200px]">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notif' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-white">Notifications</h2>
              <p className="text-xs text-[#5A6A85] mt-1 mb-6 pb-4 border-b border-[#1F2A40]">Manage how you receive alerts and updates.</p>
              
              <div className="flex flex-col">
                <div className="flex justify-between items-center py-4 border-b border-[#1A2235]">
                  <div>
                    <div className="text-sm font-semibold text-white">Email Alerts</div>
                    <div className="text-xs text-[#5A6A85] mt-0.5">Receive notifications via your registered email.</div>
                  </div>
                  <Toggle id="emailAlerts" checked={toggles.emailAlerts} onChange={() => toggleSetting('emailAlerts')} />
                </div>
                <div className="flex justify-between items-center py-4 border-b border-[#1A2235]">
                  <div>
                    <div className="text-sm font-semibold text-white">SMS Notifications</div>
                    <div className="text-xs text-[#5A6A85] mt-0.5">Receive urgent alerts directly to your phone.</div>
                  </div>
                  <Toggle id="smsAlerts" checked={toggles.smsAlerts} onChange={() => toggleSetting('smsAlerts')} />
                </div>
                <div className="flex justify-between items-center py-4 border-b border-[#1A2235]">
                  <div>
                    <div className="text-sm font-semibold text-white">Preventive Maintenance Reminders</div>
                    <div className="text-xs text-[#5A6A85] mt-0.5">Get notified before scheduled maintenance is due.</div>
                  </div>
                  <Toggle id="pmReminders" checked={toggles.pmReminders} onChange={() => toggleSetting('pmReminders')} />
                </div>
                <div className="flex justify-between items-center py-4">
                  <div>
                    <div className="text-sm font-semibold text-white">Low Stock Warnings</div>
                    <div className="text-xs text-[#5A6A85] mt-0.5">Alerts when inventory falls below minimum levels.</div>
                  </div>
                  <Toggle id="lowStock" checked={toggles.lowStock} onChange={() => toggleSetting('lowStock')} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-white">Security</h2>
              <p className="text-xs text-[#5A6A85] mt-1 mb-6 pb-4 border-b border-[#1F2A40]">Update your password and secure your account.</p>
              
              <form onSubmit={handlePasswordUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Current Password</label>
                  <input type="password" value={passwords.current} onChange={e => setPasswords(p => ({...p, current: e.target.value}))} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>New Password</label>
                  <input type="password" value={passwords.new} onChange={e => setPasswords(p => ({...p, new: e.target.value}))} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Confirm New Password</label>
                  <input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({...p, confirm: e.target.value}))} className={inputCls} required />
                </div>
                <div className="sm:col-span-2 mt-2">
                  <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-[#3B72F6] hover:bg-[#2563EB] text-white rounded-lg text-[13px] font-bold transition-colors min-w-[200px]">
                    Update Password
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-[#1F2A40]">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-white">Two-Factor Authentication (2FA)</div>
                    <div className="text-xs text-[#5A6A85] mt-0.5">Add an extra layer of security to your account.</div>
                  </div>
                  <Toggle id="twoFactor" checked={toggles.twoFactor} onChange={() => toggleSetting('twoFactor')} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'app' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-white">Application</h2>
              <p className="text-xs text-[#5A6A85] mt-1 mb-6 pb-4 border-b border-[#1F2A40]">Customize your application experience.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                <div>
                  <label className={labelCls}>Language</label>
                  <select className={inputCls}>
                    <option>English (US)</option>
                    <option>English (UK)</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Date Format</label>
                  <select className={inputCls}>
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center py-4 border-b border-[#1A2235]">
                  <div>
                    <div className="text-sm font-semibold text-white">Dark Theme</div>
                    <div className="text-xs text-[#5A6A85] mt-0.5">Use dark mode interface across the app.</div>
                  </div>
                  <Toggle id="darkTheme" checked={toggles.darkTheme} onChange={() => toggleSetting('darkTheme')} />
                </div>
                <div className="flex justify-between items-center py-4">
                  <div>
                    <div className="text-sm font-semibold text-white">Compact Table View</div>
                    <div className="text-xs text-[#5A6A85] mt-0.5">Reduce padding in data tables to show more rows.</div>
                  </div>
                  <Toggle id="compactView" checked={toggles.compactView} onChange={() => toggleSetting('compactView')} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}