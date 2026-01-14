const requestBtn = document.getElementById('requestBtn');
const destInput = document.getElementById('destInput');

// Slider setup
const slidesContainer = document.querySelector('.slides');
const thumbsContainer = document.getElementById('thumbnails');
const prevBtn = document.querySelector('.slider-btn.prev');
const nextBtn = document.querySelector('.slider-btn.next');
const selectedCarEl = document.getElementById('selectedCar');
let slides = [];
let thumbs = [];
let currentSlide = 0;
let slideInterval = null;

function getCarName(item) {
    if (!item) return '';
    if (typeof item === 'string') {
        const name = item.split('/').pop();
        return name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    }
    // assume object { src, name }
    if (item.name) return item.name;
    if (item.src) return item.src.split('/').pop().replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    return '';
} 

const buildSlider = (imageList) => {
    if (!slidesContainer) return;
    slidesContainer.innerHTML = (imageList || []).map((item, i) => {
        const src = typeof item === 'string' ? item : item.src;
        const name = getCarName(item);
        return `
        <div class="slide" data-car="${name}">
            <img src="${src}" alt="${name}">
        </div>
    `;
    }).join('');

    thumbsContainer.innerHTML = (imageList || []).map((item, i) => {
        const src = typeof item === 'string' ? item : item.src;
        return `
        <img class="thumb ${i === 0 ? 'active' : ''}" src="${src}" data-index="${i}" alt="">
    `;
    }).join('');

    // re-query
    slides = document.querySelectorAll('.slide');
    thumbs = document.querySelectorAll('.thumb');

    // attach thumb listeners
    thumbs.forEach(t => t.addEventListener('click', (e) => {
        const idx = Number(t.dataset.index || 0);
        updateSlider(idx);
        resetAutoplay();
    }));

    // reset current position
    updateSlider(0);
};

const updateSlider = (index) => {
    if (!slidesContainer) return;
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    currentSlide = clamped;
    slidesContainer.style.transform = `translateX(-${clamped * 100}%)`;

    thumbs.forEach(t => t.classList.remove('active'));
    if (thumbs[clamped]) thumbs[clamped].classList.add('active');

    const carName = slides[clamped]?.dataset?.car || '';
    if (selectedCarEl) selectedCarEl.innerText = carName;
};

const nextSlide = () => updateSlider(currentSlide + 1 >= slides.length ? 0 : currentSlide + 1);
const prevSlide = () => updateSlider(currentSlide - 1 < 0 ? slides.length - 1 : currentSlide - 1);

prevBtn?.addEventListener('click', () => { prevSlide(); resetAutoplay(); });
nextBtn?.addEventListener('click', () => { nextSlide(); resetAutoplay(); });

const startAutoplay = () => { stopAutoplay(); slideInterval = setInterval(nextSlide, 4000); };
const stopAutoplay = () => { if (slideInterval) clearInterval(slideInterval); slideInterval = null; };
const resetAutoplay = () => { startAutoplay(); };

// load images from server
const loadImages = async () => {
    try {
        const res = await fetch('/api/images');
        if (!res.ok) throw new Error('No image list');
        const images = await res.json();
        if (images && images.length) {
            buildSlider(images);
            startAutoplay();
            return;
        }
    } catch (err) {
        console.warn('Failed to load images from server, falling back', err);
    }
    // fallback images (use objects with friendly names)
    const fallback = [
        { src: './image/car1.jpg', name: 'Sedan' },
        { src: './image/car3.jpg', name: 'SUV' },
        { src: './image/car4.jpg', name: 'Coupe' }
    ];
    buildSlider(fallback);
    startAutoplay();
};

// init
loadImages();

// Helper to fill input from popular cards
window.selectDest = (place) => {
    if (destInput) destInput.value = place;
};

// --- Auth UI / logic ---
const authPanel = document.getElementById('authPanel');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authMessage = document.getElementById('authMessage');
const profileBtn = document.getElementById('profileBtn');

const setMessage = (msg, isError = false) => {
    if (!authMessage) return;
    authMessage.innerText = msg;
    authMessage.style.color = isError ? '#fda4af' : '';
    setTimeout(() => { if (authMessage) authMessage.innerText = ''; }, 3500);
};

// Tab switching
authPanel?.addEventListener('click', (e) => {
    const t = e.target.closest('.tab');
    if (!t) return;
    const tab = t.dataset.tab;
    authPanel.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b === t));
    loginForm.classList.toggle('hidden', tab !== 'login');
    registerForm.classList.toggle('hidden', tab !== 'register');
});

// Register
registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    if (!email || !password) return setMessage('Email & password required', true);
    try {
        const res = await fetch('/api/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password }) });
        const json = await res.json();
        if (!res.ok) return setMessage(json.error || 'Registration failed', true);
        setMessage('Registered — You can now log in');
        // switch to login tab
        authPanel.querySelector('[data-tab="login"]').click();
    } catch (err) {
        console.error(err); setMessage('Registration failed', true);
    }
});

// Login
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) return setMessage('Email & password required', true);
    try {
        const res = await fetch('/api/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
        const json = await res.json();
        if (!res.ok) return setMessage(json.error || 'Login failed', true);
        // store user
        localStorage.setItem('qr_user', JSON.stringify(json.user));
        updateAuthUI();
        setMessage('Logged in');
    } catch (err) {
        console.error(err); setMessage('Login failed', true);
    }
});

const logout = () => { localStorage.removeItem('qr_user'); updateAuthUI(); };

const updateAuthUI = () => {
    const raw = localStorage.getItem('qr_user');
    const user = raw ? JSON.parse(raw) : null;
    // ensure profile button exists before manipulating it
    if (!profileBtn) return;
    if (user) {
        profileBtn.classList.add('logged-in');
        profileBtn.innerText = user.name ? user.name.split(' ')[0] : user.email;
        // hide auth panel when logged in
        if (authPanel) authPanel.classList.remove('open');
        // convert profile click to logout
        profileBtn.onclick = () => { if (confirm('Logout?')) logout(); };
    } else {
        profileBtn.classList.remove('logged-in');
        profileBtn.innerText = '👤';
        // start with auth panel closed; clicking profile toggles it
        if (authPanel) authPanel.classList.remove('open');
        profileBtn.onclick = () => {
            if (!authPanel) return;
            const wasOpen = authPanel.classList.contains('open');
            if (!wasOpen) {
                authPanel.classList.add('open');
                // open the login tab by default
                const loginTab = authPanel.querySelector('[data-tab="login"]');
                loginTab?.click();
                setTimeout(() => document.getElementById('loginEmail')?.focus(), 50);
            } else {
                authPanel.classList.remove('open');
            }
        };
    }
};

updateAuthUI();

// Function to send data to MongoDB via our Server
const handleRequest = async () => {
    const destination = destInput.value;

    if (!destination) {
        alert("Please enter a destination first!");
        return;
    }

    requestBtn.innerText = "Connecting...";
    requestBtn.disabled = true;

    try {
        const rawUser = localStorage.getItem('qr_user');
        const user = rawUser ? JSON.parse(rawUser) : null;
        const payload = { destination };
        if (user && user.email) payload.userEmail = user.email;

        const response = await fetch('/api/rides', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Ride Confirmed to ${data.ride.destination}!`);
            destInput.value = "";
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to request ride.");
    } finally {
        requestBtn.innerText = "Request Ride";
        requestBtn.disabled = false;
    }
};

requestBtn?.addEventListener('click', handleRequest);