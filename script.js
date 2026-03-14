/* ═══════════════════════════════════════════════════════════
   Solar Solution Invest — Main Script v2
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Constants ─────────────────────────────────────────────── */

/**
 * Grand Est department prefixes.
 * Departments: Ardennes (08), Aube (10), Marne (51), Haute-Marne (52),
 * Meurthe-et-Moselle (54), Meuse (55), Moselle (57),
 * Bas-Rhin (67), Haut-Rhin (68), Vosges (88).
 */
const GRAND_EST_PREFIXES = ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'];

const TOTAL_STEPS = 4;

/* ── State ─────────────────────────────────────────────────── */
const state = {
  currentStep: 1,
  answers: {
    owner:      null,
    bill:       null,
    postalCode: null,
    timeline:   null,
  },
};

/* ── DOM Helpers ────────────────────────────────────────────── */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ── Navbar ─────────────────────────────────────────────────── */
function initNavbar() {
  const navbar    = $('#navbar');
  const burger    = $('.navbar__burger');
  const mobileMenu = $('#mobileMenu');
  const mobileLinks = $$('.mobile-link');

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
  });

  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Ouvrir le menu');
    });
  });
}

/* ── Scroll Reveal ──────────────────────────────────────────── */
function initScrollReveal() {
  if (!window.IntersectionObserver) return;

  const items = $$('.svc-card, .badge-card, .testi-card');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const delay = (i % 4) * 90;
          setTimeout(() => entry.target.classList.add('visible'), delay);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  items.forEach((el) => io.observe(el));
}

/* ── Postal Code Helpers ────────────────────────────────────── */
function isGrandEst(code) {
  if (!/^\d{5}$/.test(code)) return null;
  return GRAND_EST_PREFIXES.includes(code.slice(0, 2));
}

function departmentName(code) {
  const map = {
    '08': 'Ardennes', '10': 'Aube', '51': 'Marne',
    '52': 'Haute-Marne', '54': 'Meurthe-et-Moselle', '55': 'Meuse',
    '57': 'Moselle', '67': 'Bas-Rhin', '68': 'Haut-Rhin', '88': 'Vosges',
  };
  return map[code.slice(0, 2)] || null;
}

/* ── Step Indicator ─────────────────────────────────────────── */
function updateProgress(step) {
  const bar   = $('#stepsProgress');
  const label = $('#stepsLabel');
  if (bar)   bar.style.width   = `${(step / TOTAL_STEPS) * 100}%`;
  if (label) label.textContent = `Étape ${step} sur ${TOTAL_STEPS}`;
}

function showStep(n) {
  $$('.form-step').forEach((el) => el.classList.remove('active'));
  const target = $(`#step${n}`);
  if (target) {
    target.classList.add('active');
    if (window.innerWidth < 768) {
      target.closest('.form-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  state.currentStep = n;
  updateProgress(n);
}

/* ── Step Value & Validation ────────────────────────────────── */
function getStepValue(step) {
  switch (step) {
    case 1: return $('input[name="owner"]:checked')?.value ?? null;
    case 2: return $('input[name="bill"]:checked')?.value  ?? null;
    case 3: return ($('#postalCode')?.value ?? '').trim()  || null;
    case 4: return $('input[name="timeline"]:checked')?.value ?? null;
    default: return null;
  }
}

function validateStep(step) {
  const errEl = $(`#error${step}`);
  const show = (msg) => { if (errEl) { errEl.textContent = msg; errEl.hidden = false; } return false; };
  const clear = ()   => { if (errEl) errEl.hidden = true; };

  const val = getStepValue(step);

  if (step === 3) {
    if (!val || !/^\d{5}$/.test(val)) return show('Veuillez entrer un code postal valide (5 chiffres).');
    clear(); return val;
  }

  if (!val) return show('Veuillez sélectionner une réponse.');
  clear(); return val;
}

/* ── Qualification Logic ────────────────────────────────────── */
function qualify() {
  const { owner, bill, postalCode, timeline } = state.answers;

  if (owner !== 'yes') return {
    ok: false,
    reason: 'Nos installations sont réservées aux propriétaires. En tant que locataire, vous ne pouvez pas bénéficier de nos solutions actuellement.',
  };
  if (bill !== 'yes') return {
    ok: false,
    reason: 'Votre facture mensuelle est inférieure à 100 €. Nos solutions deviennent rentables à partir de ce seuil pour garantir un retour sur investissement optimal.',
  };
  if (!isGrandEst(postalCode)) return {
    ok: false,
    reason: `Le code postal ${postalCode} n'est pas situé en Grand Est. Nous intervenons uniquement dans les départements 08, 10, 51, 52, 54, 55, 57, 67, 68 et 88.`,
  };
  if (timeline !== 'yes') return {
    ok: false,
    reason: 'Votre projet est prévu au-delà des 3 prochains mois. Revenez nous voir quand votre calendrier se précise !',
  };
  return { ok: true };
}

/* ── Contact Fields Toggle ──────────────────────────────────── */
function setContactVisible(show) {
  const fields = $('#contactFields');
  const btn    = $('#submitBtn');
  if (!fields) return;
  fields.hidden = !show;
  if (btn) btn.textContent = show ? 'Recevoir mon devis gratuit 🎉' : 'Voir mon résultat →';
}

/* ── Results ────────────────────────────────────────────────── */
function showResult(ok, reason = '') {
  const form   = $('#qualificationForm');
  const prog   = $('#formSteps');
  const successEl    = $('#resultSuccess');
  const ineligibleEl = $('#resultIneligible');
  const reasonEl     = $('#ineligibleReason');

  if (form) form.style.display  = 'none';
  if (prog) prog.style.display  = 'none';

  if (ok) {
    if (successEl) successEl.hidden = false;
  } else {
    if (reasonEl && reason) reasonEl.textContent = reason;
    if (ineligibleEl) ineligibleEl.hidden = false;
  }
}

/* ── Postal Code Live Feedback ──────────────────────────────── */
function initPostalFeedback() {
  const input = $('#postalCode');
  const hint  = $('#postalHint');
  if (!input || !hint) return;

  input.addEventListener('input', () => {
    const val = input.value.trim();
    if (val.length < 5) {
      hint.textContent = ''; hint.className = 'input-hint';
      input.classList.remove('valid', 'invalid');
      return;
    }
    if (!/^\d{5}$/.test(val)) {
      hint.textContent = 'Format invalide — 5 chiffres requis.';
      hint.className = 'input-hint invalid';
      input.classList.replace('valid', 'invalid') || input.classList.add('invalid');
      return;
    }
    if (isGrandEst(val)) {
      const dept = departmentName(val);
      hint.textContent = dept ? `✓ Département couvert : ${dept}` : '✓ Code postal Grand Est reconnu.';
      hint.className = 'input-hint valid';
      input.classList.remove('invalid'); input.classList.add('valid');
    } else {
      hint.textContent = '✗ Ce code postal n\'est pas en Grand Est.';
      hint.className = 'input-hint invalid';
      input.classList.remove('valid'); input.classList.add('invalid');
    }
  });
}

/* ── Timeline auto-reveal contact fields ───────────────────── */
function initTimelineReveal() {
  $$('input[name="timeline"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      const preQualified =
        state.answers.owner === 'yes' &&
        state.answers.bill  === 'yes' &&
        isGrandEst(state.answers.postalCode) === true;
      setContactVisible(preQualified && radio.value === 'yes');
    });
  });
}

/* ── Form ───────────────────────────────────────────────────── */
function initForm() {
  const form = $('#qualificationForm');
  if (!form) return;

  form.addEventListener('click', (e) => {
    const nextBtn = e.target.closest('[data-next]');
    const prevBtn = e.target.closest('[data-prev]');

    if (nextBtn) {
      const step = parseInt(nextBtn.dataset.next, 10);
      const val  = validateStep(step);
      if (val === false) return;

      switch (step) {
        case 1: state.answers.owner      = val; break;
        case 2: state.answers.bill       = val; break;
        case 3: state.answers.postalCode = val; break;
        case 4: state.answers.timeline   = val; break;
      }
      if (step < TOTAL_STEPS) showStep(step + 1);
    }

    if (prevBtn) {
      const step = parseInt(prevBtn.dataset.prev, 10);
      if (step > 1) showStep(step - 1);
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = validateStep(4);
    if (val === false) return;
    state.answers.timeline = val;
    const result = qualify();
    showResult(result.ok, result.reason);
  });
}

/* ── A11y: option-card keyboard ────────────────────────────── */
function initRadioA11y() {
  $$('.radio-card').forEach((label) => {
    label.setAttribute('tabindex', '0');
    label.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const radio = label.querySelector('input[type="radio"]');
        if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
      }
    });
  });
}

/* ── Smooth anchor scroll with navbar offset ────────────────── */
function initAnchorScroll() {
  const OFFSET = 74;
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - OFFSET, behavior: 'smooth' });
  });
}

/* ── Phone number formatting ────────────────────────────────── */
function initPhoneFormat() {
  const phone = $('#phone');
  if (!phone) return;
  phone.addEventListener('input', () => {
    let v = phone.value.replace(/\D/g, '').slice(0, 10);
    phone.value = v.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  });
}

/* ── Hero image lazy-load fallback ──────────────────────────── */
function initHeroImage() {
  const img = $('.hero__bg-img');
  if (!img) return;
  // If image fails to load, fallback to CSS gradient
  img.addEventListener('error', () => {
    const bg = img.closest('.hero__bg');
    if (bg) bg.style.background = 'linear-gradient(135deg, #050B1A 0%, #0D1E3D 50%, #1A3A6E 100%)';
    img.style.display = 'none';
  });
}

/* ── Init ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initPostalFeedback();
  initTimelineReveal();
  initForm();
  initRadioA11y();
  initAnchorScroll();
  initPhoneFormat();
  initHeroImage();

  updateProgress(1);
});
