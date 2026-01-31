// Clean module for customize editor — moved out of HTML to avoid exposing inline code

// Helper to get query param
function getParam(name){
  const p = new URLSearchParams(window.location.search);
  return p.get(name);
}

function normalizeImageUrl(url){
  if(!url) return '';
  return url.replace(/^\.\.\//, '/Public/').replace(/^\./, '/Public/');
}

const illId = getParam('illId');
const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
const tint = document.getElementById('tint');
const tintOpacity = document.getElementById('tintOpacity');
const scaleInput = document.getElementById('scale');
const titleEl = document.getElementById('ill-title');

let img = new Image();
let originalW = canvas.width, originalH = canvas.height;
let currentScale = 1;

async function loadIllustrationById(id){
  try{
    const res = await fetch('./json/illustrations.json');
    const data = await res.json();
    const item = data.illustrations.find(x => String(x.id) === String(id));
    if(!item){ titleEl.innerText = 'Illustration not found'; return; }
    titleEl.innerText = item.title;
    const src = normalizeImageUrl(item.url || '');
    if(src.toLowerCase().endsWith('.svg')){
      showEditorLoader();
      try{
        const r = await fetch(src);
        if(!r.ok) throw new Error('SVG fetch failed');
        const svgText = await r.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgEl = doc.documentElement;
        svgEl.setAttribute('preserveAspectRatio','xMidYMid meet');
        document.getElementById('svg-wrap').innerHTML = '';
        const wrapper = document.getElementById('svg-wrap');
        wrapper.appendChild(svgEl);
        wrapper.style.display = 'flex';
        canvas.style.display = 'none';
        hideEditorLoader();
        setupSvgControls(svgEl);
      }catch(e){ titleEl.innerText = 'Failed to load SVG'; hideEditorLoader(); }
      return;
    }

    showEditorLoader();
    canvas.style.display = 'block';
    document.getElementById('svg-wrap').style.display = 'none';
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = ()=> {
      const cw = canvas.width; const ch = canvas.height;
      const ar = img.width / img.height;
      let dw = cw; let dh = cw / ar;
      if(dh > ch){ dh = ch; dw = ch * ar; }
      originalW = dw; originalH = dh;
      currentScale = parseFloat(scaleInput.value) || 1;
      draw();
      hideEditorLoader();
    };
    img.onerror = ()=>{ titleEl.innerText = 'Failed to load image'; hideEditorLoader(); };
    img.src = src;
  }catch(e){ titleEl.innerText = 'Error loading data'; }
}

function showEditorLoader(){ const l = document.getElementById('editor-loader'); if(l) l.style.display = 'flex'; }
function hideEditorLoader(){ const l = document.getElementById('editor-loader'); if(l) l.style.display = 'none'; }
function clear(){ ctx.clearRect(0,0,canvas.width,canvas.height); }

function draw(){
  clear();
  const dw = originalW * currentScale; const dh = originalH * currentScale;
  const x = (canvas.width - dw) / 2; const y = (canvas.height - dh) / 2;
  ctx.drawImage(img, x, y, dw, dh);
  const color = tint.value || '#ffffff';
  const op = parseFloat(tintOpacity.value) || 0;
  if(op > 0){ ctx.fillStyle = color; ctx.globalAlpha = op; ctx.fillRect(x, y, dw, dh); ctx.globalAlpha = 1; }
}

// controls wiring
if(tint) tint.addEventListener('input', draw);
if(tintOpacity) tintOpacity.addEventListener('input', draw);
if(scaleInput) scaleInput.addEventListener('input', ()=>{ currentScale = parseFloat(scaleInput.value); draw(); });

const downloadBtn = document.getElementById('download');
if(downloadBtn) downloadBtn.addEventListener('click', ()=>{
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a'); a.href = url; a.download = (titleEl.innerText || 'illustration') + '.png'; document.body.appendChild(a); a.click(); a.remove();
});

const openBtn = document.getElementById('open-in-library');
if(openBtn) openBtn.addEventListener('click', ()=>{ if(!illId) return; window.location.href = `/Public/p/home.html?illId=${illId}`; });

if(illId){ loadIllustrationById(illId); } else { titleEl.innerText = 'No illustration selected. Use ?illId=<id> in URL.'; }

// SVG utilities
function setupSvgControls(svgEl){
  const svgOptions = document.getElementById('svg-options');
  const downloadSvgBtn = document.getElementById('download-svg');
  if(svgOptions) svgOptions.style.display = 'block';
  if(downloadSvgBtn) downloadSvgBtn.style.display = 'inline-block';

  // collect unique fills
  const fills = new Map();
  svgEl.querySelectorAll('[fill]').forEach(el => {
    const f = el.getAttribute('fill');
    if(!f || f === 'none' || f.startsWith('url(')) return;
    if(!fills.has(f)) fills.set(f, []);
    fills.get(f).push(el);
  });

  const colorMapping = document.getElementById('color-mapping');
  if(colorMapping) colorMapping.innerHTML = '';
  let idx = 0;
  fills.forEach((els, orig) => {
    const row = document.createElement('div');
    row.style.display = 'flex'; row.style.alignItems = 'center'; row.style.gap = '8px'; row.style.marginTop = '6px';
    const swatch = document.createElement('div'); swatch.style.width='28px'; swatch.style.height='20px'; swatch.style.borderRadius='6px'; swatch.style.background=orig; swatch.style.border='1px solid #ddd';
    const input = document.createElement('input'); input.type='color'; input.value = normalizeColorForInput(orig) || '#ffffff'; input.style.marginLeft='6px';
    const label = document.createElement('div'); label.innerText = `Color ${++idx}`; label.style.fontSize='0.85rem'; label.style.color='#334155';
    input.oninput = ()=>{ const v = input.value; els.forEach(e=> e.setAttribute('fill', v)); swatch.style.background = v; };
    row.appendChild(swatch); row.appendChild(input); row.appendChild(label);
    colorMapping.appendChild(row);
  });

  const bgColor = document.getElementById('bg-color');
  if(bgColor) bgColor.oninput = ()=>{ const wrap = document.querySelector('.canvas-wrap'); if(wrap) wrap.style.background = bgColor.value; };

  const strokeWidth = document.getElementById('stroke-width');
  if(strokeWidth) strokeWidth.oninput = ()=>{ svgEl.querySelectorAll('[stroke]').forEach(el=> el.setAttribute('stroke-width', strokeWidth.value)); };

  if(downloadSvgBtn) downloadSvgBtn.onclick = ()=>{
    const svgStr = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgStr], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = (titleEl.innerText||'illustration') + '.svg'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  // download PNG from inline svg
  const down = document.getElementById('download');
  if(down) down.onclick = ()=>{
    const svgStr = new XMLSerializer().serializeToString(svgEl);
    const canvasEl = document.createElement('canvas');
    const vb = svgEl.viewBox.baseVal;
    const w = vb && vb.width ? vb.width : svgEl.clientWidth || 800;
    const h = vb && vb.height ? vb.height : svgEl.clientHeight || 600;
    canvasEl.width = w; canvasEl.height = h;
    const img2 = new Image();
    img2.onload = ()=>{
      const ctx2 = canvasEl.getContext('2d'); ctx2.fillStyle = (document.querySelector('.canvas-wrap').style.background || '#ffffff'); ctx2.fillRect(0,0,w,h);
      ctx2.drawImage(img2,0,0,w,h);
      const url = canvasEl.toDataURL('image/png'); const a = document.createElement('a'); a.href = url; a.download = (titleEl.innerText||'illustration') + '.png'; document.body.appendChild(a); a.click(); a.remove();
    };
    img2.onerror = ()=>{ alert('Failed to rasterize SVG for PNG export.'); };
    img2.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
  };
}

function normalizeColorForInput(c){
  try{ if(/^#/.test(c)) return c; const ctx = document.createElement('canvas').getContext('2d'); ctx.fillStyle = c; return ctx.fillStyle; }catch(e){ return '#ffffff'; }
}
