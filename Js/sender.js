/* ============================================================
   RAJA HACKER PANEL — SENDER ENGINE
   Rate-limited, retry, backoff, safe-stop
   ============================================================ */

import { bus, sleep, retry, RateLimiter, uid } from './core.js';

export class Sender {
  constructor(){
    this.running = false;
    this.paused  = false;
    this.index   = 0;
    this.sent    = 0;
    this.failed  = 0;
    this.total   = 0;
    this.rate    = new RateLimiter(1);   // 1 msg per second default
    this.delayMs = 5000;
    this.token   = '';
    this.text    = '';
    this.list    = [];
    this.logs    = [];
    this._ctrl   = null;
  }

  configure({ token, text, delayMs, retries, list }){
    this.token = token;
    this.text  = text;
    this.delayMs = Math.max(1200, delayMs);
    this.retries = Math.max(0, retries|0);
    this.list = [...list];
    this.total = this.list.length;
    // rate: 1 per delayMs
    this.rate.setRate(1000 / this.delayMs);
  }

  _log(type, msg, psid){
    const entry = { id: uid('log'), t: Date.now(), type, msg, psid };
    this.logs.push(entry);
    bus.emit('log', entry);
  }

  async _sendOne(psid){
    const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${encodeURIComponent(this.token)}`;
    const body = {
      recipient: { id: psid },
      messaging_type: 'RESPONSE',
      message: { text: this.text }
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if(data.error) throw new Error(data.error.message || 'FB API error');
    return data;
  }

  async start(){
    if(this.running) return;
    if(!this.token) throw new Error('API token missing');
    if(!this.text)  throw new Error('Message text missing');
    if(!this.list.length) throw new Error('Recipient list empty');

    this.running = true;
    this.paused  = false;
    this._log('info', `▶ Engine started • ${this.total} targets • delay ${this.delayMs}ms`);

    this._ctrl = { stopped:false };

    for(this.index = 0; this.index < this.list.length; this.index++){
      if(this._ctrl.stopped) break;
      while(this.paused) await sleep(200);

      const psid = this.list[this.index];
      if(!psid) continue;

      await this.rate.take();

      try{
        await retry(
          () => this._sendOne(psid),
          {
            tries: this.retries + 1,
            base: 900,
            onRetry: (e, n, w) => this._log('warn',
              `↻ retry ${n}/${this.retries} for ${psid} in ${Math.round(w)}ms — ${e.message}`, psid)
          }
        );
        this.sent++;
        this._log('ok', `✔ delivered → ${psid}`, psid);
      }catch(e){
        this.failed++;
        this._log('err', `�’ failed → ${psid} — ${e.message}`, psid);
      }

      bus.emit('progress', {
        index: this.index + 1,
        total: this.total,
        sent: this.sent,
        failed: this.failed
      });
    }

    this.running = false;
    this._log('info', `■ Engine finished • sent=${this.sent} failed=${this.failed}`);
    bus.emit('done', { sent: this.sent, failed: this.failed });
  }

  stop(){
    if(!this.running) return;
    this._ctrl && (this._ctrl.stopped = true);
    this._log('warn', '⏹ Stop signal received');
  }

  pause(){ this.paused = true;  this._log('warn','⏸ Paused');  }
  resume(){ this.paused = false; this._log('info','⏵ Resumed'); }
}
