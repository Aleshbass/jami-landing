document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scale the hero scene (authored at 1440×700) to the viewport
  const scene = document.querySelector('.scene');
  const fit = () => {
    if (!scene) return;
    const w = scene.clientWidth, mobile = w < 760;
    const s = mobile ? w / 760 : Math.min(1, w / 1440);
    scene.style.setProperty('--s', s.toFixed(4));
    scene.style.setProperty('--dx', mobile ? '21.5px' : '0px');
  };
  fit(); addEventListener('resize', fit);

  // Nav state on scroll
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 10);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  // Scroll reveals (staggered). Only content below the fold starts hidden.
  const groups = [
    ['.problem .head'], ['.problem .chip', .04], ['.problem .together'], ['.problem .photo'],
    ['.how .head'], ['.wcard', .09], ['.try-banner'],
    ['.first .head'], ['.first .mascot'], ['.tile', .05],
    ['.control .art'], ['.control .head > *', .07], ['.faq .head'], ['.item', .05],
    ['.panel'], ['.join > *', .06], ['.footer .top > *', .05]
  ];
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  groups.forEach(([sel, step = 0]) => document.querySelectorAll(sel).forEach((el, i) => {
    el.classList.add('rv');
    el.style.setProperty('--rd', (i * step).toFixed(2) + 's');
    if (!reduce && el.getBoundingClientRect().top > innerHeight) { el.classList.add('pre'); io.observe(el); }
  }));
  addEventListener('load', () => setTimeout(() => document.querySelectorAll('.rv.pre').forEach(el => {
    if (el.getBoundingClientRect().top < innerHeight) el.classList.remove('pre');
  }), 600));

  // Idle bob on mascots
  document.querySelectorAll('.control .art, .first .mascot img').forEach(el => el.classList.add('bob'));

  // Pointer parallax on the hero visuals
  const hero = document.querySelector('.hero');
  if (hero && !reduce && matchMedia('(pointer:fine)').matches) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (((e.clientX - r.left) / r.width - .5) * -10).toFixed(2));
      hero.style.setProperty('--my', (((e.clientY - r.top) / r.height - .5) * -8).toFixed(2));
    });
    hero.addEventListener('pointerleave', () => { hero.style.setProperty('--mx', 0); hero.style.setProperty('--my', 0); });
  }

  // Typewriter in the phone's input
  const typed = document.getElementById('hero-typed');
  const prompts = ['Find me a cleaner for Saturday.', 'A barber near Ancoats?', 'What’s on in Leeds this weekend?', 'Tell Jami what you need...'];
  if (typed && !reduce) {
    let p = 0, c = 0, del = false;
    const tick = () => {
      const t = prompts[p];
      c += del ? -1 : 1; typed.textContent = t.slice(0, c);
      let wait = del ? 28 : 55 + Math.random() * 40;
      if (!del && c === t.length) { del = true; wait = 1900; }
      else if (del && c === 0) { del = false; p = (p + 1) % prompts.length; wait = 350; }
      setTimeout(tick, wait);
    };
    setTimeout(tick, 4200);
  }

  // FAQ accordion (one open at a time)
  const qs = document.querySelectorAll('.qa');
  qs.forEach(btn => btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    qs.forEach(b => { b.setAttribute('aria-expanded', 'false'); b.querySelector('img').src = '/assets/faq-plus.svg'; });
    if (!open) { btn.setAttribute('aria-expanded', 'true'); btn.querySelector('img').src = '/assets/faq-close.svg'; }
  }));

  // Collapse the legal table of contents on small screens
  const toc = document.querySelector('.toc');
  if (toc && innerWidth <= 960) toc.open = false;
