// A grown-up's corner on the title screen: a small save-disk button that
// opens a panel to download the whole game as a file, or load one back (on a
// new computer, or after the browser was cleared). Plain HTML over the game,
// used with a mouse.

import { exportText, importText, backupFileName, latestBackup } from '../save/backup.js';
import { saveState } from '../save/save.js';

// (the game's own palette, from DESIGN.md: Book Page buttons on a Parchment
// card with a Saddle Leather rim; the main action is Go Green)
const BTN = 'font:600 15px system-ui,sans-serif;padding:10px 16px;border-radius:8px;border:2px solid #8a5a34;background:#f8ecd0;color:#4a3222;cursor:pointer;margin:6px 6px 0 0;box-shadow:2px 3px 0 rgba(0,0,0,.2);';
const GO = 'background:#4cc24a;border-color:#2f8f34;color:#fff;';
const STYLE = `<style>
  #backup-panel button:hover { filter: brightness(1.05); transform: translateY(-1px); }
  #backup-panel button:focus-visible { outline: 3px solid #f5c629; outline-offset: 2px; }
  #backup-panel button:active { transform: translateY(1px); box-shadow: none; }
</style>`;

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
  button.setAttribute('aria-label', 'Game backup');
  button.textContent = '💾';
  // (on a phone the bottom-right is the A button, so it sits top-left instead)
  const coarse = !!win.matchMedia?.('(pointer: coarse)').matches;
  const corner = coarse ? 'left:12px;top:10px;' : 'right:12px;bottom:12px;';
  button.style.cssText = `position:fixed;${corner}z-index:30;width:44px;height:44px;border-radius:50%;border:2px solid #8a5a34;background:#f4e4c1;font-size:22px;cursor:pointer;opacity:.8;`;

  const panel = doc.createElement('div');
  panel.id = 'backup-panel';
  panel.style.cssText = 'position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;background:rgba(20,12,30,.55);';
  const card = doc.createElement('div');
  card.style.cssText = 'background:#f4e4c1;border:4px solid #8a5a34;border-radius:10px;padding:20px 24px;max-width:420px;font:15px/1.5 system-ui,sans-serif;color:#4a3222;box-shadow:4px 6px 0 rgba(0,0,0,.25);';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-label', 'Game backup');
  card.innerHTML = `${STYLE}
    <div style="font-weight:700;font-size:18px;margin-bottom:6px">💾 Game backup</div>
    <div>Save a copy of the whole game (every planet, sticker and build) as a file. Load it back here, or on another computer.</div>
    <div id="backup-auto" style="margin-top:8px;color:#4a3222;font-size:14px"></div>
    <div style="margin-top:10px">
      <button id="backup-download" style="${BTN}${GO}">⬇ Download a backup</button>
      <button id="backup-load" style="${BTN}">⬆ Load a backup…</button>
      <button id="backup-close" style="${BTN}">Close</button>
    </div>
    <div id="backup-msg" style="margin-top:10px;font-size:13px;min-height:18px"></div>
    <input id="backup-file" type="file" accept=".json,application/json" style="display:none">`;
  panel.appendChild(card);
  doc.body.append(button, panel);

  const $ = (id) => card.querySelector(`#${id}`);
  const say = (text, bad = false) => { $('backup-msg').textContent = text; $('backup-msg').style.color = bad ? '#5a2a1c' : '#2f8f34'; };
  const open = () => {
    const auto = latestBackup(storage);
    $('backup-auto').textContent = auto ? `Automatic backup: ${ago(Date.now() - auto.time)}` : 'Automatic backup: not yet (it starts once you play)';
    say('');
    panel.style.display = 'flex';
    $('backup-download').focus();
  };
  // (blur, so the space bar goes back to the game, not a hidden button)
  const close = () => { doc.activeElement?.blur?.(); panel.style.display = 'none'; };

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
