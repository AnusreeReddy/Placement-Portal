document.addEventListener('DOMContentLoaded', () => {

    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const passwordStrengthElem = document.getElementById('passwordStrength');

    // Function to simulate a simple password hash (not secure for production)
    function hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    // --- NEW: Password Strength Checker ---
    function checkPasswordStrength() {
        if (!passwordInput || !passwordStrengthElem) return;

        const password = passwordInput.value;
        let strength = 0;
        let feedback = '';

        const hasLowerCase = /[a-z]/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);

        if (password.length >= 8) {
            strength++;
        }
        if (hasLowerCase) {
            strength++;
        }
        if (hasUpperCase) {
            strength++;
        }
        if (hasNumber) {
            strength++;
        }
        if (hasSpecialChar) {
            strength++;
        }

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
                passwordStrengthElem.style.color = '#ffc107'; // yellow
                break;
            case 5:
                feedback = 'Strong';
                passwordStrengthElem.style.color = '#28a745'; // green
                break;
        }

        passwordStrengthElem.textContent = feedback;
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }
    // --- END NEW CODE ---

    // --- Registration Logic ---
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const registerMessage = document.getElementById('registerMessage');

            // Add a check to prevent weak passwords from being registered
            if (passwordStrengthElem.textContent === 'Very Weak' || passwordStrengthElem.textContent === 'Weak') {
                registerMessage.textContent = 'Please choose a stronger password.';
                registerMessage.style.color = '#dc3545';
                return;
            }

            const hashedPassword = hashPassword(password);

            const newUser = {
                id: Date.now(),
                name: name,
                email: email,
                password: hashedPassword,
                role: role
            };

            let users = JSON.parse(localStorage.getItem('users')) || [];

            // Check if email already exists
            const emailExists = users.some(user => user.email === email);
            if (emailExists) {
                registerMessage.textContent = 'Email already registered. Please login or use a different email.';
                return;
            }

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            registerMessage.textContent = 'Registration successful! You can now log in.';
            registerMessage.style.color = '#28a745';
            registerForm.reset();
            
            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = '/Login/login.html';
            }, 2000);
        });
    }

    // --- Login Logic ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const loginMessage = document.getElementById('loginMessage');
            
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const hashedPassword = hashPassword(password);
            
            const user = users.find(u => u.email === email && u.role === role && u.password === hashedPassword);

            if (user) {
                // Save the logged-in user to sessionStorage
                sessionStorage.setItem('loggedInUser', JSON.stringify(user));
                
                // Redirect based on role
                switch (user.role) {
                    case 'student':
                        window.location.href = '/Student/student_dashboard.html';
                        break;
                    case 'recruiter':
                        window.location.href = '/Recruiter/recruiter_dashboard.html';
                        break;
                    case 'placementOfficer':
                        window.location.href = '/Placement/placement_officer_dashboard.html';
                        break;
                }
            } else {
                loginMessage.textContent = 'Invalid email, password, or role.';
            }
        });
    }

    // --- Verification Logic for Dashboard Pages ---
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage.includes('dashboard') || currentPage.includes('profile') || currentPage.includes('applications')) {
        if (!loggedInUser) {
            console.log("not registered")
            window.location.href = 'Login/login.html'; // Redirect to login if not authenticated
        }
    }
});