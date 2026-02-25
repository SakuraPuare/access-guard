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

/** Generate an inline script that checks identity at runtime in the browser */
export function generateGuardScript(
  identity: { osUsername: string; gitName: string; gitEmail: string },
  blocklist: string[],
  silent: boolean,
): string {
  return `<script>
(function(){
  var id=${JSON.stringify([identity.osUsername, identity.gitName, identity.gitEmail])};
  var bl=${JSON.stringify(blocklist.map(k => k.trim().toLowerCase()).filter(Boolean))};
  for(var i=0;i<bl.length;i++){
    for(var j=0;j<id.length;j++){
      if(id[j]&&id[j].toLowerCase().indexOf(bl[i])!==-1){
        document.open();
        document.write(${JSON.stringify(generateDenialHtml('__KW__', silent))}.replace('__KW__',bl[i]));
        document.close();
        return;
      }
    }
  }
})();
</script>`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
