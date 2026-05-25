document.addEventListener('DOMContentLoaded', async () => {
    const sensorForm = document.getElementById('addSensorForm');
    const typeSelect = document.getElementById('sensortype_ID');
    const roomSelect = document.getElementById('Room_ID');
    const messageDiv = document.getElementById('message');

    // 1. Fetch Types and Rooms for dropdowns
    async function loadDropdowns() {
        try {
            const [typesRes, roomsRes] = await Promise.all([
                fetch('http://localhost:3000/api/sensor-types'),
                fetch('http://localhost:3000/api/rooms')
            ]);

            const types = await typesRes.json();
            const rooms = await roomsRes.json();

            if (types.success) {
                typeSelect.innerHTML = '<option value="" disabled selected>Select Type</option>' +
                    types.data.map(t => `<option value="${t.sensortype_ID}">${t.type_name}</option>`).join('');
            }

            if (rooms.success) {
                roomSelect.innerHTML = '<option value="" disabled selected>Select Room</option>' +
                    rooms.data.map(r => `<option value="${r.Room_ID}">${r.Room_Number}</option>`).join('');
            }
        } catch (error) {
            console.error('Error loading dropdowns:', error);
            showMessage('Failed to load system metadata.', 'error-message');
        }
    }

    // 2. Handle form submission
    sensorForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            sensor_ID: document.getElementById('sensor_ID').value,
            sensortype_ID: typeSelect.value,
            Room_ID: roomSelect.value,
            Install_Date: document.getElementById('Install_Date').value,
            Technician: document.getElementById('Technician').value
        };

        // Reset message
        messageDiv.style.display = 'none';

        try {
            const response = await fetch('http://localhost:3000/api/sensors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                showMessage(result.message, 'success-message');
                sensorForm.reset();
            } else {
                showMessage(result.message || 'Failed to add sensor', 'error-message');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Server connection failed.', 'error-message');
        }
    });

    function showMessage(text, className) {
        messageDiv.textContent = text;
        messageDiv.className = className;
        messageDiv.style.display = 'block';
    }

    loadDropdowns();
});
