import { escapeHtml } from '../utils/dom.js';
import { icon } from './icons.js';

// tone: teal | info | warning | success
export function statCard({ label, value, iconName, tone = 'teal' }) {
  return `
    <div class="card stat-card stat-card--${tone}">
      <span class="stat-card__icon">${icon(iconName)}</span>
      <div>
        <span class="stat__label">${escapeHtml(label)}</span>
        <strong class="stat__value">${escapeHtml(value)}</strong>
      </div>
    </div>`;
}