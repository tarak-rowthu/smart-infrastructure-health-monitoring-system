// Check if user is already logged in and redirect to dashboard
document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('iot_user');
    if (user) {
        window.location.href = 'index.html';
    }
});

const loginForm = document.getElementById('login-form');
const errorDiv = document.getElementById('login-error');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Hide previous errors
        errorDiv.style.display = 'none';
        
        try {
            const response = await fetch('https://smart-infrastructure-health-monitoring.onrender.com/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Save user session in localStorage
                localStorage.setItem('iot_user', JSON.stringify(result.data));
                
                // Redirect to dashboard
                window.location.href = 'index.html';
            } else {
                // Show error
                errorDiv.textContent = result.message || 'Login failed. Please try again.';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'Server connection failed. Is the backend running?';
            errorDiv.style.display = 'block';
        }
    });
}
