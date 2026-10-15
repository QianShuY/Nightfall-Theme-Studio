/* Chromium MV3 content script; bundled with shared/engine.js. */
(()=>{
  'use strict';
  const E=globalThis.NightfallEngine;
  if(!E||!globalThis.chrome?.storage?.local)return;
  function apply(data){if(data.enabled===false){E.unmount();return;}E.mount(E.normalized(data.theme||E.PRESETS.obsidian))}
  chrome.storage.local.get(['theme','enabled'],apply);
  chrome.storage.onChanged.addListener((changes,area)=>{
    if(area!=='local'||(!changes.theme&&!changes.enabled))return;
    chrome.storage.local.get(['theme','enabled'],apply);
  });
})();
