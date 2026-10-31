import { el } from '../../utils/dom.js';
import '../../styles/landing.css';

const slides = [
  { image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1500&q=88', alt: 'Kucing berbulu lembut menikmati suasana tenang', kicker: 'Ruang untuk merasa aman', first: 'Care for', second: 'your', tail: ' pets', description: 'Perawatan yang penuh perhatian, untuk sahabat kecil yang selalu ada di sisi Anda.' },
  { image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1500&q=88', alt: 'Anjing menikmati waktu di alam terbuka', kicker: 'Waktu untuk merasa nyaman', first: 'Made for', second: 'their', tail: ' comfort', description: 'Ruang yang tenang dan perhatian yang tulus untuk teman berbulu Anda.' },
  { image: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=1500&q=88', alt: 'Kucing kecil dengan ekspresi penuh rasa ingin tahu', kicker: 'Perhatian untuk setiap karakter', first: 'Always by', second: 'your', tail: ' side', description: 'Kami hadir untuk menemani setiap langkah kecil menuju hari yang lebih baik.' },
];
const bookingHref = '#/login?next=%2Fcustomer%2Fbookings';
const servicesHref = '#/login?next=%2Fcustomer%2Fservices';

export function createLandingPage() {
  const node = el(`
    <div class="landing-page" id="petcareLanding">
      <header class="lp-header" data-header>
        <a class="lp-wordmark" href="#top" aria-label="PetCare, kembali ke atas"><span class="lp-mark" aria-hidden="true">p.</span><span>petcare<span class="lp-period">.</span></span></a>
        <button class="lp-menu-toggle" type="button" aria-expanded="false" aria-controls="lp-nav" aria-label="Buka menu"><span></span><span></span></button>
        <nav class="lp-nav" id="lp-nav" aria-label="Navigasi utama"><a href="#services">Layanan</a><a href="#approach">Tentang kami</a><a href="#care">Cerita perawatan</a></nav>
        <div class="lp-header-actions"><a class="lp-login" href="#/login">Masuk</a><a class="lp-button lp-button-dark lp-button-small" href="${bookingHref}">Buat janji <span aria-hidden="true">↗</span></a></div>
      </header>
      <section class="lp-hero lp-wrap" id="top" aria-labelledby="lp-title">
        <div class="lp-hero-copy"><p class="lp-eyebrow lp-hero-eyebrow"><span class="lp-rule"></span> Klinik hewan · Jakarta</p><h1 id="lp-title"><span class="lp-title-line"><span data-headline-first>Care for</span></span><span class="lp-title-line"><em data-headline-second>your</em><span data-headline-tail> pets</span><span class="lp-title-dot">.</span></span></h1><p class="lp-description" data-slide-description>Perawatan yang penuh perhatian, untuk sahabat kecil yang selalu ada di sisi Anda.</p><div class="lp-hero-actions"><a class="lp-button lp-button-dark" href="${bookingHref}">Atur kunjungan <span class="lp-arrow" aria-hidden="true">↗</span></a><a class="lp-text-link" href="#services">Jelajahi layanan <span aria-hidden="true">↓</span></a></div><div class="lp-note"><span aria-hidden="true">✳</span><span>Perhatian yang terasa<br />di setiap kunjungan.</span></div></div>
        <div class="lp-hero-visual" data-parallax><div class="lp-image-frame" data-hero-frame><img data-slide-image src="${slides[0].image}" alt="${slides[0].alt}" fetchpriority="high" /><div class="lp-image-shade"></div><div class="lp-image-caption"><span data-slide-kicker>${slides[0].kicker}</span><span class="lp-count" data-slide-count aria-live="polite">01 <i>/</i> 03</span></div></div><div class="lp-glass lp-glass-note" data-float="1"><span class="lp-glass-icon" aria-hidden="true">✳</span><span><strong>Care, with intention.</strong><small>Setiap teman berbulu punya cerita.</small></span></div><button class="lp-glass lp-glass-story" type="button" data-open-story aria-label="Baca tentang pendekatan PetCare"><span class="lp-play-icon" aria-hidden="true">✳</span><span><strong>Tentang PetCare</strong><small>Perhatian untuk setiap kunjungan</small></span><span class="lp-story-arrow" aria-hidden="true">↗</span></button><div class="lp-controls" aria-label="Kontrol foto utama"><button type="button" data-prev aria-label="Foto sebelumnya">←</button><div class="lp-dots" data-dots aria-label="Pilih foto"></div><button type="button" data-next aria-label="Foto berikutnya">→</button></div><span class="lp-ghost-index" aria-hidden="true" data-hero-index>01</span></div>
        <div class="lp-hero-footer"><span>PERAWATAN DENGAN HATI</span><span>SCROLL UNTUK MENJELAJAH</span><span aria-hidden="true">↓</span></div>
      </section>
      <section class="lp-intro lp-wrap lp-reveal" id="approach" aria-labelledby="lp-intro-title"><p class="lp-eyebrow"><span class="lp-rule"></span> CARA KAMI MERAWAT</p><h2 id="lp-intro-title">Lebih dari sekadar kunjungan.<br /><em>Rasa tenang untuk Anda berdua.</em></h2><p class="lp-intro-side">Pendekatan personal, tim yang penuh empati, dan ruang yang dirancang agar setiap kunjungan terasa lebih nyaman.</p></section>
      <section class="lp-services lp-wrap" id="services" aria-labelledby="lp-services-title"><div class="lp-section-heading lp-reveal"><div><p class="lp-eyebrow"><span class="lp-rule"></span> DENGAN PENUH PERHATIAN</p><h2 id="lp-services-title">Care for every<br /><em>kind of companion.</em></h2></div><a class="lp-text-link" href="${servicesHref}">Lihat layanan <span aria-hidden="true">↗</span></a></div><div class="lp-service-grid">
        <article class="lp-service-card lp-reveal" data-stagger="0"><div class="lp-service-image"><img src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=82" alt="Anjing kecil didampingi dengan lembut" loading="lazy" /><span>01 / KUNJUNGAN</span></div><div class="lp-service-copy"><div><h3>Perawatan kesehatan</h3><p>Perhatian yang menyeluruh, dari pemeriksaan rutin hingga konsultasi.</p></div><a href="${servicesHref}" aria-label="Jelajahi layanan kesehatan">↗</a></div></article>
        <article class="lp-service-card lp-reveal" data-stagger="1"><div class="lp-service-image"><img src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=900&q=82" alt="Anjing menikmati perawatan grooming" loading="lazy" /><span>02 / GROOMING</span></div><div class="lp-service-copy"><div><h3>Grooming penuh kasih</h3><p>Waktu untuk merasa segar, nyaman, dan menjadi diri sendiri.</p></div><a href="${servicesHref}" aria-label="Jelajahi layanan grooming">↗</a></div></article>
        <article class="lp-service-card lp-reveal" data-stagger="2"><div class="lp-service-image"><img src="https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=82" alt="Anjing kecil menatap dengan ceria" loading="lazy" /><span>03 / PERSONAL</span></div><div class="lp-service-copy"><div><h3>Rencana yang personal</h3><p>Setiap hewan unik. Perhatian dan sarannya pun seharusnya begitu.</p></div><a href="${servicesHref}" aria-label="Jelajahi layanan personal">↗</a></div></article>
      </div></section>
      <section class="lp-story" id="care"><div class="lp-story-inner lp-wrap"><div class="lp-story-image lp-reveal"><img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1400&q=88" alt="Dua anjing berjalan berdampingan di alam terbuka" loading="lazy" /><span>Bersama, di setiap langkah.</span></div><div class="lp-story-copy lp-reveal"><p class="lp-eyebrow"><span class="lp-rule"></span> FILOSOFI PETCARE</p><h2>Small moments.<br /><em>Big love.</em></h2><p>Ruang yang tenang. Sapaan yang lembut. Waktu untuk mendengarkan. Kami percaya perawatan terbaik dimulai dari memahami siapa mereka—dan betapa berartinya mereka bagi Anda.</p><a class="lp-button lp-button-outline" href="${bookingHref}">Mari berkenalan <span class="lp-arrow" aria-hidden="true">↗</span></a></div></div></section>
      <section class="lp-promise lp-wrap lp-reveal" aria-labelledby="lp-promise-title"><p class="lp-eyebrow"><span class="lp-rule"></span> HAL-HAL YANG BERARTI</p><h2 id="lp-promise-title">Thoughtful care,<br /><em>in the little things.</em></h2><div class="lp-promise-grid"><article><span data-count="1">01</span><h3>Kenali mereka</h3><p>Setiap teman punya karakter, kebiasaan, dan kebutuhan yang berbeda.</p></article><article><span data-count="2">02</span><h3>Dengarkan Anda</h3><p>Kami memulai dengan percakapan dan perhatian pada setiap detail.</p></article><article><span data-count="3">03</span><h3>Rawat sepenuh hati</h3><p>Pengalaman yang hangat untuk hewan, dan rasa tenang untuk keluarga.</p></article></div></section>
      <section class="lp-closing lp-wrap lp-reveal"><div><p class="lp-eyebrow"><span class="lp-rule"></span> LANGKAH KECIL, HARI YANG LEBIH BAIK</p><h2>They make life<br /><em>more lovely.</em></h2></div><a class="lp-button lp-button-dark" href="${bookingHref}">Buat janji kunjungan <span class="lp-arrow" aria-hidden="true">↗</span></a><span class="lp-orb lp-orb-one" aria-hidden="true"></span><span class="lp-orb lp-orb-two" aria-hidden="true"></span></section>
      <footer class="lp-footer lp-wrap"><a class="lp-wordmark" href="#top"><span class="lp-mark" aria-hidden="true">p.</span><span>petcare<span class="lp-period">.</span></span></a><span>Dengan hati, untuk mereka yang kita sayangi.</span><div><a href="#/login">Masuk</a><a href="${bookingHref}">Buat janji ↗</a></div><small>© ${new Date().getFullYear()} PetCare</small></footer>
      <div class="lp-modal" data-story-modal hidden><div class="lp-modal-backdrop" data-close-story></div><section class="lp-dialog" role="dialog" aria-modal="true" aria-labelledby="lp-dialog-title" tabindex="-1"><button class="lp-modal-close" type="button" data-close-story aria-label="Tutup">×</button><span class="lp-dialog-icon" aria-hidden="true">✳</span><p class="lp-eyebrow">PENDEKATAN PETCARE</p><h2 id="lp-dialog-title">Care should feel<br /><em>like coming home.</em></h2><p>Setiap kunjungan dimulai dengan perhatian, percakapan, dan pemahaman tentang kebutuhan hewan kesayangan Anda.</p><a class="lp-button lp-button-dark" href="${bookingHref}">Buat janji <span class="lp-arrow" aria-hidden="true">↗</span></a></section></div>
    </div>`);

  const controller = new AbortController();
  const { signal } = controller;
  const $ = (selector) => node.querySelector(selector);
  const header = $('[data-header]');
  const image = $('[data-slide-image]');
  const caption = $('[data-slide-kicker]');
  const slideCount = $('[data-slide-count]');
  const heroIndex = $('[data-hero-index]');
  const title = $('#lp-title');
  const titleFirst = $('[data-headline-first]');
  const titleSecond = $('[data-headline-second]');
  const titleTail = $('[data-headline-tail]');
  const description = $('[data-slide-description]');
  const dots = $('[data-dots]');
  const modal = $('[data-story-modal]');
  const dialog = $('[role="dialog"]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeSlide = 0;
  let transitionLock = false;
  let touchStartX = null;
  let lastFocused = null;
  let destroyed = false;
  let scrollQueued = false;
  let pointerQueued = false;
  let observer = null;

  const updateDots = (index) => [...dots.children].forEach((dot, dotIndex) => {
    dot.classList.toggle('is-active', dotIndex === index);
    dot.setAttribute('aria-pressed', String(dotIndex === index));
  });
  slides.forEach((slide, index) => {
    const dot = document.createElement('button');
    dot.className = `lp-dot${index === 0 ? ' is-active' : ''}`;
    dot.type = 'button';
    dot.setAttribute('aria-label', `Tampilkan foto ${index + 1}`);
    dot.setAttribute('aria-pressed', String(index === 0));
    dot.addEventListener('click', () => showSlide(index), { signal });
    dots.append(dot);
  });

  function showSlide(next) {
    if (destroyed || transitionLock || next === activeSlide) return;
    transitionLock = true;
    const target = (next + slides.length) % slides.length;
    const slide = slides[target];
    image.classList.add('is-changing');
    window.setTimeout(() => {
      if (destroyed) return;
      image.onload = () => { image.classList.remove('is-changing'); activeSlide = target; transitionLock = false; };
      image.onerror = () => { image.classList.remove('is-changing'); activeSlide = target; transitionLock = false; };
      image.src = slide.image;
      image.alt = slide.alt;
      caption.textContent = slide.kicker;
      title.classList.remove('is-changing');
      description.classList.remove('is-changing');
      titleFirst.textContent = slide.first;
      titleSecond.textContent = slide.second;
      titleTail.textContent = slide.tail;
      description.textContent = slide.description;
      requestAnimationFrame(() => {
        title.classList.add('is-changing');
        description.classList.add('is-changing');
        window.setTimeout(() => { title.classList.remove('is-changing'); description.classList.remove('is-changing'); }, reducedMotion ? 0 : 600);
      });
      const number = String(target + 1).padStart(2, '0');
      slideCount.innerHTML = `${number} <i>/</i> 03`;
      heroIndex.textContent = number;
      updateDots(target);
      if (image.complete) image.onload();
    }, reducedMotion ? 0 : 270);
  }
  $('[data-prev]').addEventListener('click', () => showSlide(activeSlide - 1), { signal });
  $('[data-next]').addEventListener('click', () => showSlide(activeSlide + 1), { signal });
  const heroFrame = $('[data-hero-frame]');
  heroFrame.addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0]?.clientX ?? null; }, { passive: true, signal });
  heroFrame.addEventListener('touchend', (event) => {
    if (touchStartX === null) return;
    const dx = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 45) showSlide(activeSlide + (dx < 0 ? 1 : -1));
    touchStartX = null;
  }, { passive: true, signal });

  const menuToggle = $('.lp-menu-toggle');
  const nav = $('.lp-nav');
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    nav.classList.toggle('is-open', open);
  }, { signal });
  nav.addEventListener('click', (event) => {
    if (!event.target.closest('a')) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Buka menu');
    nav.classList.remove('is-open');
  }, { signal });
  window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => { header.classList.toggle('is-scrolled', window.scrollY > 30); scrollQueued = false; });
  }, { passive: true, signal });

  if ('IntersectionObserver' in window && !reducedMotion) {
    observer = new IntersectionObserver((entries, currentObserver) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      if (entry.target.classList.contains('lp-promise')) entry.target.querySelectorAll('[data-count]').forEach(animateOrdinal);
      currentObserver.unobserve(entry.target);
    }), { threshold: 0.16, rootMargin: '0px 0px -35px 0px' });
    node.querySelectorAll('.lp-reveal').forEach((element) => observer.observe(element));
  } else node.querySelectorAll('.lp-reveal').forEach((element) => element.classList.add('is-visible'));

  function animateOrdinal(element) {
    const target = Number(element.dataset.count);
    const start = performance.now();
    element.textContent = '00';
    const step = (now) => {
      if (destroyed) return;
      const progress = Math.min((now - start) / 720, 1);
      element.textContent = String(Math.round(target * (1 - (1 - progress) ** 4))).padStart(2, '0');
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const parallax = $('[data-parallax]');
  if (window.matchMedia('(pointer: fine) and (min-width: 900px)').matches && !reducedMotion) {
    parallax.addEventListener('pointermove', (event) => {
      if (pointerQueued) return;
      const rect = parallax.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      pointerQueued = true;
      requestAnimationFrame(() => {
        parallax.style.transform = `translate3d(${x * 3}px,${y * 3}px,0)`;
        node.querySelectorAll('[data-float]').forEach((element, index) => { const factor = Number(element.dataset.float) || index + 1; element.style.translate = `${x * factor * -7}px ${y * factor * -6}px`; });
        pointerQueued = false;
      });
    }, { signal });
    parallax.addEventListener('pointerleave', () => { parallax.style.transform = ''; node.querySelectorAll('[data-float]').forEach((element) => { element.style.translate = ''; }); }, { signal });
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('lp-modal-open');
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  }
  $('[data-open-story]').addEventListener('click', () => { lastFocused = document.activeElement; modal.hidden = false; document.body.classList.add('lp-modal-open'); $('.lp-modal-close').focus(); }, { signal });
  modal.querySelectorAll('[data-close-story]').forEach((element) => element.addEventListener('click', closeModal, { signal }));
  document.addEventListener('keydown', (event) => {
    if (modal.hidden) return;
    if (event.key === 'Escape') closeModal();
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button,[href],[tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) return;
    if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
  }, { signal });
  node.querySelectorAll('.lp-button').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      if (!window.matchMedia('(pointer: fine)').matches || reducedMotion) return;
      const rect = button.getBoundingClientRect();
      button.style.setProperty('--mag-x', `${(event.clientX - rect.left - rect.width / 2) * 0.06}px`);
      button.style.setProperty('--mag-y', `${(event.clientY - rect.top - rect.height / 2) * 0.06}px`);
    }, { signal });
    button.addEventListener('pointerleave', () => { button.style.setProperty('--mag-x', '0px'); button.style.setProperty('--mag-y', '0px'); }, { signal });
  });

  requestAnimationFrame(() => { if (!destroyed) node.classList.add('lp-ready'); });
  return { node, destroy() { destroyed = true; controller.abort(); observer?.disconnect(); document.body.classList.remove('lp-modal-open'); } };
}
