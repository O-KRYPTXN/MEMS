/**
 * MEMS — signup.js
 * Registration page: multi-step nav, validation,
 * password strength, role card selection, success state.
 * No animations.
 */

'use strict';

/* ─── STATE ───────────────────────────────────────────────────── */
let currentStep = 1;

/* ─── DOM REFS ────────────────────────────────────────────────── */
const panels     = [1, 2, 3].map(n => document.getElementById(`panel-${n}`));
const dots       = [1, 2, 3].map(n => document.getElementById(`dot-${n}`));
const lines      = [1, 2].map(n => document.getElementById(`line-${n}`));

const stepTitle    = document.getElementById('step-title');
const stepSubtitle = document.getElementById('step-subtitle');
const signupFooter = document.getElementById('signup-footer');
const successState = document.getElementById('success-state');
const successDesc  = document.getElementById('success-desc');
const countdownEl  = document.getElementById('countdown');

const STEP_META = {
  1: { title: 'Personal Information',  subtitle: 'Tell us about yourself to get started' },
  2: { title: 'Security Credentials',  subtitle: 'Create a strong password for your account' },
  3: { title: 'Role & Department',     subtitle: 'Select your access level and team' },
};

/* ─── HELPERS ─────────────────────────────────────────────────── */
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

function setValid(el) { el.classList.remove('is-invalid'); el.classList.add('is-valid'); }
function setInvalid(el) { el.classList.remove('is-valid'); el.classList.add('is-invalid'); }
function clearState(el) { el.classList.remove('is-valid', 'is-invalid'); }

function showErr(id, show) {
  const el = document.getElementById(id);
  if (!el) return;
  show ? el.classList.add('show') : el.classList.remove('show');
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function validateField(input, condition, errId) {
  if (condition) { setValid(input); showErr(errId, false); return true; }
  else           { setInvalid(input); showErr(errId, true);  return false; }
}

/* ─── STEP NAVIGATION ─────────────────────────────────────────── */
function goToStep(step) {
  if (step < 1 || step > 3) return;

  // Panels
  panels.forEach((p, i) => {
    p.classList.remove('active');
    p.setAttribute('aria-hidden', 'true');
  });
  panels[step - 1].classList.add('active');
  panels[step - 1].removeAttribute('aria-hidden');

  // Dots
  dots.forEach((d, i) => {
    const s = i + 1;
    d.classList.remove('active', 'complete');
    d.removeAttribute('aria-current');
    if (s < step)       { d.classList.add('complete'); }
    else if (s === step) { d.classList.add('active'); d.setAttribute('aria-current', 'step'); }
  });

  // Lines
  lines.forEach((l, i) => {
    const lineNum = i + 1;
    l.classList.remove('complete', 'active');
    if (lineNum < step - 1)  l.classList.add('complete');
    else if (lineNum < step) l.classList.add('complete');
  });

  // Header
  stepTitle.textContent    = STEP_META[step].title;
  stepSubtitle.textContent = STEP_META[step].subtitle;

  currentStep = step;

  // Scroll to top of card on mobile
  document.getElementById('signup-card')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

/* ─── STEP 1 FIELDS ───────────────────────────────────────────── */
const firstName   = document.getElementById('first-name');
const lastName    = document.getElementById('last-name');
const signupEmail = document.getElementById('signup-email');

firstName.addEventListener('blur', () => validateField(firstName, firstName.value.trim().length >= 2, 'fn-err'));
firstName.addEventListener('input', () => {
  if (firstName.classList.contains('is-invalid') && firstName.value.trim().length >= 2) {
    setValid(firstName); showErr('fn-err', false);
  }
});

lastName.addEventListener('blur', () => validateField(lastName, lastName.value.trim().length >= 2, 'ln-err'));
lastName.addEventListener('input', () => {
  if (lastName.classList.contains('is-invalid') && lastName.value.trim().length >= 2) {
    setValid(lastName); showErr('ln-err', false);
  }
});

signupEmail.addEventListener('blur', () => validateField(signupEmail, isEmail(signupEmail.value), 'email2-err'));
signupEmail.addEventListener('input', () => {
  if (signupEmail.classList.contains('is-invalid') && isEmail(signupEmail.value)) {
    setValid(signupEmail); showErr('email2-err', false);
  }
});

function validateStep1() {
  let ok = true;
  ok = validateField(firstName,   firstName.value.trim().length >= 2, 'fn-err')      && ok;
  ok = validateField(lastName,    lastName.value.trim().length  >= 2, 'ln-err')      && ok;
  ok = validateField(signupEmail, isEmail(signupEmail.value),         'email2-err')  && ok;
  return ok;
}

document.getElementById('s1-next').addEventListener('click', () => {
  if (validateStep1()) goToStep(2);
});

/* ─── PASSWORD STRENGTH ───────────────────────────────────────── */
const newPw      = document.getElementById('new-pw');
const confirmPw  = document.getElementById('confirm-pw');
const segs       = [1,2,3,4].map(n => document.getElementById(`seg${n}`));
const strengthLbl = document.getElementById('strength-lbl');

const S_CLASSES = ['s-weak', 's-fair', 's-good', 's-strong'];
const S_LABELS  = ['Weak', 'Fair', 'Good', 'Strong'];
const S_LCLS    = ['lbl-weak', 'lbl-fair', 'lbl-good', 'lbl-strong'];

function getStrength(pw) {
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  return s;
}

function updateRequirements(pw) {
  const rules = {
    'req-len':     pw.length >= 8,
    'req-upper':   /[A-Z]/.test(pw),
    'req-num':     /[0-9]/.test(pw),
    'req-special': /[^A-Za-z0-9]/.test(pw),
  };
  Object.entries(rules).forEach(([id, met]) => {
    const el = document.getElementById(id);
    if (!el) return;
    met ? el.classList.add('met') : el.classList.remove('met');
  });
}

newPw.addEventListener('input', () => {
  const pw  = newPw.value;
  const str = getStrength(pw);

  // Update segments
  segs.forEach((seg, i) => {
    seg.className = 'strength-seg';
    if (i < str) seg.classList.add(S_CLASSES[str - 1]);
  });

  // Update label
  if (!pw) {
    strengthLbl.textContent = '';
    strengthLbl.className   = 'strength-label';
  } else {
    const idx = Math.max(0, str - 1);
    strengthLbl.textContent = S_LABELS[idx];
    strengthLbl.className   = `strength-label ${S_LCLS[idx]}`;
  }

  updateRequirements(pw);

  // Live confirm check
  if (confirmPw.value) {
    validateField(confirmPw, confirmPw.value === pw, 'conf-pw-err');
  }

  if (pw.length >= 8 && newPw.classList.contains('is-invalid')) {
    setValid(newPw); showErr('new-pw-err', false);
  }
});

confirmPw.addEventListener('input', () => {
  if (confirmPw.value) validateField(confirmPw, confirmPw.value === newPw.value, 'conf-pw-err');
});
confirmPw.addEventListener('blur', () => {
  if (confirmPw.value) validateField(confirmPw, confirmPw.value === newPw.value, 'conf-pw-err');
});

/* ─── PASSWORD TOGGLES ────────────────────────────────────────── */
function setupToggle(btnId, inputId, showId, hideId) {
  const btn   = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  const eShow = document.getElementById(showId);
  const eHide = document.getElementById(hideId);
  btn?.addEventListener('click', () => {
    const showing = input.type === 'password';
    input.type         = showing ? 'text' : 'password';
    eShow.style.display = showing ? 'none'  : 'block';
    eHide.style.display = showing ? 'block' : 'none';
    btn.setAttribute('aria-pressed', String(showing));
  });
}

setupToggle('toggle-new-pw',  'new-pw',     'eye-show-new',  'eye-hide-new');
setupToggle('toggle-conf-pw', 'confirm-pw', 'eye-show-conf', 'eye-hide-conf');

/* ─── STEP 2 VALIDATION ───────────────────────────────────────── */
function validateStep2() {
  let ok = true;
  ok = validateField(newPw,     newPw.value.length >= 8,              'new-pw-err')   && ok;
  ok = validateField(confirmPw, confirmPw.value === newPw.value && confirmPw.value.length > 0, 'conf-pw-err') && ok;
  return ok;
}

document.getElementById('s2-prev').addEventListener('click', () => goToStep(1));
document.getElementById('s2-next').addEventListener('click', () => {
  if (validateStep2()) goToStep(3);
});

/* ─── ROLE CARDS ──────────────────────────────────────────────── */
const roleInput = document.getElementById('selected-role');
const roleCards = document.querySelectorAll('.role-card');

roleCards.forEach(card => {
  card.addEventListener('click', () => selectRole(card));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectRole(card); }
  });
});

function selectRole(card) {
  roleCards.forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-checked', 'false'); });
  card.classList.add('selected');
  card.setAttribute('aria-checked', 'true');
  roleInput.value = card.dataset.role;
}

/* ─── STEP 3 VALIDATION ───────────────────────────────────────── */
const empId   = document.getElementById('emp-id');
const termsCb = document.getElementById('terms');

empId.addEventListener('blur', () => validateField(empId, empId.value.trim().length >= 3, 'emp-err'));
empId.addEventListener('input', () => {
  if (empId.classList.contains('is-invalid') && empId.value.trim().length >= 3) {
    setValid(empId); showErr('emp-err', false);
  }
});
termsCb.addEventListener('change', () => {
  if (termsCb.checked) showErr('terms-err', false);
});

function validateStep3() {
  let ok = true;
  ok = validateField(empId, empId.value.trim().length >= 3, 'emp-err') && ok;
  if (!termsCb.checked) { showErr('terms-err', true); ok = false; }
  else                  { showErr('terms-err', false); }
  return ok;
}

document.getElementById('s3-prev').addEventListener('click', () => goToStep(2));

/* ─── FORM SUBMIT ─────────────────────────────────────────────── */
document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateStep3()) return;

  const spinner    = document.getElementById('submit-spinner');
  const submitText = document.getElementById('submit-text');
  const submitIcon = document.getElementById('submit-icon');
  const submitBtn  = document.getElementById('submit-btn');

  submitBtn.disabled   = true;
  spinner.style.display = 'inline-block';
  submitText.textContent = 'Creating…';
  if (submitIcon) submitIcon.style.display = 'none';

  const formData = {
    firstName:  firstName.value.trim(),
    lastName:   lastName.value.trim(),
    email:      signupEmail.value.trim(),
    phone:      document.getElementById('phone')?.value?.trim() || '',
    role:       roleInput.value,
    department: deptSelect.value,
    employeeId: empId.value.trim(),
    createdAt:  new Date().toISOString(),
  };

  await delay(1500);

  // Persist to localStorage (demo)
  try {
    const list = JSON.parse(localStorage.getItem('mems_pending_users') || '[]');
    list.push(formData);
    localStorage.setItem('mems_pending_users', JSON.stringify(list));
  } catch {}

  // Show success
  document.getElementById('signup-form').style.display = 'none';
  if (signupFooter) signupFooter.style.display = 'none';
  successState.classList.add('show');

  const roleNames = {
    admin:       'Admin',
    supervisor:  'Technical Supervisor',
    technician:  'Technician',
    storekeeper: 'Storekeeper',
  };

  if (successDesc) {
    successDesc.textContent =
      `Welcome, ${formData.firstName}! Your ${roleNames[formData.role] || formData.role} account request has been submitted for approval.`;
  }

  // Countdown
  let count = 5;
  const timer = setInterval(() => {
    count--;
    if (countdownEl) countdownEl.textContent = count;
    if (count <= 0) {
      clearInterval(timer);
      window.location.href = 'index.html';
    }
  }, 1000);
});

/* ─── CHECKBOX KEYBOARD ───────────────────────────────────────── */
document.querySelectorAll('.checkbox-custom').forEach(el => {
  const cb = el.previousElementSibling;
  el.setAttribute('tabindex', '0');
  el.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); }
    }
  });
});

/* ─── INIT ────────────────────────────────────────────────────── */
goToStep(1);
