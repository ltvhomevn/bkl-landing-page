// ===== COUNTDOWN TIMER =====
function initCountdown() {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    endDate.setHours(23, 59, 59, 0);

    function updateTimer() {
        const now = new Date();
        const diff = endDate - now;
        if (diff <= 0) { endDate.setDate(endDate.getDate() + 7); return; }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }
    updateTimer();
    setInterval(updateTimer, 1000);
}

// ===== MOBILE MENU =====
function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const nav = document.getElementById('nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
        nav.classList.toggle('active');
        btn.classList.toggle('active');
    });
    nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            btn.classList.remove('active');
        });
    });
}

// ===== STICKY HEADER =====
function initStickyHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80;
            const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

// ===== FORM SUBMIT =====
function handleFormSubmit(e) {
    e.preventDefault();
    const form = document.getElementById('leadForm');
    const success = document.getElementById('formSuccess');
    const btn = document.getElementById('submitBtn');
    btn.textContent = '⏳ Đang gửi...';
    btn.disabled = true;

    // Gửi dữ liệu form qua Formspree
    const formData = new FormData(form);
    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
    })
    .then(response => {
        if (response.ok) {
            form.style.display = 'none';
            success.style.display = 'block';
        } else {
            btn.textContent = '❌ Lỗi, thử lại';
            btn.disabled = false;
        }
    })
    .catch(() => {
        // Fallback: hiển thị thành công dù offline
        form.style.display = 'none';
        success.style.display = 'block';
    });
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.product-card, .feature-card, .showroom-card, .gallery-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
}

// Add CSS class for animations
const style = document.createElement('style');
style.textContent = '.animate-visible { opacity: 1 !important; transform: translateY(0) !important; }';
document.head.appendChild(style);

// ===== COMBO MODAL =====
function openComboModal() {
    const modal = document.getElementById('comboModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeComboModal(e) {
    if (e && e.target && !e.target.classList.contains('combo-modal-overlay')) return;
    const modal = document.getElementById('comboModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeComboModal();
        closeLavaboModal();
    }
});

// ===== LAVABO MODAL =====
function openLavaboModal() {
    const modal = document.getElementById('lavaboModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLavaboModal(e) {
    if (e && e.target && !e.target.classList.contains('combo-modal-overlay')) return;
    const modal = document.getElementById('lavaboModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ===== DYNAMIC SALE BANNER =====
function initDynamicSale() {
    const saleText = document.getElementById('dynamic-sale-text');
    if (!saleText) return;

    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    
    let eventName = "THÁNG " + month;
    
    if (month === 1 && day <= 15) eventName = "TẾT DƯƠNG LỊCH";
    else if (month === 2 && day <= 14) eventName = "LỄ TÌNH NHÂN";
    else if (month === 3 && day <= 8) eventName = "QUỐC TẾ PHỤ NỮ";
    else if (month === 4) eventName = "ĐẠI LỄ 30/4";
    else if (month === 5 && day <= 5) eventName = "ĐẠI LỄ 1/5";
    else if (month === 6 && day <= 1) eventName = "QUỐC TẾ THIẾU NHI";
    else if (month === 9 && day <= 5) eventName = "MỪNG QUỐC KHÁNH";
    else if (month === 10 && day <= 20) eventName = "PHỤ NỮ VIỆT NAM";
    else if (month === 11 && day <= 20) eventName = "NHÀ GIÁO VN";
    else if (month === 12 && day <= 25) eventName = "GIÁNG SINH";
    else if (month === 12) eventName = "CHÀO NĂM MỚI";

    saleText.innerHTML = `SIÊU SALE ${eventName} - GIẢM GIÁ LÊN ĐẾN <strong>50%</strong> TOÀN BỘ SẢN PHẨM + QUÀ TẶNG HẤP DẪN`;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    initDynamicSale();
    initCountdown();
    initMobileMenu();
    initStickyHeader();
    initScrollAnimations();
});
