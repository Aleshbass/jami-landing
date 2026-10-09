// "Try Jami" — a scripted web preview of the Jami chat. Opens from any [data-try] element.
(() => {
  const APP_STORE = 'https://apps.apple.com/gb/app/jami-thrive-locally/id6605937547';
  const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.nextbud.app';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const onHome = location.pathname === '/' || location.pathname === '/index.html';

  const ICON = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    roller: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="15" height="6" rx="1.5"/><path d="M18 6h2v5h-8v3"/><rect x="10.5" y="14" width="3" height="7" rx="1"/></svg>'
  };

  const CARDS = {
    bee:   { tag: 'Movers',   name: 'Bee Move',   img: '/assets/moving-sofa.webp', desc: 'Two-person crew, blanket wrap, and a van that actually fits a sofa.', meta: 'Ancoats & city centre · Tomorrow 8–11am · From £89' },
    peach: { tag: 'Painters', name: 'Peach Coat', img: null, desc: 'Clean lines, furniture moved, and the room ready the same day.', meta: 'Chorlton · Thu–Sat this week · From £180/room' },
    priya: { tag: 'Nearby',   name: 'Priya',      img: '/assets/hero-card-cleaner.webp', desc: 'Runs a newcomers’ dinner once a month. No networking, just food.', meta: 'Northern Quarter · Next Tue 7pm' },
    amira: { tag: 'Nearby',   name: 'Amira',      img: '/assets/hero-card-love.webp', desc: 'Walks the canal most Sunday mornings. Newcomers always welcome.', meta: 'Ancoats · Sundays 10am' }
  };

  const FOLLOW_UP = ['Find me a cleaner for Saturday', 'Who else can I meet?', 'That’s all for now'];
  const ANYTHING_ELSE = 'Nothing else happens until you want it to. Need anything else locally?';

  // ---------- build the dialog once ----------
  const overlay = document.createElement('div');
  overlay.className = 'chat-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="chat" role="dialog" aria-modal="true" aria-labelledby="chat-title">
      <div class="chat-head">
        <img src="/assets/nav-logo.webp" width="44" height="44" alt="">
        <div class="who"><b id="chat-title">Jami</b><span>${ICON.pin}Your Manchester local agent</span></div>
        <a class="ctl" href="${onHome ? '#control' : '/#control'}">You stay in control</a>
        <button class="chat-close" type="button" aria-label="Close chat">${ICON.close}</button>
      </div>
      <div class="chat-body" aria-live="polite"></div>
      <form class="chat-input">
        <label class="sr" for="chat-text">Message Jami</label>
        <input id="chat-text" type="text" placeholder="Tell Jami what you need..." autocomplete="off">
        <button type="submit" aria-label="Send">${ICON.up}</button>
      </form>
      <div class="sheet-scrim"></div>
      <div class="sheet" role="dialog" aria-label="Confirm booking" aria-hidden="true">
        <div class="top"><span>You stay in control</span><button class="chat-close" type="button" data-sheet-close aria-label="Close">${ICON.close}</button></div>
        <h3>Bee Move</h3>
        <div class="simg"><img src="/assets/moving-sofa.webp" alt="Bee Move crew carrying a sofa"></div>
        <p class="sdesc">Two-person crew, blanket wrap, and a van that actually fits a sofa.</p>
        <dl>
          <dt>When</dt><dd>Tomorrow, 8–11am</dd>
          <dt>Where</dt><dd>Ancoats &amp; city centre</dd>
          <dt>Cost</dt><dd>From £89</dd>
          <dt>Next step</dt><dd>Bee Move confirms by text</dd>
        </dl>
        <div class="acts">
          <button class="btn btn-ghost" type="button" data-sheet-close>Go back</button>
          <button class="btn btn-dark" type="button" data-confirm>Confirm booking</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const body = overlay.querySelector('.chat-body');
  const form = overlay.querySelector('.chat-input');
  const input = overlay.querySelector('#chat-text');
  const sheet = overlay.querySelector('.sheet');
  const scrim = overlay.querySelector('.sheet-scrim');
  let lastFocus = null, run = 0;

  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  const scroll = () => body.scrollTo({ top: body.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const you = text => { body.append(el('div', 'cm you', esc(text))); scroll(); };
  const jami = async (html, id) => {
    const t = el('div', 'cm jami typing', '<i></i><i></i><i></i>');
    body.append(t); scroll();
    await wait(900);
    if (id !== run) return false;
    t.remove();
    body.append(el('div', 'cm jami', html)); scroll();
    return true;
  };
  const storesHtml = `<div class="stores-mini"><a href="${APP_STORE}" target="_blank" rel="noopener">App Store</a><a href="${PLAY_STORE}" target="_blank" rel="noopener">Google Play</a></div>`;

  const cardHtml = c => `
    <article class="pcard2">
      <div class="pic">${c.img ? `<img src="${c.img}" alt="">` : `<div class="paint">${ICON.roller}</div>`}<span class="tag">${c.tag}</span></div>
      <h4>${c.name}</h4><p>${c.desc}</p><p class="meta2">${c.meta}</p>
    </article>`;
  const carousel = keys => {
    const wrap = el('div', 'carousel');
    wrap.innerHTML = `<button class="c-arrow prev" type="button" aria-label="Previous">${ICON.left}</button>
      <div class="track">${keys.map(k => cardHtml(CARDS[k])).join('')}</div>
      <button class="c-arrow next" type="button" aria-label="Next">${ICON.right}</button>`;
    const track = wrap.querySelector('.track');
    wrap.querySelector('.prev').onclick = () => track.scrollBy({ left: -252, behavior: 'smooth' });
    wrap.querySelector('.next').onclick = () => track.scrollBy({ left: 252, behavior: 'smooth' });
    body.append(wrap); scroll();
  };
  const chips = labels => {
    const row = el('div', 'chips2');
    labels.forEach(l => { const b = el('button', null, esc(l)); b.type = 'button'; b.onclick = () => { row.querySelectorAll('button').forEach(x => x.disabled = true); handle(l); }; row.append(b); });
    body.append(row); scroll();
  };

  // ---------- conversation ----------
  async function start() {
    const id = ++run;
    body.innerHTML = '';
    await wait(250); if (id !== run) return;
    you('I’m moving to Manchester tomorrow. I need a mover, a painter and I don’t know anyone there.');
    if (!await jami('Welcome to Manchester — tomorrow’s a big day. I’ve lined up movers who can do tomorrow morning, painters free later this week, and a few friendly locals so you’re not starting from zero.', id)) return;
    await wait(250); if (id !== run) return;
    carousel(['bee', 'peach', 'priya', 'amira']);
    await wait(250); if (id !== run) return;
    chips(['Book Bee Move for tomorrow', 'Message Amira about a walk', 'See Priya’s next dinner']);
  }

  async function handle(label) {
    const id = run;
    if (label === 'Book Bee Move for tomorrow') { openSheet(); return; }
    you(label);
    let ok = true;
    switch (label) {
      case 'Message Amira about a walk':
        ok = await jami(`I’ve asked Amira if you can join Sunday’s canal walk. ${ANYTHING_ELSE}`, id); break;
      case 'See Priya’s next dinner':
        ok = await jami(`I’ll introduce you to Priya. Her next dinner is Tuesday at 7pm in the Northern Quarter. ${ANYTHING_ELSE}`, id); break;
      case 'Who else can I meet?':
        ok = await jami('Priya and Amira are both nearby and happy to meet newcomers.', id);
        if (ok) { carousel(['priya', 'amira']); chips(['See Priya’s next dinner', 'Message Amira about a walk', 'That’s all for now']); }
        return;
      case 'That’s all for now':
        await jami(`Welcome to Manchester. I’m here whenever you need something local. Get Jami on your phone to carry on.${storesHtml}`, id);
        return;
      default:
        await jami(`In the app I’d find you options for that right away. This web preview only covers moving day, so download Jami to ask for real.${storesHtml}`, id);
        return;
    }
    if (ok) chips(FOLLOW_UP);
  }

  // ---------- confirm sheet ----------
  function openSheet() {
    sheet.classList.add('is-open'); scrim.classList.add('is-open'); sheet.setAttribute('aria-hidden', 'false');
    sheet.querySelector('[data-confirm]').focus();
  }
  function closeSheet(reenable) {
    sheet.classList.remove('is-open'); scrim.classList.remove('is-open'); sheet.setAttribute('aria-hidden', 'true');
    if (reenable) { const all = body.querySelectorAll('.chips2'), last = all[all.length - 1]; last && last.querySelectorAll('button').forEach(b => b.disabled = false); }
  }
  sheet.querySelectorAll('[data-sheet-close]').forEach(b => b.onclick = () => closeSheet(true));
  scrim.onclick = () => closeSheet(true);
  sheet.querySelector('[data-confirm]').onclick = async () => {
    closeSheet(false);
    const id = run;
    you('Book Bee Move for tomorrow');
    if (await jami(`You’re booked with Bee Move for tomorrow, 8–11am. ${ANYTHING_ELSE}`, id)) chips(FOLLOW_UP);
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = input.value.trim(); if (!v) return;
    input.value = '';
    body.querySelectorAll('.chips2 button').forEach(b => b.disabled = true);
    handle(v);
  });

  // ---------- open / close ----------
  function open() {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    closeSheet(false);
    start();
    setTimeout(() => input.focus({ preventScroll: true }), 50);
  }
  function close() {
    run++;
    overlay.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    setTimeout(() => { overlay.hidden = true; }, reduce ? 0 : 300);
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  overlay.querySelector('.chat-head .chat-close').onclick = close;
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  overlay.querySelector('.ctl').addEventListener('click', () => { if (onHome) close(); });
  document.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') { sheet.classList.contains('is-open') ? closeSheet(true) : close(); }
    if (e.key === 'Tab') { // keep focus inside the dialog
      const f = [...overlay.querySelectorAll('button:not([disabled]), a[href], input')].filter(x => x.offsetParent !== null && !x.closest('.sheet:not(.is-open)'));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('click', e => { const t = e.target.closest('[data-try]'); if (t) { e.preventDefault(); open(); } });
})();
