/* ============================================
   Arbor Waitlist — script.js
   Includes: nav, animations, FAQ, form, i18n, a11y
   ============================================ */

// --- LANGUAGE DETECTION & SWITCHING ---

const SUPPORTED_LANGS = ['en', 'ar', 'ko', 'ja', 'es', 'zh', 'zh-TW'];
const RTL_LANGS = ['ar'];
const LANG_STORAGE_KEY = 'arbor-lang';

// Map UI lang codes to BCP-47 values for the <html lang> attribute.
const HTML_LANG_MAP = {
  'en': 'en',
  'ar': 'ar',
  'ko': 'ko',
  'ja': 'ja',
  'es': 'es',
  'zh': 'zh-Hans',
  'zh-TW': 'zh-Hant'
};

// Native names shown in the dropdown + the short "badge" used in the toggle.
const LANG_LABELS = {
  'en':    { native: 'English',    short: 'EN' },
  'ar':    { native: 'العربية',    short: 'ع'  },
  'ko':    { native: '한국어',      short: '한' },
  'ja':    { native: '日本語',      short: '日' },
  'es':    { native: 'Español',    short: 'ES' },
  'zh':    { native: '简体中文',    short: '简' },
  'zh-TW': { native: '繁體中文',    short: '繁' }
};

function getStoredLang() {
  try { return localStorage.getItem(LANG_STORAGE_KEY); } catch (e) { return null; }
}
function setStoredLang(lang) {
  try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch (e) { /* ignore */ }
}

function getInitialLang() {
  // The inline <head> script has already picked a language and set <html lang>.
  if (window.__arborInitialLang && SUPPORTED_LANGS.includes(window.__arborInitialLang)) {
    return window.__arborInitialLang;
  }
  const stored = getStoredLang();
  if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  const lang = navigator.language || navigator.userLanguage || 'en';
  if (SUPPORTED_LANGS.includes(lang)) return lang;
  const base = lang.split('-')[0];
  if (SUPPORTED_LANGS.includes(base)) return base;
  return 'en';
}

let currentLang = getInitialLang();

function t(keyPath) {
  const keys = keyPath.split('.');
  let val = (window.waitlistTranslations || {})[currentLang];
  if (!val) val = (window.waitlistTranslations || {})['en'];
  for (const k of keys) {
    if (val == null) return keyPath;
    val = val[k];
  }
  return val == null ? keyPath : val;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    const translated = t(key);
    if (attr) {
      el.setAttribute(attr, translated);
    } else {
      const hasNonTextChildren = Array.from(el.childNodes).some(n => n.nodeType !== Node.TEXT_NODE);
      el.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) n.remove(); });
      if (hasNonTextChildren) {
        el.insertAdjacentText('afterbegin', translated);
      } else {
        el.textContent = translated;
      }
    }
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    el.innerHTML = t(key);
  });

  document.documentElement.lang = HTML_LANG_MAP[currentLang] || currentLang;
  document.documentElement.dir = RTL_LANGS.includes(currentLang) ? 'rtl' : 'ltr';
}

function updateLangUI() {
  // Dropdown: sync aria-selected on each option and the toggle button label.
  document.querySelectorAll('.lang-option').forEach(opt => {
    const isActive = opt.getAttribute('data-lang') === currentLang;
    opt.setAttribute('aria-selected', isActive ? 'true' : 'false');
    opt.setAttribute('tabindex', isActive ? '0' : '-1');
  });
  const currentEl = document.querySelector('.lang-current');
  if (currentEl && LANG_LABELS[currentLang]) {
    currentEl.textContent = LANG_LABELS[currentLang].short;
    currentEl.setAttribute('lang', HTML_LANG_MAP[currentLang] || currentLang);
  }
}

function switchLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  currentLang = lang;
  setStoredLang(lang);
  applyTranslations();
  updateLangUI();
}

// --- NAV SCROLL EFFECT (rAF-throttled) ---

const nav = document.getElementById('nav');
let navScrollPending = false;
window.addEventListener('scroll', () => {
  if (navScrollPending) return;
  navScrollPending = true;
  requestAnimationFrame(() => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
    navScrollPending = false;
  });
}, { passive: true });

// --- SCROLL-TRIGGERED ANIMATIONS ---

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion()) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
} else {
  // With reduced motion, show everything immediately — the CSS @media rule also handles this
  // but setting the class keeps behavior consistent if users toggle the OS setting live.
  document.querySelectorAll('.animate-on-scroll').forEach(el => el.classList.add('visible'));
}

// --- FAQ ACCORDION (proper ARIA disclosure) ---

document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const answerId = btn.getAttribute('aria-controls');
    const answer = document.getElementById(answerId);
    const isOpen = btn.getAttribute('aria-expanded') === 'true';

    // Collapse all
    document.querySelectorAll('.faq-item').forEach(i => {
      const q = i.querySelector('.faq-question');
      const aId = q.getAttribute('aria-controls');
      const a = document.getElementById(aId);
      i.classList.remove('open');
      a.style.maxHeight = null;
      a.hidden = true;
      q.setAttribute('aria-expanded', 'false');
    });

    if (!isOpen) {
      item.classList.add('open');
      answer.hidden = false;
      // Let the browser paint `hidden=false` before measuring scrollHeight.
      requestAnimationFrame(() => {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      });
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// --- SMOOTH SCROLL FOR ANCHOR LINKS (motion-aware) ---

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    target.scrollIntoView({ behavior, block: 'start' });
    // Move focus into the target for screen-reader + keyboard continuity.
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
});

// --- FORM SUBMISSION ---

const form = document.getElementById('formContent');
const formCard = document.getElementById('formCard');
const formSuccess = document.getElementById('formSuccess');
const formStatus = document.getElementById('form-status');

function clearFieldError(field) {
  field.setAttribute('aria-invalid', 'false');
  const errId = field.getAttribute('aria-describedby');
  if (!errId) return;
  const errEl = document.getElementById(errId);
  if (errEl) errEl.textContent = '';
}
function setFieldError(field, message) {
  field.setAttribute('aria-invalid', 'true');
  const errId = field.getAttribute('aria-describedby');
  if (!errId) return;
  const errEl = document.getElementById(errId);
  if (errEl) errEl.textContent = message;
}
function clearAllFieldErrors() {
  form.querySelectorAll('[aria-invalid="true"]').forEach(clearFieldError);
  formStatus.textContent = '';
  formStatus.classList.remove('is-error', 'is-success');
}

function setFormStatus(message, kind) {
  formStatus.textContent = message;
  formStatus.classList.remove('is-error', 'is-success');
  if (kind) formStatus.classList.add('is-' + kind);
}

function validateForm() {
  clearAllFieldErrors();
  const email = document.getElementById('email');
  const name  = document.getElementById('name');
  const role  = document.getElementById('role');
  const size  = document.getElementById('company-size');

  const errors = [];
  const emailVal = email.value.trim();
  if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    setFieldError(email, t('form.errors.emailInvalid'));
    errors.push(email);
  }
  if (!name.value.trim()) {
    setFieldError(name, t('form.errors.nameRequired'));
    errors.push(name);
  }
  if (!role.value) {
    setFieldError(role, t('form.errors.roleRequired'));
    errors.push(role);
  }
  if (!size.value) {
    setFieldError(size, t('form.errors.sizeRequired'));
    errors.push(size);
  }
  return errors;
}

async function submitForm() {
  const errors = validateForm();
  if (errors.length) {
    setFormStatus(t('form.errors.summary'), 'error');
    errors[0].focus();
    return;
  }

  setFormStatus(t('form.status.submitting'), null);
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;

  const formData = {
    email: document.getElementById('email').value.trim(),
    name: document.getElementById('name').value.trim(),
    role: document.getElementById('role').value,
    companySize: document.getElementById('company-size').value,
    frustration: document.getElementById('frustration').value,
    language: currentLang,
    timestamp: new Date().toISOString()
  };

  try {
    await fetch('https://api.hsforms.com/submissions/v3/integration/submit/245811751/5565157e-6827-42c2-ae5e-670bfba75c7f', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: [
          { name: 'email',                value: formData.email },
          { name: 'firstname',            value: formData.name.split(' ')[0] },
          { name: 'lastname',             value: formData.name.split(' ').slice(1).join(' ') || '' },
          { name: 'your_role',            value: formData.role },
          { name: 'companysize',          value: formData.companySize },
          { name: 'waitlistpain_points',  value: formData.frustration }
        ],
        context: {
          pageUri: 'arbortech.io',
          pageName: 'Arbor Home'
        }
      })
    });
  } catch (err) {
    console.error('HubSpot submission error:', err);
    setFormStatus(t('form.errors.submitFailed'), 'error');
    submitBtn.disabled = false;
    return;
  }

  // Success: swap to the success panel and move focus so screen readers
  // announce it and keyboard users land where they should.
  form.style.display = 'none';
  formSuccess.classList.add('show');
  formSuccess.focus();
  const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
  formCard.scrollIntoView({ behavior, block: 'center' });
}

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm();
  });

  // Clear per-field error state the moment the user starts fixing a field.
  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', () => clearFieldError(el));
    el.addEventListener('change', () => clearFieldError(el));
  });
}

// --- LANGUAGE SWITCHER DROPDOWN ---
// WAI-ARIA listbox pattern: toggle button opens a listbox of options.
// Keyboard: Arrow up/down, Home/End, Enter/Space to select, Escape to close.

const langToggle = document.getElementById('lang-toggle');
const langMenu = document.getElementById('lang-menu');

function getLangOptions() {
  return Array.from(document.querySelectorAll('.lang-option'));
}

function openLangMenu() {
  if (!langMenu) return;
  langMenu.hidden = false;
  langToggle.setAttribute('aria-expanded', 'true');
  const active = langMenu.querySelector('[aria-selected="true"]') || getLangOptions()[0];
  if (active) active.focus();
}

function closeLangMenu({ returnFocus } = { returnFocus: true }) {
  if (!langMenu) return;
  langMenu.hidden = true;
  langToggle.setAttribute('aria-expanded', 'false');
  if (returnFocus) langToggle.focus();
}

function isLangMenuOpen() {
  return langMenu && !langMenu.hidden;
}

if (langToggle && langMenu) {
  langToggle.addEventListener('click', () => {
    if (isLangMenuOpen()) closeLangMenu();
    else openLangMenu();
  });

  langToggle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLangMenu();
    }
  });

  getLangOptions().forEach(opt => {
    opt.addEventListener('click', () => {
      switchLang(opt.getAttribute('data-lang'));
      closeLangMenu();
    });
    opt.addEventListener('keydown', (e) => {
      const options = getLangOptions();
      const idx = options.indexOf(e.currentTarget);
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          options[(idx + 1) % options.length].focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          options[(idx - 1 + options.length) % options.length].focus();
          break;
        case 'Home':
          e.preventDefault();
          options[0].focus();
          break;
        case 'End':
          e.preventDefault();
          options[options.length - 1].focus();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          switchLang(e.currentTarget.getAttribute('data-lang'));
          closeLangMenu();
          break;
        case 'Escape':
          e.preventDefault();
          closeLangMenu();
          break;
        case 'Tab':
          // Let Tab behave naturally but close the menu so focus doesn't
          // end up stranded inside a hidden listbox on re-entry.
          closeLangMenu({ returnFocus: false });
          break;
      }
    });
  });

  // Click outside closes.
  document.addEventListener('click', (e) => {
    if (!isLangMenuOpen()) return;
    if (langToggle.contains(e.target) || langMenu.contains(e.target)) return;
    closeLangMenu({ returnFocus: false });
  });
}

// --- INIT ---

document.addEventListener('DOMContentLoaded', () => {
  if (window.waitlistTranslations) {
    applyTranslations();
  }
  updateLangUI();
});
