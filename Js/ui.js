/* ============================================================
   RAJA HACKER PANEL — UI HELPERS
   ============================================================ */

import { $, $$, beep } from './core.js';

/* ---------- Matrix rain ---------- */
export function matrixRain(canvasId='matrix'){
  const cvs = document.getElementById(canvasId);
  if(!cvs) return;
  const ctx = cvs.getContext('2d');
  let w, h, cols, drops;
  const chars = 'アイウエオカキクケコサシスセソRAJA01<>{}[]#$%&@'.split('');

  function resize(){
    w = cvs.width  = innerWidth;
    h = cvs.height = innerHeight;
    cols = Math.floor(w / 14);
    drops = new Array(cols).fill(1);
  }
  resize();
  addEventListener('resize', resize);

  (function loop(){
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#00ff9c';
    ctx.font = '14px monospace';
    for(let i=0;i<cols;i++){
      const ch = chars[Math.floor(Math.random()*chars.length)];
      ctx.fillText(ch, i*14, drops[i]*14);
      if(drops[i]*14 > h && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    requestAnimationFrame(loop);
  })();
}

/* ---------- Terminal logger ---------- */
export class Terminal {
  constructor(elId){
    this.el = document.getElementById(elId);
    this.max = 300;
    if(this.el) this.el.textContent = '';
  }
  write(type, msg, ts=true){
    if(!this.el) return;
    const time = ts ? `<span class="t-time">[${new Date().toLocaleTimeString('en-GB',{hour12:false})}]</span> ` : '';
    const cls = { ok:'t-ok', err:'t-err', warn:'t-warn', info:'t-info' }[type] || '';
    const line = document.createElement('div');
    line.innerHTML = `${time}<span class="${cls}">${msg}</span>`;
    this.el.prepend(line);
    while(this.el.children.length > this.max) this.el.lastChild.remove();
  }
  clear(){ if(this.el) this.el.textContent = ''; }
}

/* ---------- Tab switcher ---------- */
export function initTabs(root='.tabs'){
  const bar = document.querySelector(root);
  if(!bar) return;
  bar.addEventListener('click', e => {
    const tab = e.target.closest('.tab'); if(!tab) return;
    $$('.tab', bar).forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    $$('[data-panel]').forEach(p => {
      p.style.display = (p.dataset.panel === target) ? '' : 'none';
    });
  });
}

/* ---------- Toast ---------- */
export function toast(msg, kind='ok'){
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {
    position:'fixed', bottom:'24px', right:'24px',
    background: kind==='err' ? '#1a0309' : '#031a0e',
    color:      kind==='err' ? '#ff2e63' : '#00ff9c',
    border:    `1px solid ${kind==='err'?'#ff2e63':'#00ff9c'}`,
    padding:'12px 18px', borderRadius:'6px',
    fontFamily:'monospace', fontSize:'13px',
    boxShadow:`0 0 20px ${kind==='err'?'#ff2e6355':'#00ff9c55'}`,
    zIndex:10000, animation:'fade .3s ease'
  });
  document.body.appendChild(t);
  beep(kind==='err'?220:880);
  setTimeout(() => t.remove(), 3200);
}

/* ---------- File parser ---------- */
export function parseRecipients(fileName, text){
  const list = [];
  if(fileName.endsWith('.json')){
    try{
      const j = JSON.parse(text);
      if(Array.isArray(j)){
        j.forEach(x => {
          if(typeof x === 'string') list.push(x.trim());
          else if(x && (x.id || x.psid)) list.push(String(x.id||x.psid).trim());
        });
      }
    }catch{}
  } else {
    text.split(/\r?\n/).forEach(line => {
      line = line.trim();
      if(!line || line.startsWith('#')) return;
      list.push(line.split(',')[0].trim());
    });
  }
  return [...new Set(list.filter(Boolean))];
        }
