document.addEventListener('DOMContentLoaded', () => {

    // --- Daily Check-in and Gamification Logic ---

    const streakCountElem = document.getElementById('streak-count');
    const checkInBtn = document.getElementById('checkInBtn');
    const badgesContainer = document.getElementById('badges-container');

    // Get data from localStorage or initialize
    let lastCheckInDate = localStorage.getItem('lastCheckInDate');
    let streak = parseInt(localStorage.getItem('streak')) || 0;
    let badges = JSON.parse(localStorage.getItem('badges')) || [];

    // Function to update the UI
    function updateGamificationUI() {
        streakCountElem.textContent = streak;
        badgesContainer.innerHTML = '';
        badges.forEach(badge => {
            const badgeElem = document.createElement('span');
            badgeElem.className = `badge ${badge.toLowerCase()}`;
            badgeElem.textContent = badge;
            badgesContainer.appendChild(badgeElem);
        });
    }

    // Function to check and award badges
    function awardBadges() {
        if (streak >= 7 && !badges.includes('Weekly Streak')) {
            badges.push('Weekly Streak');
            alert('🎉 Congrats! You earned the Weekly Streak badge!');
        }
        if (streak >= 30 && !badges.includes('Monthly Contributor')) {
            badges.push('Monthly Contributor');
            alert('🚀 Awesome! You earned the Monthly Contributor badge!');
        }
    }

    // Check-in logic
    checkInBtn.addEventListener('click', () => {
        const today = new Date().toDateString();

        if (lastCheckInDate !== today) {
            if (lastCheckInDate) {
                const lastDate = new Date(lastCheckInDate);
                const dayDiff = (new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24);

                if (dayDiff < 2) {
                    streak++;
                } else {
                    streak = 1; // Reset streak if more than a day has passed
                }
            } else {
                streak = 1;
            }

            lastCheckInDate = today;
            localStorage.setItem('lastCheckInDate', lastCheckInDate);
            localStorage.setItem('streak', streak);
            
            awardBadges();
            localStorage.setItem('badges', JSON.stringify(badges));

            updateGamificationUI();
            alert('Checked in! Your streak is now ' + streak + ' days.');
        } else {
            alert('You have already checked in today!');
        }
    });

    // Initial UI update on page load
    updateGamificationUI();

    // --- Internship & Placement Listing Logic ---

    const internshipList = document.getElementById('internship-list');

    // Dummy data to simulate API response
    const internships = [
        {
            company: 'Google',
            role: 'Software Engineer Intern',
            stipend: '₹80,000/month',
            duration: '6 months',
            details: 'Exciting opportunity to work on cutting-edge AI and machine learning projects. '
        },
        {
            company: 'Microsoft',
            role: 'Data Analyst',
            stipend: '₹75,000/month',
            duration: '3 months',
            details: 'Analyze large datasets to drive business decisions. Strong Python and SQL skills required.'
        },
        {
            company: 'Amazon',
            role: 'Cloud Support Associate',
            stipend: '₹70,000/month',
            duration: '4 months',
            details: 'Provide technical assistance to AWS customers.'
        }
    ];

    // Function to render internships
    function renderInternships() {
        internshipList.innerHTML = ''; // Clear previous content
        internships.forEach(item => {
            const internshipCard = document.createElement('div');
            internshipCard.className = 'internship-card';
            internshipCard.innerHTML = `
                <h4>${item.role}</h4>
                <p><strong>Company:</strong> ${item.company}</p>
                <p><strong>Stipend:</strong> ${item.stipend}</p>
                <p><strong>Duration:</strong> ${item.duration}</p>
                <p>${item.details}</p>
                <a href="#" class="apply-btn">Apply Now</a>
            `;
            internshipList.appendChild(internshipCard);
        });
    }

    // Initial render
    renderInternships();
});