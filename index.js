<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>༒ⓂⓇ ⓈⓊⓇⒶⒿ🩵༈Panel</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin:0; font-family: Arial, sans-serif;
    background:#0b1220; color:#e2e8f0;
    display:flex; justify-content:center; padding:30px;
  }
  .wrap {
    width:100%; max-width:560px;
    background:#131c31; padding:26px;
    border-radius:16px; box-shadow:0 10px 30px #0008;
    border:1px solid #1f2a44;
  }
  .head {
    display:flex; justify-content:space-between;
    align-items:center; margin-bottom:18px;
  }
  h1 { margin:0; font-size:20px; color:#38bdf8; }
  .owner {
    font-size:12px; color:#94a3b8;
    background:#0b1220; padding:5px 10px; border-radius:20px;
    border:1px solid #1f2a44;
  }
  label { display:block; margin:14px 0 6px; font-size:13px; color:#94a3b8; }
  input, textarea {
    width:100%; padding:11px;
    background:#0b1220; color:#e2e8f0;
    border:1px solid #2a3654; border-radius:8px;
    outline:none; font-size:14px;
  }
  textarea { min-height:80px; resize:vertical; font-family:monospace; }
  .row { display:flex; gap:10px; flex-wrap:wrap; margin-top:20px; }
  button, a.btn {
    padding:11px 18px; border:none; border-radius:8px;
    cursor:pointer; font-weight:bold; text-decoration:none;
    display:inline-block; font-size:14px;
  }
  #startBtn { background:#22c55e; color:#052e16; }
  #stopBtn  { background:#ef4444; color:#fff; }
  a.btn     { background:#38bdf8; color:#082f49; }
  #status { margin-top:14px; font-weight:bold; color:#facc15; }
  .note {
    margin-top:16px; font-size:12px; color:#fca5a5;
    background:#2a0f14; padding:10px; border-radius:8px;
    border:1px solid #7f1d1d; line-height:1.5;
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="head">
    <h1 id="pageTitle">༒ⓂⓇ ⓈⓊⓇⒶⒿ🩵༈Panel</h1>
    <span class="owner">Owner:༒ⓂⓇ ⓈⓊⓇⒶⒿ🩵༈ </span>
  </div>

  <label>Header Name</label>
  <input id="headerName" value="༒ⓂⓇ ⓈⓊⓇⒶⒿ🩵༈" placeholder="Header name">

  <label>Owner Name</label>
  <input id="ownerName" value="༒ⓂⓇ ⓈⓊⓇⒶⒿ🩵༈" placeholder="Owner name">

  <label>Name here</label>
  <input id="name" placeholder="Name">

  <label>Last name</label>
  <input id="lastName" placeholder="Last name">

  <label>API Token paste (Page Access Token)</label>
  <textarea id="apiToken" placeholder="EAAB..."></textarea>

  <label>Message text (nonstop bhejne wala message)</label>
  <textarea id="msgText" placeholder="Hello! Ye demo message hai."></textarea>

  <label>Time (delay between messages, seconds)</label>
  <input id="time" type="number" value="5" min="1">

  <label>Import file (recipients list — .json / .csv / .txt)</label>
  <input id="importFile" type="file" accept=".json,.csv,.txt">

  <div class="row">
    <button id="startBtn">Start</button>
    <button id="stopBtn">Stop</button>
    <a class="btn" href="dashboard.html" target="_blank">Dashboard Live</a>
  </div>

  <p id="status">Status: stopped</p>

  <div class="note">
    ⚠️ Sirf opted-in users (jinhone page ko message kiya ho, 24h window) ko bhejo.
    Warna Facebook page ban kar dega. Ye tool rate-limit ke saath hai.
  </div>
</div>

<script>
const KEY = '༒ⓂⓇ ⓈⓊⓇⒶⒿ🩵༈_messenger_data';
const fields = ['headerName','ownerName','name','lastName','apiToken','msgText','time'];

function collect() {
  const o = {};
  fields.forEach(f => o[f] = document.getElementById(f).value);
  return o;
}
function save(){ localStorage.setItem(KEY, JSON.stringify(collect())); }
function load(){
  const d = JSON.parse(localStorage.getItem(KEY) || '{}');
  fields.forEach(f => { if (d[f] !== undefined) document.getElementById(f).value = d[f]; });
  document.getElementById('pageTitle').textContent = d.headerName || 'Raja Messenger Panel';
}

fields.forEach(f => {
  document.getElementById(f).addEventListener('input', e => {
    save();
    if (f === 'headerName') document.getElementById('pageTitle').textContent = e.target.value;
  });
});

document.getElementById('importFile').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      let recipients = [];
      const txt = reader.result;

      if (file.name.endsWith('.json')) {
        const j = JSON.parse(txt);
        recipients = Array.isArray(j) ? j.map(x => typeof x === 'string' ? x : (x.id || x.psid)) : [];
      } else {
        txt.split('\n').forEach(line => {
          line = line.trim();
          if (line) recipients.push(line.split(',')[0].trim());
        });
      }
      recipients = recipients.filter(Boolean);
      localStorage.setItem('༒ⓂⓇ ⓈⓊⓇⒶⒿ🩵༈_recipients', JSON.stringify(recipients));
      alert(recipients.length + ' recipients import ho gaye!');
    } catch (err) { alert('File error: ' + err.message); }
  };
  reader.readAsText(file);
});

document.getElementById('startBtn').onclick = () => {
  localStorage.setItem('raja_running','true');
  save();
  updateStatus();
};
document.getElementById('stopBtn').onclick = () => {
  localStorage.setItem('raja_running','false');
  save();
  updateStatus();
};
function updateStatus(){
  const r = localStorage.getItem('༒ⓂⓇ ⓈⓊⓇⒶⒿ🩵༈_running') === 'true';
  document.getElementById('status').textContent = 'Status: ' + (r ? 'running' : 'stopped');
}
window.addEventListener('storage', updateStatus);
load();
updateStatus();
</script>
</body>
</html>
