// Initialize state
let state = {
    ads: JSON.parse(localStorage.getItem('ads')) || [],
    users: JSON.parse(localStorage.getItem('users')) || [],
    loggedInUser: localStorage.getItem('loggedInUser') || null,
    adTimer: null,
    isRechargeProcessing: false,
    rechargeTimeout: null
};

// Check localStorage availability
let storageAvailable = true;
try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
} catch (e) {
    storageAvailable = false;
    console.warn('localStorage unavailable, using in-memory storage');
}

// DOM Elements with null checks
const elements = {
    registerSection: document.getElementById('register-section'),
    loginSection: document.getElementById('login-section'),
    gameSection: document.getElementById('game-section'),
    profileSection: document.getElementById('profile-section'),
    adSection: document.getElementById('ad-section'),
    rechargeSection: document.getElementById('recharge-section'),
    withdrawalSection: document.getElementById('withdrawal-section'),
    inviteSection: document.getElementById('invite-section'),
    adminSection: document.getElementById('admin-section'),
    boxContainer: document.getElementById('box-container'),
    currentLevel: document.getElementById('current-level'),
    totalCoins: document.getElementById('total-coins'),
    message: document.getElementById('message'),
    nextLevel: document.getElementById('next-level'),
    adImage: document.getElementById('ad-image'),
    adLink: document.getElementById('ad-link'),
    adTimer: document.getElementById('ad-timer'),
    skipAd: document.getElementById('skip-ad'),
    rechargeBtn: document.getElementById('recharge-btn'),
    rechargeMessage: document.getElementById('recharge-message'),
    adminUsername: document.getElementById('admin-username'),
    adminPassword: document.getElementById('admin-password'),
    adminLoginBtn: document.getElementById('admin-login-btn'),
    adminLogin: document.getElementById('admin-login'),
    adminControls: document.getElementById('admin-controls'),
    adUpload: document.getElementById('ad-upload'),
    adLinkInput: document.getElementById('ad-link-input'),
    uploadAdBtn: document.getElementById('upload-ad-btn'),
    adList: document.getElementById('ad-list'),
    adminLogout: document.getElementById('admin-logout'),
    registerUsername: document.getElementById('register-username'),
    registerEmail: document.getElementById('register-email'),
    registerMobile: document.getElementById('register-mobile'),
    registerPassword: document.getElementById('register-password'),
    registerInviteCode: document.getElementById('register-invite-code'),
    registerBtn: document.getElementById('register-btn'),
    registerMessage: document.getElementById('register-message'),
    loginUsername: document.getElementById('login-username'),
    loginPassword: document.getElementById('login-password'),
    loginBtn: document.getElementById('login-btn'),
    loginMessage: document.getElementById('login-message'),
    linkToLogin: document.getElementById('link-to-login'),
    linkToRegister: document.getElementById('link-to-register'),
    navGame: document.getElementById('nav-game'),
    navRecharge: document.getElementById('nav-recharge'),
    navWithdrawal: document.getElementById('nav-withdrawal'),
    navInvite: document.getElementById('nav-invite'),
    navAdmin: document.getElementById('nav-admin'),
    tabAds: document.getElementById('tab-ads'),
    tabUsers: document.getElementById('tab-users'),
    adsTab: document.getElementById('ads-tab'),
    usersTab: document.getElementById('users-tab'),
    dateFilter: document.getElementById('date-filter'),
    userList: document.getElementById('user-list'),
    totalUsers: document.getElementById('total-users'),
    adUploadMessage: document.getElementById('ad-upload-message'),
    adminLoginMessage: document.getElementById('admin-login-message'),
    profileBtn: document.getElementById('profile-btn'),
    profilePhoto: document.getElementById('profile-photo'),
    profileUsername: document.getElementById('profile-username'),
    profileRegNumber: document.getElementById('profile-reg-number'),
    profileMobile: document.getElementById('profile-mobile'),
    profileWinnings: document.getElementById('profile-winnings'),
    editProfileBtn: document.getElementById('edit-profile-btn'),
    profileDisplay: document.getElementById('profile-display'),
    profileEdit: document.getElementById('profile-edit'),
    editUsername: document.getElementById('edit-username'),
    editMobile: document.getElementById('edit-mobile'),
    editPhoto: document.getElementById('edit-photo'),
    saveProfileBtn: document.getElementById('save-profile-btn'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),
    profileMessage: document.getElementById('profile-message'),
    inviteCode: document.getElementById('invite-code'),
    copyInviteCode: document.getElementById('copy-invite-code'),
    inviteCoins: document.getElementById('invite-coins'),
    invitedUsers: document.getElementById('invited-users')
};

// Validate DOM elements
const missingElements = Object.entries(elements).filter(([key, el]) => !el);
if (missingElements.length) {
    console.error('Missing DOM elements:', missingElements.map(([key]) => key));
    alert('Application error: Some elements are missing. Please check the HTML.');
}

// Simple password hash
function hashPassword(password) {
    return btoa(password.split('').reverse().join(''));
}

// Generate registration number
function generateRegNumber() {
    return `USER-${(state.users.length + 1).toString().padStart(4, '0')}`;
}

// Generate invite code
function generateInviteCode(username) {
    const randomNum = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
    return `${username}${randomNum}`;
}

// Save state with quota error handling
let saveTimeout = null;
function saveState() {
    if (!storageAvailable) return;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        try {
            localStorage.setItem('ads', JSON.stringify(state.ads));
            localStorage.setItem('users', JSON.stringify(state.users));
            localStorage.setItem('loggedInUser', state.loggedInUser);
        } catch (e) {
            console.error('Failed to save state:', e);
            if (e.name === 'QuotaExceededError') {
                alert('Storage limit reached! Please clear some data or use smaller images.');
            } else {
                alert('Storage error! Data may not persist.');
            }
        }
    }, 100);
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Show section
function showSection(sectionId) {
    if (!elements[sectionId]) {
        console.error(`Section ${sectionId} not found`);
        return;
    }
    if (state.adTimer) {
        clearInterval(state.adTimer);
        state.adTimer = null;
    }
    Object.values(elements).forEach(el => {
        if (el && el.classList && el.classList.contains('section')) {
            el.classList.add('hidden');
        }
    });
    elements[sectionId].classList.remove('hidden');
    if (sectionId === 'profileSection') {
        displayProfile();
    } else if (sectionId === 'gameSection') {
        initGame();
    } else if (sectionId === 'adminSection') {
        elements.adminLogin.classList.remove('hidden');
        elements.adminControls.classList.add('hidden');
        elements.adminUsername.value = '';
        elements.adminPassword.value = '';
        elements.adminLoginMessage.textContent = '';
    } else if (sectionId === 'inviteSection') {
        displayInvitePage();
    }
}

// Show admin tab
function showAdminTab(tabId) {
    elements.adsTab.classList.add('hidden');
    elements.usersTab.classList.add('hidden');
    elements[tabId].classList.remove('hidden');
    elements.tabAds.classList.remove('active');
    elements.tabUsers.classList.remove('active');
    elements[tabId === 'adsTab' ? 'tabAds' : 'tabUsers'].classList.add('active');
    if (tabId === 'usersTab') {
        populateDateFilter();
        displayUsersByDate();
    } else if (tabId === 'adsTab') {
        displayAds();
    }
}

// Register
const handleRegister = debounce(() => {
    if (!elements.registerBtn) return;
    elements.registerBtn.disabled = true;
    const username = elements.registerUsername.value.trim();
    const email = elements.registerEmail.value.trim();
    const mobile = elements.registerMobile.value.trim();
    const password = elements.registerPassword.value.trim();
    const inviteCode = elements.registerInviteCode.value.trim();
    let invitedBy = null;

    if (!username || !email || !mobile || !password) {
        elements.registerMessage.textContent = 'All fields are required!';
        elements.registerMessage.className = 'error';
        elements.registerBtn.disabled = false;
        return;
    }
    if (state.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        elements.registerMessage.textContent = 'Username already exists!';
        elements.registerMessage.className = 'error';
        elements.registerBtn.disabled = false;
        return;
    }
    if (state.users.some(u => u.mobile === mobile)) {
        elements.registerMessage.textContent = 'Mobile number already registered!';
        elements.registerMessage.className = 'error';
        elements.registerBtn.disabled = false;
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        elements.registerMessage.textContent = 'Invalid email format!';
        elements.registerMessage.className = 'error';
        elements.registerBtn.disabled = false;
        return;
    }
    if (!/^\d{10}$/.test(mobile)) {
        elements.registerMessage.textContent = 'Mobile number must be 10 digits!';
        elements.registerMessage.className = 'error';
        elements.registerBtn.disabled = false;
        return;
    }
    if (password.length < 6) {
        elements.registerMessage.textContent = 'Password must be at least 6 characters!';
        elements.registerMessage.className = 'error';
        elements.registerBtn.disabled = false;
        return;
    }
    if (inviteCode) {
        const inviter = state.users.find(u => u.inviteCode === inviteCode);
        if (!inviter) {
            elements.registerMessage.textContent = 'Invalid invite code!';
            elements.registerMessage.className = 'error';
            elements.registerBtn.disabled = false;
            return;
        }
        invitedBy = inviter.username;
    }
    const date = new Date().toISOString().split('T')[0];
    const newUser = {
        username,
        email,
        mobile,
        password: hashPassword(password),
        date,
        registrationNumber: generateRegNumber(),
        totalWinnings: 0,
        profilePhoto: 'default-profile.png',
        totalCoins: 0,
        hasRecharged: false,
        currentLevel: 1,
        inviteCode: generateInviteCode(username),
        invitedBy,
        inviteCoins: 0,
        invitedUsers: []
    };
    state.users.push(newUser);
    state.loggedInUser = username;
    saveState();
    elements.registerMessage.textContent = 'Registration successful! Please recharge to start playing.';
    elements.registerMessage.className = 'success';
    elements.registerUsername.value = '';
    elements.registerEmail.value = '';
    elements.registerMobile.value = '';
    elements.registerPassword.value = '';
    elements.registerInviteCode.value = '';
    setTimeout(() => {
        elements.rechargeMessage.textContent = 'Buy 100 coins for ₹100 to start playing!';
        showSection('rechargeSection');
        elements.registerBtn.disabled = false;
        elements.registerMessage.textContent = '';
        elements.registerMessage.className = '';
    }, 1000);
}, 300);

// Login
const handleLogin = debounce(() => {
    if (!elements.loginBtn) return;
    elements.loginBtn.disabled = true;
    const username = elements.loginUsername.value.trim();
    const password = elements.loginPassword.value.trim();
    const user = state.users.find(u => u.username === username && u.password === hashPassword(password));
    if (!user) {
        elements.loginMessage.textContent = 'Invalid username or password!';
        elements.loginMessage.className = 'error';
        elements.loginBtn.disabled = false;
        return;
    }
    state.loggedInUser = username;
    saveState();
    elements.loginMessage.textContent = 'Login successful!';
    elements.loginMessage.className = 'success';
    elements.loginUsername.value = '';
    elements.loginPassword.value = '';
    setTimeout(() => {
        if (!user.hasRecharged || user.totalCoins < 10) {
            elements.rechargeMessage.textContent = user.hasRecharged ?
                'Insufficient coins! Buy 100 coins for ₹100.' :
                'Buy 100 coins for ₹100 to start playing!';
            showSection('rechargeSection');
        } else {
            showSection('gameSection');
        }
        elements.loginBtn.disabled = false;
        elements.loginMessage.textContent = '';
        elements.loginMessage.className = '';
    }, 1000);
}, 300);

// Display profile
function displayProfile() {
    if (!elements.profilePhoto || !elements.profileUsername || !elements.profileRegNumber || !elements.profileMobile || !elements.profileWinnings) {
        console.error('Profile elements missing');
        showSection('loginSection');
        return;
    }
    const user = state.users.find(u => u.username === state.loggedInUser);
    if (!user) {
        showSection('loginSection');
        return;
    }
    elements.profilePhoto.src = user.profilePhoto || 'default-profile.png';
    elements.profilePhoto.onerror = () => {
        console.warn(`Failed to load profile photo for ${user.username}, resetting to default`);
        user.profilePhoto = 'default-profile.png';
        saveState();
        elements.profilePhoto.src = 'default-profile.png';
    };
    elements.profileUsername.textContent = user.username;
    elements.profileRegNumber.textContent = user.registrationNumber;
    elements.profileMobile.textContent = user.mobile;
    elements.profileWinnings.textContent = user.totalWinnings;
    elements.profileDisplay.classList.remove('hidden');
    elements.profileEdit.classList.add('hidden');
    elements.editUsername.value = user.username;
    elements.editMobile.value = user.mobile;
    elements.editPhoto.value = '';
    elements.profileMessage.textContent = '';
    elements.profileMessage.className = '';
}

// Edit profile
function handleEditProfile() {
    if (!elements.profileDisplay || !elements.profileEdit) return;
    elements.profileDisplay.classList.add('hidden');
    elements.profileEdit.classList.remove('hidden');
}

// Save profile
const handleSaveProfile = debounce(() => {
    if (!elements.saveProfileBtn) return;
    elements.saveProfileBtn.disabled = true;
    const newUsername = elements.editUsername.value.trim();
    const newMobile = elements.editMobile.value.trim();
    const file = elements.editPhoto.files[0];
    let newPhoto = state.users.find(u => u.username === state.loggedInUser).profilePhoto;

    if (newUsername && newUsername !== state.loggedInUser) {
        if (state.users.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
            elements.profileMessage.textContent = 'Username already exists!';
            elements.profileMessage.className = 'error';
            elements.saveProfileBtn.disabled = false;
            return;
        }
        if (newUsername.length < 3) {
            elements.profileMessage.textContent = 'Username must be at least 3 characters!';
            elements.profileMessage.className = 'error';
            elements.saveProfileBtn.disabled = false;
            return;
        }
    }

    if (newMobile && newMobile !== state.users.find(u => u.username === state.loggedInUser).mobile) {
        if (state.users.some(u => u.mobile === newMobile)) {
            elements.profileMessage.textContent = 'Mobile number already registered!';
            elements.profileMessage.className = 'error';
            elements.saveProfileBtn.disabled = false;
            return;
        }
        if (!/^\d{10}$/.test(newMobile)) {
            elements.profileMessage.textContent = 'Mobile number must be 10 digits!';
            elements.profileMessage.className = 'error';
            elements.saveProfileBtn.disabled = false;
            return;
        }
    }

    if (file) {
        if (!file.type.match(/^image\/(jpeg|png)$/)) {
            elements.profileMessage.textContent = 'Please select a JPEG or PNG image!';
            elements.profileMessage.className = 'error';
            elements.saveProfileBtn.disabled = false;
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            elements.profileMessage.textContent = 'Image size must be less than 5MB!';
            elements.profileMessage.className = 'error';
            elements.saveProfileBtn.disabled = false;
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            newPhoto = reader.result;
            updateProfile(newUsername, newMobile, newPhoto);
        };
        reader.onerror = () => {
            elements.profileMessage.textContent = 'Error reading image!';
            elements.profileMessage.className = 'error';
            elements.saveProfileBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    } else {
        updateProfile(newUsername, newMobile, newPhoto);
    }
}, 300);

function updateProfile(newUsername, newMobile, newPhoto) {
    const user = state.users.find(u => u.username === state.loggedInUser);
    if (newUsername && newUsername !== state.loggedInUser) {
        // Update invitedBy references
        state.users.forEach(u => {
            if (u.invitedBy === state.loggedInUser) {
                u.invitedBy = newUsername;
            }
        });
        // Update invitedUsers references
        user.invitedUsers.forEach(invited => {
            const invitedUser = state.users.find(u => u.username === invited.username);
            if (invitedUser) {
                invitedUser.invitedBy = newUsername;
            }
        });
        user.username = newUsername;
        user.inviteCode = generateInviteCode(newUsername);
        state.loggedInUser = newUsername;
    }
    if (newMobile && newMobile !== user.mobile) {
        user.mobile = newMobile;
    }
    user.profilePhoto = newPhoto;
    saveState();
    elements.profileMessage.textContent = 'Profile updated successfully!';
    elements.profileMessage.className = 'success';
    setTimeout(() => {
        displayProfile();
        elements.saveProfileBtn.disabled = false;
    }, 1000);
}

// Cancel edit
function handleCancelEdit() {
    displayProfile();
}

// Display invite page
function displayInvitePage() {
    if (!state.loggedInUser) {
        showSection('loginSection');
        return;
    }
    const user = state.users.find(u => u.username === state.loggedInUser);
    if (!user) {
        showSection('loginSection');
        return;
    }
    elements.inviteCode.value = user.inviteCode;
    elements.inviteCoins.textContent = user.inviteCoins || 0;
    if (!user.invitedUsers || user.invitedUsers.length === 0) {
        elements.invitedUsers.innerHTML = '<p>No users invited yet.</p>';
    } else {
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Username</th>
                    <th>Registration Date</th>
                    <th>Coins Earned</th>
                </tr>
            </thead>
            <tbody>
                ${user.invitedUsers.map(u => `
                    <tr>
                        <td>${u.username}</td>
                        <td>${u.date}</td>
                        <td>${u.coinsEarned}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        elements.invitedUsers.innerHTML = '';
        elements.invitedUsers.appendChild(table);
    }
}

// Copy invite code
function handleCopyInviteCode() {
    elements.inviteCode.select();
    try {
        document.execCommand('copy');
        alert('Invite code copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy code. Please copy it manually.');
    }
}

// Populate date filter
function populateDateFilter() {
    if (!elements.dateFilter || !elements.totalUsers) return;
    const dates = [...new Set(state.users.map(u => u.date))].sort().reverse();
    elements.dateFilter.innerHTML = '<option value="">All Dates</option>';
    dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date;
        elements.dateFilter.appendChild(option);
    });
    elements.totalUsers.textContent = state.users.length;
}

// Display users by date
function displayUsersByDate() {
    if (!elements.userList) return;
    const selectedDate = elements.dateFilter.value;
    const filteredUsers = selectedDate ? state.users.filter(u => u.date === selectedDate) : state.users;
    filteredUsers.sort((a, b) => a.username.localeCompare(b.username));
    elements.userList.innerHTML = '';
    if (filteredUsers.length === 0) {
        elements.userList.innerHTML = '<p>No users registered on this date.</p>';
        return;
    }
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Mobile Number</th>
                <th>Registration Number</th>
                <th>Registration Date</th>
                <th>Invited By</th>
            </tr>
        </thead>
        <tbody>
            ${filteredUsers.map(u => `
                <tr>
                    <td>${u.username}</td>
                    <td>${u.email}</td>
                    <td>${u.mobile}</td>
                    <td>${u.registrationNumber}</td>
                    <td>${u.date}</td>
                    <td>${u.invitedBy || 'None'}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    elements.userList.appendChild(table);
}

// Initialize game
function initGame() {
    if (!state.loggedInUser) {
        showSection('loginSection');
        return;
    }
    const user = state.users.find(u => u.username === state.loggedInUser);
    if (!user.hasRecharged) {
        elements.rechargeMessage.textContent = 'Buy 100 coins for ₹100 to start playing!';
        showSection('rechargeSection');
        return;
    }
    if (user.totalCoins < 10) {
        elements.rechargeMessage.textContent = 'Insufficient coins! Buy 100 coins for ₹100.';
        showSection('rechargeSection');
        return;
    }
    elements.currentLevel.textContent = user.currentLevel;
    elements.totalCoins.textContent = user.totalCoins;
    generateBoxes();
}

// Generate boxes
function generateBoxes() {
    if (!elements.boxContainer) return;
    elements.boxContainer.innerHTML = '';
    const user = state.users.find(u => u.username === state.loggedInUser);
    let rewards;
    if (user.currentLevel <= 100) {
        rewards = [100, 100, 50, 50, 50, 'boom', 'boom', 'boom', 'boom', 'boom'];
    } else if (user.currentLevel <= 300) {
        rewards = [100, 50, 50, 50, 'boom', 'boom', 'boom', 'boom', 'boom', 'boom'];
    } else {
        rewards = [100, 50, 50, 'boom', 'boom', 'boom', 'boom', 'boom', 'boom', 'boom'];
    }
    shuffleArray(rewards);
    for (let i = 0; i < 10; i++) {
        const box = document.createElement('div');
        box.classList.add('box');
        box.textContent = '?';
        box.dataset.reward = rewards[i];
        box.addEventListener('click', () => openBox(box), { once: true });
        elements.boxContainer.appendChild(box);
    }
}

// Shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Open box
function openBox(box) {
    if (box.classList.contains('opened')) return;
    const user = state.users.find(u => u.username === state.loggedInUser);
    if (user.totalCoins < 10) {
        elements.message.textContent = 'Insufficient coins!';
        return;
    }
    user.totalCoins -= 10;
    elements.totalCoins.textContent = user.totalCoins;
    box.classList.add('opened');
    const reward = box.dataset.reward;
    box.textContent = reward === 'boom' ? '💥' : reward;
    if (reward === 'boom') {
        elements.message.textContent = 'Boom! Bet lost!';
    } else {
        const coinReward = parseFloat(reward);
        user.totalCoins += coinReward;
        user.totalWinnings += coinReward;
        elements.message.textContent = `You won ${coinReward} coins!`;
    }
    elements.totalCoins.textContent = user.totalCoins;
    saveState();
    Array.from(elements.boxContainer.children).forEach(b => {
        if (!b.classList.contains('opened')) {
            b.classList.add('opened');
            b.textContent = b.dataset.reward === 'boom' ? '💥' : b.dataset.reward;
            b.style.pointerEvents = 'none';
        }
    });
    elements.nextLevel.disabled = false;
}

// Next level
function handleNextLevel() {
    const user = state.users.find(u => u.username === state.loggedInUser);
    if (user.currentLevel < 500) {
        user.currentLevel++;
        saveState();
        showAd();
    } else {
        elements.message.textContent = 'Congratulations! You completed all 500 levels!';
        elements.nextLevel.disabled = true;
    }
}

// Show ad
function showAd() {
    if (state.ads.length === 0) {
        initGame();
        return;
    }
    const ad = state.ads[Math.floor(Math.random() * state.ads.length)];
    elements.adImage.src = ad.image;
    elements.adLink.href = ad.link || '#';
    showSection('adSection');
    let timeLeft = 10;
    elements.adTimer.textContent = timeLeft;
    elements.skipAd.disabled = true;
    state.adTimer = setInterval(() => {
        timeLeft--;
        elements.adTimer.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(state.adTimer);
            state.adTimer = null;
            elements.skipAd.disabled = false;
        }
    }, 1000);
}

// Skip ad
function handleSkipAd() {
    if (state.adTimer) {
        clearInterval(state.adTimer);
        state.adTimer = null;
    }
    showSection('gameSection');
}

// Recharge
function handleRecharge() {
    if (state.isRechargeProcessing) return;
    state.isRechargeProcessing = true;
    elements.rechargeMessage.textContent = 'Processing... Please complete the payment.';
    elements.rechargeBtn.disabled = true;
    localStorage.setItem('rechargeStartTime', Date.now().toString());
    state.rechargeTimeout = setTimeout(() => {
        state.isRechargeProcessing = false;
        const user = state.users.find(u => u.username === state.loggedInUser);
        if (user) {
            user.hasRecharged = true;
            user.totalCoins += 100;
            user.totalWinnings += 100;
            if (user.invitedBy) {
                const inviter = state.users.find(u => u.username === user.invitedBy);
                if (inviter) {
                    const inviteReward = 100;
                    inviter.inviteCoins = (inviter.inviteCoins || 0) + inviteReward;
                    inviter.totalCoins += inviteReward; // Add invite coins to totalCoins
                    inviter.invitedUsers = inviter.invitedUsers || [];
                    inviter.invitedUsers.push({
                        username: user.username,
                        date: user.date,
                        coinsEarned: inviteReward
                    });
                    saveState();
                }
            }
            saveState();
            elements.rechargeMessage.textContent = 'Recharge successful! You got 100 coins.';
            elements.rechargeBtn.disabled = false;
            localStorage.removeItem('rechargeStartTime');
            setTimeout(() => showSection('gameSection'), 2000);
        } else {
            elements.rechargeMessage.textContent = 'Error: User not found.';
            elements.rechargeBtn.disabled = false;
            localStorage.removeItem('rechargeStartTime');
            showSection('loginSection');
        }
    }, 90000);
}

// Handle visibility change
function handleVisibilityChange() {
    if (document.visibilityState !== 'visible') return;
    if (state.isRechargeProcessing) {
        clearTimeout(state.rechargeTimeout);
        const user = state.users.find(u => u.username === state.loggedInUser);
        if (!user) {
            state.isRechargeProcessing = false;
            localStorage.removeItem('rechargeStartTime');
            showSection('loginSection');
            return;
        }
        const rechargeStartTime = parseInt(localStorage.getItem('rechargeStartTime') || '0', 10);
        const elapsedTime = Date.now() - rechargeStartTime;
        if (elapsedTime <= 90000) {
            const remainingTime = 90000 - elapsedTime;
            elements.rechargeMessage.textContent = 'Processing... Please complete the payment.';
            state.rechargeTimeout = setTimeout(() => {
                state.isRechargeProcessing = false;
                user.hasRecharged = true;
                user.totalCoins += 100;
                user.totalWinnings += 100;
                if (user.invitedBy) {
                    const inviter = state.users.find(u => u.username === user.invitedBy);
                    if (inviter) {
                        const inviteReward = 100;
                        inviter.inviteCoins = (inviter.inviteCoins || 0) + inviteReward;
                        inviter.totalCoins += inviteReward; // Add invite coins to totalCoins
                        inviter.invitedUsers = inviter.invitedUsers || [];
                        inviter.invitedUsers.push({
                            username: user.username,
                            date: user.date,
                            coinsEarned: inviteReward
                        });
                        saveState();
                    }
                }
                saveState();
                elements.rechargeMessage.textContent = 'Recharge successful! You got 100 coins.';
                elements.rechargeBtn.disabled = false;
                localStorage.removeItem('rechargeStartTime');
                showSection('rechargeSection');
                setTimeout(() => showSection('gameSection'), 2000);
            }, remainingTime);
        } else {
            state.isRechargeProcessing = false;
            user.hasRecharged = true;
            user.totalCoins += 100;
            user.totalWinnings += 100;
            if (user.invitedBy) {
                const inviter = state.users.find(u => u.username === user.invitedBy);
                if (inviter) {
                    const inviteReward = 100;
                    inviter.inviteCoins = (inviter.inviteCoins || 0) + inviteReward;
                    inviter.totalCoins += inviteReward; // Add invite coins to totalCoins
                    inviter.invitedUsers = inviter.invitedUsers || [];
                    inviter.invitedUsers.push({
                        username: user.username,
                        date: user.date,
                        coinsEarned: inviteReward
                    });
                    saveState();
                }
            }
            saveState();
            elements.rechargeMessage.textContent = 'Recharge successful! You got 100 coins.';
            elements.rechargeBtn.disabled = false;
            localStorage.removeItem('rechargeStartTime');
            showSection('rechargeSection');
            setTimeout(() => showSection('gameSection'), 2000);
        }
    } else {
        const user = state.users.find(u => u.username === state.loggedInUser);
        if (!user || !user.hasRecharged || user.totalCoins < 10) {
            elements.rechargeMessage.textContent = user && user.hasRecharged ?
                'Insufficient coins! Buy 100 coins for ₹100.' :
                'Buy 100 coins for ₹100 to start playing!';
            showSection('rechargeSection');
        }
    }
}

// Admin login
const handleAdminLogin = debounce(() => {
    if (!elements.adminLoginBtn) return;
    elements.adminLoginBtn.disabled = true;
    const username = elements.adminUsername.value.trim();
    const password = elements.adminPassword.value.trim();
    if (username === '000' && password === '000') {
        elements.adminLogin.classList.add('hidden');
        elements.adminControls.classList.remove('hidden');
        elements.adminUsername.value = '';
        elements.adminPassword.value = '';
        elements.adminLoginMessage.textContent = 'Login successful!';
        elements.adminLoginMessage.className = 'success';
        showAdminTab('adsTab');
    } else {
        elements.adminLoginMessage.textContent = 'Invalid credentials!';
        elements.adminLoginMessage.className = 'error';
    }
    elements.adminLoginBtn.disabled = false;
}, 300);

// Upload ad
function handleUploadAd() {
    const file = elements.adUpload.files[0];
    const link = elements.adLinkInput.value.trim();
    if (!file) {
        elements.adUploadMessage.textContent = 'Please select an image!';
        elements.adUploadMessage.className = 'error';
        return;
    }
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
        elements.adUploadMessage.textContent = 'Please select a JPEG or PNG image!';
        elements.adUploadMessage.className = 'error';
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        elements.adUploadMessage.textContent = 'Image size must be less than 5MB!';
        elements.adUploadMessage.className = 'error';
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        state.ads.push({ image: reader.result, link: link || '#' });
        saveState();
        elements.adUpload.value = '';
        elements.adLinkInput.value = '';
        elements.adUploadMessage.textContent = 'Ad uploaded successfully!';
        elements.adUploadMessage.className = 'success';
        displayAds();
        setTimeout(() => {
            elements.adUploadMessage.textContent = '';
            elements.adUploadMessage.className = '';
        }, 2000);
    };
    reader.onerror = () => {
        elements.adUploadMessage.textContent = 'Error reading image!';
        elements.adUploadMessage.className = 'error';
    };
    reader.readAsDataURL(file);
}

// Display ads in admin panel
function displayAds() {
    if (!elements.adList) return;
    elements.adList.innerHTML = '';
    state.ads.forEach((ad, index) => {
        const adItem = document.createElement('div');
        adItem.classList.add('ad-item');
        const img = document.createElement('img');
        img.src = ad.image;
        const linkText = document.createElement('p');
        linkText.textContent = ad.link || 'No link';
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-ad-btn');
        deleteBtn.textContent = 'X';
        deleteBtn.addEventListener('click', () => {
            state.ads.splice(index, 1);
            saveState();
            displayAds();
        }, { once: true });
        adItem.appendChild(img);
        adItem.appendChild(linkText);
        adItem.appendChild(deleteBtn);
        elements.adList.appendChild(adItem);
    });
}

// Admin logout
function handleAdminLogout() {
    elements.adminLogin.classList.remove('hidden');
    elements.adminControls.classList.add('hidden');
    elements.adminUsername.value = '';
    elements.adminPassword.value = '';
    elements.adminLoginMessage.textContent = '';
    if (state.loggedInUser) {
        initGame();
    } else {
        showSection('loginSection');
    }
}

// Event listeners
function setupEventListeners() {
    // Clear existing listeners
    const buttons = [
        'registerBtn', 'loginBtn', 'linkToLogin', 'linkToRegister', 'navGame', 'navRecharge',
        'navWithdrawal', 'navInvite', 'navAdmin', 'nextLevel', 'skipAd', 'rechargeBtn', 'adminLoginBtn',
        'uploadAdBtn', 'adminLogout', 'profileBtn', 'editProfileBtn', 'saveProfileBtn',
        'cancelEditBtn', 'tabAds', 'tabUsers', 'copyInviteCode'
    ];
    buttons.forEach(id => {
        const el = elements[id];
        if (el) {
            const clone = el.cloneNode(true);
            el.replaceWith(clone);
            elements[id] = clone;
        }
    });

    // Navigation
    if (elements.navGame) elements.navGame.addEventListener('click', () => showSection('gameSection'));
    if (elements.navRecharge) elements.navRecharge.addEventListener('click', () => showSection('rechargeSection'));
    if (elements.navWithdrawal) elements.navWithdrawal.addEventListener('click', () => showSection('withdrawalSection'));
    if (elements.navInvite) elements.navInvite.addEventListener('click', () => showSection('inviteSection'));
    if (elements.navAdmin) elements.navAdmin.addEventListener('click', () => showSection('adminSection'));

    // Register/Login
    if (elements.registerBtn) elements.registerBtn.addEventListener('click', handleRegister);
    if (elements.loginBtn) elements.loginBtn.addEventListener('click', handleLogin);
    if (elements.linkToLogin) elements.linkToLogin.addEventListener('click', () => showSection('loginSection'));
    if (elements.linkToRegister) elements.linkToRegister.addEventListener('click', () => showSection('registerSection'));

    // Game
    if (elements.nextLevel) elements.nextLevel.addEventListener('click', handleNextLevel);
    if (elements.skipAd) elements.skipAd.addEventListener('click', handleSkipAd);
    if (elements.rechargeBtn) elements.rechargeBtn.addEventListener('click', handleRecharge);

    // Admin
    if (elements.adminLoginBtn) elements.adminLoginBtn.addEventListener('click', handleAdminLogin);
    if (elements.uploadAdBtn) elements.uploadAdBtn.addEventListener('click', handleUploadAd);
    if (elements.adminLogout) elements.adminLogout.addEventListener('click', handleAdminLogout);
    if (elements.tabAds) elements.tabAds.addEventListener('click', () => showAdminTab('adsTab'));
    if (elements.tabUsers) elements.tabUsers.addEventListener('click', () => showAdminTab('usersTab'));
    if (elements.dateFilter) elements.dateFilter.addEventListener('change', displayUsersByDate);

    // Profile
    if (elements.profileBtn) elements.profileBtn.addEventListener('click', () => showSection('profileSection'));
    if (elements.editProfileBtn) elements.editProfileBtn.addEventListener('click', handleEditProfile);
    if (elements.saveProfileBtn) elements.saveProfileBtn.addEventListener('click', handleSaveProfile);
    if (elements.cancelEditBtn) elements.cancelEditBtn.addEventListener('click', handleCancelEdit);

    // Invite
    if (elements.copyInviteCode) elements.copyInviteCode.addEventListener('click', handleCopyInviteCode);

    // Visibility change
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

// Initialize
function initialize() {
    if (missingElements.length) return;
    setupEventListeners();
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite');
    if (inviteCode && !state.loggedInUser) {
        showSection('registerSection');
        elements.registerInviteCode.value = inviteCode;
    } else if (!state.users.length || !state.loggedInUser) {
        showSection('registerSection');
    } else {
        showSection('loginSection');
    }
}
initialize();