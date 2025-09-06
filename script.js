// Global variables
let users = [];
let teams = [];
let requirements = [];

// Get DOM elements
const userForm = document.getElementById('userForm');
const requirementForm = document.getElementById('requirementForm');
const usersSection = document.getElementById('usersSection');
const teamsSection = document.getElementById('teamsSection');
const requirementsSection = document.getElementById('requirementsSection');
const usersList = document.getElementById('usersList');
const teamsList = document.getElementById('teamsList');
const requirementsList = document.getElementById('requirementsList');
const matchTeamsBtn = document.getElementById('matchTeamsBtn');

// Form submission handler for users
userForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const experience = document.getElementById('experience').value;
    const languages = document.getElementById('languages').value;
    
    // Get selected skills
    const skillCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    const skills = Array.from(skillCheckboxes).map(cb => cb.value);
    
    // Check if skills are selected
    if (skills.length === 0) {
        alert('Please select at least one skill!');
        return;
    }
    
    // Check if user already exists
    if (users.find(user => user.email === email)) {
        alert('User with this email already exists!');
        return;
    }
    
    // Create user object
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        experience: experience,
        skills: skills,
        languages: languages,
        teamId: null,
        matched: false
    };
    
    // Add user to array
    users.push(newUser);
    
    // Clear form
    userForm.reset();
    
    // Show success message
    alert('Successfully registered! Check requirements below to see matching opportunities.');
    
    // Update display
    displayUsers();
    showSections();
    
    // Save data
    saveData();
    
    // Try to match if requirements exist
    if (requirements.length > 0) {
        autoMatchAvailableUsers();
    }
});

// Form submission handler for requirements
requirementForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const teamName = document.getElementById('teamName').value;
    const description = document.getElementById('teamDescription').value;
    const teamSize = parseInt(document.getElementById('teamSize').value);
    const experienceLevel = document.getElementById('experienceLevel').value;
    
    // Get required skills
    const skillCheckboxes = document.querySelectorAll('input[name="required-skills"]:checked');
    const requiredSkills = Array.from(skillCheckboxes).map(cb => cb.value);
    
    // Check if skills are selected
    if (requiredSkills.length === 0) {
        alert('Please select at least one required skill!');
        return;
    }
    
    // Create requirement object
    const newRequirement = {
        id: Date.now(),
        teamName: teamName,
        description: description,
        teamSize: teamSize,
        requiredSkills: requiredSkills,
        experienceLevel: experienceLevel,
        matchedUsers: [],
        completed: false
    };
    
    // Add requirement to array
    requirements.push(newRequirement);
    
    // Clear form
    requirementForm.reset();
    
    // Show success message
    alert('Team requirement created! Users will be matched automatically as they register.');
    
    // Update display
    displayRequirements();
    requirementsSection.style.display = 'block';
    
    // Save data
    saveData();
    
    // Try to match existing users
    if (users.length > 0) {
        autoMatchAvailableUsers();
    }
});

// Display all users
function displayUsers() {
    if (users.length === 0) {
        usersList.innerHTML = '<p>No users registered yet.</p>';
        return;
    }
    
    usersList.innerHTML = users.map(user => `
        <div class="user-card">
            <h3>${user.name}</h3>
            <div class="user-info">
                <strong>Experience:</strong> ${capitalizeFirst(user.experience)}
            </div>
            <div class="user-info">
                <strong>Email:</strong> ${user.email}
            </div>
            <div class="user-info">
                <strong>Languages:</strong> ${user.languages || 'Not specified'}
            </div>
            <div class="user-info">
                <strong>Status:</strong> ${user.matched ? getMatchedTeamName(user.teamId) : 'Available for matching'}
            </div>
            <div class="user-skills">
                ${user.skills.map(skill => `<span class="skill-badge">${skill}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

// Display requirements
function displayRequirements() {
    if (requirements.length === 0) {
        requirementsList.innerHTML = '<p>No team requirements created yet.</p>';
        return;
    }
    
    requirementsList.innerHTML = requirements.map(req => `
        <div class="requirement-card">
            <h3>${req.teamName}</h3>
            <div class="requirement-info">
                <strong>Description:</strong> ${req.description || 'No description provided'}
            </div>
            <div class="requirement-info">
                <strong>Team Size:</strong> ${req.teamSize} members
            </div>
            <div class="requirement-info">
                <strong>Experience Level:</strong> ${capitalizeFirst(req.experienceLevel) || 'Any'}
            </div>
            <div class="requirement-info">
                <strong>Status:</strong> ${req.completed ? 'Team Complete' : `${req.matchedUsers.length}/${req.teamSize} members found`}
            </div>
            <div class="needed-skills">
                <strong>Required Skills:</strong>
                ${req.requiredSkills.map(skill => `<span class="needed-badge">${skill}</span>`).join('')}
            </div>
            ${req.matchedUsers.length > 0 ? `
                <div style="margin-top: 15px;">
                    <strong>Matched Users:</strong>
                    ${req.matchedUsers.map(userId => {
                        const user = users.find(u => u.id === userId);
                        return user ? `<div class="team-member">${user.name} - ${user.skills.join(', ')}</div>` : '';
                    }).join('')}
                </div>
            ` : ''}
            ${!req.completed ? `<button class="match-btn" onclick="findMatchesForRequirement(${req.id})">Find Matches</button>` : ''}
        </div>
    `).join('');
}

// Display matched teams
function displayTeams() {
    const completedTeams = requirements.filter(req => req.completed);
    
    if (completedTeams.length === 0) {
        teamsList.innerHTML = '<p>No complete teams yet. Create requirements and register users to form teams.</p>';
        return;
    }
    
    teamsList.innerHTML = completedTeams.map((team, index) => `
        <div class="team-card">
            <h3>${team.teamName}</h3>
            <div class="requirement-info">
                <strong>Project:</strong> ${team.description}
            </div>
            <div class="team-skills">
                <strong>Team Skills:</strong> ${getTeamSkillsFromRequirement(team).join(', ')}
            </div>
            <div style="margin-top: 15px;">
                ${team.matchedUsers.map(userId => {
                    const member = users.find(u => u.id === userId);
                    return member ? `
                        <div class="team-member">
                            <strong>${member.name}</strong> (${member.experience})
                            <br>Skills: ${member.skills.join(', ')}
                            <br>Languages: ${member.languages || 'Not specified'}
                        </div>
                    ` : '';
                }).join('')}
            </div>
        </div>
    `).join('');
}

// Auto match available users to requirements
// ⚠️ THIS IS THE PROBLEMATIC FUNCTION - USES .some() INSTEAD OF .every()
function autoMatchAvailableUsers() {
    let matchesMade = false;
    
    requirements.forEach(req => {
        if (req.completed) return;
        
        const availableUsers = users.filter(user => !user.matched);
        
        availableUsers.forEach(user => {
            if (req.matchedUsers.length >= req.teamSize) return;
            
            // ❌ BUG: This only checks if user has ONE matching skill, not ALL required skills
            const hasRequiredSkill = user.skills.some(skill => req.requiredSkills.includes(skill));
            const experienceMatches = checkExperienceMatch(user.experience, req.experienceLevel);
            
            if (hasRequiredSkill && experienceMatches) {
                // Add user to requirement
                req.matchedUsers.push(user.id);
                user.matched = true;
                user.teamId = req.id;
                matchesMade = true;
                
                // Check if requirement is complete
                if (req.matchedUsers.length >= req.teamSize) {
                    req.completed = true;
                }
            }
        });
    });
    
    if (matchesMade) {
        displayUsers();
        displayRequirements();
        displayTeams();
        teamsSection.style.display = 'block';
        saveData();
    }
}

// Manual matching for specific requirement
// ⚠️ THIS ALSO HAS THE SAME BUG
function findMatchesForRequirement(requirementId) {
    const requirement = requirements.find(req => req.id === requirementId);
    if (!requirement || requirement.completed) return;
    
    const availableUsers = users.filter(user => !user.matched);
    const suitableUsers = availableUsers.filter(user => {
        // ❌ BUG: Same problem here - only checks for ONE matching skill
        const hasRequiredSkill = user.skills.some(skill => requirement.requiredSkills.includes(skill));
        const experienceMatches = checkExperienceMatch(user.experience, requirement.experienceLevel);
        return hasRequiredSkill && experienceMatches;
    });
    
    if (suitableUsers.length === 0) {
        alert('No suitable users found for this requirement. More users need to register.');
        return;
    }
    
    // Match best users up to team size
    const neededMembers = requirement.teamSize - requirement.matchedUsers.length;
    const usersToMatch = suitableUsers.slice(0, neededMembers);
    
    usersToMatch.forEach(user => {
        requirement.matchedUsers.push(user.id);
        user.matched = true;
        user.teamId = requirement.id;
    });
    
    // Check if requirement is complete
    if (requirement.matchedUsers.length >= requirement.teamSize) {
        requirement.completed = true;
    }
    
    displayUsers();
    displayRequirements();
    displayTeams();
    teamsSection.style.display = 'block';
    saveData();
    
    alert(`Matched ${usersToMatch.length} user(s) to ${requirement.teamName}!`);
}

// Check if user experience matches requirement
function checkExperienceMatch(userExp, reqExp) {
    if (!reqExp || reqExp === 'mixed') return true;
    
    const expLevels = { beginner: 1, intermediate: 2, advanced: 3 };
    const userLevel = expLevels[userExp] || 1;
    const reqLevel = expLevels[reqExp] || 1;
    
    switch (reqExp) {
        case 'beginner': return userLevel >= 1;
        case 'intermediate': return userLevel >= 2;
        case 'advanced': return userLevel >= 3;
        default: return true;
    }
}

// Get team skills from requirement
function getTeamSkillsFromRequirement(requirement) {
    const skills = new Set();
    requirement.matchedUsers.forEach(userId => {
        const member = users.find(u => u.id === userId);
        if (member) {
            member.skills.forEach(skill => skills.add(skill));
        }
    });
    return Array.from(skills);
}

// Get matched team name
function getMatchedTeamName(teamId) {
    const requirement = requirements.find(req => req.id === teamId);
    return requirement ? `Matched to: ${requirement.teamName}` : 'Unknown Team';
}

// Match teams button
matchTeamsBtn.addEventListener('click', function() {
    if (users.length === 0) {
        alert('No users registered yet!');
        return;
    }
    
    if (requirements.length === 0) {
        alert('No team requirements created yet!');
        return;
    }
    
    autoMatchAvailableUsers();
    alert('Matching process completed!');
});

// Show users and teams sections
function showSections() {
    usersSection.style.display = 'block';
    if (requirements.length > 0) {
        requirementsSection.style.display = 'block';
        teamsSection.style.display = 'block';
    }
}

// Capitalize first letter
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('hackathonUsers', JSON.stringify(users));
    localStorage.setItem('hackathonTeams', JSON.stringify(teams));
    localStorage.setItem('hackathonRequirements', JSON.stringify(requirements));
}

// Load data from localStorage
function loadData() {
    const savedUsers = localStorage.getItem('hackathonUsers');
    const savedTeams = localStorage.getItem('hackathonTeams');
    const savedRequirements = localStorage.getItem('hackathonRequirements');
    
    if (savedUsers) {
        users = JSON.parse(savedUsers);
        displayUsers();
        showSections();
    }
    
    if (savedTeams) {
        teams = JSON.parse(savedTeams);
    }
    
    if (savedRequirements) {
        requirements = JSON.parse(savedRequirements);
        displayRequirements();
        requirementsSection.style.display = 'block';
    }
    
    // Display teams if there are completed requirements
    if (requirements.some(req => req.completed)) {
        displayTeams();
        teamsSection.style.display = 'block';
    }
}

// Load data on page load
window.addEventListener('load', function() {
    loadData();
});

// Clear all data (optional function for development)
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        localStorage.removeItem('hackathonUsers');
        localStorage.removeItem('hackathonTeams');
        localStorage.removeItem('hackathonRequirements');
        users = [];
        teams = [];
        requirements = [];
        displayUsers();
        displayTeams();
        displayRequirements();
        usersSection.style.display = 'none';
        teamsSection.style.display = 'none';
        requirementsSection.style.display = 'none';
        alert('All data cleared!');
    }
}