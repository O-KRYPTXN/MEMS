
'use strict';

/* -- Utility -------------------------------------------------- */
const fmt = n => '$' + Number(n).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

/* -- Date & Session ------------------------------------------- */
const _invSession = JSON.parse(sessionStorage.getItem('mems_session') || localStorage.getItem('mems_session') || '{}');
const _isStorekeeper = _invSession.role === 'storekeeper';

(function initDateAndSession() {
  const dateEl = document.getElementById('topbar-date');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (_invSession.email) {
    const nameEl = document.getElementById('sb-name');
    const avatarEl = document.getElementById('sb-avatar');
    if (nameEl) nameEl.textContent = _invSession.email.split('@')[0];
    if (avatarEl) avatarEl.textContent = (_invSession.email.charAt(0) || 'A').toUpperCase() + 'D';
  }
  if (_isStorekeeper) {
    const addBtn = document.getElementById('openModalBtn');
    if (addBtn) addBtn.style.display = '';
  }
})();

/* -- Inventory Data ------------------------------------------- */
// Load live inventory from storekeeper's localStorage
function loadLiveInventory() {
  const stored = JSON.parse(localStorage.getItem('mems_inventory') || '[]');
  if (stored.length > 0) {
    return stored.map((item, i) => ({
      code: item.id || ('INV-' + String(i+1).padStart(4,'0')),
      name: item.itemName || item.name || 'Unknown',
      category: item.category || 'General',
      unit: item.unit || 'pcs',
      qty: parseInt(item.qty) || 0,
      min: parseInt(item.min) || 1,
      location: item.location || 'Storeroom',
      price: parseFloat(item.price) || 0,
      recent: false
    }));
  }
  return FALLBACK_INVENTORY;
}

const FALLBACK_INVENTORY = [
  { code:'INV-0001', name:'O2 Sensor � Nellcor Compatible',         category:'Cables & Sensors',       unit:'pcs',  qty:0,   min:10, location:'ICU Pharmacy',  price:48.00,  recent:false },
  { code:'INV-0002', name:'ECG Patient Cable � 5-Lead AHA',          category:'Cables & Sensors',       unit:'pcs',  qty:3,   min:15, location:'Storeroom',   price:85.00,  recent:false },
  { code:'INV-0003', name:'IV Pump Inline Filter 0.2 �m',            category:'Filters & Consumables',  unit:'box',  qty:22,  min:20, location:'Storeroom',   price:32.50,  recent:true  },
  { code:'INV-0004', name:'Defibrillator Pads � Adult Multifunction', category:'Spare Parts',            unit:'pair', qty:1,   min:12, location:'ER Supplies',   price:120.00, recent:false },
  { code:'INV-0005', name:'Ventilator Breathing Circuit',            category:'Filters & Consumables',  unit:'set',  qty:0,   min:8,  location:'ICU Pharmacy',  price:210.00, recent:false },
  { code:'INV-0006', name:'HEPA Filter � Ventilator Grade',          category:'Filters & Consumables',  unit:'pcs',  qty:5,   min:10, location:'Storeroom',   price:75.00,  recent:true  },
  { code:'INV-0007', name:'Battery Pack 12V � Infusion Pump',        category:'Batteries & Power',      unit:'pcs',  qty:18,  min:10, location:'Storeroom',   price:95.00,  recent:true  },
  { code:'INV-0008', name:'Syringe Pump Drive Mechanism',            category:'Spare Parts',            unit:'pcs',  qty:4,   min:6,  location:'Storeroom',   price:340.00, recent:false },
  { code:'INV-0009', name:'BP Cuff � Adult Large (Reusable)',        category:'Cables & Sensors',       unit:'pcs',  qty:30,  min:12, location:'ER Supplies',   price:28.00,  recent:true  },
  { code:'INV-0010', name:'SpO2 Probe � Neonatal Wrap',              category:'Cables & Sensors',       unit:'pcs',  qty:2,   min:10, location:'ICU Pharmacy',  price:55.00,  recent:false },
  { code:'INV-0011', name:'Suction Catheter Fr14 Sterile',           category:'PPE & Supplies',         unit:'box',  qty:40,  min:20, location:'ER Supplies',   price:18.50,  recent:true  },
  { code:'INV-0012', name:'Laryngoscope Blade Mac 3',                category:'Spare Parts',            unit:'pcs',  qty:6,   min:8,  location:'Storeroom',   price:62.00,  recent:true  },
  { code:'INV-0013', name:'Infusion Set Micro-Drip 60 drops/mL',    category:'PPE & Supplies',         unit:'box',  qty:55,  min:30, location:'Storeroom',   price:14.00,  recent:true  },
  { code:'INV-0014', name:'Pressure Transducer � Invasive BP',       category:'Spare Parts',            unit:'pcs',  qty:0,   min:5,  location:'ICU Pharmacy',  price:185.00, recent:false },
  { code:'INV-0015', name:'CO2 Absorbent Granules � 1kg',            category:'Filters & Consumables',  unit:'kg',   qty:8,   min:6,  location:'Storeroom',   price:42.00,  recent:true  },
];

const INVENTORY = loadLiveInventory();

/* -- Derive stock status --------------------------------------- */
function getStatus(item) {
  if (item.qty === 0) return 'critical';
  if (item.qty <= item.min) return 'warning';
  return 'ok';
}
function getQtyClass(item) {
  if (item.qty === 0) return 'qty-critical';
  if (item.qty <= Math.ceil(item.min * 0.3)) return 'qty-critical';
  if (item.qty <= item.min) return 'qty-warning';
  return 'qty-ok';
}

/* -- Pagination State ------------------------------------------ */
const ROWS_PER_PAGE = 10;
let currentPage = 1;
let activeTab = 'all';

/* -- Render rows ----------------------------------------------- */
function buildRow(item) {
  const status    = getStatus(item);
  const qtyClass  = getQtyClass(item);
  const totalVal  = item.qty * item.price;

  const badgeMap = {
    critical: ['badge-critical',      'Out of Stock'],
    warning:  ['badge-warning-stock', 'Low Stock'],
    ok:       ['badge-ok',            'In Stock'],
  };
  const [badgeClass, badgeLabel] = badgeMap[status];

  const eyeIcon  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const editIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

  return `
    <tr data-status="${status}" data-recent="${item.recent}" data-category="${item.category}" data-location="${item.location}"
        data-code="${item.code.toLowerCase()}" data-name="${item.name.toLowerCase()}">
      <td><span class="td-mono part-code">${item.code}</span></td>
      <td><span class="td-primary part-name">${item.name}</span></td>
      <td>${item.category}</td>
      <td>${item.unit}</td>
      <td><span class="${qtyClass}">${item.qty}</span></td>
      <td>${item.min}</td>
      <td>${item.location}</td>
      <td>${fmt(item.price)}</td>
      <td>${fmt(totalVal)}</td>
      <td><span class="badge ${badgeClass}" role="status">${badgeLabel}</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon" aria-label="View ${item.name}" title="View" onclick="openViewModal('${item.code}')">${eyeIcon}</button>
          ${_isStorekeeper ? "<button class='btn-icon' aria-label='Edit ${item.name}' title='Edit'>${editIcon}</button>" : ''}
        </div>
      </td>
    </tr>`;
}

/* -- Apply Filters + Render ------------------------------------ */
function applyFilters() {
  const query    = document.getElementById('toolbarSearch').value.toLowerCase().trim();
  const category = document.getElementById('filterCategory').value;
  const status   = document.getElementById('filterStatus').value;
  const location = document.getElementById('filterLocation').value;

  const filtered = INVENTORY.filter(item => {
    const s = getStatus(item);
    let tabMatch = true;
    if (activeTab === 'warning')  tabMatch = s === 'warning';
    if (activeTab === 'critical') tabMatch = s === 'critical';
    if (activeTab === 'recent')   tabMatch = item.recent === true;

    const catMatch  = !category || item.category === category;
    const statMatch = !status   || s === status;
    const locMatch  = !location || item.location === location;
    const qMatch    = !query    ||
      item.code.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query);

    return tabMatch && catMatch && statMatch && locMatch && qMatch;
  });

  // Update tab counts
  document.getElementById('tab-count-all').textContent      = INVENTORY.length;
  document.getElementById('tab-count-warning').textContent  = INVENTORY.filter(i => getStatus(i) === 'warning').length;
  document.getElementById('tab-count-critical').textContent = INVENTORY.filter(i => getStatus(i) === 'critical').length;
  document.getElementById('tab-count-recent').textContent   = INVENTORY.filter(i => i.recent).length;

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * ROWS_PER_PAGE;
  const end   = Math.min(start + ROWS_PER_PAGE, filtered.length);
  const slice = filtered.slice(start, end);

  const tbody     = document.getElementById('inventoryBody');
  const emptyState = document.getElementById('emptyState');

  if (!filtered.length) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    document.getElementById('paginationInfo').textContent = 'No items to display';
    renderPagination(0);
  } else {
    tbody.innerHTML = slice.map(buildRow).join('');
    emptyState.style.display = 'none';
    document.getElementById('paginationInfo').textContent = `Showing ${start + 1}�${end} of ${filtered.length} items`;
    renderPagination(totalPages);
  }
}

/* -- Pagination Buttons ---------------------------------------- */
function renderPagination(totalPages) {
  const container = document.getElementById('paginationBtns');
  if (!container) return;
  container.innerHTML = '';
  if (totalPages <= 0) return;

  const prevBtn = document.createElement('button');
  prevBtn.className = 'pg-btn';
  prevBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>`;
  prevBtn.setAttribute('aria-label', 'Previous page');
  if (currentPage <= 1) { prevBtn.disabled = true; prevBtn.style.opacity = '0.3'; }
  else prevBtn.addEventListener('click', () => { currentPage--; applyFilters(); });
  container.appendChild(prevBtn);

  let startPg = Math.max(1, currentPage - 2);
  let endPg   = Math.min(totalPages, startPg + 4);
  if (endPg - startPg < 4) startPg = Math.max(1, endPg - 4);

  for (let p = startPg; p <= endPg; p++) {
    const btn = document.createElement('button');
    btn.className = 'pg-btn' + (p === currentPage ? ' active' : '');
    btn.textContent = p;
    btn.setAttribute('aria-label', `Page ${p}`);
    if (p === currentPage) btn.setAttribute('aria-current', 'page');
    btn.addEventListener('click', () => { currentPage = p; applyFilters(); });
    container.appendChild(btn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'pg-btn';
  nextBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>`;
  nextBtn.setAttribute('aria-label', 'Next page');
  if (currentPage >= totalPages) { nextBtn.disabled = true; nextBtn.style.opacity = '0.3'; }
  else nextBtn.addEventListener('click', () => { currentPage++; applyFilters(); });
  container.appendChild(nextBtn);
}

/* -- Tabs ------------------------------------------------------ */
function syncInventoryStatusFilter(source, value) {
  if (source === 'tab') {
    activeTab = value;
    const fs = document.getElementById('filterStatus');
    if (fs) {
      if(value === 'recent' || value === 'all') fs.value = '';
      else fs.value = value;
    }
  } else if (source === 'dropdown') {
    activeTab = (value === '' || value === 'ok') ? 'all' : value;
  }
  
  document.querySelectorAll('.tab').forEach(b => {
    if (b.dataset.tab === activeTab) {
      b.classList.add('active');
      b.setAttribute('aria-selected', 'true');
    } else {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    }
  });
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    syncInventoryStatusFilter('tab', btn.dataset.tab);
    currentPage = 1;
    applyFilters();
  });
});

/* -- Search & Filter Events ------------------------------------ */
document.getElementById('toolbarSearch').addEventListener('input', () => { currentPage = 1; applyFilters(); });
document.getElementById('filterCategory').addEventListener('change', () => { currentPage = 1; applyFilters(); });
document.getElementById('filterLocation').addEventListener('change', () => { currentPage = 1; applyFilters(); });

document.getElementById('filterStatus').addEventListener('change', (e) => {
  syncInventoryStatusFilter('dropdown', e.target.value);
  currentPage = 1;
  applyFilters();
});

/* -- Modal ----------------------------------------------------- */
const overlay      = document.getElementById('addItemModal');
const openBtn      = document.getElementById('openModalBtn');
const closeBtn     = document.getElementById('closeModalBtn');
const cancelBtn    = document.getElementById('cancelModalBtn');
const addItemForm  = document.getElementById('addItemForm');

function openModal() {
  overlay.classList.add('open');
  overlay.removeAttribute('aria-hidden');
  document.getElementById('f_partCode').focus();
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  addItemForm.reset();
  openBtn.focus();
}

openBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
});

// Focus trap
overlay.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const focusable = Array.from(overlay.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  ));
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
  else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
});

addItemForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!addItemForm.checkValidity()) { addItemForm.reportValidity(); return; }
  closeModal();
});

/* -- Init ------------------------------------------------------ */
applyFilters();
