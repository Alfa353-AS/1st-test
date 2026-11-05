(() => {
  'use strict';

  /* ---------- Config: edit here to rebrand ---------- */
  const CONFIG = {
    words: ['hello.', 'design.', 'develop.', 'launch.'],
    label: 'STUDIO / ANTWERP',
    city: 'Antwerp',
    timeZone: 'Europe/Brussels',
    bootMs: 1800,
  };

  const $ = (s) => document.querySelector(s);
  const root = document.documentElement;
  const hero = $('.hero'), canvas = $('#hero-canvas');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const isRetro = () => root.dataset.era === '1984';
  const dprNow = () => (isRetro() ? 0.3 : Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2));
  const KEYS = 'qwertyasdfgh';

  /* ---------- Clock ---------- */
  const clockEl = $('#clock');
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: CONFIG.timeZone });
  const tick = () => { clockEl.textContent = `${CONFIG.city} ${fmt.format(new Date())}`; };
  tick(); setInterval(tick, 1000);

  /* ---------- Installer (boot) ---------- */
  const boot = $('#boot');
  function endBoot() {
    root.classList.remove('booting');
    if (!boot || boot.hidden) return;
    boot.classList.add('done');
    setTimeout(() => { boot.hidden = true; }, 520);
  }
  if (boot && !reduced) {
    boot.hidden = false;
    const fill = $('#boot-fill'), eta = $('#boot-eta'), t0 = performance.now();
    const step = (now) => {
      if (boot.hidden || boot.classList.contains('done')) return;
      const p = Math.min((now - t0) / CONFIG.bootMs, 1);
      fill.style.width = `${(p * 100) | 0}%`;
      eta.textContent = p < 1 ? `Time remaining: ${Math.ceil(42 * (1 - p))} years` : 'Done.';
      p < 1 ? requestAnimationFrame(step) : endBoot();
    };
    requestAnimationFrame(step);
    $('#boot-skip').addEventListener('click', endBoot);
    addEventListener('keydown', (e) => { if (e.key === 'Escape' || e.key === 'Enter') endBoot(); }, { once: true });
  } else endBoot();

  /* ---------- Menu ---------- */
  const menu = $('#menu'), menuBtn = $('#menu-button');
  const setMenu = (open) => { menu.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.firstElementChild.textContent = open ? 'Close' : 'Menu'; };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Shared state: typing + pointer ---------- */
  const typer = {
    i: 0, n: reduced ? CONFIG.words[0].length : 0, del: false, at: 0, user: '', until: 0,
    get text() { return this.user || CONFIG.words[this.i].slice(0, this.n); },
    // returns 0 = nothing, 1 = text changed, 2 = changed by a keystroke
    step(now) {
      if (now < this.until) return 0;
      if (this.user) { this.user = ''; this.n = 0; this.del = false; }
      if (reduced || now < this.at) return 0;
      const w = CONFIG.words[this.i];
      if (!this.del) {
        if (this.n < w.length) { this.n++; this.at = now + 110; return 2; }
        this.del = true; this.at = now + 1200; return 0;
      }
      if (this.n > 0) { this.n--; this.at = now + 45; return 1; }
      this.del = false; this.i = (this.i + 1) % CONFIG.words.length; this.at = now + 250; return 1;
    },
    input(ch) {
      this.user = ch === '\b' ? this.user.slice(0, -1) : (this.user + ch).slice(-12);
      this.until = performance.now() + 3000;
    },
  };
  const ptr = { x: 0.7, y: 0.38, nx: 0.25, ny: 0.1, idle: true };
  const lblX = $('#lbl-x'), lblY = $('#lbl-y');

  let actx;
  const clack = () => {
    if (!actx) return;
    const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
    o.type = 'square'; o.frequency.value = 170 + Math.random() * 70;
    g.gain.setValueAtTime(0.035, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.05);
  };

  /* ---------- 3D engine ---------- */
  function make3D() {
    let r;
    try { r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !coarse, powerPreference: 'high-performance' }); }
    catch (e) { return null; }
    r.setClearColor(0x000000, 0);
    r.shadowMap.enabled = !coarse; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;

    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(27, 1, 0.1, 100);
    const kb = new THREE.Group(), ray = new THREE.Raycaster();
    const m = new THREE.Vector2(0.25, 0.1), tgt = new THREE.Vector2(0.25, 0.1);
    const keys = [];
    scene.add(kb);

    const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.4, ...o });
    const box = (w, h, d, mt, x = 0, y = 0, z = 0) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mt);
      b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; kb.add(b); return b;
    };
    box(6.1, 0.44, 4.08, mat(0x201b1b, { roughness: 0.4, metalness: 0.55 }), 0, 0.02, 0);
    box(5.78, 0.13, 3.75, mat(0x51413d, { roughness: 0.56, metalness: 0.18 }), 0, 0.3, 0);

    const keyGeo = new THREE.BoxGeometry(0.72, 0.22, 1.14);
    const mats = {
      hot: mat(0x94132d, { emissive: 0x520415, emissiveIntensity: 0.6 }),
      light: mat(0xe9e2d7, { roughness: 0.62, metalness: 0.05 }),
      dark: mat(0x49101c, { roughness: 0.36, metalness: 0.25 }),
    };
    for (let row = 0; row < 2; row++) for (let col = 0; col < 6; col++) {
      const k = new THREE.Mesh(keyGeo, row === 1 && col === 5 ? mats.hot : row === 0 && col < 2 ? mats.light : mats.dark);
      k.position.set(-2.05 + col * 0.82, 0.49, -0.64 + row * 1.35);
      k.castShadow = k.receiveShadow = true;
      k.userData = { baseY: k.position.y, press: 0, ch: KEYS[row * 6 + col] };
      keys.push(k); kb.add(k);
    }

    /* Live terminal screen (canvas texture) */
    const term = document.createElement('canvas'); term.width = 1024; term.height = 346;
    const pen = term.getContext('2d');
    const tex = new THREE.CanvasTexture(term);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(8, r.capabilities.getMaxAnisotropy());
    let sig = '';
    const drawTerm = (now) => {
      const text = typer.text, on = Math.floor(now / 520) % 2 === 0, s = text + on;
      if (s === sig) return; sig = s;
      pen.setTransform(1024 / 768, 0, 0, 1024 / 768, 0, 0);
      pen.fillStyle = '#0b0a0a'; pen.fillRect(0, 0, 768, 260);
      pen.fillStyle = '#d7193a'; pen.fillRect(28, 34, 12, 12);
      pen.fillStyle = '#7d7470'; pen.font = '500 24px "DM Mono", monospace'; pen.fillText(CONFIG.label, 62, 46);
      pen.fillStyle = '#f3f1ec'; pen.font = '500 66px "DM Mono", monospace'; pen.fillText(text, 62, 154);
      if (on) { pen.fillStyle = '#d7193a'; pen.fillRect(67 + pen.measureText(text).width, 103, 7, 60); }
      pen.fillStyle = 'rgba(255,255,255,.035)';
      for (let y = 0; y < 260; y += 4) pen.fillRect(0, y, 768, 1);
      tex.needsUpdate = true;
    };
    box(3.06, 0.14, 1.19, mat(0x0d0c0c, { roughness: 0.28, metalness: 0.55 }), -1.06, 0.39, -1.77);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.82, 0.95), new THREE.MeshBasicMaterial({ map: tex }));
    screen.rotation.x = -Math.PI / 2; screen.position.set(-1.06, 0.47, -1.77); kb.add(screen);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.42, 0.2, 40), mat(0x260d15, { roughness: 0.3, metalness: 0.75 }));
    knob.position.set(2.17, 0.48, -1.75); knob.castShadow = true; kb.add(knob);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 20), new THREE.MeshBasicMaterial({ color: 0xd7193a }));
    led.position.set(2.63, 0.54, -1.78); kb.add(led);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(35, 35), new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.52 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.4; floor.receiveShadow = true;
    const red = new THREE.DirectionalLight(0xff3045, 5.2); red.position.set(-5, 6, 2);
    const warm = new THREE.DirectionalLight(0xffe9d0, 4.3); warm.position.set(4, 7, 5);
    warm.castShadow = !coarse; warm.shadow.mapSize.set(1024, 1024);
    scene.add(floor, new THREE.HemisphereLight(0xfff5ed, 0x14090c, 0.55), red, warm);

    let mobile = false, baseY = -0.25, hover = null;
    const press = (k, v = 1) => { if (k) k.userData.press = Math.max(k.userData.press, v); };
    const pick = () => { ray.setFromCamera(m, cam); return ray.intersectObjects(keys, false)[0]?.object || null; };

    function resize() {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      r.setPixelRatio(dprNow()); r.setSize(width, height, false);
      mobile = width < 900;
      cam.aspect = width / height; cam.fov = mobile ? 34 : 27;
      cam.position.set(mobile ? 0 : 4.1, mobile ? 8.8 : 7.4, mobile ? 11 : 11.8);
      baseY = mobile ? -0.85 : -0.25;
      kb.position.x = mobile ? 0 : 0.7; kb.scale.setScalar(mobile ? 0.72 : 0.94);
      cam.lookAt(mobile ? 0 : 0.8, mobile ? -0.8 : -0.25, 0); cam.updateProjectionMatrix();
      sig = ''; draw(0, performance.now());
    }

    function draw(dt, t) {
      if (ptr.idle && !reduced) tgt.set(0.25 + Math.sin(t * 0.0004) * 0.25, 0.1 + Math.cos(t * 0.0003) * 0.12);
      else tgt.set(ptr.nx, ptr.ny);
      m.lerp(tgt, 1 - Math.exp(-dt * 6));

      if (!ptr.idle && !coarse) { const h = pick(); if (h && h !== hover) press(h, 0.7); hover = h; } else hover = null;
      const s = typer.step(t);
      if (s === 2) { press(keys[(Math.random() * keys.length) | 0], 0.9); }
      drawTerm(t);

      for (const k of keys) {
        const u = k.userData; u.press = Math.max(0, u.press - dt * 4.5);
        k.position.y = u.baseY - u.press * u.press * (3 - 2 * u.press) * 0.115;
      }
      kb.rotation.set(-0.12 + m.y * 0.075, -0.45 + m.x * 0.09, 0);
      kb.position.y = baseY + (reduced ? 0 : Math.sin(t * 0.00082) * 0.035);
      knob.rotation.y = t * 0.00035;
      led.material.color.setHex(Math.sin(t * 0.004) > 0 ? 0xd7193a : 0x5a0c20);
      r.render(scene, cam);
    }

    return {
      resize, draw,
      tap(nx, ny) { m.set(nx, ny); tgt.set(nx, ny); const k = pick(); if (k) { press(k, 1); typer.input(k.userData.ch); clack(); } },
      key(ch) { press(keys[(Math.random() * keys.length) | 0], 1); clack(); },
      dispose() { r.dispose(); tex.dispose(); keyGeo.dispose(); },
    };
  }

  /* ---------- 2D fallback (no WebGL / no three.js) ---------- */
  function make2D() {
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    let w = 0, h = 0, px = 0.7, py = 0.38;
    function resize() {
      const b = canvas.getBoundingClientRect(), d = dprNow();
      w = b.width; h = b.height; canvas.width = w * d; canvas.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    const rr = (x, y, a, b, c) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, a, b, c) : ctx.rect(x, y, a, b); };
    function draw(dt, t) {
      const k = 1 - Math.exp(-dt * 4); px += (ptr.x - px) * k; py += (ptr.y - py) * k; typer.step(t);
      ctx.clearRect(0, 0, w, h);
      const mob = w < 900, sc = Math.min(w / (mob ? 520 : 780), 1), cx = mob ? w * 0.5 : w * 0.69, cy = mob ? h * 0.37 : h * 0.4;
      const bw = 370 * sc, bh = 220 * sc, dx = (px - 0.5) * 18, dy = (py - 0.5) * 11;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 270 * sc); g.addColorStop(0, '#d7193a40'); g.addColorStop(1, '#d7193a00');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.translate(cx + dx, cy + dy); ctx.rotate(-0.17); ctx.translate(-bw / 2, -bh / 2);
      ctx.shadowColor = '#000'; ctx.shadowBlur = 32; ctx.shadowOffsetY = 22; rr(0, 0, bw, bh, 18 * sc); ctx.fillStyle = '#171313'; ctx.fill(); ctx.shadowColor = 'transparent';
      rr(12 * sc, 13 * sc, bw - 24 * sc, bh - 26 * sc, 13 * sc); ctx.fillStyle = '#342d2c'; ctx.fill();
      const gap = 9 * sc, kw = (bw - 58 * sc - gap * 5) / 6, kh = (bh - 92 * sc - gap) / 2;
      for (let row = 0; row < 2; row++) for (let c = 0; c < 6; c++) {
        rr(29 * sc + c * (kw + gap), 26 * sc + row * (kh + gap), kw, kh, 6 * sc);
        ctx.fillStyle = row === 1 && c === 5 ? '#a61632' : row === 0 && c < 2 ? '#ebe4d9' : '#571421'; ctx.fill();
      }
      rr(34 * sc, bh - 48 * sc, 185 * sc, 28 * sc, 4 * sc); ctx.fillStyle = '#0a0909'; ctx.fill();
      ctx.fillStyle = '#f3f1ec'; ctx.font = `${15 * sc}px "DM Mono", monospace`; const txt = typer.text;
      ctx.fillText(txt, 47 * sc, bh - 29 * sc);
      if (Math.floor(t / 520) % 2 === 0) { ctx.fillStyle = '#d7193a'; ctx.fillRect(51 * sc + ctx.measureText(txt).width, bh - 41 * sc, 4 * sc, 18 * sc); }
      ctx.restore();
    }
    return { resize, draw, tap() { clack(); }, key() { clack(); }, dispose() {} };
  }

  /* ---------- Boot the engine ---------- */
  const engine = (window.THREE && make3D()) || make2D();
  if (!engine) return;

  let raf = 0, last = 0, visible = true;
  const frame = (t) => {
    raf = 0;
    if (!visible || document.hidden) return;
    engine.draw(Math.min((t - last) / 1000 || 0.016, 0.05), t); last = t;
    if (!reduced) raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const once = () => engine.draw(0.016, performance.now());

  new ResizeObserver(() => { engine.resize(); reduced ? once() : start(); }).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', start);
  document.fonts?.ready.then(() => { engine.resize(); });

  /* Pointer: listen on the hero (the canvas itself has pointer-events: none) */
  const norm = (e) => {
    const b = canvas.getBoundingClientRect();
    ptr.x = (e.clientX - b.left) / b.width; ptr.y = (e.clientY - b.top) / b.height;
    ptr.nx = ptr.x * 2 - 1; ptr.ny = -(ptr.y * 2 - 1); ptr.idle = false;
    lblX.textContent = `x ${ptr.x.toFixed(2)}`; lblY.textContent = `y ${ptr.y.toFixed(2)}`;
  };
  hero.addEventListener('pointermove', norm, { passive: true });
  hero.addEventListener('pointerleave', () => { ptr.idle = true; }, { passive: true });
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a,button')) return;
    norm(e);
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {} }
    engine.tap(ptr.nx, ptr.ny);
    if (reduced) once();
  }, { passive: true });

  /* Real typing shows up on the terminal while the hero is on screen */
  addEventListener('keydown', (e) => {
    if (!visible || e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input,textarea,[contenteditable]')) return;
    if (e.key.length === 1 || e.key === 'Backspace') {
      typer.input(e.key === 'Backspace' ? '\b' : e.key.toLowerCase()); engine.key(); if (reduced) once();
    }
  });

  /* 1984 / 2026 switch */
  const eraBtn = $('#era');
  eraBtn.addEventListener('click', () => {
    const retro = !isRetro();
    root.dataset.era = retro ? '1984' : '2026';
    eraBtn.textContent = retro ? 'Forward to 2026' : 'Back to 1984';
    eraBtn.setAttribute('aria-pressed', String(retro));
    engine.resize(); if (reduced) once();
  });

  addEventListener('pagehide', () => { cancelAnimationFrame(raf); engine.dispose(); });
  start();
})();
