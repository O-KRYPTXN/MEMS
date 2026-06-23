
document.getElementById('topbar-date').textContent = new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});

function applyPoState(tr, state) {
  const badge = tr.querySelector('.badge');
  const actionTd = tr.querySelector('td:last-child');
  if (!badge) return;
  badge.className = 'badge';
  
  const isAr = localStorage.getItem('lang') === 'ar';
  
  if (state === 'received') {
    badge.classList.add('badge-fulfilled'); // Green color
    badge.textContent = isAr ? 'تم الاستلام' : 'Received';
    actionTd.innerHTML = '';
  } else {
    // Keep original
  }
}

  function receive(id) {
    const el = document.querySelector('[data-po-id="' + id + '"]');
    
    if(el) {
      localStorage.setItem('po-status-' + id, 'received');
      applyPoState(el, 'received');
      // Update inventory in localStorage
      const itemsCell = el.querySelectorAll('td')[2];
      if (itemsCell) {
        const cellText = itemsCell.textContent;
        const qtyMatch = cellText.match(/\((\d+)\)/);
        const poQty = qtyMatch ? parseInt(qtyMatch[1]) : 0;
        const namePart = cellText.replace(/\s*\(\d+\)\s*$/, '').trim();
        
        const devs = JSON.parse(localStorage.getItem('mems_devices_v2') || '[]');
        const templateDevice = devs.find(d => d.name.toLowerCase() === namePart.toLowerCase());
        
        if (templateDevice && poQty > 0) {
          // This is a hospital device! Create real instances in the central database.
          for (let i = 0; i < poQty; i++) {
            const newId = 'DEV-' + Math.floor(Math.random() * 9000 + 1000);
            devs.push({
              id: newId,
              name: templateDevice.name,
              category: templateDevice.category || 'Other',
              type: templateDevice.type || 'Other',
              dept: 'Storage', // Newly received devices go to Storage
              status: 'operational',
              serial: 'SN-' + Date.now().toString().slice(-6) + i,
              lastPm: new Date().toISOString().split('T')[0],
              nextPm: ''
            });
          }
          localStorage.setItem('mems_devices_v2', JSON.stringify(devs));
        } else {
          // It's a regular spare part, update the basic inventory qty
          const inventory = JSON.parse(localStorage.getItem('mems_inventory') || '[]');
          const invItem = inventory.find(item => item.itemName && item.itemName.toLowerCase() === namePart.toLowerCase());
          if (invItem && poQty > 0) {
            invItem.qty = (parseInt(invItem.qty) || 0) + poQty;
            localStorage.setItem('mems_inventory', JSON.stringify(inventory));
          }
        }
      }
      filterPoTable();
    }
    const isAr = localStorage.getItem('lang') === 'ar';
    showToast(isAr ? 'تم استلام ' + id + '. تم تحديث المخزون.' : '✓ ' + id + ' received. Inventory stock incremented.');
  }

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

document.addEventListener('DOMContentLoaded', () => {

  // Inject custom orders
  const customOrders = JSON.parse(localStorage.getItem('customOrders') || '[]');
  const tbody = document.getElementById('po-tbody');
  
  const isAr = localStorage.getItem('lang') === 'ar';
  
  window.simulateReply = function(id, outcome) {
    const currentOrders = JSON.parse(localStorage.getItem('customOrders') || '[]');
    const orderIndex = currentOrders.findIndex(o => o.id === id);
    if (orderIndex > -1) {
      if (outcome === 'not_exists') {
        // Archive to rejected orders instead of deleting
        const rejectedOrder = {...currentOrders[orderIndex], status: 'rejected', rejectedAt: new Date().toISOString()};
        const rejectedList = JSON.parse(localStorage.getItem('mems_rejected_orders') || '[]');
        rejectedList.unshift(rejectedOrder);
        localStorage.setItem('mems_rejected_orders', JSON.stringify(rejectedList));
        
        currentOrders.splice(orderIndex, 1);
        localStorage.setItem('customOrders', JSON.stringify(currentOrders));
        
        const tr = document.getElementById(id.toLowerCase());
        if (tr) {
          tr.style.opacity = '0';
          setTimeout(() => {
            tr.remove();
            filterPoTable();
          }, 300);
        }
        
        showToast(isAr ? '❌ رد الشركة: العنصر غير متوفر. تم إلغاء الطلب.' : '❌ Company Reply: Item not exists. Order cancelled.');
        const t = document.getElementById('toast');
        t.style.background = '#EF4444'; 
        setTimeout(() => t.style.background = '#8B5CF6', 4000);
      } else {
        currentOrders[orderIndex].status = 'shipped';
        localStorage.setItem('customOrders', JSON.stringify(currentOrders));
        
        const tr = document.getElementById(id.toLowerCase());
        if (tr) {
          const updatedBadge = tr.querySelector('.badge');
          if (updatedBadge) {
            updatedBadge.className = 'badge badge-shipped';
            updatedBadge.removeAttribute('style');
            updatedBadge.textContent = isAr ? 'تم الشحن' : 'Shipped';
          }
          
          const actionTd = tr.querySelector('td:last-child');
          if (actionTd) {
            actionTd.innerHTML = '';
          }
        }
        showToast(isAr ? '📧 تم استلام الرد من الشركة! تم تحديث الحالة.' : '📧 Reply received from company! Status updated.');
        const t = document.getElementById('toast');
        t.style.background = '#10B981'; 
        setTimeout(() => t.style.background = '#8B5CF6', 4000);
      }
    }
  };
  
  customOrders.forEach((order, index) => {
    const tr = document.createElement('tr');
    tr.id = order.id.toLowerCase();
    tr.setAttribute('data-po-id', order.id);
    
    const isPending = order.status === 'pending' || !order.status;
    const statusText = isPending ? (isAr ? 'في انتظار الرد' : 'Pending Response') : (isAr ? 'تم الشحن' : 'Shipped');
    const badgeClass = isPending ? 'style="background:rgba(100,116,139,0.12);color:#94A3B8;"' : 'class="badge-shipped"';
    
    const actionBtn = isPending 
      ? `<div style="display:flex; gap:6px;align-items:center;flex-wrap:wrap;">
           <button class="btn-action" style="color:#C4B5FD; border-color:rgba(139,92,246,0.35); display:inline-flex; align-items:center; gap:5px;" onclick="openEmailModal('${order.id}','${order.supplier}')">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
               <polyline points="22,6 12,13 2,6"/>
             </svg>
             ${isAr ? 'الرد' : 'Response'}
           </button>
         </div>`
      : `<button class="btn-action" onclick="receive('${order.id}')">${isAr ? 'تحديد كمستلم' : 'Mark Received'}</button>`;
    
    tr.innerHTML = `
      <td class="td-primary">${order.id}</td>
      <td>${order.supplier}</td>
      <td>${order.item} (${order.qty})</td>
      <td>${order.date}</td>
      <td><span class="badge" ${badgeClass}>${statusText}</span></td>
      <td>${actionBtn}</td>
    `;
    tbody.insertBefore(tr, tbody.firstChild);
  });


  const allRows = document.querySelectorAll('tr[data-po-id]');
  allRows.forEach(tr => {
    const id = tr.getAttribute('data-po-id');
    const saved = localStorage.getItem('po-status-' + id);
    if(saved) {
      applyPoState(tr, saved);
    }
  });

  const tabs = document.querySelectorAll('.tab-btn');
  
  window.filterPoTable = function() {
    let activeIdx = 0;
    tabs.forEach((t, i) => { if(t.classList.contains('active')) activeIdx = i; });
    
    let activeCount = 0;
    Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
      const badge = tr.querySelector('.badge');
      if (!badge) return;
      let show = false;
      
      const isReceived = badge.classList.contains('badge-fulfilled');
      
      if (activeIdx === 0 && !isReceived) { show = true; activeCount++; }
      if (activeIdx === 1 && isReceived) show = true;
      
      tr.style.display = show ? '' : 'none';
    });
    
    if (activeIdx === 0) {
      const isAr = localStorage.getItem('lang') === 'ar';
      tabs[0].textContent = isAr ? 'الطلبات النشطة (' + activeCount + ')' : 'Active Orders (' + activeCount + ')';
    }
  };

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      filterPoTable();
    });
  });
  
  filterPoTable();
});

if(window.MEMSSession)window.MEMSSession.requireAuth(['storekeeper']);

(function() {
  var _po = null, _supplier = null, _outcome = null;

  var OC_COLORS = {
    Accepted: {bg:'rgba(74,222,128,.13)',color:'#4ADE80',border:'rgba(74,222,128,.3)'},
    Partial:  {bg:'rgba(252,211,77,.13)',color:'#FCD34D',border:'rgba(252,211,77,.3)'},
    Rejected: {bg:'rgba(248,113,113,.13)',color:'#F87171',border:'rgba(248,113,113,.3)'},
    Awaiting: {bg:'rgba(148,163,184,.13)',color:'#94A3B8',border:'rgba(148,163,184,.3)'},
  };

  window.openEmailModal = function(poId, supplier) {
    _po = poId; _supplier = supplier; _outcome = null;

    document.getElementById('em-po-id').textContent = poId;
    document.getElementById('em-supplier').textContent = supplier || '';

    var now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('em-date').value = now.toISOString().slice(0,16);
    document.getElementById('em-name').value = '';
    document.getElementById('em-email').value = '';
    document.getElementById('em-subject').value = 'Re: ' + poId + ' — Order Response';
    document.getElementById('em-body').value = '';
    document.getElementById('em-att').value = '';
    document.querySelectorAll('.em-oc').forEach(function(b){ b.className='em-oc'; });

    renderHistory(poId);
    document.getElementById('emailModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.getElementById('em-name').focus();
  };

  window.closeEmailModal = function() {
    document.getElementById('emailModal').style.display = 'none';
    document.body.style.overflow = '';
  };

  window.pickOutcome = function(btn) {
    document.querySelectorAll('.em-oc').forEach(function(b){ b.className='em-oc'; });
    btn.className = 'em-oc ' + btn.dataset.sel;
    _outcome = btn.dataset.oc;
  };

  window.saveEmailLog = function() {
    var name  = document.getElementById('em-name').value.trim();
    var email = document.getElementById('em-email').value.trim();
    var date  = document.getElementById('em-date').value;
    var subj  = document.getElementById('em-subject').value.trim();
    var body  = document.getElementById('em-body').value.trim();
    var att   = document.getElementById('em-att').value.trim();

    if (!name) { document.getElementById('em-name').focus(); showToast('Please enter the sender name'); return; }
    if (!body) { document.getElementById('em-body').focus(); showToast('Please enter the email content'); return; }
    if (!_outcome) { showToast('Please select a response outcome'); return; }

    var sess = {};
    try { sess = JSON.parse(sessionStorage.getItem('mems_session') || localStorage.getItem('mems_session') || '{}'); } catch(e){}

    var entry = {
      poId: _po, supplier: _supplier,
      senderName: name, senderEmail: email,
      date: date || new Date().toISOString(),
      subject: subj, body: body, attachments: att,
      outcome: _outcome,
      loggedAt: new Date().toISOString(),
      loggedBy: sess.email || 'Storekeeper'
    };

    var all = [];
    try { all = JSON.parse(localStorage.getItem('po_email_log') || '[]'); } catch(e){}
    all.unshift(entry);
    localStorage.setItem('po_email_log', JSON.stringify(all));

    renderHistory(_po);

    // Reset form for another entry
    document.getElementById('em-name').value = '';
    document.getElementById('em-email').value = '';
    document.getElementById('em-body').value = '';
    document.getElementById('em-att').value = '';
    document.querySelectorAll('.em-oc').forEach(function(b){ b.className='em-oc'; });
    _outcome = null;

    showToast('Response email logged for ' + _po);

    // Auto-update order status based on outcome
    if (entry.outcome === 'Accepted' && typeof simulateReply === 'function') {
      var tr = document.querySelector('[data-po-id="' + _po + '"]');
      if (tr) {
        var badge = tr.querySelector('.badge');
        if (badge && !badge.classList.contains('badge-shipped') && !badge.classList.contains('badge-fulfilled')) {
          simulateReply(_po, 'shipped');
        }
      }
    }
    if (entry.outcome === 'Rejected' && typeof simulateReply === 'function') {
      var tr = document.querySelector('[data-po-id="' + _po + '"]');
      if (tr) {
        var badge = tr.querySelector('.badge');
        if (badge && !badge.classList.contains('badge-fulfilled')) {
          simulateReply(_po, 'not_exists');
          closeEmailModal();
        }
      }
    }
  };

  function renderHistory(poId) {
    var all = [];
    try { all = JSON.parse(localStorage.getItem('po_email_log') || '[]'); } catch(e){}
    var entries = all.filter(function(e){ return e.poId === poId; });
    var el = document.getElementById('em-hist-list');

    if (!entries.length) {
      el.innerHTML = '<div class="em-no-hist">No responses logged yet for this order.</div>';
      return;
    }

    el.innerHTML = entries.map(function(e) {
      var oc = OC_COLORS[e.outcome] || OC_COLORS.Awaiting;
      var dt = '—';
      try { dt = new Date(e.date).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); } catch(err){}
      return '<div class="em-hist-item">'
        + '<div class="em-hist-meta">'
        + '<span class="em-hist-date">&#128197; ' + dt + '</span>'
        + '<span class="em-hist-from">&#9993; ' + e.senderName + (e.senderEmail ? ' &lt;' + e.senderEmail + '&gt;' : '') + '</span>'
        + '<span class="em-hist-oc" style="background:' + oc.bg + ';color:' + oc.color + ';border:1px solid ' + oc.border + ';">' + e.outcome + '</span>'
        + '</div>'
        + (e.subject ? '<div class="em-hist-subj">&ldquo;' + e.subject + '&rdquo;</div>' : '')
        + '<div class="em-hist-body">' + e.body.replace(/</g,'&lt;') + '</div>'
        + (e.attachments ? '<div class="em-hist-att">&#128206; ' + e.attachments + '</div>' : '')
        + '</div>';
    }).join('');
  }

  // Backdrop click closes modal
  document.getElementById('emailModal').addEventListener('click', function(e) {
    if (e.target === this) window.closeEmailModal();
  });
  // Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('emailModal').style.display !== 'none') window.closeEmailModal();
  });
})();

