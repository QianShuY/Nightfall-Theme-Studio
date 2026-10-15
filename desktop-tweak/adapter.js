/* Nightfall renderer tweak adapter. Bundled with shared/engine.js into index.js. */
(function () {
  'use strict';
  const E = globalThis.NightfallEngine;
  const ID = 'nightfall-tweak-studio';
  let theme = E.PRESETS.obsidian;
  let reg = null;
  let apiRef = null;
  let mutationObserver = null;
  let lastShell = null;
  let intro = null;
  function use(t) {
    theme = E.normalized(t);
    if (apiRef) apiRef.storage.set('theme', theme);
    if (apiRef) apiRef.storage.set('enabled', true);
    intro?.destroy();
    E.mount(theme);
    tagRoot();
  }
  function tagRoot(){
    if (!document.querySelector('html.nf-enabled')) return;
    // Only cosmetic styling; no changes to message content, events, or network.
    const s = document.querySelector('[data-testid="sidebar"]') || document.querySelector('aside');
    if (s && s !== lastShell) lastShell = s;
  }
  function create(tag,attrs={},text){const x=document.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(k==='className')x.className=v;else if(k==='type')x.type=v;else x.setAttribute(k,v)}if(text!==undefined)x.textContent=text;return x}
  function btn(label,onClick){const b=create('button',{type:'button'},label);b.style.cssText='border:1px solid #434555;background:#232634;color:#f1f0ff;border-radius:9px;padding:8px 12px;cursor:pointer;font-size:12px;';b.addEventListener('click',onClick);return b}
  function txt(root,label,desc){const p=create('div');p.style.cssText='margin:18px 0 8px;color:var(--color-token-text-primary,#eceef5);font-size:13px;font-weight:650';p.textContent=label;root.append(p);if(desc){const d=create('div');d.style.cssText='font-size:11px;color:var(--color-token-text-secondary,#999db1);margin-bottom:9px';d.textContent=desc;root.append(d)}}
  function row(root,label,control){const r=create('div');r.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:14px;padding:8px 0;font-size:12px';r.append(create('span',{},label),control);root.append(r)}
  function number(root,key,label,min,max,step){const input=create('input',{type:'range',min:String(min),max:String(max),step:String(step||1)});input.value=String(theme[key]);input.style.cssText='width:45%;accent-color:'+theme.accent;input.addEventListener('input',()=>use({...theme,[key]:Number(input.value)}));row(root,label,input)}
  function picker(root,key,label){const input=create('input',{type:'color'});input.value=theme[key];input.addEventListener('input',()=>use({...theme,[key]:input.value}));row(root,label,input)}
  function download(){const data=new Blob([JSON.stringify(theme,null,2)],{type:'application/json'});const a=create('a');a.href=URL.createObjectURL(data);a.download='nightfall-theme.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),800)}
  function uploadTheme(){const input=create('input',{type:'file',accept:'.json,application/json'});input.onchange=async()=>{const f=input.files?.[0];if(!f||f.size>9e6)return;try{const x=JSON.parse(await f.text());if(x&&typeof x==='object'&&(x.accent||x.base))use({...x,id:x.id||'imported'});else alert('主题格式不正确')}catch{alert('无法读取 JSON 主题')}};input.click()}
  function background(kind){const input=create('input',{type:'file',accept:kind==='image'?'image/png,image/jpeg,image/webp':'video/mp4,video/webm'});input.onchange=()=>{const f=input.files?.[0];if(!f)return;if(f.size>5e6){alert('媒体文件请小于 5MB');return}const reader=new FileReader();reader.onload=()=>{use({...theme,bgType:kind,[kind]:String(reader.result)});alert('背景已应用')};reader.readAsDataURL(f)};input.click()}
  function buildPage(root){
    root.replaceChildren();root.style.cssText='max-width:660px;margin:auto;padding:12px 2px 30px';
    const title=create('h2',{},'Nightfall Theme Studio');title.style.cssText='font-weight:680;font-size:21px;margin:0 0 8px';root.append(title);
    const desc=create('p',{},'Windows / Renderer Theme · 实时修改 · 离线存储');desc.style.cssText='font-size:12px;color:#9e9fb0;margin-bottom:15px';root.append(desc);
    txt(root,'主题预设','预设以外的编辑内容通过导入 JSON 保留');
    const selects=create('div');selects.style.cssText='display:flex;gap:7px;flex-wrap:wrap';for(const p of Object.values(E.PRESETS)){selects.append(btn(p.name,()=>use(p)))}root.append(selects);
    txt(root,'视觉参数');picker(root,'accent','强调色');picker(root,'base','背景色');picker(root,'surface','浮层色');number(root,'darkness','背景暗化',0,100);number(root,'glass','玻璃透明度',0,95);number(root,'radius','圆角大小',0,36);number(root,'fontSize','字体大小',12,19);number(root,'sidebarWidth','侧边栏宽度',190,330);number(root,'chatWidth','聊天内容宽度',560,1120);number(root,'particles','粒子数量',0,100);
    txt(root,'背景引擎');const types=create('select');types.style.cssText='padding:9px;background:#202230;color:#eee;border:1px solid #4b4c59;border-radius:7px';for(const [val,label] of [['aurora','动态极光'],['stars','星空'],['gradient','渐变'],['image','自定义图片'],['video','自定义视频'],['none','纯色']]){const opt=create('option',{value:val},label);types.append(opt)}types.value=theme.bgType;types.onchange=()=>use({...theme,bgType:types.value});row(root,'背景类型',types);
    const media=create('div');media.style.cssText='display:flex;gap:8px;flex-wrap:wrap';media.append(btn('上传背景图片',()=>background('image')),btn('上传背景视频',()=>background('video')));root.append(media);
    txt(root,'启动动画','加载到界面后播放，可随时跳过；并非 Windows 原生应用启动屏');
    const introOn=create('input',{type:'checkbox'});introOn.checked=theme.introEnabled;introOn.onchange=()=>use({...theme,introEnabled:introOn.checked});row(root,'启动动画开关',introOn);
    const introStyles=create('select');introStyles.style.cssText='padding:8px;background:#202230;color:#eee;border:1px solid #4b4c59;border-radius:7px';for(const [v,l] of [['eclipse','月蚀光环'],['stardust','星尘凝聚'],['signal','科技信号'],['grimoire','魔导书觉醒']]){introStyles.append(create('option',{value:v},l))}introStyles.value=theme.introStyle;introStyles.onchange=()=>use({...theme,introStyle:introStyles.value});row(root,'启动风格',introStyles);
    number(root,'introDuration','时长（毫秒）',800,3500,100);
    const introName=create('input',{type:'text',maxlength:'36'});introName.value=theme.introName;introName.style.cssText='padding:8px;background:#202230;color:#eee;border:1px solid #4b4c59;border-radius:7px;max-width:50%';introName.onchange=()=>use({...theme,introName:introName.value});row(root,'启动文字',introName);
    const introFrequency=create('select');introFrequency.style.cssText=introStyles.style.cssText;for(const [v,l] of [['session','每个窗口会话一次'],['always','每次渲染器加载']])introFrequency.append(create('option',{value:v},l));introFrequency.value=theme.introFrequency;introFrequency.onchange=()=>use({...theme,introFrequency:introFrequency.value});row(root,'播放频率',introFrequency);
    root.append(btn('▶ 预览启动动画',()=>{intro?.destroy();intro=E.showIntro(document.body,theme)}));
    txt(root,'主题文件','可从 studio/index.html 离线主题编辑器导出 JSON');const actions=create('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:8px';actions.append(btn('导入主题',uploadTheme),btn('导出主题',download),btn('关闭主题（恢复）',()=>{apiRef.storage.set('enabled',false);intro?.destroy();E.unmount()}),btn('重新启用',()=>use(theme)));root.append(actions);
    const warning=create('p',{},'注意：Nightfall 并非 OpenAI 官方功能，可能因客户端版本变化而失效。关闭主题只撤销本插件创建的样式，不修改原始客户端文件。');warning.style.cssText='color:#aaaabb;font-size:11px;line-height:1.75;margin-top:22px';root.append(warning);
  }
  module.exports={
    start(api){
      if(api.process!=='renderer')return;
      apiRef=api;
      theme=E.normalized(api.storage.get('theme',E.PRESETS.obsidian));
      if(api.storage.get('enabled',true)){
        E.mount(theme);
        let shouldShow=theme.introEnabled;
        if(theme.introFrequency==='session'){
          try{const k='nightfall-intro-v2-shown';shouldShow=shouldShow && sessionStorage.getItem(k)!=='1';if(shouldShow)sessionStorage.setItem(k,'1')}catch{/* sessionStorage may be blocked */}
        }
        if(shouldShow)intro=E.showIntro(document.body,theme);
      }
      reg=api.settings?.registerPage({id:'nightfall',title:'Nightfall Studio',description:'动态背景 · 自定义皮肤',render(root){buildPage(root)}});
      mutationObserver=new MutationObserver(()=>tagRoot());mutationObserver.observe(document.documentElement,{childList:true,subtree:true});
    },
    stop(){intro?.destroy();intro=null;mutationObserver?.disconnect();mutationObserver=null;reg?.unregister?.();reg=null;E.unmount();apiRef=null;lastShell=null}
  };
})();
