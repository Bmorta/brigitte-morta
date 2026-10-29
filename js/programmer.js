'use strict';

(() => {
  const data = JSON.parse(document.getElementById('portfolio-data').textContent);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');

  function setTheme(theme) {
    root.dataset.theme = theme;
    const light = theme === 'light';
    themeToggle.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
    themeToggle.setAttribute('title', light ? 'Switch to dark mode' : 'Switch to light mode');
    themeToggle.innerHTML = light
      ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M20 14A9 9 0 0 1 10 4a9 9 0 1 0 10 10Z"/></svg>'
      : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>';
    document.querySelector('meta[name="theme-color"]').content = light ? '#f5f7fa' : '#0d121c';
  }

  setTheme(root.dataset.theme || 'dark');
  themeToggle.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('portfolio-theme', next); } catch {}
  });

  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.getElementById('nav-links');
  const mobileNavigation = window.matchMedia('(max-width: 991px)');

  function closeMenu(returnFocus = false) {
    menu.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    if (returnFocus) menuButton.focus();
  }

  menuButton.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('click', event => {
    if (!event.target.closest('.navigation')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) closeMenu(true);
  });
  mobileNavigation.addEventListener('change', () => closeMenu());

  const navLinks = [...menu.querySelectorAll('a[href^="#"]')];
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          const current = link.hash === '#' + entry.target.id;
          link.classList.toggle('active', current);
          if (current) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    navLinks.forEach(link => {
      const section = document.querySelector(link.hash);
      if (section) sectionObserver.observe(section);
    });
  }

  const carousel = document.querySelector('.cert-carousel');
  const viewport = carousel.querySelector('.cert-viewport');
  const certificateCards = [...carousel.querySelectorAll('.cert-card')];
  const dots = carousel.querySelector('.cert-dots');
  const autoplayButton = document.getElementById('cert-autoplay');
  const range = document.getElementById('certificate-range');
  const dialog = document.getElementById('preview-dialog');
  const previewImage = document.getElementById('preview-image');
  let index = 0;
  let visible = 5;
  let maxIndex = 0;
  let step = 0;
  let timer;
  let userPaused = reducedMotion.matches;
  let hovering = false;
  let scrollFrame;

  function updatePosition() {
    if (step) index = Math.max(0, Math.min(maxIndex, Math.round(viewport.scrollLeft / step)));
    [...dots.children].forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.setAttribute('aria-current', String(i === index));
    });
    range.textContent = `${index + 1}–${Math.min(data.certificates.length, index + visible)}`;
  }

  function goToCertificate(next, smooth = true) {
    index = next > maxIndex ? 0 : next < 0 ? maxIndex : next;
    viewport.scrollTo({ left: index * step, behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant' });
    updatePosition();
  }

  function pauseTimer() {
    window.clearInterval(timer);
  }

  function restartTimer() {
    pauseTimer();
    if (userPaused || reducedMotion.matches || hovering || document.hidden || dialog.open || carousel.contains(document.activeElement)) return;
    timer = window.setInterval(() => goToCertificate(index + 1), 3500);
  }

  function updateAutoplayButton() {
    const paused = userPaused || reducedMotion.matches;
    autoplayButton.setAttribute('aria-pressed', String(paused));
    autoplayButton.setAttribute('aria-label', reducedMotion.matches ? 'Automatic scrolling off: reduced motion enabled' : paused ? 'Resume automatic certificate scrolling' : 'Pause automatic certificate scrolling');
    autoplayButton.innerHTML = paused ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="m8 4 12 8-12 8Z"/></svg>' : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';
    autoplayButton.disabled = reducedMotion.matches;
  }

  function resizeCarousel() {
    visible = parseInt(getComputedStyle(carousel).getPropertyValue('--cert-count'), 10);
    maxIndex = Math.max(0, certificateCards.length - visible);
    step = certificateCards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(carousel).getPropertyValue('--cert-gap'));
    if (dots.children.length !== maxIndex + 1) {
      dots.replaceChildren();
      for (let i = 0; i <= maxIndex; i += 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Show certificates ${i + 1} to ${i + visible}`);
        dot.addEventListener('click', () => goToCertificate(i));
        dots.append(dot);
      }
    }
    goToCertificate(Math.min(index, maxIndex), false);
  }

  viewport.addEventListener('scroll', () => {
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(updatePosition);
  }, { passive: true });
  viewport.addEventListener('keydown', event => {
    if (event.target !== viewport) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      goToCertificate(index + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  document.getElementById('cert-prev').addEventListener('click', () => goToCertificate(index - 1));
  document.getElementById('cert-next').addEventListener('click', () => goToCertificate(index + 1));
  autoplayButton.addEventListener('click', () => {
    userPaused = !userPaused;
    updateAutoplayButton();
    restartTimer();
  });
  carousel.addEventListener('mouseenter', () => { hovering = true; pauseTimer(); });
  carousel.addEventListener('mouseleave', () => { hovering = false; restartTimer(); });
  carousel.addEventListener('focusin', pauseTimer);
  carousel.addEventListener('focusout', event => {
    if (!carousel.contains(event.relatedTarget)) setTimeout(restartTimer, 0);
  });
  document.addEventListener('visibilitychange', restartTimer);
  reducedMotion.addEventListener('change', () => {
    updateAutoplayButton();
    restartTimer();
  });
  new ResizeObserver(resizeCarousel).observe(viewport);
  resizeCarousel();
  updateAutoplayButton();
  restartTimer();


  let previewType = 'work';
  let previewIndex = 0;
  let previewOpener;
  const title = document.getElementById('preview-title');
  const subtitle = document.getElementById('preview-subtitle');
  const description = document.getElementById('preview-description');
  const sourceLink = document.getElementById('preview-source');
  const externalLink = document.getElementById('preview-external');
  const techList = document.getElementById('preview-tech');

  function showPreview(type, selected) {
    previewType = type;
    const collection = type === 'work' ? data.projects : data.certificates;
    previewIndex = (selected + collection.length) % collection.length;
    const item = collection[previewIndex];
    const work = type === 'work';
    title.textContent = item.title;
    subtitle.textContent = work ? item.kind : item.issuer;
    document.getElementById('preview-type').textContent = work ? 'PROJECT PREVIEW' : 'TRAINING CREDENTIAL';
    const image = work ? item.image : item.file;
    previewImage.parentElement.hidden = !image;
    if (image) {
      previewImage.src = `images/${image}`;
      previewImage.alt = work ? `${item.title} application screenshot` : `${item.title} certificate awarded to Brigitte Morta`;
    } else {
      previewImage.removeAttribute('src');
      previewImage.alt = '';
    }
    description.textContent = work ? item.detail : '';
    description.hidden = !work;
    techList.replaceChildren();
    if (work) item.tech.forEach(tech => {
      const chip = document.createElement('span');
      chip.textContent = tech;
      techList.append(chip);
    });
    sourceLink.href = work ? item.repo : `images/${item.file}`;
    sourceLink.firstChild.textContent = work ? 'View source code ' : 'Open full-size certificate ';
    externalLink.hidden = !work;
    if (work) externalLink.href = item.live;
    else externalLink.removeAttribute('href');
    document.getElementById('preview-position').textContent = `${previewIndex + 1} / ${collection.length}`;
    if (!dialog.open) {
      previewOpener = document.activeElement;
      document.body.classList.add('modal-open');
      dialog.showModal();
      pauseTimer();
    }
    dialog.scrollTop = 0;
  }

  document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => showPreview('work', Number(button.dataset.project))));
  document.querySelectorAll('[data-certificate]').forEach(button => button.addEventListener('click', () => showPreview('certificate', Number(button.dataset.certificate))));
  document.getElementById('preview-prev').addEventListener('click', () => showPreview(previewType, previewIndex - 1));
  document.getElementById('preview-next').addEventListener('click', () => showPreview(previewType, previewIndex + 1));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (previewOpener?.isConnected) previewOpener.focus({ preventScroll: true });
    restartTimer();
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showPreview(previewType, previewIndex + (event.key === 'ArrowRight' ? 1 : -1));
  });

  // Preserve draggable badges, with keyboard movement and a reset control.
  const techBadges = [...document.querySelectorAll('.tech-icon')];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function offset(badge, x, y) {
    badge.dataset.dragX = String(x);
    badge.dataset.dragY = String(y);
    badge.style.transform = `translate(${x}px, ${y}px)`;
  }

  function resetBadges() {
    techBadges.forEach(badge => offset(badge, 0, 0));
  }

  techBadges.forEach(badge => {
    let drag;
    function bounds() {
      const box = badge.getBoundingClientRect();
      const grid = badge.closest('.tech-icon-grid').getBoundingClientRect();
      return { minX: grid.left - box.left, maxX: grid.right - box.right, minY: grid.top - box.top, maxY: grid.bottom - box.bottom };
    }
    badge.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      drag = { pointer: event.pointerId, x: event.clientX, y: event.clientY, offsetX: Number(badge.dataset.dragX || 0), offsetY: Number(badge.dataset.dragY || 0), ...bounds() };
      badge.setPointerCapture(event.pointerId);
      badge.classList.add('is-dragging');
      event.preventDefault();
    });
    badge.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.pointer) return;
      offset(badge, drag.offsetX + clamp(event.clientX - drag.x, drag.minX, drag.maxX), drag.offsetY + clamp(event.clientY - drag.y, drag.minY, drag.maxY));
    });
    function finish(event) {
      if (!drag) return;
      if (badge.hasPointerCapture(event.pointerId)) badge.releasePointerCapture(event.pointerId);
      drag = undefined;
      badge.classList.remove('is-dragging');
    }
    badge.addEventListener('pointerup', finish);
    badge.addEventListener('pointercancel', finish);
    badge.addEventListener('keydown', event => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Home') { offset(badge, 0, 0); return; }
      const b = bounds();
      const dx = event.key === 'ArrowLeft' ? -10 : event.key === 'ArrowRight' ? 10 : 0;
      const dy = event.key === 'ArrowUp' ? -10 : event.key === 'ArrowDown' ? 10 : 0;
      offset(badge, Number(badge.dataset.dragX || 0) + clamp(dx, b.minX, b.maxX), Number(badge.dataset.dragY || 0) + clamp(dy, b.minY, b.maxY));
    });
  });
  document.getElementById('reset-badges').addEventListener('click', resetBadges);
  window.addEventListener('resize', resetBadges);

  // This form preserves the original email-draft workflow; it does not send mail.
  const form = document.getElementById('contactForm');
  const fields = ['name', 'email', 'message'];
  function validateField(id) {
    const field = document.getElementById(id);
    const value = field.value.trim();
    const error = !value ? (id === 'message' ? 'Please add a message.' : id === 'name' ? 'Please enter your name.' : 'Please enter your email address.') : id === 'email' && !field.validity.valid ? 'Please enter a valid email address.' : '';
    document.getElementById(`${id}-error`).textContent = error;
    field.setAttribute('aria-invalid', String(Boolean(error)));
    return !error;
  }
  fields.forEach(id => document.getElementById(id).addEventListener('input', () => {
    if (document.getElementById(id).getAttribute('aria-invalid') === 'true') validateField(id);
  }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const valid = fields.map(validateField);
    if (valid.includes(false)) {
      document.getElementById(fields[valid.indexOf(false)]).focus();
      document.getElementById('form-status').textContent = 'Please check the highlighted fields.';
      return;
    }
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    document.getElementById('form-status').textContent = 'Opening your email app. Review and send the message there, or email brigittemorta@gmail.com directly.';
    window.location.href = `mailto:brigittemorta@gmail.com?subject=${subject}&body=${body}`;
  });
  document.getElementById('year').textContent = new Date().getFullYear();
})();
