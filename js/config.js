/* ============================================================
   RAJA HACKER PANEL — CONFIG MODULE
   ============================================================ */

import { DB, bus, safeJSON } from './core.js';

const KEY = 'raja_config_v1';

export const DEFAULTS = {
  headerName: 'RAJA TERMINAL',
  ownerName:  'RAJA',
  name:       '',
  lastName:   '',
  apiToken:   '',
  msgText:    'Hello from Raja Terminal 👾',
  time:       5,
  retries:    3,
  batch:      10,
  sound:      true,
  theme:      'matrix'
};

export const Config = {
  data: { ...DEFAULTS },
  _ready: false,

  async init(){
    if(this._ready) return;
    const stored = safeJSON(localStorage.getItem(KEY), null);
    if(stored) Object.assign(this.data, stored);
    // fallback: also try IndexedDB (backup)
    try{
      const dbRec = await DB.get('config', 'main');
      if(dbRec && dbRec.data) Object.assign(this.data, dbRec.data);
    }catch{}
    this._ready = true;
    bus.emit('config:loaded', this.data);
  },

  async set(patch){
    Object.assign(this.data, patch);
    localStorage.setItem(KEY, JSON.stringify(this.data));
    try{ await DB.put('config', { id:'main', data:this.data }); }catch{}
    bus.emit('config:changed', this.data);
  },

  get(k){ return this.data[k]; },

  async reset(){
    this.data = { ...DEFAULTS };
    await this.set({});
    bus.emit('config:reset', this.data);
  }
};
