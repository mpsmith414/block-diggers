// A grown-up's corner on the title screen: a small save-disk button that
// opens a panel to download the whole game as a file, or load one back (on a
// new computer, or after the browser was cleared). Plain HTML over the game,
// used with a mouse.

import { exportText, importText, backupFileName, latestBackup } from '../save/backup.js';
import { saveState } from '../save/save.js';

const BTN = 'font:600 15px system-ui,sans-serif;padding:10px 16px;border-radius:10px;border:2px solid #8a5a34;background:#fff6e0;color:#4a3222;cursor:pointer;margin:6px 6px 0 0;';

function ago(ms) {
  const m = Math.round(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} hour${h === 1 ? '' : 's'} ago`;
  return `${Math.round(h / 24)} days ago`;
}

export function createBackupPanel({ doc = document, win = window, getState }) {
  const storage = (() => { try { return win.localStorage; } catch { return undefined; } })();
  const button = doc.createElement('button');
  button.id = 'backup-button';
  button.title = 'Game backup';
  button.textContent = '💾';
  button.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:30;width:44px;height:44px;border-radius:50%;border:2px solid #8a5a34;background:#f4e4c1;font-size:22px;cursor:pointer;opacity:.8;';

  const panel = doc.createElement('div');
  panel.id = 'backup-panel';
  panel.style.cssText = 'position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;background:rgba(20,12,30,.55);';
  const card = doc.createElement('div');
  card.style.cssText = 'background:#f4e4c1;border:3px solid #8a5a34;border-radius:14px;padding:20px 24px;max-width:420px;font:15px/1.5 system-ui,sans-serif;color:#4a3222;';
  card.innerHTML = `
    <div style="font-weight:700;font-size:18px;margin-bottom:6px">💾 Game backup</div>
    <div>Save a copy of the whole game (every planet, sticker and build) as a file. Load it back here, or on another computer.</div>
    <div id="backup-auto" style="margin-top:8px;color:#7a5a3a;font-size:13px"></div>
    <div style="margin-top:10px">
      <button id="backup-download" style="${BTN}">⬇ Download a backup</button>
      <button id="backup-load" style="${BTN}">⬆ Load a backup…</button>
      <button id="backup-close" style="${BTN}">Close</button>
    </div>
    <div id="backup-msg" style="margin-top:10px;font-size:13px;min-height:18px"></div>
    <input id="backup-file" type="file" accept=".json,application/json" style="display:none">`;
  panel.appendChild(card);
  doc.body.append(button, panel);

  const $ = (id) => card.querySelector(`#${id}`);
  const say = (text, bad = false) => { $('backup-msg').textContent = text; $('backup-msg').style.color = bad ? '#b0302a' : '#3a7a2a'; };
  const open = () => {
    const auto = latestBackup(storage);
    $('backup-auto').textContent = auto ? `Automatic backup: ${ago(Date.now() - auto.time)}` : 'Automatic backup: not yet (it starts once you play)';
    say('');
    panel.style.display = 'flex';
  };
  const close = () => { panel.style.display = 'none'; };

  // (blur, so the space bar goes back to the game, not this button)
  button.addEventListener('click', () => { button.blur(); open(); });
  $('backup-close').addEventListener('click', close);
  panel.addEventListener('click', (e) => { if (e.target === panel) close(); });
  $('backup-download').addEventListener('click', () => {
    const blob = new Blob([exportText(getState())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = doc.createElement('a');
    a.href = url;
    a.download = backupFileName();
    doc.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    say('Downloaded. Keep the file somewhere safe.');
  });
  $('backup-load').addEventListener('click', () => $('backup-file').click());
  $('backup-file').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const r = importText(await file.text());
    if (r.error) {
      say("That file isn't a Block Diggers backup.", true);
      return;
    }
    const s = r.state;
    const stickers = Object.keys(s.stickers ?? {}).length;
    if (!win.confirm(`Load this backup? (${s.trips ?? 0} trips, ${stickers} stickers)\n\nIt replaces the game on this computer.`)) return;
    if (!saveState(storage, s)) {
      say("Couldn't save it here (is storage turned off?).", true);
      return;
    }
    say('Loaded! Starting it up…');
    setTimeout(() => win.location.reload(), 600);
  });

  return {
    destroy() {
      button.remove();
      panel.remove();
    },
  };
}
