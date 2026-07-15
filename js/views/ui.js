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

// Render a formation as dots on a pitch. Optional `labels` (matching
// formation.shape order) adds a short name under each dot.
export function pitchHtml(formation, labels = null) {
  const dots = formation.shape.map((s, i) => {
    const zone = POSITION_ZONE[s.pos] || 'mid';
    const label = labels && labels[i] ? `<b>${esc(labels[i])}</b>` : '';
    return `<span class="dot ${zone}" style="left:${s.x}%;top:${s.y}%"><i>${esc(s.pos)}</i>${label}</span>`;
  }).join('');
  return `<div class="pitch" role="img" aria-label="${esc(formation.name)} formation">${dots}</div>`;
}

// First name truncated for pitch labels.
export function shortName(name, max = 9) {
  const last = String(name || '').trim().split(/\s+/).pop();
  return last.length > max ? last.slice(0, max - 1) + '…' : last;
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

// Minimal inline SVG sparkline for a numeric series (e.g. quality over time).
// Scales to its container width; returns '' for fewer than two points.
export function sparkline(values, { height = 44 } = {}) {
  const vals = (values || []).filter((v) => Number.isFinite(v));
  if (vals.length < 2) return '';
  const w = 240;
  const pad = 4;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / (vals.length - 1);
  const y = (v) => pad + (height - pad * 2) * (1 - (v - min) / range);
  const pts = vals.map((v, i) => `${(pad + i * stepX).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const rising = vals[vals.length - 1] >= vals[0];
  const cx = (pad + (vals.length - 1) * stepX).toFixed(1);
  const cy = y(vals[vals.length - 1]).toFixed(1);
  return `<svg class="spark ${rising ? 'up' : 'down'}" viewBox="0 0 ${w} ${height}" width="100%" height="${height}" preserveAspectRatio="none" role="img" aria-label="Quality trend">
    <polyline fill="none" stroke-width="2" points="${pts}" vector-effect="non-scaling-stroke"></polyline>
    <circle cx="${cx}" cy="${cy}" r="3" vector-effect="non-scaling-stroke"></circle>
  </svg>`;
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
