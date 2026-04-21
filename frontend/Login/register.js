document.addEventListener('DOMContentLoaded', () => {

    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const passwordStrengthElem = document.getElementById('passwordStrength');
    const registerMessage = document.getElementById('registerMessage');

    function checkPasswordStrength() {

        if (!passwordInput || !passwordStrengthElem) return;

        const password = passwordInput.value;

        let strength = 0;

        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[!@#$%^&*]/.test(password)) strength++;

        let feedback = "";

        switch (strength) {

            case 0:
            case 1:
            case 2:
                feedback = "Very Weak";
                passwordStrengthElem.style.color = "red";
                break;

            case 3:
                feedback = "Weak";
                passwordStrengthElem.style.color = "orange";
                break;

            case 4:
                feedback = "Good";
                passwordStrengthElem.style.color = "#ffc107";
                break;

            case 5:
                feedback = "Strong";
                passwordStrengthElem.style.color = "#28a745";
                break;
        }

        passwordStrengthElem.textContent = feedback;
    }

    if (passwordInput) {
        passwordInput.addEventListener("input", checkPasswordStrength);
    }

    if (registerForm) {

        registerForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const password = passwordInput.value;
            const role = document.getElementById("role").value;

            if (
                passwordStrengthElem &&
                (passwordStrengthElem.textContent === "Very Weak" ||
                 passwordStrengthElem.textContent === "Weak")
            ) {
                registerMessage.textContent = "Please choose a stronger password.";
                registerMessage.style.color = "#dc3545";
                return;
            }

            try {

                const response = await fetch("http://127.0.0.1:5000/api/register", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        password,
                        role
                    })
                });

                const data = await response.json();

                if (response.ok) {

                    registerMessage.textContent =
                        "Registration successful! Redirecting to login...";

                    registerMessage.style.color = "#28a745";

                    registerForm.reset();

                    setTimeout(() => {

                        window.location.href =
                            "http://127.0.0.1:5000/login";

                    }, 1500);

                } else {

                    registerMessage.textContent =
                        data.error || "Registration failed.";

                    registerMessage.style.color = "#dc3545";
                }

            } catch (error) {

                console.error(error);

                registerMessage.textContent =
                    "Error connecting to backend server.";

                registerMessage.style.color = "#dc3545";
            }

        });

    }

});