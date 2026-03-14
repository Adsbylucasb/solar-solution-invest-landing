/* ═══════════════════════════════════════════════════════════
   Solar Solution Invest — Main Script
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
    owner: null,
    bill: null,
    postalCode: null,
    timeline: null,
  },
};

/* ── DOM Helpers ────────────────────────────────────────────── */
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ── Navbar ─────────────────────────────────────────────────── */
function initNavbar() {
  const navbar = $('.navbar');
  const burger = $('.navbar__burger');
  const mobileMenu = $('#mobileMenu');
  const mobileLinks = $$('.mobile-link');

  // Scrolled state shadow
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Burger toggle
  burger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', isOpen.toString());
  });

  // Close mobile menu when a link is clicked
  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ── Intersection Observer Animations ───────────────────────── */
function initAnimations() {
  if (!window.IntersectionObserver) return;

  const cards = $$('.service-card, .testimonial-card');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Stagger the animation slightly per card
          const delay = (index % 3) * 80;
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  cards.forEach((card) => observer.observe(card));
}

/* ── Postal Code Validation ─────────────────────────────────── */
function isGrandEstPostalCode(code) {
  if (!/^\d{5}$/.test(code)) return null; // invalid format
  const prefix = code.slice(0, 2);
  return GRAND_EST_PREFIXES.includes(prefix);
}

function getDepartmentName(code) {
  const prefix = code.slice(0, 2);
  const names = {
    '08': 'Ardennes',
    '10': 'Aube',
    '51': 'Marne',
    '52': 'Haute-Marne',
    '54': 'Meurthe-et-Moselle',
    '55': 'Meuse',
    '57': 'Moselle',
    '67': 'Bas-Rhin',
    '68': 'Haut-Rhin',
    '88': 'Vosges',
  };
  return names[prefix] || null;
}

/* ── Form Steps ─────────────────────────────────────────────── */
function updateStepIndicator(step) {
  const progress = $('#stepsProgress');
  const label    = $('#stepsLabel');
  if (!progress || !label) return;

  const pct = (step / TOTAL_STEPS) * 100;
  progress.style.width = `${pct}%`;
  label.textContent = `Étape ${step} sur ${TOTAL_STEPS}`;
}

function showStep(stepNumber) {
  // Hide all steps
  $$('.form-step').forEach((el) => el.classList.remove('active'));

  const target = $(`#step${stepNumber}`);
  if (target) {
    target.classList.add('active');
    // Scroll the form wrapper into view on mobile
    if (window.innerWidth < 768) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  state.currentStep = stepNumber;
  updateStepIndicator(stepNumber);
}

function getStepValue(step) {
  switch (step) {
    case 1: {
      const checked = $('input[name="owner"]:checked');
      return checked ? checked.value : null;
    }
    case 2: {
      const checked = $('input[name="bill"]:checked');
      return checked ? checked.value : null;
    }
    case 3: {
      const val = $('#postalCode')?.value?.trim();
      return val || null;
    }
    case 4: {
      const checked = $('input[name="timeline"]:checked');
      return checked ? checked.value : null;
    }
    default:
      return null;
  }
}

function validateStep(step) {
  const errorEl = $(`#error${step}`);

  const showError = (msg) => {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.hidden = false;
    }
    return false;
  };

  const clearError = () => {
    if (errorEl) errorEl.hidden = true;
  };

  const value = getStepValue(step);

  if (step === 1 || step === 2 || step === 4) {
    if (!value) {
      return showError('Veuillez sélectionner une réponse.');
    }
    clearError();
    return value;
  }

  if (step === 3) {
    if (!value || !/^\d{5}$/.test(value)) {
      return showError('Veuillez entrer un code postal valide (5 chiffres).');
    }
    clearError();
    return value;
  }

  return null;
}

/* ── Qualification Logic ────────────────────────────────────── */
function assessQualification() {
  const { owner, bill, postalCode, timeline } = state.answers;

  if (owner !== 'yes') {
    return {
      qualified: false,
      reason: 'Nos installations sont réservées aux propriétaires. En tant que locataire, vous ne pouvez pas bénéficier de nos solutions actuellement.',
    };
  }

  if (bill !== 'yes') {
    return {
      qualified: false,
      reason: 'Votre facture mensuelle est inférieure à 100 €. Nos solutions deviennent rentables à partir de ce seuil de consommation pour garantir un retour sur investissement optimal.',
    };
  }

  const inGrandEst = isGrandEstPostalCode(postalCode);
  if (!inGrandEst) {
    return {
      qualified: false,
      reason: `Le code postal ${postalCode} n'est pas situé en Grand Est. Nous intervenons uniquement dans les départements 08, 10, 51, 52, 54, 55, 57, 67, 68 et 88.`,
    };
  }

  if (timeline !== 'yes') {
    return {
      qualified: false,
      reason: 'Votre projet est prévu au-delà des 3 prochains mois. Nos conseillers se concentrent sur les projets à court terme. Revenez nous voir quand votre calendrier se précise !',
    };
  }

  return { qualified: true };
}

/* ── Contact Fields Visibility ──────────────────────────────── */
function toggleContactFields(show) {
  const fields  = $('#contactFields');
  const submitBtn = $('#submitBtn');
  if (!fields) return;

  if (show) {
    fields.hidden = false;
    if (submitBtn) submitBtn.textContent = 'Recevoir mon devis gratuit 🎉';
  } else {
    fields.hidden = true;
    if (submitBtn) submitBtn.textContent = 'Voir mon résultat →';
  }
}

/* ── Show Result Panels ─────────────────────────────────────── */
function showResult(qualified, reason = '') {
  const form         = $('#qualificationForm');
  const steps        = $('#formSteps');
  const success      = $('#resultSuccess');
  const ineligible   = $('#resultIneligible');
  const reasonEl     = $('#ineligibleReason');

  if (form)    form.style.display = 'none';
  if (steps)   steps.style.display = 'none';

  if (qualified) {
    if (success) success.hidden = false;
  } else {
    if (reasonEl && reason) reasonEl.textContent = reason;
    if (ineligible) ineligible.hidden = false;
  }
}

/* ── Postal Code Live Feedback ──────────────────────────────── */
function initPostalCodeFeedback() {
  const input   = $('#postalCode');
  const hint    = $('#postalHint');
  if (!input || !hint) return;

  input.addEventListener('input', () => {
    const val = input.value.trim();

    if (val.length < 5) {
      hint.textContent = '';
      hint.className = 'form-input__hint';
      input.classList.remove('valid', 'invalid');
      return;
    }

    if (!/^\d{5}$/.test(val)) {
      hint.textContent = 'Format invalide — 5 chiffres requis.';
      hint.className = 'form-input__hint invalid';
      input.classList.add('invalid');
      input.classList.remove('valid');
      return;
    }

    const inGrandEst = isGrandEstPostalCode(val);
    if (inGrandEst) {
      const dept = getDepartmentName(val);
      hint.textContent = dept
        ? `✓ Département couvert : ${dept}`
        : '✓ Code postal Grand Est reconnu.';
      hint.className = 'form-input__hint valid';
      input.classList.add('valid');
      input.classList.remove('invalid');
    } else {
      hint.textContent = '✗ Ce code postal n\'est pas en Grand Est.';
      hint.className = 'form-input__hint invalid';
      input.classList.add('invalid');
      input.classList.remove('valid');
    }
  });
}

/* ── Auto-show contact fields on timeline answer ────────────── */
function initTimelineAutoReveal() {
  const radios = $$('input[name="timeline"]');
  radios.forEach((radio) => {
    radio.addEventListener('change', () => {
      const allQualified =
        state.answers.owner === 'yes' &&
        state.answers.bill === 'yes' &&
        isGrandEstPostalCode(state.answers.postalCode) === true;

      toggleContactFields(allQualified && radio.value === 'yes');
    });
  });
}

/* ── Form Event Delegation ──────────────────────────────────── */
function initForm() {
  const form = $('#qualificationForm');
  if (!form) return;

  // "Next" buttons
  form.addEventListener('click', (e) => {
    const nextBtn = e.target.closest('[data-next]');
    const prevBtn = e.target.closest('[data-prev]');

    if (nextBtn) {
      const step = parseInt(nextBtn.dataset.next, 10);
      const value = validateStep(step);
      if (value === false) return; // validation failed

      // Save answer
      switch (step) {
        case 1: state.answers.owner     = value; break;
        case 2: state.answers.bill      = value; break;
        case 3: state.answers.postalCode = value; break;
        case 4: state.answers.timeline  = value; break;
      }

      // Advance to next step
      if (step < TOTAL_STEPS) {
        showStep(step + 1);
      }
    }

    if (prevBtn) {
      const step = parseInt(prevBtn.dataset.prev, 10);
      if (step > 1) showStep(step - 1);
    }
  });

  // Form submit (step 4)
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const timelineValue = validateStep(4);
    if (timelineValue === false) return;
    state.answers.timeline = timelineValue;

    const result = assessQualification();
    showResult(result.qualified, result.reason);
  });
}

/* ── Option card keyboard support ───────────────────────────── */
function initOptionCardA11y() {
  $$('.option-card').forEach((label) => {
    label.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const radio = label.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
    label.setAttribute('tabindex', '0');
  });
}

/* ── Smooth anchor scroll offset for sticky navbar ─────────── */
function initAnchorScroll() {
  const NAVBAR_HEIGHT = 72;

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute('href').slice(1);
    if (!id) return;

    const target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
    window.scrollTo({ top, behavior: 'smooth' });
  });
}

/* ── Counter Animation ──────────────────────────────────────── */
function animateCounter(el, target, duration = 1200) {
  const isFloat   = target % 1 !== 0;
  const start     = performance.now();
  const suffix    = el.dataset.suffix || '';
  const prefix    = el.dataset.prefix || '';

  const tick = (now) => {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutExpo
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const value  = eased * target;

    el.textContent = prefix + (isFloat ? value.toFixed(1) : Math.floor(value)) + suffix;

    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function initCounters() {
  if (!window.IntersectionObserver) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el     = entry.target;
          const target = parseFloat(el.dataset.target);
          if (!isNaN(target)) animateCounter(el, target);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  $$('[data-target]').forEach((el) => observer.observe(el));
}

/* ── Phone formatting ───────────────────────────────────────── */
function initPhoneFormatting() {
  const phone = $('#phone');
  if (!phone) return;

  phone.addEventListener('input', () => {
    let val = phone.value.replace(/\D/g, '').slice(0, 10);
    phone.value = val.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  });
}

/* ── Init ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initAnimations();
  initPostalCodeFeedback();
  initTimelineAutoReveal();
  initForm();
  initOptionCardA11y();
  initAnchorScroll();
  initCounters();
  initPhoneFormatting();

  // Set initial step indicator
  updateStepIndicator(1);
});
