/* ============================================================
   main.js — Entry point: DOM wiring, validation, UI state
   ============================================================ */

import { validateInput, computeSequence } from './kaprekar.js';
import { renderSequence, clearVisualization } from './visualizer.js';

/* ---------- DOM References ---------- */
const inputField    = document.getElementById('number-input');
const visualizeBtn  = document.getElementById('visualize-btn');
const resetBtn      = document.getElementById('reset-btn');
const errorMsg      = document.getElementById('error-message');
const vizContainer  = document.getElementById('viz-container');
const placeholder   = document.getElementById('viz-placeholder');
const stepCounter   = document.getElementById('step-counter');
const stepCountVal  = document.getElementById('step-count-value');
const resultBadge   = document.getElementById('result-badge');
const tryExampleBtn = document.getElementById('try-example-btn');

/* ---------- State ---------- */
let isAnimating = false;

/* ---------- Helpers ---------- */
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.opacity = '1';
  inputField.classList.add('error');
}

function clearError() {
  errorMsg.textContent = '';
  errorMsg.style.opacity = '0';
  inputField.classList.remove('error');
}

function showPlaceholder() {
  placeholder.style.display = 'flex';
  stepCounter.style.display = 'none';
  resultBadge.classList.remove('visible');
}

function hidePlaceholder() {
  placeholder.style.display = 'none';
}

function setAnimating(state) {
  isAnimating = state;
  visualizeBtn.disabled = state;
  inputField.disabled = state;
  if (state) {
    visualizeBtn.textContent = 'Animating…';
  } else {
    visualizeBtn.innerHTML = '<span class="btn-icon">▶</span> Visualize';
  }
}

/* ---------- Core action ---------- */
function runVisualization(value) {
  clearError();

  const validation = validateInput(String(value));
  if (!validation.valid) {
    showError(validation.reason);
    return;
  }

  // Compute steps
  const steps = computeSequence(validation.value);

  // Prepare canvas
  hidePlaceholder();
  clearVisualization(vizContainer);
  stepCounter.style.display = 'block';
  stepCountVal.textContent = steps.length;
  resultBadge.classList.remove('visible');

  setAnimating(true);

  // Render with D3
  renderSequence(steps, vizContainer, () => {
    // Animation complete
    setAnimating(false);
    resultBadge.classList.add('visible');
  });
}

/* ---------- Event Listeners ---------- */
visualizeBtn.addEventListener('click', () => {
  if (isAnimating) return;
  runVisualization(inputField.value);
});

inputField.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !isAnimating) {
    runVisualization(inputField.value);
  }
});

inputField.addEventListener('input', () => {
  clearError();
});

resetBtn.addEventListener('click', () => {
  if (isAnimating) return;
  inputField.value = '';
  clearError();
  clearVisualization(vizContainer);
  showPlaceholder();
  setAnimating(false);
});

tryExampleBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const examples = [3524, 1234, 9876, 2005, 8730, 4321, 1000];
  const pick = examples[Math.floor(Math.random() * examples.length)];
  inputField.value = String(pick);
  inputField.focus();
  // Smooth scroll to visualizer
  document.getElementById('visualizer').scrollIntoView({ behavior: 'smooth' });
});

/* ---------- Smooth scroll for nav links ---------- */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* ---------- Intersection Observer for scroll animations ---------- */
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -40px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animation = 'fadeInUp 0.7s cubic-bezier(0.4,0,0.2,1) both';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.card, .visualizer-canvas').forEach(el => {
  el.style.opacity = '0';
  observer.observe(el);
});
