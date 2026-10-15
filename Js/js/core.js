/* ============================================================
   RAJA HACKER PANEL — CORE MODULE
   Utilities + IndexedDB + Event Bus + Rate Limiter
   ============================================================ */

export const $  = (s, r=document) => r.querySelector(s);
export const $$ = (s, r=document) => [...r.querySelectorAll(s)];

/* ---------- Tiny Event Bus ---------- */
export class Bus {
  constructor(){ this.map = new Map(); }
  on(evt, fn){
    if(!this.map.has(evt)) this.map.set(evt, new Set());
    this.map.get(evt).add(fn);
    return () => this.map.get(evt).delete(fn);
  }
  emit(evt, data){
    this.map.get(evt)?.forEach(fn => {
      try{ fn(data); }catch(e){ console.error(e); }
    });
  }
}
export const bus = new Bus();

/* ---------- Clock ---------- */
export const now = () => new Date().toLocaleTimeString('en-GB', {hour12:false});

/* ---------- Sleep ---------- */
export const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- ID Generator ---------- */
export const uid = (p='id') =>
  p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);

/* ---------- Safe JSON ---------- */
export function safeJSON(str, fallback = null){
  try { return JSON.parse(str); } catch { return fallback; }
}

/* ---------- IndexedDB wrapper ---------- */
const DB_NAME = 'raja_hacker_panel';
const DB_VER  = 1;

export const DB = {
  _p: null,
  open(){
    if(this._p) return this._p;
    this._p = new Promise((res, rej) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if(!db.objectStoreNames.contains('config'))
          db.createObjectStore('config', { keyPath: 'id' });
        if(!db.objectStoreNames.contains('recipients'))
          db.createObjectStore('recipients', { keyPath: 'id', autoIncrement: true });
        if(!db.objectStoreNames.contains('logs'))
          db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
      };
      req.onsuccess = () => res(req.result);
      req.onerror   = () => rej(req.error);
    });
    return this._p;
  },
  async put(store, val){
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, 'readwrite');
      const r  = tx.objectStore(store).put(val);
      r.onsuccess = () => res(r.result);
      r.onerror   = () => rej(r.error);
    });
  },
  async get(store, key){
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, 'readonly');
      const r  = tx.objectStore(store).get(key);
      r.onsuccess = () => res(r.result);
      r.onerror   = () => rej(r.error);
    });
  },
  async all(store){
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, 'readonly');
      const r  = tx.objectStore(store).getAll();
      r.onsuccess = () => res(r.result);
      r.onerror   = () => rej(r.error);
    });
  },
  async clear(store){
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, 'readwrite');
      const r  = tx.objectStore(store).clear();
      r.onsuccess = () => res();
      r.onerror   = () => rej(r.error);
    });
  }
};

/* ---------- Rate Limiter (token bucket) ---------- */
export class RateLimiter {
  constructor(perSec = 1){ this.perSec = perSec; this.tokens = perSec; this.last = Date.now(); }
  setRate(perSec){ this.perSec = perSec; }
  async take(){
    while(true){
      const now = Date.now();
      const add = (now - this.last) / 1000 * this.perSec;
      if(add > 0){ this.tokens = Math.min(this.perSec, this.tokens + add); this.last = now; }
      if(this.tokens >= 1){ this.tokens -= 1; return; }
      await sleep(80);
    }
  }
}

/* ---------- Retry with backoff ---------- */
export async function retry(fn, { tries=3, base=800, onRetry } = {}){
  let lastErr;
  for(let i=0;i<tries;i++){
    try { return await fn(); }
    catch(e){
      lastErr = e;
      if(i < tries-1){
        const wait = base * Math.pow(2, i) + Math.random()*300;
        onRetry?.(e, i+1, wait);
        await sleep(wait);
      }
    }
  }
  throw lastErr;
}

/* ---------- Token mask ---------- */
export const mask = t => !t ? '' : t.slice(0,6) + '••••••' + t.slice(-4);

/* ---------- Sound alert ---------- */
export function beep(freq=880, dur=90){
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = freq; o.type = 'square';
    o.connect(g); g.connect(ctx.destination);
    g.gain.value = 0.03;
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, dur);
  }catch{}
}
