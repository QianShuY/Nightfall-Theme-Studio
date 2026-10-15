/* Nightfall Theme Engine v0.3 — MIT — no network, no dependencies */
(function (global) {
  'use strict';
  const clamp = (v, min, max, fallback) => Number.isFinite(Number(v)) ? Math.max(min, Math.min(max, Number(v))) : fallback;
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const types = ['aurora', 'stars', 'gradient', 'image', 'video', 'none'];
  const introTypes = ['eclipse', 'stardust', 'signal', 'grimoire'];
  const DEFAULT = {
    schemaVersion: 1, name: 'Obsidian Glass', accent: '#8A9EF4', base: '#080A0F', surface: '#161923',
    text: '#EEF0FA', muted: '#A4A9BF', border: '#353846', bgType: 'aurora', image: '', video: '',
    darkness: 65, blur: 0, glass: 60, radius: 18, fontSize: 14, sidebarWidth: 245,
    chatWidth: 800, particles: 35, speed: 42, animations: true, glassEnabled: true, compact: false,
    introEnabled: true, introStyle: 'eclipse', introDuration: 1600, introName: 'NIGHTFALL', introFrequency: 'session'
  };
  const PRESETS = {
    obsidian: { ...DEFAULT, id: 'obsidian', name: 'Obsidian Glass' },
    crimson: { ...DEFAULT, id: 'crimson', name: 'Crimson Void', accent: '#EF6C83', base: '#080608', surface: '#20141D', border: '#4A2B36', bgType: 'aurora', darkness: 72, glass: 72, speed: 26 },
    nebula: { ...DEFAULT, id: 'nebula', name: 'Ghost Neon', accent: '#8B80FF', base: '#080715', surface: '#17162A', border: '#34304D', bgType: 'stars', darkness: 54, particles: 66, speed: 48 },
    polar: { ...DEFAULT, id: 'polar', name: 'Polar Mist', accent: '#62D8C9', base: '#061012', surface: '#122528', border: '#2C5050', bgType: 'gradient', darkness: 45, glass: 80 },
    mono: { ...DEFAULT, id: 'mono', name: 'Monochrome', accent: '#E8E8E8', base: '#070707', surface: '#181818', border: '#303030', bgType: 'none', darkness: 92, glass: 20, animations: false },
    grimoire: { ...DEFAULT, id: 'grimoire', name: 'Anti-Magic Grimoire', accent: '#C84C60', base: '#050506', surface: '#130E12', text: '#EEE8EB', muted: '#A699A1', border: '#40252F', bgType: 'stars', darkness: 83, particles: 26, speed: 18, glass: 68, introStyle: 'grimoire', introName: 'GRIMOIRE', introDuration: 2800 }
  };
  function normalized(input) {
    const u = input && typeof input === 'object' ? input : {};
    const t = { ...DEFAULT };
    for (const k of ['accent', 'base', 'surface', 'text', 'muted', 'border']) if (typeof u[k] === 'string' && HEX.test(u[k])) t[k] = u[k];
    t.name = String(u.name || t.name).slice(0, 70);
    t.id = String(u.id || 'custom').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
    t.bgType = types.includes(u.bgType) ? u.bgType : t.bgType;
    t.introStyle = introTypes.includes(u.introStyle) ? u.introStyle : t.introStyle;
    t.introFrequency = ['session','always'].includes(u.introFrequency) ? u.introFrequency : t.introFrequency;
    if (typeof u.introName === 'string') t.introName = u.introName.trim().slice(0, 36) || t.introName;
    const ranges = {
      darkness: [0, 100], blur: [0, 30], glass: [0, 95], radius: [0, 36], fontSize: [12, 19],
      sidebarWidth: [190, 330], chatWidth: [560, 1120], particles: [0, 100], speed: [0, 100], introDuration: [800, 3500]
    };
    for (const [key, [min, max]] of Object.entries(ranges)) t[key] = clamp(u[key], min, max, t[key]);
    for (const key of ['animations', 'glassEnabled', 'compact', 'introEnabled']) if (typeof u[key] === 'boolean') t[key] = u[key];
    for (const key of ['image', 'video']) {
      const valid = key === 'image' ? /^data:image\/(png|jpeg|webp);base64,[\w+/=]+$/ : /^data:video\/(mp4|webm);base64,[\w+/=]+$/;
      t[key] = typeof u[key] === 'string' && u[key].length < 9_000_000 && valid.test(u[key]) ? u[key] : '';
    }
    return t;
  }
  function rgba(hex, alpha) {
    const value = HEX.test(hex) ? hex : '#000000';
    const [r, g, b] = [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16));
    return `rgba(${r},${g},${b},${alpha})`;
  }
  function baseCSS(theme) {
    const t = normalized(theme);
    const v = `--nf-base:${t.base};--nf-surface:${t.surface};--nf-accent:${t.accent};--nf-text:${t.text};--nf-muted:${t.muted};--nf-border:${t.border};--nf-radius:${t.radius}px;--nf-sidebar:${t.sidebarWidth}px;--nf-chat:${t.chatWidth}px;--nf-font:${t.fontSize}px;--nf-glass:${(t.glass / 100).toFixed(2)};`;
    const a = rgba(t.accent, 0.20);
    const surface = rgba(t.surface, t.glassEnabled ? 0.62 : 0.97);
    const translucent = rgba(t.surface, t.glassEnabled ? 0.71 : 0.97);
    return `/* Nightfall Studio — conservative cosmetic layer, not affiliated with OpenAI */
html.nf-enabled {${v} color-scheme: dark !important;}
html.nf-enabled body { color:var(--nf-text)!important; background:var(--nf-base)!important; }
html.nf-enabled body,html.nf-enabled button,html.nf-enabled input,html.nf-enabled textarea {font-size:var(--nf-font);}
html.nf-enabled #__next,html.nf-enabled #root,html.nf-enabled #app,html.nf-enabled main,html.nf-enabled [role="main"]{background-color:transparent!important;}
html.nf-enabled body>div:first-of-type{background-color:transparent!important;}
html.nf-enabled nav,html.nf-enabled aside,html.nf-enabled [data-testid="sidebar"],html.nf-enabled #stage-slideover-sidebar{
 background:${surface}!important;border-color:${rgba(t.border, 0.55)}!important;
 ${t.glassEnabled ? 'backdrop-filter:blur(22px) saturate(1.25)!important; -webkit-backdrop-filter:blur(22px) saturate(1.25)!important;' : ''}}
html.nf-enabled [data-testid="composer"],html.nf-enabled #prompt-textarea,html.nf-enabled [data-testid="prompt-textarea"],html.nf-enabled form:has(>div>textarea),html.nf-enabled [contenteditable="true"]{
 border-radius:var(--nf-radius)!important; border-color:${rgba(t.border, 0.58)}!important;}
html.nf-enabled [data-testid="composer"],html.nf-enabled form:has(#prompt-textarea){background:${translucent}!important;box-shadow:0 12px 55px rgba(0,0,0,.18),0 0 0 1px ${rgba(t.border,0.28)}!important;${t.glassEnabled ? 'backdrop-filter:blur(24px)!important;' : ''}}
html.nf-enabled [data-testid="composer"]:focus-within,html.nf-enabled form:has(#prompt-textarea):focus-within{box-shadow:0 0 0 1px ${rgba(t.accent, 0.55)},0 0 25px ${a}!important;}
html.nf-enabled [data-testid="conversation-turn"],html.nf-enabled article{max-width:min(calc(100vw - 40px),var(--nf-chat))!important;margin-left:auto;margin-right:auto;}
html.nf-enabled .prose pre,html.nf-enabled pre:has(code){border:1px solid ${rgba(t.border,0.5)}!important;border-radius:${Math.min(t.radius,16)}px!important;background:${rgba(t.surface,0.88)}!important;}
html.nf-enabled a:focus-visible,html.nf-enabled button:focus-visible{outline:2px solid var(--nf-accent)!important;outline-offset:2px;}
html.nf-enabled ::selection{background:${rgba(t.accent,0.38)}!important;}
html.nf-enabled ::-webkit-scrollbar{width:7px;height:7px;}
html.nf-enabled ::-webkit-scrollbar-thumb{background:${rgba(t.accent,0.25)};border-radius:8px;}
html.nf-enabled ::-webkit-scrollbar-track{background:transparent;}
html.nf-enabled .nf-backdrop{position:fixed!important;inset:0!important;z-index:0!important;pointer-events:none!important;overflow:hidden!important;background:var(--nf-base);}
html.nf-enabled body>*:not(.nf-backdrop){position:relative;z-index:1;}
html.nf-enabled .nf-backdrop .nf-orb{position:absolute;border-radius:50%;filter:blur(48px);opacity:.48;transform:translate3d(0,0,0);animation:nf-drift ${50 - t.speed*.3}s ease-in-out infinite alternate;}
html.nf-enabled .nf-backdrop .nf-orb.one{width:60vw;height:52vh;top:-26%;left:-10%;background:radial-gradient(circle,${rgba(t.accent,.26)},transparent 68%);}
html.nf-enabled .nf-backdrop .nf-orb.two{width:50vw;height:55vh;right:-10%;bottom:-35%;animation-direction:alternate-reverse;background:radial-gradient(circle,${rgba(t.accent,.15)},transparent 66%);}
html.nf-enabled .nf-backdrop .nf-image,html.nf-enabled .nf-backdrop video{position:absolute;width:100%;height:100%;object-fit:cover;inset:0;filter:blur(${t.blur}px);transform:scale(${t.blur ? 1.05 : 1});}
html.nf-enabled .nf-backdrop .nf-dimmer{position:absolute;inset:0;background:${rgba(t.base,t.darkness / 100)};}
html.nf-enabled .nf-backdrop canvas{position:absolute;inset:0;opacity:.65;}
@keyframes nf-drift{0%{transform:translate3d(-3%,1%,0) scale(1)}100%{transform:translate3d(12%,-8%,0) scale(1.19)}}
${t.animations ? '' : 'html.nf-enabled .nf-backdrop *,html.nf-enabled *{animation-duration:.001ms!important;transition-duration:.001ms!important;}'}
@media(prefers-reduced-motion:reduce){html.nf-enabled .nf-backdrop *{animation:none!important;}}
${t.compact ? 'html.nf-enabled nav a,html.nf-enabled aside a{padding-top:5px!important;padding-bottom:5px!important;}' : ''}
`;
  }
  let active = null;
  function createBackdrop(host, input, { preview = false } = {}) {
    const t = normalized(input);
    const el = document.createElement('div');
    el.className = preview ? 'nf-preview-backdrop' : 'nf-backdrop';
    if (preview) {
      el.style.cssText = 'position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;background:' + t.base + ';';
    }
    const orb = (name, css) => {const o = document.createElement('div');o.className = 'nf-orb ' + name;o.style.cssText = css;el.appendChild(o);};
    if (['aurora', 'gradient'].includes(t.bgType)) {
      const motion = t.animations ? `animation:nf-drift ${Math.max(10, 50-t.speed*.3)}s ease-in-out infinite alternate;` : '';
      orb('one', `position:absolute;width:85%;height:75%;border-radius:50%;filter:blur(68px);left:-28%;top:-40%;background:radial-gradient(circle,${rgba(t.accent,t.bgType==='aurora'?.54:.37)},transparent 69%);${motion}`);
      orb('two', `position:absolute;width:85%;height:85%;border-radius:50%;filter:blur(76px);right:-35%;bottom:-48%;background:radial-gradient(circle,${rgba(t.bgType==='aurora'?'#466CAA':'#3F9B88',.26)},transparent 69%);${motion}`);
    }
    if (t.bgType === 'image' && t.image) {
      const img = document.createElement('img');img.className='nf-image';img.src=t.image;img.alt='';
      img.style.cssText = `position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(${t.blur}px);transform:scale(1.055);`;el.appendChild(img);
    }
    let vid;
    if (t.bgType === 'video' && t.video) {
      vid = document.createElement('video');vid.src = t.video;vid.muted=true;vid.loop=true;vid.autoplay=t.animations;vid.playsInline=true;
      vid.style.cssText=`position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(${t.blur}px);transform:scale(1.055);`;
      el.appendChild(vid);
    }
    let raf = 0;
    let observer;
    if (t.bgType === 'stars' && t.particles > 0) {
      const canvas = document.createElement('canvas'); canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:.8;';el.appendChild(canvas);
      const ctx=canvas.getContext('2d'); let dots=[];let w=0,h=0,last=0; const motionOK=t.animations && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const resize=()=>{ const r=host.getBoundingClientRect();w=Math.max(100,Math.floor(r.width));h=Math.max(100,Math.floor(r.height));canvas.width=Math.round(w*Math.min(devicePixelRatio||1,2));canvas.height=Math.round(h*Math.min(devicePixelRatio||1,2));ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);dots=Array.from({length:Math.floor(t.particles*1.5)},()=>({x:Math.random()*w,y:Math.random()*h,r:.5+Math.random()*1.3,p:Math.random()*6.28}));};
      resize();observer=new ResizeObserver(resize);observer.observe(host);
      const draw=(now=0)=>{ if (now-last<35 && motionOK){raf=requestAnimationFrame(draw);return;}last=now;ctx.clearRect(0,0,w,h);for(const d of dots){ctx.globalAlpha=.35+.45*Math.sin(d.p+(now||0)*.00045);ctx.fillStyle=t.accent;ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,7);ctx.fill();if(motionOK){d.y+=.03+t.speed*.001;if(d.y>h)d.y=0;}}ctx.globalAlpha=1;if(motionOK)raf=requestAnimationFrame(draw);};
      draw();
    }
    const dim=document.createElement('div');dim.className='nf-dimmer';dim.style.cssText=`position:absolute;inset:0;background:${rgba(t.base,t.darkness/100)};`;el.appendChild(dim);
    if (preview) {el.style.borderRadius='inherit';}
    host.prepend(el); if (vid && t.animations) vid.play().catch(()=>{});
    return {el, destroy(){cancelAnimationFrame(raf);observer?.disconnect();vid?.pause();el.remove();}};
  }
  // Renderer-only startup transition: begins AFTER the host window/page has rendered.
  // The native Windows executable splash is outside this project's control.
  const INTRO_CSS = `
.nf-intro{box-sizing:border-box;display:grid;place-items:center;isolation:isolate;overflow:hidden;user-select:none;background:var(--nfi-base,#080a0f);color:var(--nfi-text,#fff);font-family:Inter,'Segoe UI',system-ui,sans-serif;opacity:1;transition:opacity .3s ease;}
.nf-intro *, .nf-intro *::before, .nf-intro *::after{box-sizing:border-box;}
.nf-intro::before{content:"";position:absolute;inset:-40%;pointer-events:none;background:radial-gradient(ellipse at 50% 51%,var(--nfi-glow) 0, transparent 30%),radial-gradient(ellipse at 62% 18%,var(--nfi-glow) 0,transparent 38%);opacity:.6;animation:nfi-glow var(--nfi-duration) ease-out both;}
.nf-intro__scene{position:relative;z-index:2;min-width:0;display:flex;align-items:center;flex-direction:column;gap:12px;text-align:center;transform:translateZ(0);}
.nf-intro__orb{position:relative;width:112px;height:112px;display:grid;place-items:center;margin-bottom:14px;filter:drop-shadow(0 0 29px var(--nfi-glow));animation:nfi-rise var(--nfi-duration) cubic-bezier(.15,.76,.18,1) both;}
.nf-intro__orb::before{content:"";position:absolute;width:100%;height:100%;border-radius:50%;border:1px solid var(--nfi-line);border-top-color:var(--nfi-accent);border-left-color:transparent;box-shadow:inset 0 0 30px var(--nfi-glow),0 0 30px var(--nfi-glow);animation:nfi-ring var(--nfi-duration) cubic-bezier(.2,.5,.2,1) both;}
.nf-intro__orb::after{content:"";position:absolute;width:74%;height:74%;border:1px solid var(--nfi-line);border-radius:50%;transform:rotate(-28deg) scaleX(.55);opacity:.8;}
.nf-intro__mark{font-size:44px;font-weight:300;line-height:1;color:var(--nfi-accent);text-shadow:0 0 22px var(--nfi-glow);animation:nfi-mark var(--nfi-duration) ease-out both;}
.nf-intro__eyebrow{font-size:9px;letter-spacing:.52em;color:var(--nfi-accent);opacity:.85;}
.nf-intro__title{font-size:clamp(20px,4.2vw,31px);font-weight:540;letter-spacing:.30em;text-indent:.30em;line-height:1.2;max-width:min(88vw,400px);overflow-wrap:anywhere;text-shadow:0 2px 18px #0009;}
.nf-intro__caption{font-size:10px;letter-spacing:.15em;color:var(--nfi-muted);opacity:.82;}
.nf-intro__track{width:clamp(100px,22vw,158px);height:1px;background:var(--nfi-line);margin-top:12px;overflow:hidden;}
.nf-intro__progress{height:100%;width:100%;background:var(--nfi-accent);box-shadow:0 0 12px var(--nfi-accent);transform-origin:left;animation:nfi-progress var(--nfi-duration) linear both;}
.nf-intro__skip{position:absolute;z-index:4;right:18px;bottom:17px;border:1px solid var(--nfi-line);border-radius:999px;background:transparent;color:var(--nfi-muted);font:11px 'Segoe UI',system-ui,sans-serif;padding:8px 13px;cursor:pointer;}
.nf-intro__skip:hover,.nf-intro__skip:focus-visible{color:var(--nfi-text);border-color:var(--nfi-accent);}
.nf-intro--stardust .nf-intro__orb::before{border-style:dashed;border-color:var(--nfi-line);}
.nf-intro__spark{position:absolute;top:var(--y);left:var(--x);width:2px;height:2px;border-radius:50%;background:var(--nfi-accent);opacity:0;box-shadow:0 0 10px var(--nfi-accent);animation:nfi-spark var(--nfi-duration) ease-in-out var(--delay) both;}
.nf-intro--signal .nf-intro__orb{border-radius:12px;}
.nf-intro--signal .nf-intro__orb::before{border-radius:10px;transform:rotate(45deg);border-left-color:var(--nfi-accent);}
.nf-intro--signal .nf-intro__orb::after{border-radius:4px;width:46%;height:46%;transform:rotate(45deg);}
.nf-intro--signal::after{content:"";position:absolute;inset:-100% 0 0;pointer-events:none;opacity:.2;background:linear-gradient(transparent 48%,var(--nfi-accent) 50%,transparent 52%);transform:translateY(-100%);animation:nfi-scan var(--nfi-duration) linear both;}
/* Five-leaf grimoire intro: self-contained CSS artwork, no third-party assets. */
.nf-intro--grimoire{background:radial-gradient(ellipse at 50% 48%,#2a0d18 0%,#090508 37%,#030305 78%);}
.nf-intro--grimoire::before{background:radial-gradient(ellipse at 50% 40%,rgba(191,28,58,.23) 0,transparent 45%),radial-gradient(ellipse at 72% 77%,rgba(87,27,53,.17),transparent 34%);}
.nf-intro--grimoire .nf-intro__scene{gap:9px;animation:nfg-scene var(--nfi-duration) ease-in-out both;}
.nf-intro__grimoire{position:relative;width:210px;height:202px;perspective:950px;filter:drop-shadow(0 20px 28px #000a);animation:nfg-summon var(--nfi-duration) cubic-bezier(.15,.75,.3,1) both;}
.nfg-book{position:absolute;left:18px;top:9px;width:176px;height:180px;transform-style:preserve-3d;transform:rotate(-8deg) rotateY(-16deg);}
.nfg-back{position:absolute;left:32px;top:7px;width:139px;height:166px;background:linear-gradient(132deg,#3b1d27,#180e15 64%,#110a0e);border-radius:5px 10px 9px 4px;border:2px solid #67404e;box-shadow:0 0 0 4px #130c11,inset 0 0 0 5px #211018,0 17px 33px #000e;}
.nfg-pages{position:absolute;left:32px;top:12px;width:132px;height:153px;background:repeating-linear-gradient(to bottom,#e5dac7 0px,#d0bda5 2px,#e5dac7 3px);border-radius:3px 10px 9px 3px;box-shadow:5px 4px #6d5961,0 0 22px #da385331;transform:translateZ(4px);overflow:hidden;}
.nfg-pages::before{content:'✧ ✥ ✧\A ─────────\A ▽   ◇   ▽\A ─────────\A ✧ ✥ ✧';white-space:pre;position:absolute;inset:24px 0;text-align:center;font:15px/2 Georgia,serif;color:#844658;opacity:.64;}
.nfg-cover{position:absolute;left:32px;top:7px;width:139px;height:166px;transform-origin:left center;transform-style:preserve-3d;backface-visibility:visible;border-radius:5px 9px 10px 4px;border:2px solid #774252;background:linear-gradient(137deg,#41222c,#170c13 34%,#230f19 78%,#3a1923);box-shadow:inset 0 0 0 4px #13090e,inset 0 0 0 6px #6e3649,0 0 36px #c72f4636;animation:nfg-cover var(--nfi-duration) cubic-bezier(.2,.9,.3,1) both;}
.nfg-cover::before{content:'';position:absolute;inset:13px;border:1px solid #aa516044;pointer-events:none;}
.nfg-cover::after{content:'V';position:absolute;bottom:15px;left:50%;transform:translateX(-50%);font:18px Georgia,serif;color:#ad6976;opacity:.9;}
.nfg-spine{position:absolute;left:23px;top:7px;width:13px;height:166px;border-radius:7px 0 0 6px;background:linear-gradient(90deg,#32151e,#7e3b4c,#1a0b11);box-shadow:1px 1px 4px #000a;}
.nfg-emblem{position:absolute;left:50%;top:47%;width:79px;height:79px;transform:translate(-50%,-50%);border:1px solid #915466;border-radius:50%;box-shadow:0 0 24px #d04f6440,inset 0 0 10px #c13a4d3a;display:grid;place-items:center;}
.nfg-leaf{position:absolute;left:calc(50% - 8px);top:calc(50% - 24px);width:16px;height:29px;border:1px solid #cf7886;background:linear-gradient(#983447,#431d29);border-radius:75% 16% 65% 22%;transform-origin:8px 24px;transform:rotate(var(--turn));box-shadow:0 0 7px #d83f6149;}
.nfg-core{position:absolute;width:10px;height:10px;border-radius:50%;background:#c76378;box-shadow:0 0 16px #e3486d;}
.nfg-veil{position:absolute;z-index:2;inset:15px 0 0;display:grid;place-items:center;pointer-events:none;opacity:0;background:radial-gradient(ellipse,#e0476266,transparent 52%);filter:blur(16px);animation:nfg-flash var(--nfi-duration) ease-out both;}
.nfg-ember{position:absolute;z-index:3;left:calc(50% + var(--ex));top:calc(40% + var(--ey));width:var(--size);height:var(--size);border-radius:50%;background:var(--nfi-accent);box-shadow:0 0 9px var(--nfi-accent);opacity:0;pointer-events:none;animation:nfg-ember var(--nfi-duration) ease-out var(--delay) both;}
.nf-intro--grimoire .nf-intro__eyebrow{letter-spacing:.39em;font-size:9px;color:#c77d8b;}
.nf-intro--grimoire .nf-intro__title{font-family:Georgia,'Times New Roman',serif;font-size:clamp(21px,4vw,31px);letter-spacing:.32em;color:#e8d9de;}
.nf-intro--grimoire .nf-intro__caption{letter-spacing:.30em;font-size:9px;}
@keyframes nfg-summon{0%{opacity:0;transform:translateY(26px) scale(.7) rotate(-7deg);filter:blur(18px)}20%{opacity:1;filter:blur(0)}37%{transform:translateY(0) scale(1) rotate(0)}81%{opacity:1;filter:blur(0)}100%{opacity:.1;transform:translateY(-2px) scale(1.23);filter:blur(11px)}}
@keyframes nfg-cover{0%,20%{transform:rotateY(0deg)}50%,69%{transform:rotateY(-155deg)}82%,100%{transform:rotateY(-169deg)}}
@keyframes nfg-flash{0%,43%{opacity:0}57%{opacity:.74}72%{opacity:.18}100%{opacity:0}}
@keyframes nfg-ember{0%,37%{opacity:0;transform:translate(0,0) scale(.3)}53%{opacity:1}84%{opacity:.7}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.1)}}
@keyframes nfg-scene{0%,74%{opacity:1}100%{opacity:.3;transform:scale(1.035)}}

.nf-intro.nf-intro--closing{opacity:0;pointer-events:none;}
@keyframes nfi-glow{0%{opacity:0;transform:scale(.7)}65%{opacity:.8}100%{opacity:.42;transform:scale(1.1)}}
@keyframes nfi-rise{0%{opacity:0;transform:translateY(18px) scale(.68);filter:blur(10px)}50%{opacity:1;filter:blur(0)}100%{opacity:1;transform:none}}
@keyframes nfi-ring{0%{transform:rotate(-210deg) scale(.5);opacity:0}85%{opacity:1}100%{transform:rotate(105deg) scale(1)}}
@keyframes nfi-mark{0%{opacity:0;transform:scale(.45) rotate(-25deg)}65%{opacity:1}100%{transform:none}}
@keyframes nfi-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes nfi-spark{0%{opacity:0;transform:scale(.1)}45%{opacity:.95}100%{opacity:0;transform:translateY(-11px) scale(1.6)}}
@keyframes nfi-scan{from{transform:translateY(-90%)}to{transform:translateY(80%)}}
@media(prefers-reduced-motion:reduce){.nf-intro,.nf-intro *, .nf-intro::before, .nf-intro::after{animation:none!important;transition:none!important;}}
`;
  let introCurrent = null;
  function showIntro(host, theme, options={}) {
    introCurrent?.destroy();
    const t=normalized(theme);
    const reduce=!!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (!t.introEnabled || !t.animations || reduce || !host) return {destroy(){}};
    const preview=options.preview===true;
    let done=false, exitTimer=0, endTimer=0;
    const css=document.createElement('style');css.dataset.nightfallIntro='true';css.textContent=INTRO_CSS;
    document.head.append(css);
    const overlay=document.createElement('div');overlay.className='nf-intro nf-intro--'+t.introStyle;
    overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label','Nightfall 主题启动动画');overlay.setAttribute('aria-modal','true');
    overlay.style.setProperty('--nfi-base',t.base);
    overlay.style.setProperty('--nfi-text',t.text);
    overlay.style.setProperty('--nfi-accent',t.accent);
    overlay.style.setProperty('--nfi-muted',t.muted);
    overlay.style.setProperty('--nfi-line',rgba(t.accent,.32));
    overlay.style.setProperty('--nfi-glow',rgba(t.accent,.32));
    overlay.style.setProperty('--nfi-duration',t.introDuration+'ms');
    overlay.style.setProperty('position',preview?'absolute':'fixed','important');
    overlay.style.setProperty('inset','0','important');
    overlay.style.setProperty('z-index',preview?'45':'2147483646','important');
    const scene=document.createElement('div');scene.className='nf-intro__scene';
    let motif;
    if(t.introStyle==='grimoire'){
      const book=document.createElement('div');book.className='nf-intro__grimoire';
      const volume=document.createElement('div');volume.className='nfg-book';
      const back=document.createElement('div');back.className='nfg-back';
      const pages=document.createElement('div');pages.className='nfg-pages';
      const spine=document.createElement('div');spine.className='nfg-spine';
      const cover=document.createElement('div');cover.className='nfg-cover';
      const emblem=document.createElement('div');emblem.className='nfg-emblem';
      for(let i=0;i<5;i++){const leaf=document.createElement('span');leaf.className='nfg-leaf';leaf.style.setProperty('--turn',(i*72)+'deg');emblem.append(leaf);}
      const core=document.createElement('span');core.className='nfg-core';emblem.append(core);cover.append(emblem);
      volume.append(back,pages,spine,cover);book.append(volume);
      const veil=document.createElement('div');veil.className='nfg-veil';book.append(veil);motif=book;
    }else{
      const orb=document.createElement('div');orb.className='nf-intro__orb';
      const mark=document.createElement('span');mark.className='nf-intro__mark';mark.textContent=t.introStyle==='signal'?'◇':'✦';orb.append(mark);motif=orb;
    }
    const eyebrow=document.createElement('span');eyebrow.className='nf-intro__eyebrow';eyebrow.textContent=t.introStyle==='signal'?'SYSTEM INITIALIZED':t.introStyle==='grimoire'?'FIVE-LEAF · ANTI-MAGIC':'PERSONAL EXPERIENCE';
    const title=document.createElement('div');title.className='nf-intro__title';title.textContent=t.introName;
    const caption=document.createElement('span');caption.className='nf-intro__caption';caption.textContent=t.introStyle==='grimoire'?'THE NEXT CHAPTER BEGINS':'THE INTERFACE IS YOURS';
    const track=document.createElement('div');track.className='nf-intro__track';const progress=document.createElement('div');progress.className='nf-intro__progress';track.append(progress);
    scene.append(motif,eyebrow,title,caption,track);overlay.append(scene);
    if(t.introStyle==='stardust'){
      for(let i=0;i<24;i++){
        const star=document.createElement('span');star.className='nf-intro__spark';
        star.style.setProperty('--x',(11+(i*37)%78)+'%');star.style.setProperty('--y',(12+(i*47)%75)+'%');star.style.setProperty('--delay',(i%6*35)+'ms');
        overlay.append(star);
      }
    }
    if(t.introStyle==='grimoire'){
      for(let i=0;i<34;i++){
        const ember=document.createElement('span');ember.className='nfg-ember';
        const angle=i*2.3999632297;const radius=70+(i%7)*23;
        ember.style.setProperty('--ex',(Math.cos(angle)*28).toFixed(1)+'px');
        ember.style.setProperty('--ey',(Math.sin(angle)*25).toFixed(1)+'px');
        ember.style.setProperty('--dx',(Math.cos(angle)*radius).toFixed(1)+'px');
        ember.style.setProperty('--dy',(Math.sin(angle)*radius*.62).toFixed(1)+'px');
        ember.style.setProperty('--size',(1.3+i%4)+'px');
        ember.style.setProperty('--delay',((i%5)*17)+'ms');
        overlay.append(ember);
      }
    }
    const skip=document.createElement('button');skip.type='button';skip.className='nf-intro__skip';skip.textContent='跳过 ESC';skip.setAttribute('aria-label','跳过启动动画');skip.addEventListener('click',close);overlay.append(skip);
    function keydown(ev){if(ev.key==='Escape')close();}
    function destroy(){if(done)return;done=true;clearTimeout(endTimer);clearTimeout(exitTimer);document.removeEventListener('keydown',keydown,true);overlay.remove();css.remove();if(introCurrent===ctrl)introCurrent=null;}
    function close(){if(done)return;overlay.classList.add('nf-intro--closing');clearTimeout(endTimer);exitTimer=setTimeout(destroy,310);}
    const ctrl={destroy,close};introCurrent=ctrl;
    host.append(overlay);document.addEventListener('keydown',keydown,true);
    endTimer=setTimeout(close,t.introDuration);
    return ctrl;
  }
  function mount(theme) {
    unmount();const t=normalized(theme);
    document.documentElement.classList.add('nf-enabled');
    const style=document.createElement('style');style.id='nf-style';style.textContent=baseCSS(t);document.head.append(style);
    const backdrop=createBackdrop(document.body,t);
    active={style,backdrop};return active;
  }
  function unmount(){introCurrent?.destroy();if(!active)return;active.backdrop.destroy();active.style.remove();active=null;document.documentElement.classList.remove('nf-enabled');}
  global.NightfallEngine={DEFAULT,PRESETS,normalized,rgba,baseCSS,createBackdrop,showIntro,mount,unmount};
})(typeof window !== 'undefined' ? window : globalThis);
