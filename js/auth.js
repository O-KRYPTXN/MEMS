/**
 * MEMS — auth.js
 * Login page: validation, password toggle, remember me,
 * role-based routing, forgot password modal.
 * No animations. Pure functional.
 */

'use strict';

/* ─── DEMO CREDENTIALS ────────────────────────────────────────── */
const DEMO_CREDENTIALS = [
  { email: 'admin@hospital.org',      password: 'Admin@1234',  role: 'admin', name: 'System Admin' },
  { email: 'dept@hospital.org',       password: 'Dept@1234',   role: 'dept-supervisor', name: 'Sarah Nurse' },
  { email: 'supervisor@hospital.org', password: 'Super@1234',  role: 'supervisor', name: 'Dr. Supervisor' },
  { email: 'tech@hospital.org',       password: 'Tech@1234',   role: 'technician', name: 'Ahmed Hassan' },
  { email: 'store@hospital.org',      password: 'Store@1234',  role: 'storekeeper', name: 'Store Manager' },
];

const ROLE_DASHBOARDS = {
  admin:           'dashboard.html?role=admin',
  'dept-supervisor': 'dept-dashboard.html',
  supervisor:      'supervisor-dashboard.html',
  technician:      'tech-dashboard.html',
  storekeeper:     'store-dashboard.html',
};

/* ─── DOM REFS ────────────────────────────────────────────────── */
const loginForm    = document.getElementById('login-form');
const emailInput   = document.getElementById('login-email');
const pwInput      = document.getElementById('login-password');
const rememberCb   = document.getElementById('remember-me');
const demoRole     = document.getElementById('demo-role');
const loginBtn     = document.getElementById('login-btn');
const loginAlert   = document.getElementById('login-alert');
const alertMsg     = document.getElementById('login-alert-msg');
const emailErr     = document.getElementById('email-err');
const pwErr        = document.getElementById('pw-err');

const togglePwBtn  = document.getElementById('toggle-pw');
const eyeShow      = document.getElementById('eye-show');
const eyeHide      = document.getElementById('eye-hide');

const forgotBtn    = document.getElementById('forgot-btn');
const forgotModal  = document.getElementById('forgot-modal');
const closeModal   = document.getElementById('close-modal');
const sendReset    = document.getElementById('send-reset');
const resetEmail   = document.getElementById('reset-email');
const resetEmailErr = document.getElementById('reset-email-err');

/* ─── RESTORE REMEMBERED EMAIL ───────────────────────────────── */
(function restoreRemembered() {
  try {
    const saved = JSON.parse(localStorage.getItem('mems_remember') || 'null');
    if (saved && saved.email) {
      emailInput.value   = saved.email;
      rememberCb.checked = true;
    }
  } catch {}
})();

/* ─── HELPERS ─────────────────────────────────────────────────── */
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

function setValid(el) {
  el.classList.remove('is-invalid');
  el.classList.add('is-valid');
}
function setInvalid(el) {
  el.classList.remove('is-valid');
  el.classList.add('is-invalid');
}
function clearState(el) {
  el.classList.remove('is-valid', 'is-invalid');
}

function showErr(el, show) {
  show ? el.classList.add('show') : el.classList.remove('show');
}

function showAlert(msg, type = 'danger') {
  alertMsg.textContent = msg;
  loginAlert.className = `alert alert-${type} show`;
}
function hideAlert() { loginAlert.className = 'alert alert-danger'; }

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ─── REAL-TIME VALIDATION ────────────────────────────────────── */
emailInput.addEventListener('blur', () => {
  if (!emailInput.value.trim() || !isEmail(emailInput.value)) {
    setInvalid(emailInput);
    showErr(emailErr, true);
  } else {
    setValid(emailInput);
    showErr(emailErr, false);
  }
});

emailInput.addEventListener('input', () => {
  hideAlert();
  if (emailInput.classList.contains('is-invalid') && isEmail(emailInput.value)) {
    setValid(emailInput);
    showErr(emailErr, false);
  }
});

pwInput.addEventListener('blur', () => {
  if (!pwInput.value) {
    setInvalid(pwInput);
    showErr(pwErr, true);
  }
});

pwInput.addEventListener('input', () => {
  hideAlert();
  if (pwInput.classList.contains('is-invalid') && pwInput.value.length > 0) {
    clearState(pwInput);
    showErr(pwErr, false);
  }
});

/* ─── PASSWORD TOGGLE ─────────────────────────────────────────── */
togglePwBtn.addEventListener('click', () => {
  const show = pwInput.type === 'password';
  pwInput.type     = show ? 'text' : 'password';
  eyeShow.style.display = show ? 'none'  : 'block';
  eyeHide.style.display = show ? 'block' : 'none';
  togglePwBtn.setAttribute('aria-pressed', String(show));
});

/* ─── FORM SUBMIT ─────────────────────────────────────────────── */
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const email    = emailInput.value.trim();
  const password = pwInput.value;
  const remember = rememberCb.checked;
  const role     = demoRole ? demoRole.value : 'admin';

  let hasError = false;
  if (!email || !isEmail(email)) {
    setInvalid(emailInput);
    showErr(emailErr, true);
    hasError = true;
  }
  if (!password) {
    setInvalid(pwInput);
    showErr(pwErr, true);
    hasError = true;
  }
  if (hasError) return;

  // Loading
  loginBtn.classList.add('loading');
  loginBtn.disabled = true;

  await delay(1000);

  // Check if user has a pending or denied registration
  const pendingRegs = JSON.parse(localStorage.getItem('mems_pending_registrations') || '[]');
  const pendingMatch = pendingRegs.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (pendingMatch) {
    loginBtn.classList.remove('loading');
    loginBtn.disabled = false;
    if (pendingMatch.status === 'pending') {
      showAlert('Your account request is pending Admin approval. Please wait.');
    } else if (pendingMatch.status === 'denied') {
      showAlert('Your account request was denied. Please contact the Administrator.');
    }
    return;
  }

  // Check if user is in approved users list (registered via signup)
  const approvedUsers = JSON.parse(localStorage.getItem('mems_approved_users') || '[]');
  const approvedMatch = approvedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (approvedMatch) {
    const decodedPw = atob(approvedMatch.password || '');
    if (decodedPw !== password) {
      loginBtn.classList.remove('loading');
      loginBtn.disabled = false;
      showAlert('Invalid email or password. Please try again.');
      setInvalid(emailInput); setInvalid(pwInput);
      return;
    }
    // Approved user authenticated!
    const session = {
      email,
      role: approvedMatch.role,
      name: `${approvedMatch.firstName} ${approvedMatch.lastName}`,
      loginTime: Date.now(),
      token: buildToken(email, approvedMatch.role),
    };
    if (rememberCb.checked) {
      localStorage.setItem('mems_session', JSON.stringify(session));
      localStorage.setItem('mems_remember', JSON.stringify({ email }));
    } else {
      sessionStorage.setItem('mems_session', JSON.stringify(session));
      localStorage.removeItem('mems_remember');
    }
    showAlert('Login successful. Redirecting…', 'success');
    await delay(700);
    window.location.href = ROLE_DASHBOARDS[approvedMatch.role] || ROLE_DASHBOARDS['admin'];
    return;
  }

  // Validate demo credentials
  const match = DEMO_CREDENTIALS.find(
    c => c.email.toLowerCase() === email.toLowerCase() && c.password === password
  );

  const authenticated = !!match || (email && password.length >= 4);
  const resolvedRole  = match ? match.role : role;

  if (!authenticated) {
    loginBtn.classList.remove('loading');
    loginBtn.disabled = false;
    showAlert('Invalid email or password. Please try again.');
    setInvalid(emailInput);
    setInvalid(pwInput);
    return;
  }

  // Build session
  const session = {
    email,
    role: resolvedRole,
    name: match && match.name ? match.name : resolvedRole.charAt(0).toUpperCase() + resolvedRole.slice(1),
    loginTime: Date.now(),
    token: buildToken(email, resolvedRole),
  };

  if (remember) {
    localStorage.setItem('mems_session', JSON.stringify(session));
    localStorage.setItem('mems_remember', JSON.stringify({ email }));
  } else {
    sessionStorage.setItem('mems_session', JSON.stringify(session));
    localStorage.removeItem('mems_remember');
  }

  showAlert('Login successful. Redirecting…', 'success');
  await delay(700);
  window.location.href = ROLE_DASHBOARDS[resolvedRole] || ROLE_DASHBOARDS['admin'];
});

/* ─── FORGOT PASSWORD MODAL ──────────────────────────────────── */
forgotBtn.addEventListener('click', () => {
  forgotModal.classList.add('show');
  resetEmail.focus();
});

closeModal.addEventListener('click', closeResetModal);

forgotModal.addEventListener('click', (e) => {
  if (e.target === forgotModal) closeResetModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && forgotModal.classList.contains('show')) closeResetModal();
});

sendReset.addEventListener('click', async () => {
  const email = resetEmail.value.trim();
  if (!email || !isEmail(email)) {
    resetEmail.classList.add('is-invalid');
    showErr(resetEmailErr, true);
    return;
  }
  resetEmail.classList.remove('is-invalid');
  showErr(resetEmailErr, false);

  sendReset.classList.add('loading');
  sendReset.disabled = true;
  sendReset.querySelector('.btn-text').textContent = 'Sending…';

  await delay(1400);

  sendReset.querySelector('.btn-text').textContent = '✓ Link Sent';
  sendReset.style.background = 'var(--clr-success)';
  sendReset.style.borderColor = 'var(--clr-success)';

  await delay(1600);
  closeResetModal();

  // Reset button state
  sendReset.classList.remove('loading');
  sendReset.disabled = false;
  sendReset.querySelector('.btn-text').textContent = 'Send Link';
  sendReset.style.background = '';
  sendReset.style.borderColor = '';
});

function closeResetModal() {
  forgotModal.classList.remove('show');
  resetEmail.value = '';
  resetEmail.classList.remove('is-invalid');
  showErr(resetEmailErr, false);
}

/* ─── TOKEN HELPER ────────────────────────────────────────────── */
function buildToken(email, role) {
  const h = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const p = btoa(JSON.stringify({
    sub: email, role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    permissions: {
      admin:             ['*'],
      'dept-supervisor': ['dashboard', 'requests'],
      supervisor:        ['dashboard', 'devices', 'workorders', 'reports', 'pm'],
      technician:        ['dashboard', 'workorders', 'devices:read', 'inventory:read'],
      storekeeper:       ['dashboard', 'inventory', 'workorders:read'],
    }[role] || ['dashboard'],
  }));
  const s = btoa('mems-sig');
  return `${h}.${p}.${s}`;
}

/* ─── CHECKBOX KEYBOARD ───────────────────────────────────────── */
document.querySelectorAll('.checkbox-custom').forEach(el => {
  const cb = el.previousElementSibling;
  el.setAttribute('tabindex', '0');
  el.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (cb) cb.checked = !cb.checked;
    }
  });
});
