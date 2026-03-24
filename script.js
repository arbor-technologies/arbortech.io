/* ===== INTERNATIONALIZATION ===== */

let currentLang = 'en';

function getPreferredLanguage() {
    const saved = localStorage.getItem('preferredLanguage');
    if (saved && translations[saved]) return saved;

    const browserLang = navigator.language || navigator.userLanguage || '';
    const lang = browserLang.toLowerCase();

    if (lang.startsWith('ko')) return 'ko';
    if (lang.startsWith('ja')) return 'ja';
    if (lang === 'zh-tw' || lang === 'zh-hk' || lang === 'zh-mo') return 'zh-TW';
    if (lang.startsWith('zh')) return 'zh';
    if (lang.startsWith('es')) return 'es';
    if (lang.startsWith('ar')) return 'ar';
    if (lang.startsWith('pt')) return 'pt';
    return 'en';
}

function getTranslation(lang, key) {
    const keys = key.split('.');
    let value = translations[lang];
    for (const k of keys) {
        if (!value) return key;
        value = value[k];
    }
    return value || key;
}

function applyTranslations(lang) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
        const key = el.getAttribute('data-i18n');
        const translation = getTranslation(lang, key);
        if (translation !== key) {
            el.textContent = translation;
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
        const key = el.getAttribute('data-i18n-placeholder');
        const translation = getTranslation(lang, key);
        if (translation !== key) {
            el.placeholder = translation;
        }
    });

    // Update HTML lang and dir attributes
    document.documentElement.lang = lang === 'zh-TW' ? 'zh-Hant' : lang;

    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    if (rtlLanguages.includes(lang)) {
        document.documentElement.dir = 'rtl';
    } else {
        document.documentElement.dir = 'ltr';
    }
}

function toggleLanguageDropdown() {
    var switcher = document.querySelector('.language-switcher');
    var btn = switcher.querySelector('button');
    var isOpen = switcher.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);

    if (isOpen) {
        var activeBtn = switcher.querySelector('.language-dropdown button.active');
        if (activeBtn) activeBtn.focus();
    }
}

function closeLanguageDropdown() {
    var switcher = document.querySelector('.language-switcher');
    switcher.classList.remove('open');
    switcher.querySelector('button').setAttribute('aria-expanded', 'false');
}

function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);
    applyTranslations(lang);
    updateActiveLanguage(lang);
    closeLanguageDropdown();
}

function updateActiveLanguage(lang) {
    var buttons = document.querySelectorAll('.language-dropdown button');
    buttons.forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    var currentLangDisplay = document.querySelector('.current-lang');
    var displayMap = {
        en: 'EN', ko: 'KO', ja: 'JA', zh: 'ZH', 'zh-TW': 'TW',
        es: 'ES', ar: 'AR', pt: 'PT'
    };
    currentLangDisplay.textContent = displayMap[lang] || lang.toUpperCase();
}

/* ===== INITIALIZATION ===== */

document.addEventListener('DOMContentLoaded', function () {
    // Initialize language
    currentLang = getPreferredLanguage();
    applyTranslations(currentLang);
    updateActiveLanguage(currentLang);

    // Language switcher toggle
    var langToggle = document.querySelector('.language-switcher > button');
    langToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleLanguageDropdown();
    });

    // Language selection buttons
    document.querySelectorAll('.language-dropdown button').forEach(function (btn) {
        btn.addEventListener('click', function () {
            changeLanguage(this.getAttribute('data-lang'));
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.language-switcher')) {
            closeLanguageDropdown();
        }
    });

    // Keyboard nav for language dropdown
    document.querySelector('.language-dropdown').addEventListener('keydown', function (e) {
        var items = Array.from(this.querySelectorAll('button'));
        var idx = items.indexOf(document.activeElement);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            items[(idx + 1) % items.length].focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            items[(idx - 1 + items.length) % items.length].focus();
        } else if (e.key === 'Escape') {
            closeLanguageDropdown();
            langToggle.focus();
        }
    });

    /* ===== SMOOTH SCROLLING ===== */
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Close mobile menu if open
                var navLinks = document.getElementById('nav-links');
                if (navLinks.classList.contains('mobile-visible')) {
                    navLinks.classList.remove('mobile-visible');
                    var toggle = document.querySelector('.mobile-menu-toggle');
                    if (toggle) {
                        toggle.setAttribute('aria-expanded', 'false');
                        toggle.textContent = '\u2630';
                    }
                }
            }
        });
    });

    /* ===== NAVBAR SCROLL EFFECT ===== */
    var navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });

    /* ===== CONTACT FORM ===== */
    var contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            var button = contactForm.querySelector('button[type="submit"]');
            var formStatus = document.getElementById('formStatus');
            var originalText = button.textContent;

            button.disabled = true;
            button.textContent = getTranslation(currentLang, 'contact.form.sending');

            try {
                var response = await fetch(contactForm.action, {
                    method: contactForm.method,
                    body: new FormData(contactForm),
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    button.textContent = getTranslation(currentLang, 'contact.form.success');
                    button.classList.add('success');
                    formStatus.textContent = getTranslation(currentLang, 'contact.form.success');
                    contactForm.reset();
                    setTimeout(function () {
                        button.textContent = originalText;
                        button.classList.remove('success');
                        button.disabled = false;
                    }, 3000);
                } else {
                    var data = await response.json();
                    var errorMsg = data.errors
                        ? data.errors.map(function (err) { return err.message; }).join(', ')
                        : getTranslation(currentLang, 'contact.form.error');
                    button.textContent = errorMsg;
                    button.classList.add('error');
                    formStatus.textContent = errorMsg;
                    setTimeout(function () {
                        button.textContent = originalText;
                        button.classList.remove('error');
                        button.disabled = false;
                    }, 5000);
                }
            } catch (err) {
                button.textContent = getTranslation(currentLang, 'contact.form.networkError');
                button.classList.add('error');
                formStatus.textContent = getTranslation(currentLang, 'contact.form.networkError');
                setTimeout(function () {
                    button.textContent = originalText;
                    button.classList.remove('error');
                    button.disabled = false;
                }, 5000);
            }
        });
    }

    /* ===== SCROLL ANIMATIONS ===== */
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry, index) {
                if (entry.isIntersecting) {
                    entry.target.style.transitionDelay = (index * 0.1) + 's';
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.fade-in').forEach(function (el) {
            observer.observe(el);
        });
    }

    /* ===== MOBILE MENU ===== */
    createMobileMenu();
    window.addEventListener('resize', function () {
        if (window.innerWidth <= 640) {
            createMobileMenu();
        } else {
            removeMobileMenu();
        }
    });
});

var mobileMenuCreated = false;

function createMobileMenu() {
    if (mobileMenuCreated) return;
    if (window.innerWidth > 640) return;

    var navbar = document.querySelector('.navbar .container');
    var navLinks = document.getElementById('nav-links');
    var langSwitcher = document.querySelector('.language-switcher');

    var toggle = document.createElement('button');
    toggle.className = 'mobile-menu-toggle';
    toggle.setAttribute('aria-label', 'Toggle navigation menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'nav-links');
    toggle.textContent = '\u2630';

    toggle.addEventListener('click', function () {
        var isOpen = navLinks.classList.toggle('mobile-visible');
        this.setAttribute('aria-expanded', isOpen);
        this.textContent = isOpen ? '\u2715' : '\u2630';
    });

    navbar.insertBefore(toggle, langSwitcher);
    mobileMenuCreated = true;
}

function removeMobileMenu() {
    var toggle = document.querySelector('.mobile-menu-toggle');
    if (toggle) {
        toggle.remove();
        mobileMenuCreated = false;
        var navLinks = document.getElementById('nav-links');
        navLinks.classList.remove('mobile-visible');
    }
}
