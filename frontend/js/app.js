// Authentication Check
const checkAuth = () => {
    const user = localStorage.getItem('iot_user');
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(user);
};

// Protect the page immediately
const currentUser = checkAuth();

// Global Error Handler for UI
window.onerror = function(message, source, lineno, colno, error) {
    console.error(message);
    const notification = document.createElement('div');
    notification.style = 'position:fixed;bottom:20px;right:20px;background:#f43f5e;color:white;padding:15px;border-radius:8px;z-index:9999;box-shadow:0 10px 15px rgba(0,0,0,0.3);font-size:0.9rem;';
    notification.innerHTML = `<i class="ph ph-warning-circle"></i> <b>System Error:</b> ${message}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 6000);
    return false;
};

// Global Logout Function
window.logout = () => {
    localStorage.removeItem('iot_user');
    window.location.href = 'login.html';
};

// Helper to format date
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// Render User Header
const renderHeader = () => {
    const nameEl = document.getElementById('header-user-name');
    const roleEl = document.getElementById('header-user-role');
    const avatarEl = document.getElementById('header-user-avatar');
    
    if (currentUser) {
        const userName = currentUser.name || currentUser.Name || 'User';
        const userRole = currentUser.role || currentUser.Role || 'Staff';
        
        if (nameEl) nameEl.textContent = userName;
        if (roleEl) roleEl.textContent = userRole;
        if (avatarEl) avatarEl.textContent = userName.charAt(0).toUpperCase();
    }
};

// Show/Hide Spinner Helper
const showSpinner = (containerId) => {
    const el = document.getElementById(containerId);
    if (el) {
        // Use a tr/td if the container is a tbody
        if (el.tagName.toLowerCase() === 'tbody') {
            el.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align:center; padding: 3rem;">
                        <div class="spinner-container" style="padding: 0;">
                            <div class="spinner"></div>
                            <p>Loading data...</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            el.innerHTML = `
                <div class="spinner-container">
                    <div class="spinner"></div>
                    <p>Loading data...</p>
                </div>
            `;
        }
    }
};

// Render Dashboard Data
const renderDashboard = async () => {
    const totalSensorsEl = document.getElementById('total-sensors');
    const avgReadingEl = document.getElementById('avg-reading');
    const abnormalReadingsEl = document.getElementById('abnormal-readings');
    const recentTableBody = document.getElementById('recent-table-body');

    if (!totalSensorsEl) return; // Not on dashboard page
    
    if (recentTableBody) showSpinner('recent-table-body');

    const [sensors, data, activeAlerts] = await Promise.all([
        api.getSensors(),
        api.getSensorData(),
        api.getActiveAlerts()
    ]);

    // Total Sensors
    totalSensorsEl.textContent = sensors.length;

    // Abnormal Readings (Now Active Alerts)
    abnormalReadingsEl.textContent = activeAlerts.length;
    if (activeAlerts.length > 0) {
        abnormalReadingsEl.classList.add('status-abnormal');
    }

    // Calculate Average Reading
    if (data.length > 0) {
        const sum = data.reduce((acc, curr) => acc + parseFloat(curr.Reading_Value), 0);
        const avg = (sum / data.length).toFixed(1);
        avgReadingEl.textContent = avg;
    } else {
        avgReadingEl.textContent = '0';
    }

    // Render 5 most recent readings
    const recentData = data.slice(0, 5);
    recentTableBody.innerHTML = '';
    
    if (recentData.length === 0) {
        recentTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No recent data available</td></tr>';
        return;
    }

    recentData.forEach((item, index) => {
        const tr = document.createElement('tr');
        // Add staggered animation
        tr.className = 'animate-slide-up';
        tr.style.animationDelay = `${index * 0.1}s`;
        
        const val = parseFloat(item.Reading_Value);
        let valueClass = 'status-normal';
        if (item.Type_Name === 'Temperature') {
            if (val > 45) valueClass = 'status-abnormal';
            else if (val > 35) valueClass = 'status-warning';
        } else if (item.Type_Name === 'Humidity') {
            if (val > 70) valueClass = 'status-abnormal';
            else if (val > 55) valueClass = 'status-warning';
        } else {
            if (val > 80) valueClass = 'status-abnormal';
            else if (val > 50) valueClass = 'status-warning';
        }

        tr.innerHTML = `
            <td>${item.Sensor_ID}</td>
            <td><span class="badge badge-info">${item.Type_Name}</span></td>
            <td>Room ${item.Room_Number} <span style="color:var(--text-muted);font-size:0.8rem">(${item.Building})</span></td>
            <td class="${valueClass}" id="val-${item.Sensor_ID}">${item.Reading_Value} ${item.Unit}</td>
            <td id="time-${item.Sensor_ID}">${formatDate(item.Reading_Time)}</td>
        `;
        recentTableBody.appendChild(tr);
    });

    // Render Chart.js Analytics
    await renderAnalyticsChart();

    // Initialize WebSockets
    initWebSockets();
};

let analyticsChart = null;

const renderAnalyticsChart = async () => {
    const canvas = document.getElementById('analyticsChart');
    if (!canvas) return;

    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Test Fill - Should make the chart area slightly purple if drawing works
    ctx.fillStyle = 'rgba(168, 85, 247, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const history = await api.getTelemetryHistory();
    
    if (!history || history.length === 0) {
        console.warn('No historical data found for chart');
        ctx.font = '14px Inter';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('No historical data available yet. Waiting for telemetry...', canvas.width / 2, canvas.height / 2);
        return;
    }

    console.log(`Rendering chart with ${history.length} data points`);

    const labels = [];
    const tempDataset = [];
    const humDataset = [];

    history.forEach(item => {
        // Manual time formatting for maximum compatibility
        const date = new Date(item.reading_time);
        const hours = String(date.getHours()).padStart(2, '0');
        const mins = String(date.getMinutes()).padStart(2, '0');
        const secs = String(date.getSeconds()).padStart(2, '0');
        labels.push(`${hours}:${mins}:${secs}`);
        
        const val = parseFloat(item.reading_Value);
        if (item.type_name === 'Temperature' || item.Type_Name === 'Temperature') {
            tempDataset.push(val);
            humDataset.push(null);
        } else if (item.type_name === 'Humidity' || item.Type_Name === 'Humidity') {
            tempDataset.push(null);
            humDataset.push(val);
        } else {
            tempDataset.push(null);
            humDataset.push(null);
        }
    });

    if (analyticsChart) {
        analyticsChart.destroy();
    }

    try {
        analyticsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Temperature (°C)',
                        data: tempDataset,
                        borderColor: '#a855f7',
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        tension: 0.4,
                        fill: true,
                        spanGaps: true
                    },
                    {
                        label: 'Humidity (%)',
                        data: humDataset,
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        tension: 0.4,
                        fill: true,
                        spanGaps: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { grid: { color: 'rgba(167, 139, 250, 0.05)' }, ticks: { color: '#a78bfa' } },
                    x: { grid: { display: false }, ticks: { color: '#a78bfa', maxTicksLimit: 10 } }
                },
                plugins: {
                    legend: { labels: { color: '#f5f3ff' } }
                }
            }
        });
    } catch (e) {
        console.error('Chart creation failed:', e);
    }
};

const initWebSockets = () => {
    if (typeof io === 'undefined') return;
    
    const socket = io();
    
    socket.on('connect', () => {
        const status = document.getElementById('socket-status');
        if (status) {
            status.textContent = 'Live Connected';
            status.previousElementSibling.style.background = 'var(--success)';
        }
    });

    socket.on('disconnect', () => {
        const status = document.getElementById('socket-status');
        if (status) {
            status.textContent = 'Disconnected';
            status.previousElementSibling.style.background = 'var(--danger-bg)';
        }
    });

    socket.on('new_telemetry', (data) => {
        console.log("Live Telemetry:", data);
        // Refresh the whole dashboard or just append/update DOM
        // To keep it simple and perfectly synced, let's just trigger a chart refresh 
        // and update the raw numbers if they exist
        renderAnalyticsChart();
        
        // Update the top row table if it exists
        const valCell = document.getElementById(`val-${data.sensor_ID}`);
        if (valCell) {
            valCell.innerHTML = `${data.reading_Value} ${data.unit}`;
            // Flash effect
            valCell.parentElement.style.background = 'rgba(56, 189, 248, 0.2)';
            setTimeout(() => valCell.parentElement.style.background = 'transparent', 500);
        }
    });
};

// Render Sensors List
const renderSensors = async () => {
    const tableBody = document.getElementById('sensors-table-body');
    if (!tableBody) return;

    showSpinner('sensors-table-body');
    const sensors = await api.getSensors();
    tableBody.innerHTML = '';

    if (sensors.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No sensors found</td></tr>';
        return;
    }

    sensors.forEach((sensor, index) => {
        const tr = document.createElement('tr');
        tr.className = 'animate-slide-up';
        tr.style.animationDelay = `${index * 0.05}s`;
        
        tr.innerHTML = `
            <td>${sensor.Sensor_ID}</td>
            <td><span class="badge badge-info">${sensor.Type_Name}</span></td>
            <td>Room ${sensor.Room_Number}</td>
            <td>${sensor.Building}</td>
            <td>${sensor.Technician || 'N/A'}</td>
        `;
        tableBody.appendChild(tr);
    });
};

// Render Sensor Data and handle filtering
let allSensorData = [];
const renderSensorDataPage = async () => {
    const tableBody = document.getElementById('data-table-body');
    const filterInput = document.getElementById('filter-sensor');
    
    if (!tableBody) return;

    showSpinner('data-table-body');
    allSensorData = await api.getSensorData();
    
    const displayData = (data) => {
        tableBody.innerHTML = '';
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No data records found</td></tr>';
            return;
        }

        data.forEach((item, index) => {
            const tr = document.createElement('tr');
            if (index < 10) { // Only animate first few to prevent performance issues
                tr.className = 'animate-slide-up';
                tr.style.animationDelay = `${index * 0.05}s`;
            }
            
            const val = parseFloat(item.Reading_Value);
            let valueClass = 'status-normal';
            if (item.Type_Name === 'Temperature') {
                if (val > 45) valueClass = 'status-abnormal';
                else if (val > 35) valueClass = 'status-warning';
            } else if (item.Type_Name === 'Humidity') {
                if (val > 70) valueClass = 'status-abnormal';
                else if (val > 55) valueClass = 'status-warning';
            } else {
                if (val > 80) valueClass = 'status-abnormal';
                else if (val > 50) valueClass = 'status-warning';
            }

            tr.innerHTML = `
                <td>${item.Sensor_ID}</td>
                <td><span class="badge badge-info">${item.Type_Name}</span></td>
                <td>Room ${item.Room_Number}</td>
                <td class="${valueClass}">${item.Reading_Value} ${item.Unit}</td>
                <td>${formatDate(item.Reading_Time)}</td>
            `;
            tableBody.appendChild(tr);
        });
    };

    displayData(allSensorData);

    // Event listener for filter
    if (filterInput) {
        filterInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredData = allSensorData.filter(item => 
                item.Sensor_ID.toString().toLowerCase().includes(searchTerm) ||
                item.Type_Name.toLowerCase().includes(searchTerm)
            );
            displayData(filteredData);
        });
    }
};

// Render Buildings
const renderBuildings = async () => {
    const grid = document.getElementById('buildings-grid');
    if (!grid) return;

    showSpinner('buildings-grid');
    const buildings = await api.getBuildings();
    grid.innerHTML = '';

    if (buildings.length === 0) {
        grid.innerHTML = '<div class="glass-panel" style="padding: 3rem; text-align: center; grid-column: 1 / -1;">No buildings found</div>';
        return;
    }

    // Check if admin mode is active
    const isAdmin = document.getElementById('admin-mode-toggle')?.checked || false;

    buildings.forEach((b, index) => {
        const div = document.createElement('div');
        div.className = 'stat-card glass-panel animate-slide-up';
        div.style.animationDelay = `${index * 0.1}s`;
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="stat-icon icon-blue" style="margin-bottom: 1rem;">
                    <i class="ph ph-buildings"></i>
                </div>
                <button class="delete-building-btn" onclick="deleteBuilding(${b.Building_ID})" 
                    style="display: ${isAdmin ? 'flex' : 'none'}; align-items: center; gap: 0.35rem; padding: 0.4rem 0.75rem; border-radius: 8px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; cursor: pointer; font-size: 0.8rem; transition: all 0.2s;">
                    <i class="ph ph-trash"></i> Delete
                </button>
            </div>
            <h3 style="font-size: 1.25rem; margin-bottom: 0.25rem;">${b.Building_Name}</h3>
            <p style="color: var(--accent); font-size: 0.85rem; font-weight: 500; margin-bottom: 1rem;">${b.Type || 'Campus Building'}</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem; opacity: 0.7;"><i class="ph ph-map-pin"></i> ${b.Location}</p>
            <button onclick="viewRooms(${b.Building_ID})" class="btn-glossy">View Rooms</button>
        `;
        grid.appendChild(div);
    });
};

// Expose renderBuildings globally so the inline modal script can call it
window.renderBuildings = renderBuildings;

// Render Building Details (Rooms Page)
const renderBuildingDetails = async () => {
    const titleEl = document.getElementById('building-title');
    const tableBody = document.getElementById('building-rooms-body');
    if (!titleEl || !tableBody) return;

    // Read building_id from URL using URLSearchParams
    const params = new URLSearchParams(window.location.search);
    const building_id = params.get('building_id') || params.get('id');

    if (!building_id) {
        window.location.href = 'buildings.html';
        return;
    }

    showSpinner('building-rooms-body');
    try {
        console.log(`Fetching rooms for building_id: ${building_id}`);
        // Call backend API exactly as requested
        const response = await fetch(`http://localhost:3000/buildings/${building_id}/rooms`);
        const data = await response.json();
        
        if (!data || !data.success) {
            titleEl.textContent = 'Building Not Found';
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Failed to load building data</td></tr>';
            return;
        }

        // Show building name on rooms page
        titleEl.textContent = data.data.building.Building_Name || `Building #${building_id}`;

        tableBody.innerHTML = '';
        if (!data.data.rooms || data.data.rooms.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No rooms found in this building</td></tr>';
            return;
        }

        // Display rooms in table/grid
        data.data.rooms.forEach((room, index) => {
            const tr = document.createElement('tr');
            tr.className = 'animate-slide-up';
            tr.style.animationDelay = `${index * 0.05}s`;
            // Simplified rendering to match the exact SQL requested which only returns Room_Number
            tr.innerHTML = `
                <td><i class="ph ph-door" style="color: var(--text-muted); margin-right: 0.5rem;"></i> Room ${room.Room_Number}</td>
                <td>-</td>
                <td>-</td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (e) {
        alert('Error loading rooms: ' + e.message);
        tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color: red;">Error: ${e.message}</td></tr>`;
    }
};

// Render Alerts Page
const renderAlerts = async () => {
    const tableBody = document.getElementById('alerts-table-body');
    if (!tableBody) return;

    showSpinner('alerts-table-body');
    const alerts = await api.getAllAlerts();
    tableBody.innerHTML = '';

    if (alerts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No system alerts found</td></tr>';
        return;
    }

    alerts.forEach((alert, index) => {
        const tr = document.createElement('tr');
        tr.className = 'animate-slide-up';
        tr.style.animationDelay = `${index * 0.05}s`;
        
        const isResolved = alert.Status === 'Resolved';
        const statusClass = isResolved ? 'status-normal' : 'status-abnormal';
        
        let actionCell = `<button class="btn" style="background-color: var(--danger); border: none; padding: 0.25rem 0.75rem; font-size: 0.8rem; color: white;" onclick="openResolveModal(${alert.Alert_ID})">Resolve Issue</button>`;
        if (isResolved) {
            actionCell = `<span style="color: var(--text-muted);"><i class="ph ph-check-circle" style="color: var(--accent);"></i> ${alert.Action_taken || 'Resolved'}</span>`;
        }

        tr.innerHTML = `
            <td>#${alert.Alert_ID}</td>
            <td style="font-weight: 500;">${alert.Alert_Message}</td>
            <td>Room ${alert.Room_Number}</td>
            <td>${formatDate(alert.Alert_Time)}</td>
            <td><span class="${statusClass}">${alert.Status}</span></td>
            <td>${actionCell}</td>
        `;
        tableBody.appendChild(tr);
    });
};

// Modal Logic
window.openResolveModal = (alertId) => {
    document.getElementById('resolve-alert-id').value = alertId;
    document.getElementById('action-taken').value = '';
    document.getElementById('resolve-modal').style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('resolve-modal').style.display = 'none';
};

// Resolve Form Submit
const resolveForm = document.getElementById('resolve-form');
if (resolveForm) {
    resolveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const alertId = document.getElementById('resolve-alert-id').value;
        const actionTaken = document.getElementById('action-taken').value;
        
        const result = await api.resolveAlert(alertId, actionTaken);
        if (result.success) {
            closeModal();
            renderAlerts(); // Re-render table
        } else {
            alert('Failed to resolve alert: ' + result.message);
        }
    });
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderDashboard();
    renderSensors();
    renderSensorDataPage();
    renderBuildings();
    renderBuildingDetails();
    renderAlerts();
});
