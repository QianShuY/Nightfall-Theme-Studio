(()=>{
'use strict';
const PRESETS={obsidian:{name:'Obsidian Glass',accent:'#8A9EF4',base:'#080A0F',bgType:'aurora'},crimson:{name:'Crimson Void',accent:'#EF6C83',base:'#080608',bgType:'aurora'},nebula:{name:'Ghost Neon',accent:'#8B80FF',base:'#080715',bgType:'stars'},polar:{name:'Polar Mist',accent:'#62D8C9',base:'#061012',bgType:'gradient'},mono:{name:'Monochrome',accent:'#E8E8E8',base:'#070707',bgType:'none'}};
const $=s=>document.querySelector(s);let theme={};let enabled=true;
function sync(){const k=Object.keys(PRESETS).find(k=>PRESETS[k].name===theme.name);document.querySelectorAll('#presets button').forEach(b=>b.classList.toggle('on',b.dataset.key===k));$('#accent').value=/^#[0-9a-f]{6}$/i.test(theme.accent)?theme.accent:'#8A9EF4';$('#background').value=theme.bgType||'aurora';$('#enable').checked=enabled;}
function store(){chrome.storage.local.set({theme,enabled});sync();}
chrome.storage.local.get(['theme','enabled'],s=>{theme=s.theme||{...PRESETS.obsidian};enabled=s.enabled!==false;sync()});
for(const [key,t] of Object.entries(PRESETS)){const b=document.createElement('button');b.dataset.key=key;b.textContent=t.name;b.onclick=()=>{theme={...theme,...t,id:key};store()};$('#presets').append(b)}
$('#enable').onchange=e=>{enabled=e.target.checked;store()};$('#accent').oninput=e=>{theme.accent=e.target.value;store()};$('#background').onchange=e=>{theme.bgType=e.target.value;store()};
$('#import').onclick=()=>$('#file-json').click();$('#export').onclick=()=>{const blob=new Blob([JSON.stringify(theme,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='nightfall-theme.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),600)};
$('#image').onclick=()=>$('#file-image').click();$('#video').onclick=()=>$('#file-video').click();
$('#file-json').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const obj=JSON.parse(await f.text());if(!obj||typeof obj!=='object'||(!obj.accent&&!obj.base))throw new Error();theme=obj;enabled=true;store();$('#status').textContent='✓ 主题导入成功'}catch{$('#status').textContent='导入失败：不是有效的 Nightfall JSON'}e.target.value=''};
for(const kind of ['image','video'])$('#file-'+kind).onchange=e=>{const f=e.target.files?.[0];if(!f)return;const accepted=kind==='image'?['image/png','image/jpeg','image/webp']:['video/mp4','video/webm'];if(!accepted.includes(f.type)){$('#status').textContent='文件类型不支持';return}const r=new FileReader();r.onload=()=>{theme[kind]=r.result;theme.bgType=kind;enabled=true;store();$('#status').textContent='✓ 自定义背景已经应用'};r.readAsDataURL(f);e.target.value=''};
})();
