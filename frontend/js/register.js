document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');

    // Reset message
    messageDiv.style.display = 'none';
    messageDiv.className = '';

    // Basic frontend validation
    if (!name || !email || !password) {
        showMessage('All fields are required', 'error-message');
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error-message');
        return;
    }

    try {
        const response = await fetch('https://smart-infrastructure-health-monitoring.onrender.com/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const result = await response.json();

        if (result.success) {
            showMessage(result.message, 'success-message');
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showMessage(result.message || 'Registration failed', 'error-message');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Connection to server failed. Is the backend running?', 'error-message');
    }

    function showMessage(text, className) {
        messageDiv.textContent = text;
        messageDiv.className = className;
        messageDiv.style.display = 'block';
    }
});
