import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/* ============ CONFIG: replace with your own studio details ============ */
window.CONFIG = {
  brand:"halftone", brandTitle:"Halftone", city:"Cairo", timeZone:"Africa/Cairo",
  email:"hello@yourstudio.com", address:["Street name 00","0000 City"], company:"Company no. 0000.000.000",
  since:"2022", domain:"yourstudio.com",
  greetings:["Hello.","Marhaba.","Hallo.","Bonjour.","Hola.","Ciao.","Hej.","Olá."],
  steps:[
    {n:"01",t:"Brief", file:"brief.txt", body:"We start from your goals, your audience and what the site has to do for both."},
    {n:"02",t:"Design",file:"design.fig",body:"Structure, interface and art direction, worked out in Figma for every screen size."},
    {n:"03",t:"Build", file:"index.html",body:"Fully custom-built, with a CMS your team runs itself and animation only where it adds something."},
    {n:"04",t:"Launch",file:"",          body:"Forms, integrations, languages, tracking and technical SEO in order before launch. After that, we stay on."}
  ],
  words:["Design.","Development.","Motion.","One studio."],
  projects:[
    {name:"Voltline",    cat:"E-mobility & charging",    brief:"Charging hardware, energy services and fleet software in one ecosystem.", desc:"Development of the full site in three languages, built from the supplied design.", role:"Development", status:"Live", scene:"volt"},
    {name:"Cedar House", cat:"Hospitality",              brief:"Group stays in the hills, presented with the calm of the stay itself.", desc:"Design and development for three residences, their services and experiences, with booking always within reach.", role:"Design & development", status:"Live", scene:"cedar"},
    {name:"Northway",    cat:"Transport & logistics",    brief:"A logistics partner with a broad offer that had to read simply.", desc:"A clear structure for transport, logistics and the company behind them, so a large organisation feels approachable.", role:"Design & development", status:"Live", scene:"road"},
    {name:"Youthwave",   cat:"Youth research & strategy",brief:"A youth strategy agency that turns Gen Z and Gen Alpha culture into direction.", desc:"A site that explains complex cultural thinking clearly, from insight to action.", role:"Design & development", status:"Live", scene:"circle"}
  ]
};


const C = window.CONFIG;
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
const lerp = (a,b,t) => a+(b-a)*t;
const pad = n => String(n).padStart(2,"0");
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const store = { get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
let Y84 = false;

/* ---------- bind config ---------- */
const bind = { brand:C.brand, city:C.city, since:C.since, addr1:C.address[0], addr2:C.address[1], company:C.company, addressLine:C.address.join(", ") };
$$("[data-c]").forEach(n => { const k = n.dataset.c; if (k === "emailLink"){ n.textContent = C.email; n.href = "mailto:" + C.email; } else if (bind[k] != null) n.textContent = bind[k]; });
$("#yr").textContent = new Date().getFullYear();
document.title = `${C.brandTitle} | Custom web design and development in ${C.city}`;

/* ---------- clock ---------- */
(() => {
  let f; try { f = new Intl.DateTimeFormat("en-GB",{timeZone:C.timeZone,hour:"2-digit",minute:"2-digit",hour12:false}); } catch { f = new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit"}); }
  const t = () => $$(".clk").forEach(n => n.textContent = f.format(new Date()));
  t(); setInterval(t, 15000);
})();

/* ---------- toast ---------- */
let tt; const toast = m => { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 2200); };

/* ---------- buttons: rolling label + arrow swap (as reference) ---------- */
const ARW = '<svg viewBox="0 0 12 12"><path d="M2 10L10 2M4 2h6v6" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
function rollify(root = document){
  $$(".btn:not([data-r])", root).forEach(b => {
    const arrow = b.hasAttribute("data-arrow"), t = b.textContent.trim(); b.dataset.r = 1;
    b.innerHTML = `<span class="btn-l"><span class="rl"><span>${esc(t)}</span><span aria-hidden="true">${esc(t)}</span></span></span>${arrow ? `<span class="btn-i" aria-hidden="true">${ARW}${ARW}</span>` : ""}`;
  });
}
rollify();

/* =========================================================
   SOUND: synthesized UI sounds (Web Audio, no files) + toggle
   ========================================================= */
const Sound = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null, out = null, nbuf = null, on = store.get("halftone-sound"); if (on === null) on = true;
  const init = () => {
    if (!AC) return null;
    if (!ctx){
      ctx = new AC(); out = ctx.createGain(); out.gain.value = .32;
      const comp = ctx.createDynamicsCompressor(); out.connect(comp); comp.connect(ctx.destination);
      nbuf = ctx.createBuffer(1, ctx.sampleRate * .6, ctx.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };
  function tone({ f = 440, f2, d = .1, type = "sine", g = .3, at = 0, a = .004 }){
    const t = ctx.currentTime + at, o = ctx.createOscillator(), v = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g, t + a); v.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(v); v.connect(out); o.start(t); o.stop(t + d + .03);
  }
  function noise({ d = .05, f = 3000, f2, q = 1, type = "bandpass", g = .3, at = 0 }){
    const t = ctx.currentTime + at, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), v = ctx.createGain();
    s.buffer = nbuf; fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + d); fl.Q.value = q;
    v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(fl); fl.connect(v); v.connect(out); s.start(t, Math.random() * .4); s.stop(t + d + .03);
  }
  const FX = {
    click(){ noise({ d: .035, f: 4200, q: 2, g: .35 }); tone({ f: 1800, d: .03, type: "triangle", g: .07 }); },
    hover(){ tone({ f: 2600, d: .028, g: .03 }); },
    key(i){ noise({ d: .05, f: 2400 + i * 90, q: 1.2, g: .5 }); tone({ f: 150 - i * 4, f2: 70, d: .09, g: .32 }); noise({ d: .03, f: 5200, q: 3, g: .18, at: .06 }); },
    knob(){ noise({ d: .012, f: 6000, q: 6, g: .25 }); },
    era(y84){ (y84 ? [523, 659, 784, 1047] : [1047, 784, 659, 523]).forEach((n, k) => tone({ f: n, d: .09, type: y84 ? "square" : "sine", g: y84 ? .06 : .12, at: k * .07 })); noise({ d: .5, f: y84 ? 700 : 5000, f2: y84 ? 6000 : 400, q: .7, g: .12 }); },
    menu(open){ noise({ d: .45, f: open ? 300 : 3000, f2: open ? 3000 : 300, q: .8, g: .18 }); tone({ f: open ? 220 : 330, f2: open ? 330 : 220, d: .3, g: .06 }); },
    pop(){ tone({ f: 600, f2: 900, d: .08, g: .14 }); },
    close(){ tone({ f: 700, f2: 420, d: .09, g: .12 }); },
    blip(i){ tone({ f: [440, 523, 659, 784][i] || 440, d: .12, type: "triangle", g: .09 }); },
    swish(){ noise({ d: .35, f: 600, f2: 4000, q: .6, g: .14 }); tone({ f: 90, f2: 55, d: .25, g: .12 }); },
    tick(){ tone({ f: 1320, d: .05, type: "square", g: .035 }); },
    type(){ noise({ d: .02, f: 3500 + Math.random() * 1500, q: 4, g: .18 }); },
    toggle(v){ tone({ f: v ? 880 : 520, d: .06, type: "triangle", g: .1 }); noise({ d: .02, f: 5000, q: 3, g: .15 }); },
    confirm(){ [660, 880].forEach((f, k) => tone({ f, d: .12, g: .12, at: k * .08 })); },
    shutter(){ noise({ d: .06, f: 2500, q: 1, g: .3 }); noise({ d: .05, f: 1800, q: 1, g: .25, at: .09 }); },
    zap(){ tone({ f: 1400, f2: 110, d: .28, type: "square", g: .05 }); noise({ d: .16, f: 3000, q: .5, g: .12 }); },
    power(){ tone({ f: 900, f2: 40, d: .7, type: "sawtooth", g: .05 }); noise({ d: .35, f: 8000, q: .5, g: .07 }); tone({ f: 60, f2: 120, d: .5, g: .1, at: 1.1 }); },
    chatter(){ for (let k = 0; k < 8; k++) noise({ d: .02, f: 3200 + Math.random() * 1800, q: 4, g: .16, at: k * .055 }); }
  };
  let lastHover = 0;
  const ui = () => { const b = $("#sndBtn"); if (!b) return; b.setAttribute("aria-pressed", on); $("#sndLbl").textContent = on ? "Sound on" : "Sound off"; b.classList.toggle("off", !on); };
  return {
    play(name, ...a){
      if (!on || !AC) return;
      if (name === "hover"){ const n = performance.now(); if (n - lastHover < 70) return; lastHover = n; }
      init(); if (!ctx) return;
      const go = () => { try { FX[name](...a); } catch {} };
      ctx.state === "running" ? go() : ctx.resume().then(go).catch(() => {});
    },
    toggle(){ on = !on; store.set("halftone-sound", on); ui(); if (on){ init(); this.play("confirm"); } },
    unlock(){ if (on) init(); }, ui
  };
})();
Sound.ui();
$("#sndBtn").addEventListener("click", () => Sound.toggle());
document.addEventListener("pointerdown", e => {
  Sound.unlock();
  const t = e.target.closest("button, a, [role=button], label, select");
  if (t && t.id !== "sndBtn" && !t.closest("#kpGL")) Sound.play("click");
}, true);
document.addEventListener("click", e => { if (e.detail === 0 && e.target.closest("button, a")) Sound.play("click"); }, true);
document.addEventListener("pointerover", e => {
  const t = e.target.closest(".btn, .pill, .menu-btn, .ulink, .w-index button, .ap-idx button, .menu nav a, .ft-nav a, .logo");
  if (t && !t.contains(e.relatedTarget)) Sound.play("hover");
});
document.addEventListener("keydown", e => { if (/INPUT|TEXTAREA/.test(e.target.tagName) && e.key.length === 1) Sound.play("type"); });
document.addEventListener("change", e => { if (e.target.matches(".tg")) Sound.play("toggle", e.target.checked); });

/* =========================================================
   LENIS + GSAP SCROLLTRIGGER (same wiring the reference uses)
   ========================================================= */
gsap.registerPlugin(ScrollTrigger);
const lenis = (reduced || !matchMedia("(min-width: 992px)").matches || matchMedia("(pointer: coarse)").matches) ? null : new Lenis({ lerp:.07, wheelMultiplier:1, gestureOrientation:"vertical" });
if (lenis) window.lenis = lenis;
try { history.scrollRestoration = "manual"; } catch {}
if (lenis){
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToTarget = (target, opts={}) => {
  if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: t => 1 - Math.pow(1 - t, 4), ...opts });
  else (typeof target === "number" ? window.scrollTo(0, target) : document.querySelector(target)?.scrollIntoView());
};
document.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  e.preventDefault(); const h = a.getAttribute("href");
  if (menuOpen){ toggleMenu(false); setTimeout(() => scrollToTarget(h === "#intro" ? 0 : h), 450); }
  else scrollToTarget(h === "#intro" ? 0 : h);
});
$("#toTop").addEventListener("click", () => scrollToTarget(0, { duration: 2.2 }));

/* =========================================================
   NAV: hide on scroll down, colour on paper, section indicator
   ========================================================= */
(() => {
  const nav = $("#nav"); let last = 0;
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: s => {
    const y = s.scroll();
    nav.classList.toggle("hide", y > last && y > 300 && !menuOpen);
    last = y;
    gsap.set("#siBar", { scaleX: s.progress });
  }});
  $$(".paper, #one").forEach(p => ScrollTrigger.create({ trigger: p, start: "top 32px", end: "bottom 32px", toggleClass: { targets: nav, className: "on-paper" } }));
  let cur = "";
  const setSI = v => {
    if (v === cur) return; const [n, l] = v.split("|"); cur = v;
    gsap.timeline().to(["#siNum","#siLbl"], { yPercent: -110, duration: .25, ease: "power2.in" })
      .add(() => { $("#siNum").textContent = n; $("#siLbl").textContent = l; })
      .fromTo(["#siNum","#siLbl"], { yPercent: 110 }, { yPercent: 0, duration: .45, ease: "expo.out", stagger: .04 });
  };
  $$("[data-si]").forEach(s => ScrollTrigger.create({ trigger: s, start: "top 50%", end: "bottom 50%", onToggle: e => e.isActive && setSI(s.dataset.si) }));
})();

/* =========================================================
   MENU OVERLAY
   ========================================================= */
let menuOpen = false;
function toggleMenu(force){
  const was = menuOpen; menuOpen = force ?? !menuOpen; if (was !== menuOpen) Sound.play("menu", menuOpen);
  const m = $("#menu");
  $("#menuBtn").setAttribute("aria-expanded", menuOpen); $("#menuLbl").textContent = menuOpen ? "Close" : "Menu";
  m.setAttribute("aria-hidden", !menuOpen);
  if (menuOpen){
    lenis && lenis.stop(); $("#nav").classList.remove("hide","on-paper");
    gsap.set(m, { visibility: "visible" });
    gsap.timeline().to(m, { clipPath: "inset(0 0 0% 0)", duration: .9, ease: "expo.inOut" })
      .fromTo(".menu nav a .t", { yPercent: 105 }, { yPercent: 0, duration: 1, stagger: .06, ease: "expo.out" }, "-=.45")
      .fromTo(".menu nav a .n, .menu-foot", { opacity: 0 }, { opacity: 1, duration: .6, stagger: .05 }, "<.1")
      .fromTo(".menu-art", { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.1, ease: "expo.out" }, "<");
    MenuPrev.show(0);
  } else {
    lenis && lenis.start();
    gsap.to(m, { clipPath: "inset(0 0 100% 0)", duration: .8, ease: "expo.inOut", onComplete: () => gsap.set(m, { visibility: "hidden" }) });
  }
}
$("#menuBtn").addEventListener("click", () => toggleMenu());
addEventListener("keydown", e => { if (e.key === "Escape"){ if (modalOpen) closeModal(); else if (menuOpen) toggleMenu(false); } });
function drawMenuArt(c){
  const x = c.getContext("2d"), W = c.width, H = c.height;
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#2a0a4a"); g.addColorStop(.55, "#b0144f"); g.addColorStop(1, "#ff3fb0");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const glow = x.createRadialGradient(W*.25, H*.3, 10, W*.25, H*.3, W*.8); glow.addColorStop(0, "rgba(40,120,255,.75)"); glow.addColorStop(1, "rgba(40,120,255,0)");
  x.fillStyle = glow; x.fillRect(0, 0, W, H);
  const iso = (pts, fill) => { x.beginPath(); pts.forEach(([a,b],i) => i ? x.lineTo(a,b) : x.moveTo(a,b)); x.closePath(); x.fillStyle = fill; x.fill(); };
  iso([[150,250],[430,190],[520,260],[520,520],[240,590],[150,520]], "#d9d4f2");
  iso([[150,250],[430,190],[520,260],[240,320]], "#f1edff");
  iso([[240,320],[520,260],[520,520],[240,590]], "#9a8fd6");
  iso([[180,330],[225,322],[225,540],[180,548]], "#6f63b8");
  iso([[262,350],[490,300],[490,470],[262,525]], "#0b1a2a");
  x.fillStyle = "#3dff8a"; x.font = "14px monospace"; ["> READY", "> RUN", "> HELLO_"].forEach((t,i) => x.fillText(t, 290, 390 + i * 22 - i * 5));
  iso([[90,600],[430,520],[560,600],[220,690]], "#e8e4fb");
  iso([[220,690],[560,600],[560,625],[220,715]], "#8d82cc");
  iso([[90,600],[220,690],[220,715],[90,625]], "#b7aef0");
  x.fillStyle = "rgba(60,50,120,.55)"; for (let r=0;r<4;r++) for (let k=0;k<12;k++){ const px=150+k*27+r*30, py=605+r*16-k*6; x.fillRect(px, py, 20, 8); }
}

/* =========================================================
   1-BIT HELPERS (canvas Atkinson dither for 2D art)
   ========================================================= */
function ditherCanvas(c){
  const x = c.getContext("2d", { willReadFrequently: true }), W = c.width, H = c.height, img = x.getImageData(0,0,W,H), d = img.data, g = new Float32Array(W*H);
  for (let i=0;i<W*H;i++) g[i] = d[i*4]*.3 + d[i*4+1]*.59 + d[i*4+2]*.11;
  for (let y=0;y<H;y++) for (let k=0;k<W;k++){ const i=y*W+k, o=g[i], n=o<128?0:255, e=(o-n)/8; g[i]=n;
    if(k+1<W)g[i+1]+=e; if(k+2<W)g[i+2]+=e; if(y+1<H){ if(k>0)g[i+W-1]+=e; g[i+W]+=e; if(k+1<W)g[i+W+1]+=e; } if(y+2<H)g[i+2*W]+=e; }
  for (let i=0;i<W*H;i++){ const v = g[i] > 127 ? 255 : 0; d[i*4]=d[i*4+1]=d[i*4+2]=v; d[i*4+3]=255; }
  x.putImageData(img, 0, 0);
}

/* =========================================================
   THREE.JS STAGE with optional 1-bit ordered-dither pass
   ========================================================= */
const DITHER_FS = `
uniform sampler2D tSrc; uniform float uPx; varying vec2 vUv;
float bayer(vec2 p){
  vec2 c = mod(floor(p), 4.0);
  int i = int(c.x + c.y * 4.0);
  float m[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
  return (m[i] + .5) / 16.0;
}
void main(){
  vec4 s = texture2D(tSrc, vUv);
  if (s.a < .04) discard;
  vec3 c = pow(clamp(s.rgb / max(s.a, .001), 0., 1.), vec3(1.0/2.2));
  float l = dot(c, vec3(.3,.59,.11));
  float on = step(bayer(gl_FragCoord.xy / uPx), l * 1.12 - .02);
  gl_FragColor = vec4(vec3(on), 1.0);
}`;
function makeStage(host, { fov=30, shadow=true } = {}){
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:"high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = shadow; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, .1, 100);
  const rt = new THREE.WebGLRenderTarget(2, 2, { samples: 4 });
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadMat = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: rt.texture }, uPx: { value: 2 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }", fragmentShader: DITHER_FS, depthTest:false, depthWrite:false, transparent:true });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMat); const qScene = new THREE.Scene(); qScene.add(quad);
  let visible = true;
  new IntersectionObserver(([e]) => visible = e.isIntersecting, { rootMargin: "100px" }).observe(host);
  function resize(){
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const pr = renderer.getPixelRatio(); rt.setSize(Math.floor(w*pr), Math.floor(h*pr)); quadMat.uniforms.uPx.value = 2 * pr;
  }
  new ResizeObserver(resize).observe(host); resize();
  function render(){
    if (Y84){ renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null); renderer.clear(); renderer.render(qScene, quadCam); }
    else { renderer.setRenderTarget(null); renderer.render(scene, camera); }
  }
  return { renderer, scene, camera, render, get visible(){ return visible; }, host };
}
function lights(scene, { key=1.6 } = {}){
  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2420, .9));
  scene.add(new THREE.AmbientLight(0xffffff, .25));
  const d = new THREE.DirectionalLight(0xffffff, key); d.position.set(-4, 9, 6); d.castShadow = true;
  d.shadow.mapSize.set(1024, 1024); d.shadow.radius = 6; d.shadow.bias = -.0008;
  Object.assign(d.shadow.camera, { left:-8, right:8, top:8, bottom:-8, near:.5, far:30 });
  scene.add(d);
  const rim = new THREE.DirectionalLight(0xffd9d9, .5); rim.position.set(6, 3, -5); scene.add(rim);
  return d;
}
const canvasTex = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { c, x: c.getContext("2d"), t }; };

/* =========================================================
   HERO: 3D macro keypad (12 keys, screen, LED, knob)
   ========================================================= */
const Keypad = (() => {
  const host = $("#kpGL"), S = makeStage(host, { fov: 26 });
  const { scene, camera } = S; lights(scene);
  camera.position.set(0, 9.2, 9.6); camera.lookAt(0, 0, .2);
  const holder = new THREE.Group(); scene.add(holder);
  const rig = new THREE.Group(); holder.add(rig);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: .42 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.48; ground.receiveShadow = true; scene.add(ground);

  const body = new THREE.Mesh(new RoundedBoxGeometry(6.6, .9, 4.1, 6, .42), new THREE.MeshStandardMaterial({ color: 0xf1eee8, roughness: .5, metalness: 0 }));
  body.castShadow = body.receiveShadow = true; rig.add(body);
  const plate = new THREE.Mesh(new RoundedBoxGeometry(6.2, .06, 3.7, 3, .03), new THREE.MeshStandardMaterial({ color: 0xe6e2da, roughness: .7 }));
  plate.position.y = .45; rig.add(plate);

  // screen
  const scr = canvasTex(640, 200);
  const screen = new THREE.Mesh(new RoundedBoxGeometry(3.3, .08, 1.04, 3, .04), [
    new THREE.MeshStandardMaterial({ color: 0x111111 }), new THREE.MeshStandardMaterial({ color: 0x111111 }),
    new THREE.MeshStandardMaterial({ map: scr.t, roughness: .25, emissive: 0xffffff, emissiveMap: scr.t, emissiveIntensity: .55 }),
    new THREE.MeshStandardMaterial({ color: 0x111111 }), new THREE.MeshStandardMaterial({ color: 0x111111 }), new THREE.MeshStandardMaterial({ color: 0x111111 })
  ]);
  screen.position.set(-1.25, .5, -1.18); rig.add(screen);
  let scrText = "hello.";
  function drawScreen(sub = ""){
    const { x, c } = scr; x.fillStyle = "#0b0b0b"; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = "#d7193a"; x.fillRect(40, 56, 26, 26); x.fillRect(40, 100, 26, 26); x.fillRect(66, 78, 26, 26); x.fillRect(92, 56, 26, 70);
    x.fillStyle = "#f3f1ec"; x.font = "600 64px 'Host Grotesk', sans-serif"; x.fillText(scrText, 150, 118);
    x.fillStyle = "rgba(243,241,236,.5)"; x.font = "22px 'Geist Mono', monospace"; x.fillText(sub || C.brand.toUpperCase() + " · K-84", 152, 160);
    scr.t.needsUpdate = true;
  }
  // LED + knob
  const led = new THREE.Mesh(new THREE.SphereGeometry(.07, 16, 16), new THREE.MeshStandardMaterial({ color: 0xd7193a, emissive: 0xd7193a, emissiveIntensity: 2 }));
  led.position.set(1.05, .5, -1.5); rig.add(led);
  const knob = new THREE.Group(); knob.position.set(2.2, .48, -1.15); rig.add(knob);
  const kb = new THREE.Mesh(new THREE.CylinderGeometry(.52, .56, .42, 48), new THREE.MeshStandardMaterial({ color: 0x151515, roughness: .45 }));
  kb.position.y = .21; kb.castShadow = true; knob.add(kb);
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(.44, .44, .05, 48), new THREE.MeshStandardMaterial({ color: 0x262626, roughness: .3 }));
  ridge.position.y = .44; knob.add(ridge);
  const mark = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, .22), new THREE.MeshStandardMaterial({ color: 0xd7193a, emissive: 0xd7193a, emissiveIntensity: .6 }));
  mark.position.set(0, .47, -.25); knob.add(mark);

  // keys 6 × 2
  const keys = [], words = ["hello.","pixels","taste","design","build","launch","shader","motion","grid","type","code","go!"];
  const colors = (i) => i === 0 || i === 1 ? 0xf6f4ef : i === 11 ? 0xc5162f : 0x2b2b2b;
  const kGeo = new RoundedBoxGeometry(.84, .42, .84, 4, .11);
  for (let i = 0; i < 12; i++){
    const col = i % 6, row = Math.floor(i / 6);
    const m = new THREE.Mesh(kGeo, new THREE.MeshStandardMaterial({ color: colors(i), roughness: i === 11 ? .4 : .55 }));
    m.position.set(-2.5 + col * 1.0, .66, .02 + row * 1.0); m.castShadow = true; m.receiveShadow = true;
    m.userData = { i, baseY: .66, press: 0, word: words[i] }; rig.add(m); keys.push(m);
  }
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let tx = 0, ty = 0, cx = 0, cy = 0, knobV = 0, knobA = 0, hover = null;
  const hero = $("#intro");
  hero.addEventListener("pointermove", e => {
    const r = hero.getBoundingClientRect(); const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
    tx = nx - .5; ty = ny - .5;
    $("#xL").textContent = "x " + nx.toFixed(2); $("#xR").textContent = "y " + ny.toFixed(2);
    const hr = host.getBoundingClientRect();
    ptr.set(((e.clientX - hr.left) / hr.width) * 2 - 1, -((e.clientY - hr.top) / hr.height) * 2 + 1);
    ray.setFromCamera(ptr, camera); const hit = ray.intersectObjects([...keys, kb])[0];
    hover = hit ? hit.object : null; host.style.cursor = hover ? "pointer" : "grab";
  });
  host.addEventListener("pointerdown", () => {
    if (!hover) return;
    if (hover === kb){ Sound.play("knob"); knobV += .35; scrText = "vol " + Math.round(((knobA % 6.28) + 6.28) % 6.28 / 6.28 * 100); drawScreen("KNOB"); return; }
    press(hover.userData.i);
  });
  host.addEventListener("wheel", e => { if (hover === kb){ e.preventDefault(); knobV += e.deltaY * .002; Sound.play("knob"); } }, { passive: false });
  function press(i){
    const k = keys[i]; if (!k) return;
    gsap.killTweensOf(k.userData); gsap.fromTo(k.userData, { press: 1 }, { press: 0, duration: .5, ease: "elastic.out(1,.5)" });
    scrText = k.userData.word; drawScreen("KEY " + pad(i + 1)); Sound.play("key", i);
    gsap.fromTo(led.material, { emissiveIntensity: 6 }, { emissiveIntensity: 2, duration: .4 });
  }
  addEventListener("keydown", e => {
    if (modalOpen || menuOpen || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || scrollY > innerHeight * .6) return;
    const map = "123456qwerty"; const i = map.indexOf(e.key.toLowerCase()); if (i > -1) press(i);
  });
  // intro animation
  rig.position.y = 3; rig.rotation.set(-.5, .6, 0);
  const intro = () => { gsap.to(rig.position, { y: 0, duration: 1.8, ease: "expo.out" }); };
  const clock = new THREE.Clock();
  function tick(){
    if (!S.visible) return;
    const t = clock.getElapsedTime();
    cx = lerp(cx, tx, .06); cy = lerp(cy, ty, .06);
    const sp = clamp(scrollY / innerHeight, 0, 1.2);
    rig.rotation.z = lerp(rig.rotation.z, cx * -.12, .1);
    rig.rotation.y = lerp(rig.rotation.y, cx * .5 - .1 + sp * .6, .08);
    rig.rotation.x = lerp(rig.rotation.x, cy * .35 + sp * .4, .08);
    holder.position.y = (reduced ? 0 : Math.sin(t * 1.2) * .08) - sp * 1.2;
    keys.forEach(k => { const h = k === hover ? .05 : 0; k.position.y = k.userData.baseY - k.userData.press * .22 - h; });
    knobV *= .92; knobA += knobV; knob.rotation.y = knobA;
    led.material.emissiveIntensity = Math.max(led.material.emissiveIntensity, 1.4 + Math.sin(t * 3) * .4);
    S.render();
  }
  gsap.ticker.add(tick);
  document.fonts.ready.then(() => drawScreen());
  drawScreen();
  return { intro, press, redraw: drawScreen };
})();

/* =========================================================
   IMAGE SYSTEM: procedural placeholder art → <img> data URLs
   (set CONFIG image fields to use your own photos)
   ========================================================= */
const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
function paintStudio(x, W, H, brand){
  // soft studio backdrop (pale blue-grey wall), white table, depth haze
  let g = x.createLinearGradient(0,0,0,H*.62); g.addColorStop(0,"#b9c7cf"); g.addColorStop(.55,"#d6e0e5"); g.addColorStop(1,"#e9eef0"); x.fillStyle=g; x.fillRect(0,0,W,H);
  let v = x.createRadialGradient(W*.55,H*.25,W*.1,W*.5,H*.4,W*1.1); v.addColorStop(0,"rgba(255,255,255,.35)"); v.addColorStop(1,"rgba(60,80,95,.25)"); x.fillStyle=v; x.fillRect(0,0,W,H);
  // table top
  const ty = H*.6; g = x.createLinearGradient(0,ty,0,H*.72); g.addColorStop(0,"#eef1f1"); g.addColorStop(1,"#fbfbfa"); x.fillStyle=g; x.fillRect(0,ty,W,H*.12);
  // table front edge + shadowed underside, leg
  x.fillStyle="#f7f7f6"; x.fillRect(0,H*.72,W,H*.03);
  g = x.createLinearGradient(0,H*.75,0,H); g.addColorStop(0,"#c9d3d8"); g.addColorStop(1,"#e4eaec"); x.fillStyle=g; x.fillRect(0,H*.75,W,H*.25);
  g = x.createLinearGradient(W*.66,0,W*.74,0); g.addColorStop(0,"#e9eded"); g.addColorStop(.5,"#ffffff"); g.addColorStop(1,"#d5dcdf"); x.fillStyle=g; x.fillRect(W*.66,H*.75,W*.08,H*.25);
  x.fillStyle="rgba(40,55,65,.12)"; x.fillRect(0,H*.75,W,H*.012);
  // typewriter (blurred, background) — teal-grey body
  x.save(); x.filter = "blur(3px)";
  const tg = x.createLinearGradient(0,H*.36,0,H*.6); tg.addColorStop(0,"#7f9ba6"); tg.addColorStop(.5,"#5c7884"); tg.addColorStop(1,"#3e5560"); x.fillStyle=tg;
  x.beginPath(); x.roundRect(-W*.05,H*.43,W*1.1,H*.17,40); x.fill();
  x.fillStyle="#2a2d30"; x.beginPath(); x.roundRect(-W*.08,H*.355,W*1.16,H*.045,30); x.fill();
  x.fillStyle="rgba(255,255,255,.18)"; x.fillRect(-W*.05,H*.36,W*1.1,H*.006);
  x.fillStyle="#f8f7f2"; x.beginPath(); x.moveTo(W*.18,H*.36); x.lineTo(W*.82,H*.36); x.lineTo(W*.8,H*.2); x.lineTo(W*.2,H*.2); x.fill();
  x.fillStyle="#3a3a3a"; x.font=`${W*.022}px monospace`; ["small by choice.","close at every step."].forEach((t,i)=>x.fillText(t,W*.27,H*.27+i*W*.04));
  for (let r=0;r<3;r++) for (let k=0;k<14;k++){ const cx=W*(-.02+k*.08+r*.03), cy=H*(.47+r*.035); x.fillStyle="#1a1d1f"; x.beginPath(); x.ellipse(cx,cy+3,W*.03,W*.017,0,0,7); x.fill(); x.fillStyle="#e7e5df"; x.beginPath(); x.ellipse(cx,cy,W*.025,W*.013,0,0,7); x.fill(); }
  x.restore();
  // contact shadow of cassette on table
  x.save(); x.filter="blur(10px)"; x.fillStyle="rgba(30,40,45,.35)"; x.beginPath(); x.ellipse(W*.5,H*.715,W*.31,H*.012,0,0,7); x.fill(); x.restore();
  // cassette standing upright, slightly rotated
  x.save(); x.translate(W*.5,H*.7); x.rotate(-.035);
  const cw=W*.56, ch=cw*.63, top=-ch*.98;
  let cg = x.createLinearGradient(-cw/2,top,cw/2,top+ch); cg.addColorStop(0,"#2c2c2b"); cg.addColorStop(.4,"#111"); cg.addColorStop(1,"#050505"); x.fillStyle=cg;
  x.beginPath(); x.roundRect(-cw/2,top,cw,ch,10); x.fill();
  x.strokeStyle="rgba(255,255,255,.18)"; x.lineWidth=2; x.beginPath(); x.roundRect(-cw/2+2,top+2,cw-4,ch-4,9); x.stroke();
  // label
  x.fillStyle="#efe8d6"; x.beginPath(); x.roundRect(-cw*.44,top+ch*.07,cw*.88,ch*.6,6); x.fill();
  x.fillStyle="#d7193a"; x.fillRect(-cw*.44,top+ch*.17,cw*.88,ch*.12);
  x.fillStyle="#fff"; x.font=`600 ${cw*.07}px sans-serif`; x.fillText("C60",-cw*.4,top+ch*.26);
  x.font=`${cw*.04}px monospace`; x.fillText(brand.toUpperCase()+" · SIDE A", -cw*.2, top+ch*.255);
  x.fillStyle="#3d3a33"; x.font=`italic ${cw*.055}px Georgia,serif`; x.fillText("mix for the studio", -cw*.38, top+ch*.62);
  // window + reels
  const wy=top+ch*.33, wh=ch*.2; x.fillStyle="#2a2219"; x.beginPath(); x.roundRect(-cw*.27,wy,cw*.54,wh,wh/2); x.fill();
  x.fillStyle="rgba(255,255,255,.12)"; x.beginPath(); x.roundRect(-cw*.27,wy,cw*.54,wh*.35,wh/2); x.fill();
  [[-1,.11],[1,.07]].forEach(([s,rad]) => { const cx=s*cw*.16, cy=wy+wh/2; x.fillStyle="#4b2f19"; x.beginPath(); x.arc(cx,cy,ch*rad,0,7); x.fill(); x.fillStyle="#f4f4f4"; x.beginPath(); x.arc(cx,cy,ch*.055,0,7); x.fill(); x.fillStyle="#222"; for(let k=0;k<6;k++){ const a=k*Math.PI/3; x.fillRect(cx+Math.cos(a)*ch*.035-2,cy+Math.sin(a)*ch*.035-2,4,4);} });
  // bottom trapezoid + screws
  x.fillStyle="#070707"; x.beginPath(); x.moveTo(-cw*.3,top+ch); x.lineTo(-cw*.24,top+ch*.78); x.lineTo(cw*.24,top+ch*.78); x.lineTo(cw*.3,top+ch); x.fill();
  x.fillStyle="#555"; [[-.46,.06],[.46,.06],[-.46,.94],[.46,.94]].forEach(([a,b])=>{ x.beginPath(); x.arc(cw*a,top+ch*b,3.5,0,7); x.fill(); });
  x.restore();
  // magnetic tape spilling from the cassette, over the table edge
  const tape = (pts, w) => { x.strokeStyle="#3a2414"; x.lineWidth=w; x.lineCap="round"; x.beginPath(); x.moveTo(pts[0],pts[1]); for (let i=2;i<pts.length;i+=6) x.bezierCurveTo(pts[i],pts[i+1],pts[i+2],pts[i+3],pts[i+4],pts[i+5]); x.stroke();
    x.strokeStyle="rgba(255,220,180,.25)"; x.lineWidth=w*.3; x.stroke(); };
  tape([W*.44,H*.69, W*.38,H*.705, W*.47,H*.72, W*.44,H*.735, W*.42,H*.82, W*.5,H*.88, W*.46,H*1.0], W*.012);
  tape([W*.53,H*.69, W*.6,H*.71, W*.5,H*.725, W*.55,H*.737, W*.57,H*.84, W*.49,H*.9, W*.54,H*1.0], W*.01);
  // lens vignette + subtle grain
  v = x.createRadialGradient(W/2,H/2,W*.3,W/2,H/2,W*.95); v.addColorStop(0,"rgba(0,0,0,0)"); v.addColorStop(1,"rgba(20,30,40,.22)"); x.fillStyle=v; x.fillRect(0,0,W,H);
  const img=x.getImageData(0,0,W,H), d=img.data; let s=7; for(let k=0;k<d.length;k+=4){ s=(s*16807)%2147483647; const n=((s/2147483647)-.5)*10; d[k]+=n; d[k+1]+=n; d[k+2]+=n; } x.putImageData(img,0,0);
}

const Scenes = {
  sky(x, W, H, a, b, h=.62){ const g = x.createLinearGradient(0,0,0,H*h); g.addColorStop(0,a); g.addColorStop(1,b); x.fillStyle = g; x.fillRect(0,0,W,H); },
  truck(x, px, py, s, tr, stripe){ x.save(); x.translate(px,py); x.scale(s,s);
    x.fillStyle = tr; x.fillRect(0,-180,470,165); x.fillStyle = stripe; x.fillRect(0,-80,470,22);
    x.fillStyle = "#1d2a3a"; x.fillRect(480,-150,140,135); x.fillStyle = "#9cc3e0"; x.fillRect(552,-140,60,48);
    x.fillStyle = "#222"; x.fillRect(0,-16,620,16); [60,124,380,520,584].forEach(c => { x.fillStyle="#0e0e0e"; x.beginPath(); x.arc(c,4,28,0,7); x.fill(); x.fillStyle="#666"; x.beginPath(); x.arc(c,4,10,0,7); x.fill(); }); x.restore(); },
  volt(x,W,H){ this.sky(x,W,H,"#3b2230","#c98063",.75);
    x.fillStyle = "#4a3a3a"; for (let i=0;i<40;i++){ x.beginPath(); x.arc(i*W/38, H*.48 + Math.sin(i)*20, 60+((i*37)%40), 0, 7); x.fill(); }
    x.fillStyle = "#2c2a2b"; x.fillRect(0,H*.72,W,H*.28);
    this.truck(x, W*.05, H*.82, 1.15, "#ece9e2", "#c5162f");
    const fx = W*.7, fy = H; x.fillStyle = "#f3e21c"; x.beginPath(); x.moveTo(fx-170,fy); x.quadraticCurveTo(fx-160,fy-420,fx,fy-460); x.quadraticCurveTo(fx+160,fy-420,fx+170,fy); x.fill();
    x.fillStyle = "#c9b70f"; x.fillRect(fx-170, fy-250, 340, 18);
    x.fillStyle = "#3a2a20"; x.beginPath(); x.arc(fx, fy-520, 90, 0, 7); x.fill(); x.fillStyle = "#f3e21c"; x.beginPath(); x.arc(fx, fy-540, 104, Math.PI*1.05, Math.PI*1.95); x.fill(); },
  tree(x,a,b,l,ang,d){ if(!d) return; const c=a+Math.cos(ang)*l, e=b+Math.sin(ang)*l; x.lineWidth=d*2; x.beginPath(); x.moveTo(a,b); x.lineTo(c,e); x.stroke(); this.tree(x,c,e,l*.74,ang-.38,d-1); this.tree(x,c,e,l*.7,ang+.34,d-1); },
  cedar(x,W,H){ this.sky(x,W,H,"#5b4a44","#9b8f86",.9);
    x.strokeStyle = "rgba(40,28,22,.8)"; [[.08,1,190],[.95,1,210],[.55,1,160]].forEach(([a,b,l]) => this.tree(x,W*a,H*b,l,-Math.PI/2,8));
    x.fillStyle = "#6a3d22"; x.beginPath(); x.moveTo(0,H*.25); x.lineTo(W*.42,H*.05); x.lineTo(W*.42,H); x.lineTo(0,H); x.fill();
    x.strokeStyle = "rgba(0,0,0,.25)"; x.lineWidth = 2; for (let i=0;i<W*.42;i+=18){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,H); x.stroke(); }
    const g = x.createLinearGradient(0,H*.3,0,H); g.addColorStop(0,"#ffcf8a"); g.addColorStop(1,"#d9772e");
    x.fillStyle = g; x.fillRect(W*.1,H*.32,W*.28,H*.5); x.fillRect(W*.58,H*.12,W*.38,H*.7);
    x.strokeStyle = "#2a1a12"; x.lineWidth = 10; x.strokeRect(W*.1,H*.32,W*.28,H*.5); x.strokeRect(W*.58,H*.12,W*.38,H*.7);
    x.beginPath(); x.moveTo(W*.77,H*.12); x.lineTo(W*.77,H*.82); x.stroke();
    x.strokeStyle = "rgba(60,30,20,.45)"; this.tree(x,W*.68,H*.82,120,-Math.PI/2,6); this.tree(x,W*.88,H*.82,100,-Math.PI/2,6); },
  road(x,W,H){ this.sky(x,W,H,"#3f86d6","#cfe6f5",.55);
    [["#7c8fa6",.5,.3],["#5d6f62",.58,.4],["#3f5143",.66,.5]].forEach(([c,b,a],k) => { x.fillStyle=c; x.beginPath(); x.moveTo(0,H*b); for(let i=0;i<=W;i+=W/10) x.lineTo(i,H*b-Math.abs(Math.sin(i*.004+k*2))*H*a*.6); x.lineTo(W,H); x.lineTo(0,H); x.fill(); });
    x.fillStyle = "#47474a"; x.beginPath(); x.moveTo(W*.42,H*.62); x.lineTo(W*.58,H*.62); x.lineTo(W*1.1,H); x.lineTo(-W*.1,H); x.fill();
    x.fillStyle = "#efe9dc"; for (let i=0;i<8;i++){ const a=i/8, b=a+.05, y0=H*.62+H*.38*a*a, y1=H*.62+H*.38*b*b; x.beginPath(); x.moveTo(W*.5-2-a*8,y0); x.lineTo(W*.5+2+a*8,y0); x.lineTo(W*.5+2+b*8,y1); x.lineTo(W*.5-2-b*8,y1); x.fill(); }
    this.truck(x, W*.12, H*.9, 1.1, "#1f5fae", "#f4c21a"); },
  circle(x,W,H){ const g = x.createRadialGradient(W*.5,H*.35,20,W*.5,H*.4,W*.75); g.addColorStop(0,"#f6e9ff"); g.addColorStop(.4,"#c6a6e8"); g.addColorStop(1,"#6b4aa8"); x.fillStyle=g; x.fillRect(0,0,W,H);
    [[.1,"#2c3e5a","#c98d64"],[.28,"#3a3346","#8f5a3a"],[.47,"#d9cfc4","#e2b08a"],[.63,"#2b2b2b","#6b3f22"],[.82,"#f2b8d0","#c98d64"]].forEach(([px,cl,sk],i) => { const cx=W*px, top=H*(.36+(i%2)*.06); x.fillStyle=cl; x.beginPath(); x.moveTo(cx-150,H); x.quadraticCurveTo(cx-140,top+140,cx,top+120); x.quadraticCurveTo(cx+140,top+140,cx+150,H); x.fill();
      x.fillStyle=sk; x.beginPath(); x.arc(cx,top+40,78,0,7); x.fill(); x.fillStyle="#1b120c"; x.beginPath(); x.arc(cx,top+20,82,Math.PI*1.05,Math.PI*1.95); x.fill(); });
    x.strokeStyle = "#c98d64"; x.lineWidth = 36; x.lineCap = "round"; x.beginPath(); x.moveTo(W*.28+90,H*.78); x.quadraticCurveTo(W*.38,H*.66,W*.47-90,H*.78); x.stroke(); },
  studio(x,W,H){ paintStudio(x,W,H,C.brand); },
  hello(x,W,H){ const g = x.createRadialGradient(W*.5,H*.3,10,W*.5,H*.4,W); g.addColorStop(0,"#ff5a64"); g.addColorStop(.5,"#b0142c"); g.addColorStop(1,"#1a0508"); x.fillStyle=g; x.fillRect(0,0,W,H);
    x.fillStyle = "#f3f1ec"; x.font = `600 ${W*.26}px 'Host Grotesk', sans-serif`; x.fillText("Hello.", W*.06, H*.62); x.font = `${W*.03}px 'Geist Mono', monospace`; x.fillText(C.email, W*.07, H*.72); }
};
const Art = {
  cache: {},
  scene(name, W=1600, H=1000){ const c = mk(W,H), x = c.getContext("2d", { willReadFrequently: true }); Scenes[name].call(Scenes, x, W, H);
    const img = x.getImageData(0,0,W,H), d = img.data; let s = 9; for (let k=0;k<d.length;k+=4){ s=(s*16807)%2147483647; const n=((s/2147483647)-.5)*14; d[k]+=n; d[k+1]+=n; d[k+2]+=n; } x.putImageData(img,0,0); return c; },
  url(key, make){
    const k = (Y84 ? "84:" : "") + key; if (this.cache[k]) return this.cache[k];
    let c = make();
    if (Y84){ const sm = mk(c.width/2|0, c.height/2|0); sm.getContext("2d").drawImage(c,0,0,sm.width,sm.height); ditherCanvas(sm); const big = mk(c.width,c.height), bx = big.getContext("2d"); bx.imageSmoothingEnabled = false; bx.drawImage(sm,0,0,c.width,c.height); c = big; }
    return this.cache[k] = c.toDataURL(Y84 ? "image/png" : "image/jpeg", .88);
  },
  clear(){ this.cache = {}; }
};
const projectURL = i => (C.projects[i].img && !Y84) ? C.projects[i].img : Art.url("p"+i, () => Art.scene(C.projects[i].scene));
const studioURL = () => (C.studioImg && !Y84) ? C.studioImg : Art.url("studio", () => Art.scene("studio", 800, 1200));
const setDev = (fig, src) => $$("img", fig).forEach(im => im.src = src);
const splitChars = el => { const t = el.textContent; el.setAttribute("aria-label", t); el.innerHTML = [...t].map(c => c === " " ? " " : `<span class="ch" aria-hidden="true">${esc(c)}</span>`).join(""); return $$(".ch", el); };

/* =========================================================
   STUDIO: word opacity scrub + sliced "developing" portrait
   ========================================================= */
function sliceReveal(fig){
  const src = $("img", fig).src, n = innerWidth < 900 ? 9 : 13;
  const box = document.createElement("div"); box.className = "slices"; box.setAttribute("aria-hidden", "true");
  for (let i = 0; i < n; i++) box.insertAdjacentHTML("beforeend", `<div class="slice" style="--off:${-100*i}%;--fw:${100*n}%"><img src="${src}" alt=""><img class="safe" src="${src}" alt=""></div>`);
  fig.prepend(box); fig.classList.add("sliced");
  const offs = Array.from({ length: n }, (_, i) => (i % 2 ? 1 : -1) * (10 + (37 * i) % 13));
  let shot = false;
  const tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: "top 90%", end: "center 45%", scrub: .8 }, onUpdate(){ const p = this.progress(); if (p > .97 && !shot){ shot = true; Sound.play("shutter"); } else if (p < .5) shot = false; } });
  [...box.children].forEach((s, i) => tl.fromTo($$("img", s), { yPercent: offs[i], scale: 1.5 }, { yPercent: 0, scale: 1, ease: "none" }, 0));
  tl.fromTo($$(".slice .safe", fig), { opacity: 1 }, { opacity: 0, ease: "none" }, .25);
}
const Studio = (() => {
  const st = $("#statement");
  const wrap = node => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3){ const f = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) f.append(w); else { const s = document.createElement("span"); s.className = "wd"; s.textContent = w; f.append(s); } }); n.replaceWith(f); }
    else if (n.nodeType === 1) wrap(n);
  });
  wrap(st);
  gsap.fromTo($$(".wd", st), { opacity: .14 }, { opacity: 1, ease: "none", stagger: .1, scrollTrigger: { trigger: st, start: "top 80%", end: "bottom 45%", scrub: .4 } });
  gsap.from(".facts div", { y: 26, opacity: 0, duration: 1, stagger: .08, ease: "expo.out", scrollTrigger: { trigger: ".facts", start: "top 90%", once: true } });
  const fig = $("#portrait");
  setDev(fig, studioURL());
  sliceReveal(fig);
  return { redraw(){ setDev(fig, studioURL()); } };
})();

/* =========================================================
   APPROACH: pinned scrubbed timeline (same structure as reference)
   0–1 develop + scale .86→1, words ±6vw + weight · steps at 1,2,3,4
   final screen at 5 · fly-out at 5.25 · zoom into screen · paper fade
   ========================================================= */
const Approach = (() => {
  const S = makeStage($("#macGL"), { fov: 28 }); const { scene, camera } = S; lights(scene, { key: 1.4 });
  const mac = new THREE.Group(); scene.add(mac);
  const beige = new THREE.Color(0xddd3bd), safeRed = new THREE.Color(0xc4182f);
  const shell = new THREE.MeshStandardMaterial({ color: safeRed.clone(), roughness: .6 });
  const b = new THREE.Mesh(new RoundedBoxGeometry(2.7, 3.35, 2.8, 6, .18), shell); b.castShadow = b.receiveShadow = true; mac.add(b);
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(2.18, 1.78, .1, 4, .08), new THREE.MeshStandardMaterial({ color: 0x2a2724, roughness: .5 }));
  bezel.position.set(0, .55, 1.39); mac.add(bezel);
  const sc = canvasTex(768, 576);
  const glassMat = new THREE.MeshStandardMaterial({ map: sc.t, emissive: 0xffffff, emissiveMap: sc.t, emissiveIntensity: .75, roughness: .2 });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.48), glassMat); glass.position.set(0, .55, 1.451); mac.add(glass);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(.8, .07, .05), new THREE.MeshStandardMaterial({ color: 0x1a1816 })); slot.position.set(.5, -.85, 1.41); mac.add(slot);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(.22, .12, .06), shell); lip.position.set(.86, -.85, 1.41); mac.add(lip);
  const footMat = new THREE.MeshStandardMaterial({ color: 0xbfb49c, roughness: .7 });
  const foot = new THREE.Mesh(new RoundedBoxGeometry(2.5, .22, 2.6, 3, .08), footMat); foot.position.y = -1.75; foot.castShadow = true; mac.add(foot);
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x8f8670 });
  for (let i = 0; i < 14; i++){ const v = new THREE.Mesh(new THREE.BoxGeometry(.03, .1, .02), ventMat); v.position.set(-.85 + i * .13, -1.35, 1.405); mac.add(v); }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: .5 })); ground.rotation.x = -Math.PI/2; ground.position.y = -1.86; ground.receiveShadow = true; scene.add(ground);

  const steps = C.steps.map(s => ({ ...s, file: s.file || C.domain }));
  $("#apStep").innerHTML = steps.map(s => `<div class="st"><p class="meta label"><i></i>${s.n} ${esc(s.t)}</p><p>${esc(s.body)}</p></div>`).join("");
  $("#apIdx").innerHTML = steps.map((s, i) => `<li><button type="button" data-i="${i}">${s.n} ${esc(s.t)}<i></i></button></li>`).join("");
  splitChars($("#wD1 span")); splitChars($("#wD2 span"));
  const st = $$("#apStep .st"), idx = $$("#apIdx button");

  // proxies driven by the scrubbed timeline
  const P = { safe: 1, scale: .86, zoom: 0 }, R = [0,1,2,3,4].map(() => ({ v: 0 }));
  gsap.set(st, { autoAlpha: 0 });
  const T = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { id: "approach", trigger: "#apPin", start: "top top", end: () => "+=" + 5.2 * innerHeight, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
  T.fromTo(P, { safe: 1 }, { safe: 0, duration: 1 }, 0)
   .fromTo(P, { scale: .86 }, { scale: 1, duration: 1, ease: "power1.out" }, 0)
   .fromTo("#wD1", { x: 0 }, { x: () => .06 * innerWidth, duration: 1 }, 0)
   .fromTo("#wD2", { x: 0 }, { x: () => -.06 * innerWidth, duration: 1 }, 0)
   .fromTo(".ap-word .ch", { fontVariationSettings: '"wght" 300' }, { fontVariationSettings: '"wght" 620', duration: .9, stagger: .03 }, 0)
   .fromTo(idx, { opacity: 0, x: 14 }, { opacity: 1, x: 0, duration: .4, stagger: .08 }, .3);
  for (let t = 0; t < 4; t++){
    const e = 1 + t;
    T.fromTo(R[t], { v: 0 }, { v: 1, duration: .35, ease: "power2.inOut", immediateRender: false }, e);
    if (t) T.fromTo(st[t-1], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -14, duration: .2, immediateRender: false }, e);
    T.fromTo(st[t], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .3, immediateRender: false }, e + .15);
  }
  T.fromTo("#wD2", { opacity: 1 }, { opacity: .28, duration: .3, immediateRender: false }, 1)
   .fromTo("#wD1", { opacity: 1 }, { opacity: .28, duration: .3, immediateRender: false }, 3)
   .fromTo("#wD2", { opacity: .28 }, { opacity: 1, duration: .3, immediateRender: false }, 3)
   .fromTo(R[4], { v: 0 }, { v: 1, duration: .3, ease: "power2.inOut", immediateRender: false }, 5)
   .addLabel("in", 5.25)
   .to("#wD1", { x: () => -.5 * innerWidth, opacity: 0, duration: 1.2, ease: "power2.in" }, "in")
   .to("#wD2", { x: () => .5 * innerWidth, opacity: 0, duration: 1.2, ease: "power2.in" }, "in")
   .to("#apStep, #apIdx, .ap-lbl, #apHint", { opacity: 0, duration: .4 }, "in")
   .fromTo(P, { zoom: 0 }, { zoom: 1, duration: 2, ease: "power3.in" }, "in+=.1")
   .to("#paperfade", { opacity: 1, duration: .45 }, "in+=1.7");
  T.eventCallback("onUpdate", () => {
    let best = -1, max = .5; st.forEach((s, i) => { const o = +gsap.getProperty(s, "opacity"); if (o > max){ max = o; best = i; } });
    idx.forEach((b, i) => b.classList.toggle("on", i === best));
    if (best !== lastBest){ if (best >= 0) Sound.play("blip", best); lastBest = best; }
  });
  let lastBest = -1;
  $("#apIdx").addEventListener("click", e => { const btn = e.target.closest("[data-i]"); if (!btn) return; const s = ScrollTrigger.getById("approach");
    scrollToTarget(s.start + (s.end - s.start) * ((1.5 + +btn.dataset.i) / T.duration())); });

  // screen compositing: hello → reveal each step screen from the top (clip), typing follows scroll
  const CODE = ['<section class="hero">', '  <h1>Hello.</h1>', '</section>'];
  const drawHello = (x, W, H) => { const g = x.createRadialGradient(W/2, H/2, 40, W/2, H/2, W*.7); g.addColorStop(0, "#f6fbf9"); g.addColorStop(1, "#cfdcd8"); x.fillStyle = g; x.fillRect(0,0,W,H);
    x.fillStyle = "#1a1a1a"; x.font = "italic 600 150px Georgia, 'Times New Roman', serif"; x.textAlign = "center"; x.fillText("hello", W/2, H/2 + 50); x.textAlign = "left"; };
  const chrome = (x, W, title) => { x.fillStyle = "#111"; x.fillRect(40,40,W-80,2); x.fillRect(40,84,W-80,2); for (let i=0;i<6;i++) x.fillRect(50,52+i*5,W-100,1);
    x.fillStyle = "#e3ebe8"; x.fillRect(W/2-100,46,200,36); x.fillStyle = "#111"; x.font = "22px 'Geist Mono', monospace"; x.textAlign = "center"; x.fillText(title, W/2, 72); x.textAlign = "left"; };
  function drawStep(x, W, H, k, prog){
    x.fillStyle = "#e3ebe8"; x.fillRect(0,0,W,H);
    if (k === 4) return;
    chrome(x, W, steps[k].file); x.fillStyle = "#111"; x.strokeStyle = "#111";
    if (k === 0){
      x.font = "600 46px 'Host Grotesk', sans-serif"; x.fillText("The brief", 70, 160);
      ["Goals","Audience","What the site must do"].forEach((t, i) => { x.lineWidth = 3; x.strokeRect(72, 196+i*58, 26, 26); if (prog > (i+1)/4){ x.beginPath(); x.moveTo(77,210+i*58); x.lineTo(84,218+i*58); x.lineTo(95,200+i*58); x.stroke(); } x.font = "28px 'Geist Mono', monospace"; x.fillText(t, 118, 218+i*58); });
    } else if (k === 1){
      x.font = "600 120px 'Host Grotesk', sans-serif"; x.fillText("Aa", 70, 230); x.font = "22px 'Geist Mono', monospace"; x.fillText("Host Grotesk · 600", 70, 270);
      [[360,120,340,60],[360,200,160,160],[540,200,160,70],[540,290,160,70],[70,310,270,50],[70,380,630,140]].forEach(([a,b2,w,h], i) => { x.lineWidth = 2; x.strokeRect(a, b2, w * clamp(prog * 2 - i * .2 + .2, 0, 1), h); });
    } else if (k === 2){
      x.font = "26px 'Geist Mono', monospace"; let n = Math.round(prog * (CODE.join("").length + 6));
      CODE.forEach((l, i) => { x.fillText(l.slice(0, Math.max(0, n)), 64, 160 + i*46); n -= l.length; });
      if (prog > .95){ x.setLineDash([8,6]); x.lineWidth = 2; x.strokeRect(64,320,W-128,140); x.setLineDash([]); x.font = "600 72px 'Host Grotesk', sans-serif"; x.fillText("Hello.", 92, 412); }
    } else {
      x.lineWidth = 2; x.beginPath(); x.roundRect(64,120,W-128,46,23); x.stroke();
      x.fillStyle = "#1aa34a"; x.beginPath(); x.arc(92,143,8,0,7); x.fill(); x.fillStyle = "#111";
      x.font = "22px 'Geist Mono', monospace"; x.fillText(C.domain, 112, 151);
      x.font = "600 130px 'Host Grotesk', sans-serif"; x.fillText("Live.", 64, 340); x.font = "28px 'Host Grotesk', sans-serif"; x.fillText("Launched and looked after.", 68, 400);
    }
  }
  /* ---------- interactive screen: buttons on the Mac trigger random effects ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const easeIO = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const off = document.createElement("canvas"); off.width = 768; off.height = 576; const ox = off.getContext("2d");
  const GLYPHS = "!<>-_\\/[]{}=+*^?#%01ABCDEFabcdef";
  const TXT = {
    scramble: (s, p) => [...s].map((ch, i) => ch === " " ? " " : (i / s.length < p * 1.15 - .1 ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join(""),
    leet: s => s.replace(/[aeiolstAEIOLST]/g, c => ({ a:"4", e:"3", i:"1", o:"0", l:"1", s:"5", t:"7" })[c.toLowerCase()]),
    shout: s => s.toUpperCase() + (/[a-z]$/i.test(s) ? "!" : ""),
    reverse: s => [...s].reverse().join(""),
    wide: s => [...s].join(" "),
    pixel: s => s,
    binary: (s, p) => [...s].map((ch, i) => ch === " " || Math.random() < p * p ? ch : (Math.random() < .5 ? "0" : "1")).join("")
  };
  const BG = "#e3ebe8";
  const PIX = {
    glitch(x, W, H, p){ ox.drawImage(x.canvas, 0, 0); const a = 1 - p; for (let i = 0; i < 16; i++){ const y = rnd(0, H), h = rnd(6, 44); x.drawImage(off, 0, y, W, h, rnd(-70, 70) * a, y, W, h); }
      x.globalCompositeOperation = "multiply"; x.globalAlpha = .55 * a; x.drawImage(off, 8 * a, 0); x.fillStyle = "rgba(255,40,80,.5)"; x.fillRect(0, rnd(0, H), W, rnd(10, 60)); x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; },
    wave(x, W, H, p, t){ ox.drawImage(x.canvas, 0, 0); x.fillStyle = BG; x.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 3) x.drawImage(off, 0, y, W, 3, Math.sin(y * .028 + t * 9) * 30 * Math.sin(p * Math.PI), y, W, 3); },
    rainbow(x, W, H, p, t){ const g = x.createLinearGradient(0, 0, W, H); for (let k = 0; k <= 6; k++) g.addColorStop(k / 6, `hsl(${(k * 60 + t * 260) % 360},95%,55%)`);
      x.globalCompositeOperation = "screen"; x.globalAlpha = Math.sin(p * Math.PI) * .9 + .1; x.fillStyle = g; x.fillRect(0, 0, W, H); x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; },
    shake(x, W, H, p){ ox.drawImage(x.canvas, 0, 0); x.fillStyle = BG; x.fillRect(0, 0, W, H); const a = 26 * (1 - p); x.drawImage(off, rnd(-a, a), rnd(-a, a)); },
    melt(x, W, H, p){ ox.drawImage(x.canvas, 0, 0); x.fillStyle = BG; x.fillRect(0, 0, W, H); const m = Math.sin(p * Math.PI);
      for (let cx = 0; cx < W; cx += 6){ const d = ((Math.sin(cx * .05) * .5 + .5) * 160 + ((cx * 37) % 29) * 3) * m; x.drawImage(off, cx, 0, 6, H, cx, d, 6, H); } },
    pixelate(x, W, H, p){ const s = Math.max(1, Math.round(30 * Math.sin(p * Math.PI))); if (s < 2) return; const w = W / s | 0, h = H / s | 0;
      x.imageSmoothingEnabled = false; x.drawImage(x.canvas, 0, 0, W, H, 0, 0, w, h); x.drawImage(x.canvas, 0, 0, w, h, 0, 0, W, H); x.imageSmoothingEnabled = true; },
    snow(x, W, H, p){ const img = x.getImageData(0, 0, W, H), d = img.data, a = (1 - p) * .7; for (let i = 0; i < d.length; i += 4) if (Math.random() < a){ const v = Math.random() * 255; d[i] = d[i+1] = d[i+2] = v; } x.putImageData(img, 0, 0); },
    invert(x, W, H){ x.globalCompositeOperation = "difference"; x.fillStyle = "#fff"; x.fillRect(0, 0, W, H); x.globalCompositeOperation = "source-over"; },
    zoom(x, W, H, p){ ox.drawImage(x.canvas, 0, 0); const k = 1 + Math.sin(p * Math.PI) * .7; x.fillStyle = BG; x.fillRect(0, 0, W, H); x.drawImage(off, W/2 - W*k/2, H/2 - H*k/2, W*k, H*k); },
    spin(x, W, H, p){ ox.drawImage(x.canvas, 0, 0); x.fillStyle = BG; x.fillRect(0, 0, W, H); x.save(); x.translate(W/2, H/2); x.rotate(easeIO(p) * Math.PI * 2); const k = 1 - Math.sin(p * Math.PI) * .4; x.scale(k, k); x.drawImage(off, -W/2, -H/2); x.restore(); },
    mirror(x, W, H, p){ ox.drawImage(x.canvas, 0, 0); x.fillStyle = BG; x.fillRect(0, 0, W, H); x.save(); x.translate(W/2, 0); x.scale(Math.cos(easeIO(p) * Math.PI * 2), 1); x.drawImage(off, -W/2, 0); x.restore(); },
    dither(x, W, H){ const img = x.getImageData(0, 0, W, H), d = img.data, B = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
      for (let y = 0; y < H; y++) for (let k = 0; k < W; k++){ const i = (y * W + k) * 4, l = (d[i] * .3 + d[i+1] * .59 + d[i+2] * .11) / 255, th = (B[((y >> 1) & 3) * 4 + ((k >> 1) & 3)] + .5) / 16, v = l > th ? 236 : 18; d[i] = d[i+1] = d[i+2] = v; } x.putImageData(img, 0, 0); },
    crt(x, W, H, p){ ox.drawImage(x.canvas, 0, 0); x.fillStyle = "#050505"; x.fillRect(0, 0, W, H);
      const q = p < .5 ? p * 2 : (1 - p) * 2, sy = Math.max(.006, 1 - q * 1.25), sx = q > .78 ? Math.max(.012, 1 - (q - .78) * 4.6) : 1;
      if (q < .97){ x.drawImage(off, W/2 - W*sx/2, H/2 - H*sy/2, W*sx, H*sy); x.fillStyle = `rgba(255,255,255,${q * .85})`; x.fillRect(W/2 - W*sx/2, H/2 - 2, W*sx, 4); }
      else { x.fillStyle = "#fff"; x.beginPath(); x.arc(W/2, H/2, 7, 0, 7); x.fill(); } }
  };
  const GROUPS = [
    { label: "FX",  pool: ["glitch", "wave", "rainbow", "shake", "melt", "pixelate", "snow"], snd: "zap" },
    { label: "TXT", pool: ["scramble", "leet", "shout", "reverse", "wide", "pixel", "binary"], snd: "chatter" },
    { label: "RND", pool: ["invert", "zoom", "spin", "mirror", "dither", "glitch", "scramble", "rainbow"], snd: "zap" },
    { label: "PWR", pool: ["crt"], snd: "power" }
  ];
  const DUR = { crt: 2.2, scramble: 1.6, binary: 1.6, spin: 1.3, mirror: 1.3, melt: 1.8, wave: 1.8, rainbow: 2.2, dither: 1.6, invert: 1.2, leet: 2, shout: 2, reverse: 2, wide: 2, pixel: 2.2 };
  let fx = null, lastFx = "", fxEnd = 0;
  function trigger(g){
    const G = GROUPS[g], pool = G.pool.filter(n => n !== lastFx || G.pool.length === 1), name = pool[(Math.random() * pool.length) | 0];
    lastFx = name; fx = { name, kind: TXT[name] ? "txt" : "pix", t0: performance.now(), dur: (DUR[name] || 1.4) * 1000, label: G.label };
    Sound.play(TXT[name] && name !== "pixel" && name !== "scramble" ? G.snd : (name === "crt" ? "power" : name === "scramble" || name === "binary" ? "chatter" : "zap"));
    gsap.fromTo(led.material, { emissiveIntensity: 5 }, { emissiveIntensity: 1.2, duration: .6 });
  }
  let sig = "";
  function drawScr(force){
    const tm = T.time(), progs = [0,1,2,3].map(k => clamp((tm - (1 + k) - .35) / .5, 0, 1));
    const now = performance.now();
    if (fx && now > fx.t0 + fx.dur){ fx = null; force = true; }
    const s = R.map(r => r.v.toFixed(3)).join() + progs.map(p => p.toFixed(2)).join() + Y84;
    if (s === sig && !force && !fx) return; sig = s;
    const { x, c } = sc, W = c.width, H = c.height;
    const fp = fx ? clamp((now - fx.t0) / fx.dur, 0, 1) : 0, ft = now / 1000;
    if (fx && fx.kind === "txt"){
      const orig = CanvasRenderingContext2D.prototype.fillText;
      x.fillText = function(str, a, b){ let out = String(str);
        if (fx.name === "pixel") this.font = this.font.replace(/(\d+(?:\.\d+)?px).*$/, "$1 'Pixelify Sans', monospace");
        else out = TXT[fx.name](out, fp);
        return orig.call(this, out, a, b); };
    }
    drawHello(x, W, H);
    R.forEach((r, k) => { if (r.v <= 0) return; x.save(); x.beginPath(); x.rect(0, 0, W, H * r.v); x.clip(); drawStep(x, W, H, k, progs[k] ?? 1); x.restore(); });
    delete x.fillText;
    if (fx && fx.kind === "pix") PIX[fx.name](x, W, H, fp, ft);
    if (fx){ x.fillStyle = "#111"; x.fillRect(W - 236, H - 64, 200, 34); x.fillStyle = "#e3ebe8"; x.font = "20px 'Geist Mono', monospace"; x.fillText(`${fx.label} · ${fx.name.toUpperCase()}`, W - 224, H - 40); }
    x.fillStyle = "rgba(0,0,0,.05)"; for (let y = 0; y < H; y += 4) x.fillRect(0, y, W, 1);
    sc.t.needsUpdate = true;
  }
  // physical buttons + label strip + LED on the Mac's front panel
  const btns = [], btnColors = [0xd7193a, 0xf2eee6, 0x2b2b2b, 0x2b2b2b];
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x1a1816, roughness: .6 });
  btnColors.forEach((col, i) => {
    const bx = -1.02 + i * .27;
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(.112, .112, .02, 32), ringMat); ring.rotation.x = Math.PI / 2; ring.position.set(bx, -.85, 1.405); mac.add(ring);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(.085, .085, .07, 32), new THREE.MeshStandardMaterial({ color: col, roughness: .38, emissive: col, emissiveIntensity: 0 }));
    m.rotation.x = Math.PI / 2; m.position.set(bx, -.85, 1.44); m.castShadow = true; m.userData = { i, press: 0, hover: 0 }; mac.add(m); btns.push(m);
  });
  const lab = canvasTex(512, 64);
  lab.x.fillStyle = "rgba(0,0,0,0)"; lab.x.clearRect(0, 0, 512, 64); lab.x.fillStyle = "#5c5446"; lab.x.font = "600 30px 'Geist Mono', monospace"; lab.x.textAlign = "center";
  const drawLab = () => { lab.x.clearRect(0, 0, 512, 64); GROUPS.forEach((G, i) => lab.x.fillText(G.label, (( -1.02 + i * .27) + 1.2) / 1.1 * 512, 42)); lab.t.needsUpdate = true; };
  const labPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .1375), new THREE.MeshBasicMaterial({ map: lab.t, transparent: true }));
  labPlane.position.set(-.65, -.66, 1.402); mac.add(labPlane); drawLab(); document.fonts.ready.then(drawLab);
  const led = new THREE.Mesh(new THREE.SphereGeometry(.03, 16, 16), new THREE.MeshStandardMaterial({ color: 0x29d16b, emissive: 0x29d16b, emissiveIntensity: 1.2 }));
  led.position.set(1.1, -1.18, 1.41); mac.add(led);
  // pointer: hover + press buttons, click the screen for a random effect
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), host = $("#macGL");
  let hoverObj = null;
  const pick = e => { const r = host.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, camera); const hit = ray.intersectObjects([...btns, glass])[0]; return hit ? hit.object : null; };
  host.addEventListener("pointermove", e => { if (P.zoom > .05){ hoverObj = null; host.style.cursor = ""; return; } const o = pick(e); if (o !== hoverObj && o && o !== glass) Sound.play("hover"); hoverObj = o; host.style.cursor = o ? "pointer" : ""; });
  host.addEventListener("pointerleave", () => { hoverObj = null; host.style.cursor = ""; });
  host.addEventListener("pointerdown", e => {
    if (P.zoom > .05) return; const o = pick(e); if (!o) return;
    if (o === glass){ Sound.play("click"); trigger(2); gsap.fromTo("#apHint", { opacity: .4 }, { opacity: 1, duration: .4 }); return; }
    const i = o.userData.i; Sound.play("key", 6 + i);
    gsap.fromTo(o.userData, { press: 1 }, { press: 0, duration: .45, ease: "elastic.out(1,.5)" });
    gsap.fromTo(o.material, { emissiveIntensity: .9 }, { emissiveIntensity: 0, duration: .6 });
    trigger(i);
  });
  // keyboard: F / T / R / P while the Approach scene is on screen
  addEventListener("keydown", e => {
    if (!S.visible || P.zoom > .05 || modalOpen || menuOpen || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || e.metaKey || e.ctrlKey) return;
    const i = "ftrp".indexOf(e.key.toLowerCase()); if (i < 0) return;
    const r = $("#apPin").getBoundingClientRect(); if (r.top > innerHeight * .3 || r.bottom < innerHeight * .7) return;
    gsap.fromTo(btns[i].userData, { press: 1 }, { press: 0, duration: .45, ease: "elastic.out(1,.5)" }); Sound.play("key", 6 + i); trigger(i);
  });
  const animBtns = () => btns.forEach(b => { const h = b === hoverObj ? 1 : 0; b.userData.hover = lerp(b.userData.hover, h, .2); b.position.z = 1.44 - b.userData.press * .045 + b.userData.hover * .01; });
  let px = 0, tpx = 0; $("#approach").addEventListener("pointermove", e => tpx = e.clientX / innerWidth - .5);
  function tick(){
    if (!S.visible) return;
    const t = performance.now() / 1000, z = P.zoom;
    shell.color.copy(beige).lerp(safeRed, P.safe);
    glassMat.color.setRGB(1, lerp(1, .42, P.safe), lerp(1, .46, P.safe));
    footMat.color.set(0xbfb49c).lerp(new THREE.Color(0x8a1222), P.safe);
    mac.scale.setScalar(P.scale);
    px = lerp(px, tpx, .06);
    mac.rotation.y = (-.32 * P.safe + px * .25 + (reduced ? 0 : Math.sin(t * .6) * .03)) * (1 - z);
    camera.position.set(0, lerp(.35, .55, z), lerp(14, 1.9, z)); camera.lookAt(0, lerp(.2, .55, z), 0);
    animBtns();
    drawScr();
    S.render();
  }
  gsap.ticker.add(tick);
  document.fonts.ready.then(() => drawScr(true)); drawScr(true);
  return { redraw: () => drawScr(true) };
})();

/* =========================================================
   WORK: pinned scrubbed timeline (same structure as reference)
   ========================================================= */
const Work = (() => {
  const Pj = C.projects, N = Pj.length;
  $("#shots").innerHTML = Pj.map(p => `<figure class="shot dev"><img alt="${esc(p.name)}"><img class="safe" alt=""></figure>`).join("");
  $("#wNames").innerHTML = Pj.map(p => `<h3 class="w-name">${esc(p.name)}</h3>`).join("");
  $("#wInfos").innerHTML = Pj.map((p, i) => `<div class="w-info"><p class="brief">${esc(p.brief)}</p><p class="desc">${esc(p.desc)}</p><dl class="meta"><div><dt>Role</dt><dd>${esc(p.role)}</dd></div><div><dt>Status</dt><dd>${esc(p.status)}</dd></div></dl><button class="btn ghost sm" type="button" data-case="${i}">View project</button></div>`).join("");
  $("#wIndex").innerHTML = Pj.map((p, i) => `<li><button type="button" data-i="${i}"${i ? "" : ' class="on"'}><i></i>${esc(p.name)}</button></li>`).join("");
  $("#wBar").innerHTML = Pj.map(() => "<b></b>").join("");
  $("#wkTotal").textContent = pad(N) + " projects"; $("#wTot").textContent = pad(N); $("#wSector").textContent = Pj[0].cat;
  rollify($("#wInfos"));
  const E = $$(".shot"), Cn = $$(".w-name"), M = $$(".w-info"), Pb = $$("#wIndex button"), O = $$("#wBar b");
  const setImgs = () => E.forEach((s, i) => setDev(s, projectURL(i)));
  setImgs();
  gsap.set(Cn, { yPercent: 140, autoAlpha: 1 }); gsap.set(Cn[0], { yPercent: 0 });
  gsap.set(M, { autoAlpha: 0 }); gsap.set(M[0], { autoAlpha: 1 });
  gsap.set(E.slice(1), { clipPath: "inset(50% 0% 50% 0%)" });
  let A = 0;
  const L = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { id: "work", trigger: "#stage", start: "top top", end: () => "+=" + innerHeight * (N + .4) * 1.15, pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1 } });
  L.to($(".safe", E[0]), { opacity: 0, duration: .7 }, 0).fromTo($$("img", E[0]), { scale: 1.14 }, { scale: 1, duration: 1 }, 0).to(O[0], { scaleX: 1, duration: 1 }, 0);
  for (let t = 1; t < N; t++){
    const e = t;
    L.fromTo(".w-slit", { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: .18, ease: "power2.inOut", immediateRender: false }, e - .05)
     .fromTo(E[t], { clipPath: "inset(50% 0% 50% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: .45, ease: "power3.inOut", immediateRender: false }, e + .08)
     .to(".w-slit", { opacity: 0, duration: .12 }, e + .16)
     .fromTo($$("img", E[t-1]), { scale: 1 }, { scale: .92, duration: .5, immediateRender: false }, e + .08)
     .fromTo($$("img", E[t]), { scale: 1.28 }, { scale: 1, duration: .9, ease: "power2.out", immediateRender: false }, e + .08)
     .fromTo($(".safe", E[t]), { opacity: 1 }, { opacity: 0, duration: .7, immediateRender: false }, e + .3)
     .fromTo(Cn[t-1], { yPercent: 0 }, { yPercent: -140, duration: .3, ease: "power2.in", immediateRender: false }, e)
     .fromTo(Cn[t], { yPercent: 140 }, { yPercent: 0, duration: .4, ease: "power3.out", immediateRender: false }, e + .22)
     .fromTo(M[t-1], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -14, duration: .2, immediateRender: false }, e + .12)
     .fromTo(M[t], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .3, immediateRender: false }, e + .35)
     .to(O[t], { scaleX: 1, duration: 1 }, e);
  }
  L.to({}, { duration: .4 });
  L.eventCallback("onUpdate", () => {
    const t = clamp(Math.floor(L.time() - .3), 0, N - 1); if (t === A) return;
    const d = t > A ? 1 : -1; A = t; Sound.play("swish");
    const r = $("#wCur"), old = r.lastElementChild, n = document.createElement("span"); n.textContent = pad(t + 1); r.append(n);
    gsap.fromTo(n, { yPercent: 100 * d }, { yPercent: 0, duration: .7, ease: "expo.out" });
    gsap.to(old, { yPercent: -100 * d, duration: .7, ease: "expo.out", onComplete: () => old.remove() });
    Pb.forEach((b, i) => b.classList.toggle("on", i === t)); $("#wSector").textContent = Pj[t].cat;
  });
  const posFor = i => { const s = ScrollTrigger.getById("work"), n = L.duration(); return Math.round(s.start + (s.end - s.start) * (i ? (i + .75) / n : 0)); };
  // settle on the nearest project once scrolling stops
  let snapT, touching = false;
  const snap = () => { const s = ScrollTrigger.getById("work"); if (!s || touching || menuOpen || modalOpen) return;
    const y = scrollY, h = innerHeight; if (y < s.start - .35 * h || y > s.end + .2 * h) return;
    const pts = E.map((_, i) => posFor(i)).concat(Math.round(s.end)); const tgt = pts.reduce((a, b2) => Math.abs(b2 - y) < Math.abs(a - y) ? b2 : a);
    if (Math.abs(tgt - y) >= 2) scrollToTarget(tgt, { duration: .9 }); };
  addEventListener("scroll", () => { clearTimeout(snapT); snapT = setTimeout(snap, 180); }, { passive: true });
  addEventListener("touchstart", () => { touching = true; clearTimeout(snapT); }, { passive: true });
  addEventListener("touchend", () => { touching = false; snapT = setTimeout(snap, 180); }, { passive: true });
  Pb.forEach((b, i) => b.addEventListener("click", () => scrollToTarget(posFor(i))));
  $("#wInfos").addEventListener("click", e => { const b2 = e.target.closest("[data-case]"); if (b2) openCase(+b2.dataset.case); });
  // heading: crimson + light weight → ink + bold, scrubbed per character
  gsap.fromTo(splitChars($("#wkH")), { color: "#B0142C", fontVariationSettings: '"wght" 300' }, { color: "#0C0B0B", fontVariationSettings: '"wght" 600', ease: "none", stagger: .04, scrollTrigger: { trigger: "#wkH", start: "top 88%", end: "bottom 55%", scrub: .5 } });
  return { redraw: setImgs, url: projectURL };
})();

/* =========================================================
   MENU PREVIEWS: one developing image per link (hover / focus)
   ========================================================= */
const MenuPrev = (() => {
  const box = $("#menuArt"), urls = () => [projectURL(0), Art.url("menu", () => { const c = mk(640, 800); drawMenuArt(c); return c; }), studioURL(), Art.url("hello", () => Art.scene("hello", 640, 800))];
  box.innerHTML = [0,1,2,3].map(() => `<figure class="dev"><img alt=""><img class="safe" alt=""></figure>`).join("");
  const figs = $$(".dev", box);
  const set = () => urls().forEach((u, i) => setDev(figs[i], u));
  const show = i => figs.forEach((f, j) => { f.classList.toggle("on", i === j); const s = $(".safe", f); if (i === j) reduced ? (s.style.opacity = 0) : gsap.fromTo(s, { opacity: 1 }, { opacity: 0, duration: 1.2, ease: "power2.inOut", delay: .1 }); });
  $$(".menu nav a").forEach((a, i) => { a.addEventListener("mouseenter", () => show(i)); a.addEventListener("focus", () => show(i)); });
  return { set, show };
})();

/* =========================================================
   ONE STUDIO: pinned word cycle
   ========================================================= */
(() => {
  const el = $("#oneWord"), Wd = C.words; el.innerHTML = Wd.map(w => `<span>${esc(w)}</span>`).join("");
  const spans = $$("span", el); gsap.set(spans, { yPercent: 105 }); gsap.set(spans[0], { yPercent: 0 });
  let cur = 0;
  ScrollTrigger.create({ trigger: "#one", start: "top top", end: () => "+=" + innerHeight * 2.2, pin: "#onePin", scrub: true,
    onUpdate: s => { const i = Math.min(Wd.length - 1, Math.floor(s.progress * Wd.length)); if (i === cur) return; const dir = i > cur ? 1 : -1;
      gsap.to(spans[cur], { yPercent: -105 * dir, duration: .7, ease: "expo.inOut" });
      gsap.fromTo(spans[i], { yPercent: 105 * dir }, { yPercent: 0, duration: .9, ease: "expo.inOut" });
      Sound.play("tick"); cur = i; $("#oneCount").textContent = `${pad(i+1)} / ${pad(Wd.length)}`; } });
})();

/* =========================================================
   FOOTER: heading reveal + greeting swap
   ========================================================= */
gsap.from(".ft-h .ln > span", { yPercent: 110, duration: 1.2, stagger: .08, ease: "expo.out", scrollTrigger: { trigger: ".ft-h", start: "top 85%" } });
(() => {
  const el = $("#hello"); let i = 0;
  const put = (w, from) => { const s = document.createElement("span"); s.textContent = w; el.appendChild(s); gsap.fromTo(s, { yPercent: from }, { yPercent: 0, duration: 1, ease: "expo.out" }); return s; };
  let curS = put(C.greetings[0], 0);
  setInterval(() => { if (document.hidden) return; i = (i + 1) % C.greetings.length; const old = curS; gsap.to(old, { yPercent: -105, duration: .8, ease: "expo.in", onComplete: () => old.remove() }); curS = put(C.greetings[i], 105); }, 2000);
})();

/* =========================================================
   MODALS, COOKIES, CASE + CONTACT
   ========================================================= */
let modalOpen = false, lastFocus = null;
function openModal(html, onMount){
  lastFocus = document.activeElement; const old = $("#modal"); const m = old.cloneNode(false); old.replaceWith(m); m.innerHTML = html; rollify(m); if (!modalOpen) Sound.play("pop"); modalOpen = true; lenis && lenis.stop();
  gsap.set("#modalBg", { visibility: "visible" }); gsap.to("#modalBg", { opacity: 1, duration: .35 }); gsap.fromTo(m, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: "expo.out" });
  onMount && onMount(m); (m.querySelector("[autofocus], button, input") || m).focus();
}
function closeModal(){ if (modalOpen) Sound.play("close"); modalOpen = false; lenis && !menuOpen && lenis.start(); gsap.to("#modalBg", { opacity: 0, duration: .3, onComplete: () => gsap.set("#modalBg", { visibility: "hidden" }) }); lastFocus && lastFocus.focus && lastFocus.focus(); }
$("#modalBg").addEventListener("mousedown", e => { if (e.target.id === "modalBg") closeModal(); });
const close = `<button class="meta" data-close style="float:right;color:var(--mute-on-ink)">Close ✕</button>`;
$("#modalBg").addEventListener("click", e => { if (e.target.closest("[data-close]")) closeModal(); });

const CK = "halftone-consent";
const Consent = {
  get(){ return store.get(CK); },
  save(p){ Sound.play("confirm"); store.set(CK, { necessary: true, statistics: !!p.statistics, marketing: !!p.marketing, media: !!p.media, at: Date.now() }); hideBanner(); toast("Preferences saved"); },
  prefs(){
    const c = this.get() || {};
    const rows = [["statistics","Statistics","Anonymous figures on how the site is used, so we can improve it. No statistics tools are in use right now."],["marketing","Marketing","Cookies that make ads more relevant. None in use right now."],["media","External media","Content from other platforms, such as videos, which can set their own cookies. None on the site right now."]];
    openModal(`${close}<span class="meta label"><span class="dot"></span>Cookies</span><h2>Cookie preferences</h2><p>Choose which cookies you allow. You can change your choice at any time through Cookie settings at the bottom of every page.</p>
      <div class="ck-row"><div><b>Necessary</b><small class="meta">Always on</small><p>Needed for the site to work, such as remembering this choice. These can't be switched off.</p></div><input class="tg" type="checkbox" checked disabled aria-label="Necessary, always on"></div>
      ${rows.map(([k,l,d]) => `<label class="ck-row"><div><b>${l}</b><p>${d}</p></div><input class="tg" type="checkbox" data-k="${k}" ${c[k] ? "checked" : ""}></label>`).join("")}
      <div class="acts"><button class="btn sm" data-p="all">Accept all</button><button class="btn ghost sm" data-p="decline">Decline</button><button class="btn ghost sm" data-p="save">Save preferences</button></div>`,
      m => m.addEventListener("click", e => { const a = e.target.closest("[data-p]")?.dataset.p; if (!a) return;
        const p = {}; if (a === "all") Object.assign(p, { statistics:1, marketing:1, media:1 }); if (a === "save") $$("[data-k]", m).forEach(x => p[x.dataset.k] = x.checked);
        this.save(p); closeModal(); }, { once: false }));
  }
};
function showBanner(){ gsap.set("#ck", { visibility: "visible" }); gsap.to("#ck", { y: 0, duration: 1, ease: "expo.out" }); }
function hideBanner(){ gsap.to("#ck", { y: "130%", duration: .6, ease: "expo.in", onComplete: () => gsap.set("#ck", { visibility: "hidden" }) }); }
$("#ck").addEventListener("click", e => { const a = e.target.closest("[data-ck]")?.dataset.ck; if (!a) return;
  if (a === "all") Consent.save({ statistics:1, marketing:1, media:1 }); if (a === "decline") Consent.save({}); if (a === "manage") Consent.prefs(); });

function openCase(i){
  const p = C.projects[i];
  openModal(`${close}<span class="meta label"><span class="dot"></span>${pad(i+1)} / ${pad(C.projects.length)} · ${esc(p.cat)}</span><h2>${esc(p.name)}</h2><div class="case-art"></div><p style="font-size:19px;color:var(--paper)">${esc(p.brief)}</p><p>${esc(p.desc)}</p>
    <div class="ck-row meta"><span>Role<br><span style="color:var(--paper)">${esc(p.role)}</span></span><span>Status<br><span style="color:var(--paper)">${esc(p.status)}</span></span></div>
    <div class="acts"><button class="btn ghost sm" data-n="-1">Previous</button><button class="btn ghost sm" data-n="1">Next project</button></div>`,
    m => { const im = new Image(); im.alt = p.name; im.src = Work.url(i); $(".case-art", m).appendChild(im);
      m.addEventListener("click", e => { const n = e.target.closest("[data-n]"); if (n){ const j = (i + +n.dataset.n + C.projects.length) % C.projects.length; openCase(j); } }); });
}
function openContact(){
  openModal(`${close}<span class="meta label"><span class="dot"></span>Contact</span><h2>Start a project</h2><p>Tell us a little about it. This opens your email app with the message ready to send to ${esc(C.email)}.</p>
    <form class="form" id="cf"><label class="meta">Name<input name="n" required autocomplete="name"></label><label class="meta">Email<input name="e" type="email" required autocomplete="email"></label>
    <label class="meta">Type of project<select name="t"><option>New website</option><option>Web app</option><option>Redesign</option><option>Something else</option></select></label>
    <label class="meta">Message<textarea name="m" required></textarea></label><div class="acts"><button class="btn" type="submit" data-arrow>Compose email</button></div></form>`,
    m => $("#cf", m).addEventListener("submit", e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
      const href = `mailto:${C.email}?subject=${encodeURIComponent(d.t + " — " + d.n)}&body=${encodeURIComponent(d.m + "\n\n" + d.n + "\n" + d.e)}`;
      e.target.outerHTML = `<p style="color:var(--paper)">Your message is ready. If your email app didn't open, write to <b>${esc(C.email)}</b> or <a href="${href}" style="text-decoration:underline">try again</a>.</p>`; location.href = href; }));
}
const legal = {
  privacy: `${close}<span class="meta label"><span class="dot"></span>Legal</span><h2>Privacy</h2><p>Placeholder. Replace with your privacy policy: who you are, what the contact form collects, where the site is hosted and how people can reach you about their data.</p>`,
  policy: `${close}<span class="meta label"><span class="dot"></span>Legal</span><h2>Cookies</h2><p>This site only stores your cookie choice. No statistics, marketing or external media tools are loaded.</p><div class="acts"><button class="btn ghost sm" data-act="prefs">Cookie settings</button></div>`
};
document.addEventListener("click", e => {
  const a = e.target.closest("[data-act]"); if (!a) return; const k = a.dataset.act;
  if (k === "contact"){ if (menuOpen) toggleMenu(false); openContact(); }
  if (k === "about") openModal(`${close}<span class="meta label"><span class="dot"></span>Studio</span><h2>About ${esc(C.brandTitle)}</h2><p>A small design and development studio in ${esc(C.city)}, since ${esc(C.since)}. Design, development and motion under one roof, with one point of contact from the first conversation to launch, and after.</p><div class="acts"><button class="btn ghost sm" data-act="contact">Start a project</button></div>`);
  if (k === "privacy" || k === "policy") openModal(legal[k]);
  if (k === "prefs") Consent.prefs();
});

/* =========================================================
   1984 ⇄ 2026 (wipe left→right, then 1-bit everything)
   ========================================================= */
function setEra(on){
  const w = $("#wipe"); Sound.play("era", on);
  gsap.timeline()
    .set(w, { clipPath: "inset(0 100% 0 0)" })
    .to(w, { clipPath: "inset(0 0% 0 0)", duration: .55, ease: "power3.inOut" })
    .add(() => { Y84 = on; document.documentElement.classList.toggle("y84", on); $("#eraLbl").textContent = on ? "Forward to 2026" : "Back to 1984";
      Work.redraw(); Studio.redraw(); Keypad.redraw(); Approach.redraw(); MenuPrev.set(); })
    .to(w, { clipPath: "inset(0 0 0 100%)", duration: .6, ease: "power3.inOut", delay: .05 });
}
$("#eraBtn").addEventListener("click", () => setEra(!Y84));

gsap.to("#kpGL", { yPercent: 14, ease: "none", scrollTrigger: { trigger: "#intro", start: "top top", end: "bottom top", scrub: true } });
MenuPrev.set();

/* =========================================================
   LOADER → HERO ENTRANCE
   ========================================================= */
gsap.set(".hero-title .ln > span", { yPercent: 110 });
gsap.set("#heroSide, .hero-foot, .hero .xlbl, .hero .figlbl", { opacity: 0, y: 16 });
gsap.set("#nav", { yPercent: -100 });
const tl = gsap.timeline();
tl.to("#ldGrid", { opacity: 1, duration: .8 })
  .fromTo("#ldMark", { scale: .6, opacity: 0 }, { scale: 1, opacity: 1, duration: .8, ease: "expo.out" }, 0)
  .to("#ldBar", { scaleX: 1, duration: 1.1, ease: "power2.inOut" }, .1)
  .add(async () => { try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]); } catch {} })
  .to("#loader", { clipPath: "inset(0 0 100% 0)", duration: 1, ease: "expo.inOut" }, "+=.15")
  .add(() => { $("#loader").remove(); Keypad.intro(); }, "-=.5")
  .to("#nav", { yPercent: 0, duration: 1, ease: "expo.out" }, "-=.6")
  .to(".hero-title .ln > span", { yPercent: 0, duration: 1.3, stagger: .1, ease: "expo.out" }, "<")
  .to("#heroSide, .hero-foot, .hero .xlbl, .hero .figlbl", { opacity: 1, y: 0, duration: 1, stagger: .08, ease: "expo.out" }, "<.3")
  .add(() => { if (!Consent.get()) setTimeout(showBanner, 900); });
if (reduced) tl.progress(1);
gsap.set("#ck", { y: "130%" });
addEventListener("load", () => ScrollTrigger.refresh());