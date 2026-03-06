// =============================================
// Budget Homes – Site JavaScript
// =============================================

// ── Navbar scroll effect ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── Hamburger menu ──
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
    hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
});

document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger?.classList.remove('open');
        mobileMenu?.classList.remove('open');
        hamburger?.setAttribute('aria-expanded', 'false');
        hamburger?.setAttribute('aria-label', 'Open menu');
        document.body.style.overflow = '';
    });
});

// ── Scroll reveal ──
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 80);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Animated counters ──
function animateCounter(el, target, suffix = '') {
    const isDecimal = target % 1 !== 0;
    const decimals = isDecimal ? 1 : 0;
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            el.textContent = (isDecimal ? target.toFixed(decimals) : target) + suffix;
            clearInterval(timer);
        } else {
            el.textContent = (isDecimal ? current.toFixed(decimals) : Math.floor(current)) + suffix;
        }
    }, 20);
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            document.querySelectorAll('.stat-num').forEach(el => {
                const val = parseFloat(el.dataset.val);
                const suffix = el.dataset.suffix || '';
                animateCounter(el, val, suffix);
            });
            statsObserver.disconnect();
        }
    });
}, { threshold: 0.5 });

const statsSection = document.getElementById('stats');
if (statsSection) statsObserver.observe(statsSection);

// ── Lightbox ──
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbClose = document.getElementById('lbClose');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');

const galleryImages = Array.from(document.querySelectorAll('.gallery-item img'));
let currentIdx = 0;

function openLightbox(idx) {
    if (!lbImg || !lightbox) return;
    currentIdx = idx;
    lbImg.src = galleryImages[idx].src;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    if (lightbox) lightbox.classList.remove('open');
    document.body.style.overflow = '';
}

function showPrev() {
    currentIdx = (currentIdx - 1 + galleryImages.length) % galleryImages.length;
    openLightbox(currentIdx);
}

function showNext() {
    currentIdx = (currentIdx + 1) % galleryImages.length;
    openLightbox(currentIdx);
}

document.querySelectorAll('.gallery-item').forEach((item, idx) => {
    item.addEventListener('click', () => openLightbox(idx));
});

lbClose?.addEventListener('click', closeLightbox);
lbPrev?.addEventListener('click', showPrev);
lbNext?.addEventListener('click', showNext);
lightbox?.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', e => {
    if (!lightbox?.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
});

// ── Date picker validation ──
const checkIn = document.getElementById('checkIn');
const checkOut = document.getElementById('checkOut');
const todayStr = new Date().toISOString().split('T')[0];

if (checkIn) checkIn.min = todayStr;
if (checkOut) checkOut.min = todayStr;

checkIn?.addEventListener('change', () => {
    if (checkOut) {
        checkOut.min = checkIn.value;
        if (checkOut.value && checkOut.value <= checkIn.value) {
            checkOut.value = '';
        }
    }
});

// ── Booking Form ──
const form = document.getElementById('bookingForm');
const formMsg = document.getElementById('formMsg');
const submitBtn = document.getElementById('submitBtn');

form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (checkIn && checkOut && checkIn.value && checkOut.value && checkOut.value <= checkIn.value) {
        showMsg('Check-out date must be after check-in date.', 'error');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner">⏳</span> Sending…';
    }

    try {
        const data = new FormData(form);
        const response = await fetch(form.action, {
            method: 'POST',
            body: data,
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            showMsg('✅ Booking request sent! We\'ll confirm your stay within 24 hours.', 'success');
            form.reset();
            showToast('🎉 Request received! Check your email for confirmation.');
        } else {
            const json = await response.json();
            const err = json.errors?.map(e => e.message).join(', ') || 'Submission failed.';
            showMsg('⚠️ ' + err, 'error');
        }
    } catch (err) {
        showMsg('⚠️ Network error. Please call us directly at +91 77361 61763.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '✦ Send Booking Request';
        }
    }
});

function showMsg(text, type) {
    if (!formMsg) return;
    formMsg.textContent = text;
    formMsg.className = 'form-msg ' + type;
    formMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Toast notification ──
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4500);
}

// ── Mobile Contact Widget ──
const mcwToggle = document.getElementById('mcwToggle');
const mcwOptions = document.getElementById('mcwOptions');
const mcwOpenIcon = document.querySelector('.mcw-icon-open');
const mcwCloseIcon = document.querySelector('.mcw-icon-close');

mcwToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!mcwOptions) return;
    const isOpen = mcwOptions.classList.toggle('active');
    mcwToggle.setAttribute('aria-expanded', isOpen);
    if (mcwOpenIcon) mcwOpenIcon.style.display = isOpen ? 'none' : 'flex';
    if (mcwCloseIcon) mcwCloseIcon.style.display = isOpen ? 'flex' : 'none';
});

document.addEventListener('click', (e) => {
    if (mcwOptions?.classList.contains('active') && !e.target.closest('#mobileContactWidget')) {
        mcwOptions.classList.remove('active');
        mcwToggle?.setAttribute('aria-expanded', 'false');
        if (mcwOpenIcon) mcwOpenIcon.style.display = 'flex';
        if (mcwCloseIcon) mcwCloseIcon.style.display = 'none';
    }
});

// ── Interactive Hero Day/Night Toggle ──
const heroCanvas = document.getElementById('heroCanvas');
if (heroCanvas) {
    const handleWipe = (clientX) => {
        const rect = heroCanvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
        heroCanvas.style.setProperty('--wipe', `${percent}%`);
    };

    heroCanvas.addEventListener('mousemove', (e) => handleWipe(e.clientX));
    heroCanvas.addEventListener('touchmove', (e) => {
        handleWipe(e.touches[0].clientX);
    }, { passive: true });
}

// ── Smooth active nav link on scroll ──
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
        const offset = s.offsetTop;
        if (window.scrollY >= offset - 120) current = s.id;
    });
    navLinks.forEach(a => {
        a.style.color = a.getAttribute('href') === '#' + current ? 'var(--gold)' : '';
    });
}, { passive: true });
