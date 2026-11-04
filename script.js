const menu = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');
const header = document.querySelector('header');
const motionToggle = document.querySelector('.motion-toggle');
const progress = document.querySelector('.reading-progress');
const backTop = document.querySelector('.back-top');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const runningAnimations = new Set();
let paused = false;
try { paused = localStorage.getItem('wopegee-motion-paused') === 'true'; } catch { /* Storage can be unavailable in private browsing. */ }

function closeMenu(returnFocus = false) {
  menu.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('open');
  if (returnFocus) menu.focus();
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') closeMenu(true);
});
document.addEventListener('click', event => {
  if (!header.contains(event.target)) closeMenu();
});
window.matchMedia('(min-width: 701px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

function syncMotion() {
  document.body.classList.toggle('motion-paused', paused);
  document.documentElement.classList.toggle('motion-paused', paused);
  motionToggle.setAttribute('aria-pressed', String(paused));
  const label = paused ? 'Resume animations' : 'Pause animations';
  motionToggle.setAttribute('aria-label', label);
  motionToggle.title = label;
  motionToggle.querySelector('.tool-label').textContent = label;
  motionToggle.querySelector('svg').innerHTML = paused
    ? '<path d="m8 5 11 7-11 7V5Z"/>'
    : '<path d="M9 5v14M15 5v14"/>';
  if (paused || reducedMotion.matches) {
    runningAnimations.forEach(animation => animation.cancel());
    runningAnimations.clear();
  }
}
motionToggle.addEventListener('click', () => {
  paused = !paused;
  try { localStorage.setItem('wopegee-motion-paused', String(paused)); } catch { /* Retain the preference for this page view. */ }
  syncMotion();
});
reducedMotion.addEventListener('change', syncMotion);
syncMotion();

// Content stays visible if JavaScript or animation APIs are unavailable.
function reveal(element, delay = 0) {
  if (paused || reducedMotion.matches || !element.animate) return;
  const animation = element.animate([
    { opacity: 0, transform: 'translateY(22px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], { duration: 750, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
  runningAnimations.add(animation);
  animation.finished.then(() => runningAnimations.delete(animation)).catch(() => runningAnimations.delete(animation));
}
[...document.querySelector('.hero-copy').children].forEach((element, index) => reveal(element, index * 85));
reveal(document.querySelector('.hero-scene'), 180);

if ('IntersectionObserver' in window) {
  const reveals = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const siblings = entry.target.parentElement.classList.contains('cards');
      const delay = siblings ? [...entry.target.parentElement.children].indexOf(entry.target) * 80 : 0;
      reveal(entry.target, delay);
      reveals.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.about > div, .section-heading, .cards article, .approach > div, .invitation > *, .contact > div').forEach(element => reveals.observe(element));
  const links = [...navigation.querySelectorAll('a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const currentSection = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    });
  }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
  sections.forEach(section => currentSection.observe(section));
}

let scrollQueued = false;
function updateScroll() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0})`;
  header.classList.toggle('scrolled', window.scrollY > 20);
  backTop.hidden = window.scrollY < 650;
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if (!scrollQueued) {
    scrollQueued = true;
    requestAnimationFrame(updateScroll);
  }
}, { passive: true });
window.addEventListener('resize', updateScroll);
updateScroll();
