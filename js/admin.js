'use strict';

(() => {
  const data = JSON.parse(document.getElementById('portfolio-data').textContent);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
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

  const cards = [...document.querySelectorAll('.work-card')];
  const filterButtons = [...document.querySelectorAll('.filter')];
  const moreButton = document.getElementById('more-work');
  let activeFilter = 'All';
  let showAll = false;

  function filterWork() {
    let shown = 0;
    const total = cards.filter(card => activeFilter === 'All' || card.dataset.category === activeFilter).length;
    cards.forEach(card => {
      const matches = activeFilter === 'All' || card.dataset.category === activeFilter;
      const visible = matches && (activeFilter !== 'All' || showAll || shown < 6);
      card.hidden = !visible;
      if (visible) shown += 1;
    });
    document.getElementById('work-count').textContent = `Showing ${shown} of ${total} samples`;
    moreButton.hidden = activeFilter !== 'All' || showAll;
    filterButtons.forEach(button => {
      const current = button.dataset.filter === activeFilter;
      button.classList.toggle('active', current);
      button.setAttribute('aria-pressed', String(current));
    });
  }

  filterButtons.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterWork();
  }));
  moreButton.addEventListener('click', () => {
    showAll = true;
    filterWork();
    cards[6].querySelector('button').focus({ preventScroll: true });
    cards[6].scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center' });
  });

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

  function showPreview(type, selected) {
    previewType = type;
    const collection = type === 'work' ? data.projects : data.certificates;
    previewIndex = (selected + collection.length) % collection.length;
    const item = collection[previewIndex];
    title.textContent = item.title;
    subtitle.textContent = type === 'work' ? item.tools : item.issuer;
    document.getElementById('preview-type').textContent = type === 'work' ? `${item.cat.toUpperCase()} · PORTFOLIO SAMPLE` : 'TRAINING CREDENTIAL';
    previewImage.src = type === 'work' ? `images/admin-va/page-${String(item.page).padStart(2, '0')}.webp` : `images/admin-va/${item.file}.webp`;
    previewImage.alt = type === 'work' ? `Original portfolio page ${item.page}: ${item.title}` : `${item.title} certificate awarded to Brigitte Morta`;
    description.textContent = type === 'work' ? item.desc : '';
    description.hidden = type !== 'work';
    sourceLink.href = type === 'work' ? `https://drive.google.com/file/d/1PDuwoEhfDVWv-k0FV95VNDAHnQTMYa2T/view?usp=drive_link` : `images/admin-va/${item.file}.webp`;
    sourceLink.firstChild.textContent = type === 'work' ? `Open original PDF · page ${item.page} ` : 'Open full-size certificate ';
    externalLink.hidden = !item.url;
    if (item.url) {
      externalLink.href = item.url;
      externalLink.textContent = `${item.link} ↗`;
    } else {
      externalLink.removeAttribute('href');
    }
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
  document.getElementById('year').textContent = new Date().getFullYear();
})();
