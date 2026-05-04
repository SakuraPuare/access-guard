import type { UserIdentity } from './core'

interface RuntimeIdentitySource {
  global?: string
  globals?: string[]
  endpoint?: string
  timeoutMs?: number
}

export interface GuardScriptOptions {
  identity?: Partial<UserIdentity>
  blocklist: string[]
  silent: boolean
  runtime?: RuntimeIdentitySource | false
}

export function generateDenialHtml(keyword: string, silent: boolean): string {
  const detail = silent
    ? ''
    : `<div style="margin-top:24px;padding:12px 20px;background:#252526;border:1px solid #3c3c3c;border-radius:6px;font-size:12px;color:#858585;font-family:'SF Mono','Fira Code','Cascadia Code',Consolas,monospace">
        Matched policy keyword: <span style="color:#f14c4c">${escapeHtml(keyword)}</span>
      </div>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Access Denied</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#1e1e1e;color:#ccc;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,system-ui,sans-serif}
</style>
</head>
<body>
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f14c4c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
  <h1 style="font-size:24px;font-weight:600;color:#f14c4c;margin-top:24px;margin-bottom:8px">Access Denied</h1>
  <p style="font-size:14px;color:#858585;max-width:400px;text-align:center;line-height:1.5">You are not authorized to use this application.</p>
  ${detail}
</body>
</html>`
}

/** Generate an inline script that checks available identity at runtime before app code runs. */
export function generateGuardScript(
  identityOrOptions: Partial<UserIdentity> | GuardScriptOptions,
  blocklist?: string[],
  silent?: boolean,
): string {
  const options = Array.isArray(blocklist)
    ? { identity: identityOrOptions as Partial<UserIdentity>, blocklist, silent: Boolean(silent) }
    : (identityOrOptions as GuardScriptOptions)

  const runtime = options.runtime === false ? false : options.runtime || {}
  const runtimeGlobals = normalizeRuntimeGlobals(runtime)
  const timeoutMs = typeof runtime === 'object' && runtime.timeoutMs ? runtime.timeoutMs : 700

  return `<script>
(function(){
  var buildIdentity=${JSON.stringify(options.identity || {})};
  var blocklist=${JSON.stringify(options.blocklist.map(k => k.trim().toLowerCase()).filter(Boolean))};
  var denialHtml=${JSON.stringify(generateDenialHtml('__KW__', options.silent))};
  var runtimeGlobals=${JSON.stringify(runtimeGlobals)};
  var endpoint=${JSON.stringify(typeof runtime === 'object' ? runtime.endpoint || '' : '')};
  var timeoutMs=${JSON.stringify(timeoutMs)};

  function deny(keyword){
    document.open();
    document.write(denialHtml.replace('__KW__', keyword));
    document.close();
  }

  function match(identity){
    if(!identity) return '';
    var values=[];
    if(Array.isArray(identity)) values=identity;
    else if(typeof identity==='object'){
      for(var key in identity){
        if(Object.prototype.hasOwnProperty.call(identity,key)) values.push(identity[key]);
      }
    } else values=[identity];

    for(var i=0;i<blocklist.length;i++){
      for(var j=0;j<values.length;j++){
        var value=values[j];
        if(value==null) continue;
        if(String(value).toLowerCase().indexOf(blocklist[i])!==-1) return blocklist[i];
      }
    }
    return '';
  }

  function readBrowserIdentity(){
    var nav=window.navigator||{};
    var screen=window.screen||{};
    var timezone='';
    try { timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||''; } catch (_) {}
    return {
      userAgent: nav.userAgent||'',
      platform: nav.platform||'',
      language: nav.language||'',
      languages: Array.isArray(nav.languages)?nav.languages.join(','):'',
      hardwareConcurrency: nav.hardwareConcurrency?String(nav.hardwareConcurrency):'',
      deviceMemory: nav.deviceMemory?String(nav.deviceMemory):'',
      maxTouchPoints: nav.maxTouchPoints?String(nav.maxTouchPoints):'',
      vendor: nav.vendor||'',
      timezone: timezone,
      screen: screen.width&&screen.height ? String(screen.width)+'x'+String(screen.height) : '',
      colorDepth: screen.colorDepth?String(screen.colorDepth):'',
      pixelDepth: screen.pixelDepth?String(screen.pixelDepth):'',
      devicePixelRatio: window.devicePixelRatio?String(window.devicePixelRatio):'',
      host: window.location&&window.location.host||''
    };
  }

  function readGlobalIdentity(){
    for(var i=0;i<runtimeGlobals.length;i++){
      var current=window;
      var parts=runtimeGlobals[i].split('.');
      for(var j=0;j<parts.length&&current;j++) current=current[parts[j]];
      if(current){
        if(typeof current==='function'){
          try { current=current(); } catch (_) { current=null; }
        }
        if(current) return Promise.resolve(current);
      }
    }
    return Promise.resolve(null);
  }

  function fetchIdentity(){
    if(!endpoint||!window.fetch) return Promise.resolve(null);
    var controller=window.AbortController?new AbortController():null;
    var timer=controller?setTimeout(function(){ controller.abort(); }, timeoutMs):null;
    return fetch(endpoint,{credentials:'same-origin',cache:'no-store',signal:controller&&controller.signal})
      .then(function(response){ return response&&response.ok?response.json():null; })
      .catch(function(){ return null; })
      .then(function(value){ if(timer) clearTimeout(timer); return value; });
  }

  var matched=match(buildIdentity)||match(readBrowserIdentity());
  if(matched){ deny(matched); return; }

  Promise.resolve()
    .then(readGlobalIdentity)
    .then(function(identity){
      matched=match(identity);
      if(matched){ deny(matched); return null; }
      return fetchIdentity();
    })
    .then(function(identity){
      if(!identity) return;
      matched=match(identity);
      if(matched) deny(matched);
    });
})();
</script>`
}

function normalizeRuntimeGlobals(runtime: RuntimeIdentitySource | false): string[] {
  if (runtime === false) return []

  const globals = [
    ...(runtime.globals || []),
    runtime.global || '',
    'accessGuardIdentity',
    'electronAccessGuardIdentity',
    'apolloAccessGuardIdentity',
  ]

  return [...new Set(globals.map(value => value.trim()).filter(Boolean))]
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
