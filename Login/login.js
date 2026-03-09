// login.js
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevents the form from submitting normally

    const role = document.getElementById('role').value;

    if (role === 'student') {
        window.location.href = '/Student/student_dashboard.html'; // Redirect to student dashboard
    } else if (role === 'placement_officer') {
        window.location.href = '/Placement/placement_officer_dashboard.html'; // Redirect to placement officer dashboard
    } else if (role === 'recruiter') {
        window.location.href = '/Recruiter/recruiter_dashboard.html'; // Redirect to recruiter dashboard
    } else {
        alert('Please select a role.');
    }
});