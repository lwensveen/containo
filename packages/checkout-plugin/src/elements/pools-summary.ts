type PoolStatus = 'open' | 'closing' | 'booked' | 'in_transit' | 'arrived';
type Mode = 'sea' | 'air';

export interface Pool {
  id: string;
  originPort: string;
  destPort: string;
  mode: Mode;
  cutoffAt: string;
  capacityM3: string;
  usedM3: string;
  status: PoolStatus;
}

type Opts = {
  apiBase: string;
  origin?: string;
  dest?: string;
  mode?: Mode;
  limit: number;
  minFill: number;
  refreshSeconds: number;
  hideEmpty: boolean;
};

const DEFAULTS: Opts = {
  apiBase: '',
  limit: 3,
  minFill: 0,
  refreshSeconds: 60,
  hideEmpty: true,
};

export class ContainoPoolsSummary extends HTMLElement {
  #opts: Opts = { ...DEFAULTS };
  #timer: any = null;
  #root: ShadowRoot;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return [
      'api-base',
      'origin',
      'dest',
      'mode',
      'limit',
      'min-fill',
      'refresh-seconds',
      'hide-empty',
    ];
  }

  connectedCallback() {
    this.#readAttributes();
    this.#renderSkeleton();
    this.#load();

    if (this.#opts.refreshSeconds > 0) {
      this.#timer = setInterval(() => this.#load(), this.#opts.refreshSeconds * 1000);
    }
  }

  disconnectedCallback() {
    if (this.#timer) clearInterval(this.#timer);
  }

  attributeChangedCallback() {
    this.#readAttributes();
    this.#load();
  }

  #readAttributes() {
    const get = (name: string) => this.getAttribute(name) || undefined;
    const num = (name: string, fallback: number) => {
      const v = this.getAttribute(name);
      const n = v == null ? NaN : Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    this.#opts.apiBase = (get('api-base') || '').replace(/\/+$/, '');
    this.#opts.origin = get('origin')?.toUpperCase();
    this.#opts.dest = get('dest')?.toUpperCase();
    const m = get('mode');
    this.#opts.mode = m === 'air' || m === 'sea' ? (m as Mode) : undefined;
    this.#opts.limit = Math.max(1, num('limit', DEFAULTS.limit));
    const mf = Number(get('min-fill'));
    this.#opts.minFill = Number.isFinite(mf) ? Math.max(0, Math.min(1, mf)) : DEFAULTS.minFill;
    this.#opts.refreshSeconds = Math.max(0, num('refresh-seconds', DEFAULTS.refreshSeconds));
    this.#opts.hideEmpty = (get('hide-empty') ?? 'true') !== 'false';
  }

  async #load() {
    if (!this.#opts.apiBase) {
      this.#renderError('Missing required attribute: api-base');
      return;
    }
    try {
      const res = await fetch(`${this.#opts.apiBase}/pools`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const pools = (await res.json()) as Pool[];

      const filtered = pools
        .filter((p) => p.status === 'open' || p.status === 'closing')
        .filter((p) =>
          this.#opts.origin ? p.originPort.toUpperCase() === this.#opts.origin : true
        )
        .filter((p) => (this.#opts.dest ? p.destPort.toUpperCase() === this.#opts.dest : true))
        .filter((p) => (this.#opts.mode ? p.mode === this.#opts.mode : true))
        .map((p) => ({
          ...p,
          cap: Number(p.capacityM3) || 0,
          used: Number(p.usedM3) || 0,
          fill: (() => {
            const c = Number(p.capacityM3) || 0;
            const u = Number(p.usedM3) || 0;
            return c > 0 ? Math.min(1, u / c) : 0;
          })(),
        }))
        .filter((p) => p.fill >= this.#opts.minFill)
        .sort((a, b) => b.fill - a.fill)
        .slice(0, this.#opts.limit);

      if (!filtered.length && this.#opts.hideEmpty) {
        this.style.display = 'none';
        return;
      }
      this.style.display = '';
      this.#renderList(filtered);
    } catch (err: any) {
      this.#renderError(String(err?.message || err));
    }
  }

  #renderSkeleton() {
    this.#root.innerHTML = `
      <style>${styles}</style>
      <div class="wrap">
        <div class="title">Available pools</div>
        <div class="list">
          ${['', '', ''].map(() => skeletonItem).join('')}
        </div>
      </div>
    `;
  }

  #renderError(msg: string) {
    this.#root.innerHTML = `
      <style>${styles}</style>
      <div class="wrap">
        <div class="title">Available pools</div>
        <div class="empty">Could not load pools (${escapeHTML(msg)})</div>
      </div>
    `;
  }

  #renderList(rows: Array<ReturnType<typeof mapPool>>) {
    this.#root.innerHTML = `
      <style>${styles}</style>
      <div class="wrap">
        <div class="title">Available pools</div>
        ${
          rows.length
            ? `<ul class="list">${rows.map(renderItem).join('')}</ul>`
            : `<div class="empty">No active pools${this.#opts.origin || this.#opts.dest ? ' for this lane' : ''}.</div>`
        }
      </div>
    `;

    const buttons = this.#root.querySelectorAll<HTMLButtonElement>('button[data-id]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')!;
        const payload = rows.find((r) => r.id === id)!;
        this.dispatchEvent(new CustomEvent('containo:select', { detail: payload, bubbles: true }));
      });
    });
  }
}

function mapPool(p: Pool) {
  const cap = Number(p.capacityM3) || 0;
  const used = Number(p.usedM3) || 0;
  const fill = cap > 0 ? Math.min(1, used / cap) : 0;
  return {
    id: p.id,
    originPort: p.originPort,
    destPort: p.destPort,
    mode: p.mode,
    cutoffAt: p.cutoffAt,
    status: p.status,
    cap,
    used,
    fill,
  };
}

function renderItem(p: ReturnType<typeof mapPool>) {
  const pct = Math.round(p.fill * 100);
  const cutoff = new Date(p.cutoffAt);
  return `
    <li class="item">
      <div class="row">
        <div class="lane">${p.originPort} → ${p.destPort} <span class="mode">${p.mode}</span></div>
        <div class="cutoff">Cut-off: ${cutoff.toLocaleString()}</div>
      </div>
      <div class="bar"><div class="barFill" style="width:${pct}%"></div></div>
      <div class="meta">
        <span>${p.used.toFixed(2)} / ${p.cap.toFixed(2)} m³</span>
        <span class="pct">${pct}%</span>
      </div>
      <button class="reserve" data-id="${p.id}" aria-label="Reserve in this pool">Reserve</button>
    </li>
  `;
}

const skeletonItem = `
  <div class="item skeleton">
    <div class="row">
      <div class="s sk-lane"></div>
      <div class="s sk-cutoff"></div>
    </div>
    <div class="s sk-bar"></div>
    <div class="row"><div class="s sk-meta"></div></div>
  </div>
`;

const styles = `
:host { all: initial; display:block; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Inter, sans-serif; color:#0f172a }
.wrap { border:1px solid rgba(15,23,42,.08); border-radius:12px; padding:12px; background:#fff }
.title { font-weight:700; font-size:14px; margin-bottom:8px; color:#0f172a }
.list { list-style:none; padding:0; margin:0; display:grid; gap:10px }
.item { border:1px solid rgba(15,23,42,.08); border-radius:10px; padding:10px; background:#fff }
.row { display:flex; justify-content:space-between; gap:8px; align-items:center; margin-bottom:6px }
.lane { font-weight:600; font-size:14px }
.mode { font-size:12px; color:#475569; margin-left:6px; text-transform:uppercase }
.cutoff { font-size:12px; color:#475569 }
.bar { height:8px; width:100%; background:#f1f5f9; border-radius:999px; overflow:hidden; }
.barFill { height:100%; background:linear-gradient(90deg,#2563eb,#38bdf8); transition:width .3s ease }
.meta { display:flex; justify-content:space-between; color:#475569; font-size:12px; margin-top:6px }
.pct { font-weight:700; color:#0f172a }
.reserve { margin-top:8px; width:100%; border:1px solid rgba(37,99,235,.25); color:#1d4ed8; background:rgba(37,99,235,.06); border-radius:8px; padding:8px 10px; font-weight:600; cursor:pointer }
.reserve:hover { background:rgba(37,99,235,.1) }

.skeleton .s { border-radius:6px; background: linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9);
  background-size:200% 100%; animation:shimmer 1.2s infinite; }
.sk-lane { width:180px; height:14px }
.sk-cutoff { width:120px; height:12px }
.sk-bar { width:100%; height:8px; margin-top:8px }
.sk-meta { width:60%; height:12px; margin-top:6px }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`;

function escapeHTML(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );
}
