/* ============================================
   Arbor Waitlist — script.js
   Includes: nav, animations, FAQ, form, i18n
   ============================================ */

// --- LANGUAGE DETECTION & SWITCHING ---

const SUPPORTED_LANGS = ['en', 'ko', 'ja', 'es', 'zh', 'zh-TW'];

function getBrowserLang() {
  const lang = navigator.language || navigator.userLanguage || 'en';
  // Check for exact match first (e.g. zh-TW)
  if (SUPPORTED_LANGS.includes(lang)) return lang;
  // Check for base language match (e.g. 'ko-KR' → 'ko')
  const base = lang.split('-')[0];
  if (SUPPORTED_LANGS.includes(base)) return base;
  return 'en';
}

let currentLang = getBrowserLang();

function t(keyPath) {
  const keys = keyPath.split('.');
  let val = (window.waitlistTranslations || {})[currentLang];
  if (!val) val = (window.waitlistTranslations || {})['en'];
  for (const k of keys) {
    if (val == null) return keyPath;
    val = val[k];
  }
  return val || keyPath;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    const translated = t(key);
    if (attr) {
      el.setAttribute(attr, translated);
    } else {
      // Preserve child elements (e.g. SVG arrows, em tags)
      const children = Array.from(el.childNodes).filter(n => n.nodeType !== Node.TEXT_NODE);
      el.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) n.remove(); });
      el.insertAdjacentText('afterbegin', translated);
    }
  });

  // Handle HTML content keys (for copy with markup like <em>)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    el.innerHTML = t(key);
  });

  // Update lang attribute on html element
  document.documentElement.lang = currentLang;
}

function switchLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  currentLang = lang;
  applyTranslations();
  // Update active state on switcher buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
}

// --- NAV SCROLL EFFECT ---

const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

// --- SCROLL-TRIGGERED ANIMATIONS ---

const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -40px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, observerOptions);
document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

// --- FAQ ACCORDION ---

document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const answer = item.querySelector('.faq-answer');
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-answer').style.maxHeight = null;
      i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });

    if (!isOpen) {
      item.classList.add('open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// --- SMOOTH SCROLL FOR ANCHOR LINKS ---

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offset = 80;
      const position = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: position, behavior: 'smooth' });
    }
  });
});

// --- FORM SUBMISSION ---

async function handleSubmit() {
  const email = document.getElementById('email');
  const name = document.getElementById('name');
  const role = document.getElementById('role');
  const size = document.getElementById('company-size');

  // Validation
  if (!email.value || !email.value.includes('@')) {
    email.focus();
    email.style.borderColor = 'var(--rose)';
    setTimeout(() => email.style.borderColor = '', 2000);
    return;
  }
  if (!name.value.trim()) {
    name.focus();
    name.style.borderColor = 'var(--rose)';
    setTimeout(() => name.style.borderColor = '', 2000);
    return;
  }
  if (!role.value) {
    role.focus();
    role.style.borderColor = 'var(--rose)';
    setTimeout(() => role.style.borderColor = '', 2000);
    return;
  }
  if (!size.value) {
    size.focus();
    size.style.borderColor = 'var(--rose)';
    setTimeout(() => size.style.borderColor = '', 2000);
    return;
  }

  const formData = {
    email: email.value,
    name: name.value,
    role: role.value,
    companySize: size.value,
    frustration: document.getElementById('frustration').value,
    language: currentLang,
    timestamp: new Date().toISOString()
  };

  // --- HUBSPOT INTEGRATION ---
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
  }

  // Make.com webhook (alternative — uncomment to use instead):
  // await fetch('https://hook.eu1.make.com/YOUR_WEBHOOK_ID', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(formData)
  // });

  // Show success state
  document.getElementById('formContent').style.display = 'none';
  document.getElementById('formSuccess').classList.add('show');
  document.getElementById('formCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Remove error styling on focus
document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(el => {
  el.addEventListener('focus', () => { el.style.borderColor = ''; });
});

// --- INIT ---
// Apply translations once DOM and translations file are both ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.waitlistTranslations) {
    applyTranslations();
  }
});
