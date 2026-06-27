/**
 * MEMS — session.js  v1.0
 * ─────────────────────────────────────────────────────────────────
 * Shared session management utility. Add ONE line to every page:
 *   <script src="js/session.js"></script>
 *
 * Public API  (window.MEMSSession):
 *   getSession()           → { email, role, name, initials, roleLabel } | null
 *   requireAuth(roles[])   → redirects to index.html if not logged in / wrong role
 *   logout()               → clears session, goes to index.html
 *   saveSession(updates)   → merge updates into stored session object
 *   initSidebarUser()      → injects user name/initials into sidebar automatically
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

(function () {

  const SESSION_KEY = 'mems_session';

  const ROLE_LABELS = {
    admin:             'Administrator',
    'dept-supervisor': 'Department Supervisor',
    supervisor:        'Technical Supervisor',
    technician:        'Biomedical Technician',
    storekeeper:       'Storekeeper',
  };

  /* ── getSession ────────────────────────────────────────────── */
  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !s.email) return null;

      // Build initials from name (e.g. "Ahmed Hassan" → "AH")
      const nameParts = (s.name || s.email).trim().split(/\s+/);
      const initials = nameParts.length >= 2
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : nameParts[0].substring(0, 2).toUpperCase();

      return Object.assign({}, s, {
        initials,
        roleLabel: ROLE_LABELS[s.role] || s.role,
      });
    } catch (_) {
      return null;
    }
  }

  /* ── saveSession ───────────────────────────────────────────── */
  function saveSession(updates) {
    try {
      const inLocal = !!localStorage.getItem(SESSION_KEY);
      const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      const current = raw ? JSON.parse(raw) : {};
      const merged = Object.assign({}, current, updates);
      const str = JSON.stringify(merged);
      if (inLocal) localStorage.setItem(SESSION_KEY, str);
      sessionStorage.setItem(SESSION_KEY, str);
    } catch (_) {}
  }

  /* ── requireAuth ───────────────────────────────────────────── */
  function requireAuth(allowedRoles) {
    const s = getSession();
    if (!s) {
      window.location.href = 'index.html';
      return null;
    }
    if (allowedRoles && allowedRoles.length && !allowedRoles.includes(s.role)) {
      window.location.href = 'index.html';
      return null;
    }
    return s;
  }

  /* ── logout ────────────────────────────────────────────────── */
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
  }

  /* ── initSidebarUser ───────────────────────────────────────── */
  function initSidebarUser() {
    const s = getSession();
    if (!s) return;

    // ── Avatar ──
    const avatarKey = 'mems_' + s.role + '_avatar';
    const savedAvatar = localStorage.getItem(avatarKey) || localStorage.getItem('mems_avatar');

    document.querySelectorAll('.user-avatar, #sb-avatar').forEach(el => {
      if (savedAvatar) {
        el.style.backgroundImage = 'url(' + savedAvatar + ')';
        el.style.backgroundSize  = 'cover';
        el.style.backgroundPosition = 'center';
        el.textContent = '';
      } else {
        el.textContent = s.initials;
      }
    });

    // ── Name ──
    document.querySelectorAll('.user-name, #sb-name').forEach(el => {
      el.textContent = s.name || s.email;
    });

    // ── Role label ──
    document.querySelectorAll('.user-role, #sb-role').forEach(el => {
      el.textContent = s.roleLabel;
    });

    // ── Logout buttons ──
    document.querySelectorAll('.logout-btn, #logout-btn').forEach(btn => {
      // Remove any existing href so click handler takes over
      btn.removeAttribute('href');
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        logout();
      });
    });
  }

  /* ── Auto-run on DOM ready ─────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarUser);
  } else {
    initSidebarUser();
  }

  /* ── Global export ─────────────────────────────────────────── */
  window.MEMSSession = { getSession, saveSession, requireAuth, logout, initSidebarUser };

})();
