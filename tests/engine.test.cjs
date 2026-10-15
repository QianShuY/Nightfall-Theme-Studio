const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname,'../shared/engine.js'),'utf8');
const global = { Number,Math,Map,Set,String,Array,Object,parseInt };
vm.createContext(global);
vm.runInContext(code,global);
const E=global.NightfallEngine;

test('preset registry has six themes',()=>assert.equal(Object.keys(E.PRESETS).length,6));
test('invalid colors cannot inject CSS',()=>{const t=E.normalized({accent:'#ffffff;body{display:none}',base:'url(javascript:bad)'});assert.equal(t.accent,E.DEFAULT.accent);assert.equal(t.base,E.DEFAULT.base);assert.equal(E.baseCSS(t).includes('javascript:bad'),false)});
test('range values are bounded',()=>{const t=E.normalized({radius:999,sidebarWidth:-4,darkness:'nan',particles:1000});assert.equal(t.radius,36);assert.equal(t.sidebarWidth,190);assert.equal(t.darkness,E.DEFAULT.darkness);assert.equal(t.particles,100)});
test('untrusted media is blocked',()=>{const t=E.normalized({image:'https://example.com/img.png',video:'data:text/html;base64,AAAA'});assert.equal(t.image,'');assert.equal(t.video,'')});
test('valid theme data survives normalization',()=>{const t=E.normalized(E.PRESETS.crimson);assert.equal(t.accent,'#EF6C83');assert.equal(t.bgType,'aurora')});
test('CSS includes class-based opt-in and fallback',()=>{const css=E.baseCSS(E.PRESETS.obsidian);assert.match(css,/html\.nf-enabled/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/nf-backdrop/)});

test('intro validation accepts safe configurations',()=>{const t=E.normalized({introStyle:'signal',introDuration:2200,introName:'Hello',introEnabled:false,introFrequency:'always'});assert.equal(t.introStyle,'signal');assert.equal(t.introDuration,2200);assert.equal(t.introName,'Hello');assert.equal(t.introEnabled,false);assert.equal(t.introFrequency,'always')});
test('intro rejects invalid styles and clamps long duration',()=>{const t=E.normalized({introStyle:'<img>',introDuration:999999,introName:'x'.repeat(100),introFrequency:'javascript:alert(1)'});assert.equal(t.introStyle,'eclipse');assert.equal(t.introDuration,3500);assert.equal(t.introName.length,36);assert.equal(t.introFrequency,'session')});

test('grimoire theme binds book animation and avoids remote media',()=>{const t=E.normalized(E.PRESETS.grimoire);assert.equal(t.introStyle,'grimoire');assert.equal(t.introDuration,2800);assert.equal(t.bgType,'stars');assert.equal(t.image,'');assert.equal(t.video,'');});
test('grimoire is an allowed intro style for custom themes',()=>{const t=E.normalized({introStyle:'grimoire',introName:'My ritual'});assert.equal(t.introStyle,'grimoire');assert.equal(t.introName,'My ritual')});
