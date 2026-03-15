function toggleAuth(type) {
    const loginBox = document.getElementById('login-box');
    const signupBox = document.getElementById('signup-box');

    if (type === 'signup') {
        loginBox.style.display = 'none';
        signupBox.style.display = 'block';
    } else {
        signupBox.style.display = 'none';
        loginBox.style.display = 'block';
    }
}

// Handle Sign Up
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const errorDiv = document.getElementById('signup-error');
    const successDiv = document.getElementById('signup-success');
    const btn = document.getElementById('signup-btn');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Registering...';

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();

        if (response.ok) {
            successDiv.textContent = 'Registration successful! You can now Sign In.';
            successDiv.style.display = 'block';
            document.getElementById('signup-form').reset();
            setTimeout(() => toggleAuth('login'), 2000);
        } else {
            errorDiv.textContent = data.error || 'Registration failed.';
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sign Up';
    }
});

// Handle Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    errorDiv.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Signing in...';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (response.ok) {
            // In a real app, save token/session here. 
            // For now, simple redirect to homepage on success.
            localStorage.setItem('streamflix_user', JSON.stringify(data.user));
            window.location.href = 'index.html';
        } else {
            errorDiv.textContent = data.error || 'Invalid credentials.';
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
});
