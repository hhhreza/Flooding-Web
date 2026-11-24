// app.js — Main init, navigation, toast, scroll-to-top

// TOAST

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const inner = document.getElementById('toast-inner');
  const msg   = document.getElementById('toast-msg');
  if (!toast || !inner || !msg) return;

  inner.className = type === 'error' ? 'toast__error' : 'toast__success';
  msg.textContent = message;
  toast.hidden = false;

  setTimeout(() => {
    toast.hidden = true;
  }, 4000);
}

// GLOBAL HELPERS
window.showToast = showToast;
window.escapeHTML = function(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
};

// HAMBURGER MENU

function initHamburger() {
  const btn   = document.getElementById('hamburger');
  const menu  = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    btn.setAttribute('aria-expanded', String(!menu.hidden));
  });

  // Close on link click
  menu.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}

// ACTIVE NAV HIGHLIGHT

function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${entry.target.id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    },
    { rootMargin: '-30% 0px -65% 0px' }
  );

  sections.forEach(section => observer.observe(section));
}

// SCROLL TO TOP BUTTON

function initScrollTop() {
  const btn = document.createElement('button');
  btn.id = 'scroll-top';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Kembali ke atas');
  btn.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/></svg>`;
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) btn.classList.add('visible');
    else btn.classList.remove('visible');
  });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// MAIN INIT

async function main() {
  // 1. Setup IndexedDB + seed data
  try {
    await window.floodDB.setupDB();
  } catch (err) {
    console.error('[APP] DB setup failed:', err);
    showToast('Gagal memuat database lokal.', 'error');
    return;
  }

  // 2. Navigation
  initHamburger();
  initScrollSpy();
  initScrollTop();

  // 3. Init all modules in parallel
  try {
    await Promise.all([
      window.floodTable.initTable(),
      window.floodMissing.initMissing(),
    ]);
  } catch (err) {
    console.error('[APP] Module init error:', err);
  }

  // 4. Map (init after layout settled)
  window.floodMap.initMap();
  try {
    const zones = await window.floodDB.getAll('risk_zones');
    window.floodMap.renderRiskZones(zones);
  } catch (err) {
    console.error('[APP] Map error:', err);
  }

  // 5. Charts
  try {
    await window.floodCharts.initCharts();
  } catch (err) {
    console.error('[APP] Charts error:', err);
  }

  console.log('[APP] SiPADU initialized.');
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', main);
