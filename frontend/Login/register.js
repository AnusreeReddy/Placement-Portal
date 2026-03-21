document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const passwordStrengthElem = document.getElementById('passwordStrength');

    // Password Strength Checker
    function checkPasswordStrength() {
        if (!passwordInput || !passwordStrengthElem) return;

        const password = passwordInput.value;
        let strength = 0;
        let feedback = '';

        const hasLowerCase = /[a-z]/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);

        if (password.length >= 8) strength++;
        if (hasLowerCase) strength++;
        if (hasUpperCase) strength++;
        if (hasNumber) strength++;
        if (hasSpecialChar) strength++;

        switch (strength) {
            case 0:
            case 1:
            case 2:
                feedback = 'Very Weak';
                passwordStrengthElem.style.color = 'red';
                break;
            case 3:
                feedback = 'Weak';
                passwordStrengthElem.style.color = 'orange';
                break;
            case 4:
                feedback = 'Good';
                passwordStrengthElem.style.color = '#ffc107';
                break;
            case 5:
                feedback = 'Strong';
                passwordStrengthElem.style.color = '#28a745';
                break;
        }

        passwordStrengthElem.textContent = feedback;
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }

    // Registration Logic
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const registerMessage = document.getElementById('registerMessage');

            if (passwordStrengthElem && (passwordStrengthElem.textContent === 'Very Weak' || passwordStrengthElem.textContent === 'Weak')) {
                registerMessage.textContent = 'Please choose a stronger password.';
                registerMessage.style.color = '#dc3545';
                return;
            }

            try {
                const response = await fetch('http://127.0.0.1:5000/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        password: password,
                        role: role
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    registerMessage.textContent = 'Registration successful! Redirecting to login...';
                    registerMessage.style.color = '#28a745';
                    registerForm.reset();
                    
                    setTimeout(() => {
                        window.location.href = 'http://127.0.0.1:5000/login';
                    }, 2000);
                } else {
                    registerMessage.textContent = data.error || 'Registration failed.';
                    registerMessage.style.color = '#dc3545';
                }
            } catch (error) {
                registerMessage.textContent = 'Error connecting to server.';
                registerMessage.style.color = '#dc3545';
                console.error(error);
            }
        });
    }
});
