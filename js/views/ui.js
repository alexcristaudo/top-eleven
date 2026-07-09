// Small shared rendering helpers.
import { POSITION_ZONE } from '../data/roles.js';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function posBadge(pos) {
  const zone = POSITION_ZONE[pos] || 'mid';
  return `<span class="badge-pos ${zone}">${esc(pos)}</span>`;
}

// Render a formation as dots on a pitch.
export function pitchHtml(formation) {
  const dots = formation.shape.map((s) => {
    const zone = POSITION_ZONE[s.pos] || 'mid';
    return `<span class="dot ${zone}" style="left:${s.x}%;top:${s.y}%"><i>${esc(s.pos)}</i></span>`;
  }).join('');
  return `<div class="pitch" role="img" aria-label="${esc(formation.name)} formation">${dots}</div>`;
}

export function meterRow(label, value, max = 100) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const cls = pct < 45 ? 'bad' : pct < 70 ? 'warn' : '';
  return `
    <div class="meter-row">
      <span>${esc(label)}</span>
      <div class="meter"><i class="${cls}" style="width:${pct}%"></i></div>
      <span class="val">${Math.round(value)}</span>
    </div>`;
}

export function settingsTable(settings) {
  const rows = [
    ['Mentality', settings.mentality],
    ['Focus passing', settings.focus],
    ['Pressing', settings.pressing],
    ['Tackling', settings.tackling],
    ['Passing style', settings.passing],
    ['Marking', settings.marking],
    ['Counter-attack', settings.counterAttack],
    ['Offside trap', settings.offsideTrap],
    ['Arrows', settings.arrows],
  ];
  return `<div class="table-wrap"><table class="tbl">
    ${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}
  </table></div>`;
}
