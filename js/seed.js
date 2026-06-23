// Real-World Scenario Seeder v2
// Runs automatically on first load to populate the app with a complex, interconnected hospital state.

function seedRealWorldScenario() {
  if (localStorage.getItem('mems_scenario_v2') === 'true') {
    return; // Already seeded the V2 scenario
  }

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // 1. Devices (The Hospital's active equipment)
  const devices = [
    { id: 'DEV-0101', name: 'ICU Ventilator V-12', dept: 'ICU', status: 'Operational', lastPM: '2026-02-10', nextPM: '2026-08-10', category: 'Respiratory', type: 'Ventilator' },
    { id: 'DEV-0102', name: 'Patient Monitor PM-01', dept: 'ICU', status: 'Operational', lastPM: '2025-12-15', nextPM: today, category: 'Monitoring', type: 'Monitor' }, // PM Due Today!
    { id: 'DEV-0103', name: 'Defibrillator AED-7', dept: 'ER', status: 'Faulty', lastPM: '2026-01-20', nextPM: '2026-07-20', category: 'Resuscitation', type: 'Defibrillator' }, // Broken
    { id: 'DEV-0104', name: 'Infusion Pump IP-22', dept: 'ICU', status: 'Operational', lastPM: '2026-04-05', nextPM: '2026-10-05', category: 'Pumps', type: 'Pump' },
    { id: 'DEV-0105', name: 'ECG Machine 3000', dept: 'Cardiology', status: 'Faulty', lastPM: '2026-03-01', nextPM: '2026-09-01', category: 'Cardiology', type: 'ECG' }, // Broken
    { id: 'DEV-0106', name: 'Defibrillator AED-7', dept: 'Surgery', status: 'Operational', lastPM: '2026-02-20', nextPM: '2026-08-20', category: 'Resuscitation', type: 'Defibrillator' },
    { id: 'DEV-0107', name: 'ICU Ventilator V-12', dept: 'ICU', status: 'Operational', lastPM: '2026-02-15', nextPM: '2026-08-15', category: 'Respiratory', type: 'Ventilator' }
  ];
  localStorage.setItem('mems_devices_v2', JSON.stringify(devices));

  // 2. Department Requests (Nurses reporting faults)
  const deptReqs = [
    { id: "WO-9001", device: "Defibrillator AED-7", desc: "Device won't hold charge. Battery dead.", status: "Pending", date: today }
  ];
  localStorage.setItem('mems_dept_requests', JSON.stringify(deptReqs));

  // 3. Work Orders (Supervisor & Technician)
  const wos = [
    { id: "WO-9001", title: "Defibrillator Power Failure", device: "Defibrillator AED-7", priority: "Critical", status: "Unassigned", assignee: "Unassigned", date: today, dept: "ER" },
    { id: "WO-9002", title: "Monthly Preventive Maintenance", device: "Patient Monitor PM-01", priority: "Medium", status: "Unassigned", assignee: "Unassigned", date: today, dept: "ICU" },
    { id: "WO-9003", title: "ECG Sensor Replacement", device: "ECG Machine 3000", priority: "High", status: "In Progress", assignee: "tech@hospital.org", date: yesterday, dept: "Cardiology" }
  ];
  localStorage.setItem('mems_supervisor_wos', JSON.stringify(wos));

  // 4. Store Inventory (Specific Stock Levels for Testing)
  const inventory = [
    { id: "PRT-001", itemName: "O2 Sensor Pro", category: "Sensors", qty: 50, min: 10, unitCost: 150 }, // Healthy Stock
    { id: "PRT-002", itemName: "ECG Leads", category: "Cables", qty: 3, min: 5, unitCost: 45 }, // Low Stock (Warning)
    { id: "PRT-003", itemName: "Defibrillator Battery", category: "Power", qty: 0, min: 2, unitCost: 300 } // Out of Stock (Error)
  ];
  localStorage.setItem('mems_inventory', JSON.stringify(inventory));

  // 5. Store Requests (Techs ordering parts for their active WOs)
  const storeReqs = [
    { id: "REQ-7001", partName: "ECG Leads", qty: 3, requester: "tech@hospital.org", wo: "WO-9003", status: "pending_storekeeper", date: today }, // Triggers Low Stock
    { id: "REQ-7002", partName: "Defibrillator Battery", qty: 1, requester: "tech@hospital.org", wo: "WO-9001", status: "pending_storekeeper", date: today } // Triggers Out of Stock
  ];
  localStorage.setItem('deviceRequests', JSON.stringify(storeReqs));

  // 6. Purchase Orders
  const customOrders = [
    { id: "PO-5001", supplier: "Global Medical Parts", item: "ICU Ventilator V-12", qty: 2, date: today, status: "pending" }, // Pending Device Order
    { id: "PO-5002", supplier: "MedTech Supply Co.", item: "Defibrillator Battery", qty: 5, date: today, status: "pending" } // Pending Part Order
  ];
  localStorage.setItem('customOrders', JSON.stringify(customOrders));

  // Mark scenario as fully seeded
  localStorage.setItem('mems_scenario_v2', 'true');
  console.log("Real-World Scenario V2 Successfully Seeded!");
}

// Execute immediately
seedRealWorldScenario();
