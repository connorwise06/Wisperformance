// Wise Performance: scroll effects shared by every page.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Darken the menu bar and fill the progress bar as the page scrolls
  var nav = document.querySelector('nav');
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle('scrolled', y > 40);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Fade sections in as they scroll into view. Only things below the first
  // screen are hidden, so nothing visible on load ever blinks.
  if (reduce || !('IntersectionObserver' in window)) return;
  var selector = [
    '.section-label', '.section-title', '.section-sub',
    '.about-eyebrow', '.about-name', '.about-role', '.about-text', '.about-card',
    '.program-card', '.pricing-card', '.consult-banner', '.hiw-step',
    '.faq-item', '.product-card', '.free-section-left', '.free-section-right',
    '.form-wrap', '.contact-email-wrap'
  ].join(',');
  var els = Array.prototype.filter.call(document.querySelectorAll(selector), function (el) {
    return el.getBoundingClientRect().top > window.innerHeight;
  });
  els.forEach(function (el) {
    // stagger cards that sit side by side or in a list
    var kind = el.classList[0];
    var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains(kind); });
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 4) * 0.08 + 's');
    el.classList.add('reveal');
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('in');
      io.unobserve(el);
      // hand control back to the normal hover transitions once it's in place
      el.addEventListener('transitionend', function done(ev) {
        if (ev.propertyName !== 'transform') return;
        el.classList.remove('reveal', 'in');
        el.style.removeProperty('--d');
        el.removeEventListener('transitionend', done);
      });
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });
})();

// Contact form: send to Formspree in the background and show a thank-you
// message instead of leaving the site. Falls back to a normal submit if
// fetch is not available.
(function () {
  var form = document.getElementById('contact-form');
  var thanks = document.getElementById('form-thanks');
  if (!form || !thanks || !window.fetch || !window.FormData) return;
  var btn = form.querySelector('.btn-submit');
  var err = form.querySelector('.form-error');
  var label = btn ? btn.innerHTML : '';
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (err) err.hidden = true;
    if (btn) { btn.disabled = true; btn.textContent = 'SENDING…'; }
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('status ' + res.status);
        form.hidden = true;
        thanks.hidden = false;
        thanks.focus();
        if (window.gtag) window.gtag('event', 'generate_lead', { form: 'contact', plan: form.plan ? form.plan.value : '' });
      })
      .catch(function () {
        if (err) err.hidden = false;
        if (btn) { btn.disabled = false; btn.innerHTML = label; }
      });
  });
})();