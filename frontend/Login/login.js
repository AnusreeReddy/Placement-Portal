document.querySelector("form").addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password,
            role: role
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);

        if (data.token) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.role);

            // Redirect after a small delay to ensure localStorage is saved
            setTimeout(() => {
                if (data.role === "student") {
                    window.location.href = "http://127.0.0.1:5000/student/dashboard";
                } else if (data.role === "recruiter") {
                    window.location.href = "http://127.0.0.1:5000/recruiter/dashboard";
                } else if (data.role === "placementOfficer") {
                    window.location.href = "http://127.0.0.1:5000/placement/dashboard";
                }
            }, 100);

        } else {
            alert(data.message || data.error);
        }
    })
    .catch(err => {
        console.error(err);
        alert("Error connecting to server");
    });
});