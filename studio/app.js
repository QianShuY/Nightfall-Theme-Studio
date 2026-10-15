(()=>{
  'use strict';
  const E=window.NightfallEngine;
  const $=(s)=>document.querySelector(s);
  const $$=(s)=>Array.from(document.querySelectorAll(s));
  const NAMESPACE='nightfall.studio.v1';
  const BRIDGE=location.protocol==='http:' && location.hostname==='127.0.0.1';
  let bridgeReady=false;const assetUrls=new Map();
  const SECTIONS={themes:['主题库','创造你的 <em>ChatGPT.</em>','挑选一个起点，再把它变成自己的作品。'],appearance:['外观编辑','细节定义 <em>气质.</em>','从配色到材质，每一层都有自己的表达。'],background:['动态背景','让背景 <em>呼吸.</em>','用微光、星云或私藏影像填满你的空间。'],intro:['启动动画','第一眼的 <em>仪式感.</em>','专属启动标识、光晕动效、节奏与播放策略。'],layout:['布局细节','更适合你的 <em>节奏.</em>','从字距到界面宽度，精调每个细节。']};
  function read(){try{const v=JSON.parse(localStorage.getItem(NAMESPACE)||'{}');return v && typeof v==='object'?v:{}}catch{return {}}}
  const saved=read();
  let t=E.normalized(saved.theme||E.PRESETS.obsidian);
  let customs=Array.isArray(saved.customs)?saved.customs.filter(x=>x && typeof x==='object').slice(0,24).map(E.normalized):[];
  let selectedPage='themes';let backdrop;let noticeTimer;let introView;
  const portable=(o)=>({...o,image:'',video:''});
  const persist=()=>{try{localStorage.setItem(NAMESPACE,JSON.stringify({theme:portable(t),customs:customs.map(portable)}))}catch{toast('本地存储不可写；请检查浏览器隐私模式')}};
  const dbPromise=new Promise(resolve=>{
    if(!globalThis.indexedDB)return resolve(null);
    let request;try{request=indexedDB.open('nightfall-media-v04',1)}catch{return resolve(null)}
    request.onupgradeneeded=()=>request.result.createObjectStore('media');
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve(null);
  });
  async function mediaOp(mode,key,value){const db=await dbPromise;if(!db)throw new Error('浏览器不支持本地媒体存储');return new Promise((resolve,reject)=>{const tx=db.transaction('media',mode==='get'?'readonly':'readwrite');const req=tx.objectStore('media')[mode](...(mode==='get'?[key]:[value,key]));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});}
  async function rehydrate(input){const next=E.normalized(input);const kind=next.bgType;
    if(['image','video'].includes(kind)&&next.mediaKey){
      try{let url=assetUrls.get(next.mediaKey);if(!url){const file=await mediaOp('get',next.mediaKey);if(file){url=URL.createObjectURL(file);assetUrls.set(next.mediaKey,url)}}
      if(url)next[kind]=url;}catch{toast('本地媒体读取失败；请重新选择图片或视频')}
    }return next;}
  async function bridgeRequest(path,body,headers={}){const r=await fetch(path,{method:'POST',headers:{'X-Nightfall-Client':'studio',...headers},body});let x;try{x=await r.json()}catch{throw new Error('本地服务没有响应')}if(!r.ok)throw new Error(x.error||'操作失败');return x}
  async function connect(){if(!BRIDGE){toast('请通过「安装并启动Nightfall.bat」打开，离线预览不能连接客户端');return false;}
    try{const data=await bridgeRequest('/api/install',new Blob([]));bridgeReady=!!data.tweakInstalled;setBridgeStatus(data);toast('插件文件已安装。首次使用请重启已支持的 ChatGPT 客户端');return true;}
    catch(e){toast(e.message);return false;}}
  function setBridgeStatus(x){const badge=$('#bridge-status');if(!badge)return;badge.textContent=!BRIDGE?'○ 离线预览':x?.tweakInstalled?'● 插件已安装（未验证生效）':x?.runtimeDetected?'◐ 需要连接插件':'○ 桌面运行时未安装';badge.title='官方客户端无公开换肤 API，桌面模式依赖第三方注入运行时。';const hint=$('#compat-hint');if(hint)hint.textContent=!BRIDGE?'当前是离线预览。要尝试应用到 Windows ChatGPT，请双击项目根目录「安装并启动Nightfall.bat」。':x?.tweakInstalled?'Nightfall 插件已复制到本机。点击「一键应用」，再查看 ChatGPT 客户端是否真的生效；需要时重启客户端。':x?.runtimeDetected?'检测到运行时目录，但还没有 Nightfall 插件。点击「连接客户端」再一键应用。':'未检测到兼容第三方插件运行时：官方 Windows 客户端没有公开的换肤 API，暂时只能预览。点击右下角「查看安装方式」了解要求。'}
  async function disableClient(){
    if(!BRIDGE){toast('请使用本地主题管理器');return;}
    try{await bridgeRequest('/api/disable',new Blob([]));toast('✓ 已发送恢复默认外观指令，请检查客户端');}
    catch(e){toast('恢复失败：'+e.message)}
  }
  async function applyToClient(){if(!BRIDGE){toast('请双击「安装并启动Nightfall.bat」使用一键应用功能');return}
    $('#apply-client').disabled=true;
    try{
      if(!bridgeReady && !(await connect()))return;
      const cfg=portable(t);const kind=t.bgType;
      if(['image','video'].includes(kind)&&t.mediaKey){
        const file=await mediaOp('get',t.mediaKey);if(!file)throw new Error('请重新选择背景素材');
        toast('正在保存本地媒体，文件较大时可能需要一些时间…');
        const result=await bridgeRequest('/api/media?kind='+kind,file,{'Content-Type':'application/octet-stream','X-Nightfall-Mime':file.type||kind+'/octet-stream'});
        cfg.mediaKey=result.mediaKey;cfg.mediaName=t.mediaName;cfg.mediaMime=t.mediaMime||file.type;
        if(result.mediaKey!==t.mediaKey){await mediaOp('put',result.mediaKey,file);t.mediaKey=result.mediaKey;persist();}
      }
      const res=await bridgeRequest('/api/apply',JSON.stringify(cfg),{'Content-Type':'application/json'});
      toast('✓ 已写入皮肤配置，请查看 ChatGPT；未实机验证，不代表已成功换肤');
      $('#apply-client').textContent='✓ 已发送到客户端';setTimeout(()=>$('#apply-client').textContent='✦ 一键应用到 ChatGPT',3500);
    }catch(e){toast('应用失败：'+e.message)}finally{$('#apply-client').disabled=false}
  }
  if(BRIDGE){fetch('/api/status').then(r=>r.json()).then(x=>{bridgeReady=x.tweakInstalled;setBridgeStatus(x)}).catch(()=>setBridgeStatus(null));} else queueMicrotask(()=>setBridgeStatus(null));
  function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.classList.remove('visible'),3300)}
  async function setTheme(next){introView?.destroy();t=await rehydrate(next);persist();render();}
  function update(k,v){t=E.normalized({...t,[k]:v,id:t.id||'custom'});persist();applyPreview();syncOutputs(k);}
  function swatches(){const all=[...Object.values(E.PRESETS),...customs];$('#theme-strip').replaceChildren(...all.map(p=>{const btn=document.createElement('button');btn.className='theme-card'+(p.id===t.id?' active':'');btn.dataset.id=p.id;btn.style.setProperty('--theme-highlight',E.rgba(p.accent,.48));btn.style.setProperty('--theme-base',p.base);btn.style.setProperty('--theme-accent',p.accent);btn.innerHTML='<span class="art"></span><span class="theme-abstract">✦</span><strong></strong><small></small><span class="chosen"></span>';btn.querySelector('strong').textContent=p.name;btn.querySelector('small').textContent=customs.some(c=>c.id===p.id)?'CUSTOM THEME':'NIGHTFALL PRESET';btn.querySelector('.chosen').textContent=p.id===t.id?'✓':'';btn.addEventListener('click',()=>setTheme(p));return btn;}));$('#custom-list').replaceChildren(...customs.map(p=>{const b=document.createElement('button');b.className='saved-theme'+(p.id===t.id?' active':'');b.textContent='◈  '+p.name;b.onclick=()=>setTheme(p);return b}));}
  const range=(key,name,min,max,unit='',step='1')=>`<div class="control" data-bind="${key}"><div class="control-head"><label for="range-${key}">${name}</label><output>${t[key]}${unit}</output></div><input type="range" id="range-${key}" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${t[key]}"/></div>`;
  const color=(key,name)=>`<div class="control" data-bind="${key}"><div class="control-head"><label for="color-${key}">${name}</label></div><div class="color-input"><input type="color" data-key="${key}" id="color-${key}" value="${t[key]}"/><small>${t[key].toUpperCase()}</small></div></div>`;
  const toggle=(key,name,desc)=>`<div class="switch-row"><div><b>${name}</b><small>${desc}</small></div><button class="toggle ${t[key]?'on':''}" data-toggle="${key}" role="switch" aria-checked="${t[key]}" aria-label="${name}"></button></div>`;
  const section=(name,body)=>`<section class="control-section"><h3>${name}</h3>${body}</section>`;
  function formForPage(){
    if(selectedPage==='themes') return section('QUICK CUSTOMIZATION',color('accent','主题强调色')+range('glass','玻璃透明度',0,95,'%')+range('darkness','背景暗化',0,100,'%'))+section('BEHAVIOR',toggle('animations','播放动态效果','关闭可减少性能消耗')+toggle('glassEnabled','玻璃质感','为浮层添加柔和透明效果'))+section('PRESET ACTIONS','<div class="inspector-actions"><button class="inspector-action" data-action="save">＋ 保存自定义主题</button><button class="inspector-action" data-action="reset">↶ 重置当前主题</button></div>');
    if(selectedPage==='appearance') return section('COLOR PALETTE',color('accent','强调色')+color('base','画布底色')+color('surface','容器底色')+color('text','主要文字')+color('muted','次要文字')+color('border','边框颜色'))+section('MATERIAL',range('glass','透明度',0,95,'%')+range('radius','圆角半径',0,36,'px')+toggle('glassEnabled','玻璃拟态','主界面容器半透明'));
    if(selectedPage==='background')return section('BACKGROUND ENGINE','<div class="control"><div class="control-head"><label for="background-kind">背景类型</label></div><select class="select-control" id="background-kind" data-key="bgType"><option value="aurora">Aurora / 流动极光</option><option value="stars">Starfield / 星点</option><option value="gradient">Gradient / 静态渐变</option><option value="image">Image / 自定义图片</option><option value="video">Video / 自定义视频</option><option value="none">None / 纯色</option></select></div><div class="control"><div class="control-head"><label>自定义素材</label></div><div class="option-grid"><button id="upload-image">＋ 上传图片</button><button id="upload-video">＋ 上传视频</button></div><p class="small-note">支持选择本地图片和视频，不设 5MB 限额；大文件保存在浏览器 IndexedDB，应用时复制到本机插件目录。能否播放取决于 Chromium 对编码的支持。</p></div>'+range('darkness','遮罩浓度',0,100,'%')+range('blur','背景模糊',0,30,'px'))+section('MOTION SYSTEM',range('speed','动态速度',0,100,'%')+range('particles','星点数量',0,100,'')+toggle('animations','动态效果','尊重系统“减少动态效果”设置'));
    if(selectedPage==='intro')return section('STARTUP SEQUENCE',
      toggle('introEnabled','显示启动动画','在客户端启动、渲染器加载后播放')+
      '<div class="control"><div class="control-head"><label for="intro-style">动画风格</label></div><select class="select-control" id="intro-style" data-key="introStyle"><option value="eclipse">Eclipse / 月蚀光环</option><option value="stardust">Stardust / 星尘凝聚</option><option value="signal">Signal / 科技信号</option><option value="grimoire">Grimoire / 魔导书觉醒</option></select></div>'+
      '<div class="control"><div class="control-head"><label for="intro-name">启动页文字</label></div><input id="intro-name" class="name-input" type="text" maxlength="36" autocomplete="off" placeholder="NIGHTFALL" /></div>'+
      range('introDuration','播放时长',800,3500,'ms','100')+
      '<div class="control"><div class="control-head"><label for="intro-frequency">播放频率</label></div><select class="select-control" id="intro-frequency" data-key="introFrequency"><option value="session">每个窗口会话一次</option><option value="always">每次渲染器加载</option></select></div>')+
      section('LIVE TEST', '<div class="inspector-actions"><button class="inspector-action" id="replay-inspector">▶ 预览启动动画</button></div><p class="small-note">这是载入后的视觉过渡，不是 Windows 原生启动屏。支持点击跳过或按 ESC。系统开启减少动画时会跳过。</p>');
    return section('LAYOUT & SPACING',range('sidebarWidth','侧边栏宽度',190,330,'px')+range('chatWidth','对话内容宽度',560,1120,'px')+range('fontSize','字体大小',12,19,'px')+range('radius','组件圆角',0,36,'px'))+section('DENSITY',toggle('compact','紧凑模式','收紧侧边栏留白')+toggle('glassEnabled','容器透明','适配背景透出'));
  }
  function syncOutputs(k){const control=$(`[data-bind="${k}"]`);if(!control)return;const o=control.querySelector('output');if(o){const s=control.querySelector('input');o.textContent=t[k]+(s?.id==='range-blur'?'px':s?.id==='range-radius'?'px':s?.id==='range-fontSize'?'px':s?.id==='range-sidebarWidth'?'px':s?.id==='range-chatWidth'?'px':['glass','darkness','speed'].includes(k)?'%':'');}const small=control.querySelector('small');if(small)small.textContent=t[k].toUpperCase()}
  function editor(){const body=$('#inspector-body');body.innerHTML=formForPage();const sel=body.querySelector('#background-kind');if(sel)sel.value=t.bgType;body.querySelectorAll('input[data-key]').forEach(inp=>inp.addEventListener('input',ev=>update(inp.dataset.key,inp.type==='color'?inp.value:Number(inp.value))));if(sel)sel.addEventListener('change',()=>{update('bgType',sel.value);});const introStyle=body.querySelector('#intro-style');if(introStyle){introStyle.value=t.introStyle;introStyle.onchange=()=>update('introStyle',introStyle.value)}const introFrequency=body.querySelector('#intro-frequency');if(introFrequency){introFrequency.value=t.introFrequency;introFrequency.onchange=()=>update('introFrequency',introFrequency.value)}const introName=body.querySelector('#intro-name');if(introName){introName.value=t.introName;introName.addEventListener('change',()=>update('introName',introName.value))}body.querySelector('#replay-inspector')?.addEventListener('click',replayIntro);body.querySelectorAll('button[data-toggle]').forEach(b=>b.onclick=()=>{update(b.dataset.toggle,!t[b.dataset.toggle]);b.classList.toggle('on',t[b.dataset.toggle]);b.setAttribute('aria-checked',String(t[b.dataset.toggle]))});body.querySelector('#upload-image')?.addEventListener('click',()=>$('#image-file').click());body.querySelector('#upload-video')?.addEventListener('click',()=>$('#video-file').click());body.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>b.dataset.action==='save'?saveCustom():reset()));}
  function replayIntro(){introView?.destroy();introView=E.showIntro($('#preview'),t,{preview:true});if(!t.introEnabled || !t.animations)toast('请先开启启动动画与动态效果');}
  function applyPreview(){const pv=$('#preview');pv.style.setProperty('--pv-accent',t.accent);pv.style.setProperty('--pv-text',t.text);pv.style.setProperty('--pv-surface',t.surface);pv.style.setProperty('--pv-edge',t.border);pv.style.setProperty('--pv-glass',String(t.glassEnabled ? .32+(100-t.glass)/180 : .95));pv.style.setProperty('--pv-radius',t.radius+'px');pv.style.fontSize=t.fontSize+'px';const sidebar=pv.querySelector('.mock-sidebar');sidebar.style.width=Math.max(19,Math.min(34,t.sidebarWidth/10))+'%';pv.querySelector('.mock-chat').style.paddingTop=t.compact?'6px':'10px';pv.querySelector('.mock-scroll').style.maxWidth=Math.max(65,Math.min(95,t.chatWidth/10))+'%';backdrop?.destroy();backdrop=E.createBackdrop(pv,t,{preview:true});$('#active-name').textContent=t.name;}
  function render(){const [,title,desc]=SECTIONS[selectedPage];$('#page-title').innerHTML=title;$('#page-description').textContent=desc;$('#crumb-page').textContent=SECTIONS[selectedPage][0];$('#editor-title').textContent=SECTIONS[selectedPage][0];$$('.navitem').forEach(el=>el.classList.toggle('selected',el.dataset.page===selectedPage));swatches();editor();applyPreview();}
  function reset(){const preset=E.PRESETS[t.id]||E.PRESETS.obsidian;setTheme(preset);toast('已恢复主题默认设置');}
  function saveCustom(){const name=prompt('给新主题取个名字：',t.name+' Custom');if(name===null)return;const safe=name.trim().slice(0,60);if(!safe){toast('主题名称不能为空');return}const copy=E.normalized({...t,name:safe,id:'custom-'+Date.now()});customs=[copy,...customs].slice(0,24);setTheme(copy);toast('新主题已保存到本地主题库');}
  function exportTheme(){const blob=new Blob([JSON.stringify({...portable(t),exportedBy:'Nightfall Theme Studio 0.4',note:'Custom background media is local-only; reselect it on another computer.'},null,2)],{type:'application/json'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='nightfall-'+(t.name.toLowerCase().replace(/[^a-z0-9-]+/g,'-')||'theme')+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);toast('主题文件已导出');}
  function importTheme(){ $('#import-file').click(); }
  function handleImport(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const raw=JSON.parse(String(r.result));if(!raw||typeof raw!=='object'||(!raw.accent&&!raw.base)){throw new Error('bad theme')}const copy=E.normalized({...raw,id:'custom-'+Date.now(),name:raw.name||'Imported Theme'});customs=[copy,...customs].slice(0,24);setTheme(copy);toast('主题导入成功')}catch{toast('无效主题文件：需要 Nightfall 主题 JSON')}};r.readAsText(file);}
  async function handleMedia(file,type){if(!file)return;
    const ext=file.name.toLowerCase();
    const supported=file.type.startsWith(type+'/') || (type==='image'?/\.(png|jpg|jpeg|webp|gif|avif|bmp)$/i:/\.(mp4|webm|mov|mkv|avi)$/i).test(ext);
    if(!supported){toast('请选择图片或视频文件');return}
    try{
      const key='local-'+(globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(16).slice(2)).replace(/[^a-f0-9-]/g,'').slice(0,48);
      await mediaOp('put',key,file);
      const url=URL.createObjectURL(file);assetUrls.set(key,url);
      await setTheme({...t,image:'',video:'',[type]:url,bgType:type,mediaKey:key,mediaMime:file.type||type+'/octet-stream',mediaName:file.name});
      toast('✓ 已在本地预览背景。点击「一键应用到 ChatGPT」才会尝试应用到客户端。');
    }catch(e){
      const url=URL.createObjectURL(file);await setTheme({...t,image:'',video:'',[type]:url,bgType:type,mediaKey:'',mediaName:file.name});
      toast('浏览器本地空间不足，暂时只能预览。可重启工具后重试。');
    }
  }
  $$('.navitem').forEach(b=>b.addEventListener('click',()=>{selectedPage=b.dataset.page;render()}));
  $('#replay-intro').onclick=replayIntro;
  $('#apply-client').onclick=applyToClient;
  $('#disable-client').onclick=disableClient;
  $('#connect-client').onclick=connect;
  for(const s of ['#export','#export-top','#export-inspector'])$(s).addEventListener('click',exportTheme);
  for(const s of ['#import-inspector','#import-rail'])$(s).addEventListener('click',importTheme);
  $('#save').onclick=saveCustom;$('#reset').onclick=reset;
  $('#import-file').onchange=e=>{handleImport(e.target.files?.[0]);e.target.value=''};
  $('#image-file').onchange=e=>{handleMedia(e.target.files?.[0],'image');e.target.value=''};
  $('#video-file').onchange=e=>{handleMedia(e.target.files?.[0],'video');e.target.value=''};
  $('#toggle-motion').onclick=()=>{update('animations',!t.animations);editor();toast(t.animations?'已启用动态效果':'已关闭动态效果')};
  $$('.preview-switch button[data-screen]').forEach(b=>b.onclick=()=>{$$('.preview-switch button[data-screen]').forEach(x=>x.classList.toggle('active',x===b));$('#preview').classList.toggle('compact',b.dataset.screen==='compact')});
  $('#open-instructions').onclick=()=>$('#help-dialog').showModal();$('#close-dialog').onclick=$('#close-dialog-bottom').onclick=()=>$('#help-dialog').close();
  render();
  if(t.mediaKey)rehydrate(t).then(next=>{t=next;applyPreview()});
})();
