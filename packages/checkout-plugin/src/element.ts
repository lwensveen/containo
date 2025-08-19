import { Mode, Pool, PoolOrderOptions } from './types.js';
import { getPools, init, intent, quote } from './api.js';

const css = ` 
:host{all:initial}
*,*::before,*::after{box-sizing:border-box}
.container{font:14px/1.45 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:#0f172a}
.h1{font-weight:800;font-size:20px;margin:0 0 10px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.card{border:1px solid #e2e8f0;border-radius:12px;background:#fff;padding:12px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.btn{appearance:none;border:1px solid #cbd5e1;border-radius:10px;background:#0ea5e9;color:#fff;padding:8px 12px;font-weight:600;cursor:pointer}
.btn:disabled{opacity:.6;cursor:not-allowed}
.btn.outline{background:#fff;color:#0f172a}
.label{display:block;font-size:12px;color:#475569;margin-bottom:4px}
.input{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:8px}
.small{font-size:12px;color:#475569}
.table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}
th,td{padding:8px;text-align:left;border-bottom:1px solid #e2e8f0}
th{background:#f8fafc;font-weight:600;font-size:12px;color:#475569}
.badge{background:#e2e8f0;color:#0f172a;border-radius:999px;padding:2px 8px;font-size:11px}
.fillbar{height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden}
.fillbar>div{height:100%;background:#0ea5e9}
.mt8{margin-top:8px}.mt12{margin-top:12px}.mt16{margin-top:16px}
.flex{display:flex;gap:8px;align-items:center}
.right{margin-left:auto}
.mono{font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace}
`;

const template = document.createElement('template');
template.innerHTML = `<style>${css}</style>
<div class="container">
  <div class="card">
    <div class="h1">Containo – Quote & Reserve</div>
    <div class="row">
      <div>
        <label class="label">Origin (IATA)</label>
        <input class="input" id="origin" maxlength="3" value="AMS"/>
      </div>
      <div>
        <label class="label">Destination (IATA)</label>
        <input class="input" id="dest" maxlength="3" value="BKK"/>
      </div>
    </div>

    <div class="row mt8">
      <div>
        <label class="label">Mode</label>
        <select class="input" id="mode">
          <option value="sea">Sea</option>
          <option value="air">Air</option>
        </select>
      </div>
      <div>
        <label class="label">Cut-off (ISO)</label>
        <input class="input" id="cutoff" />
      </div>
    </div>

    <div class="row-3 mt8">
      <div>
        <label class="label">Weight (kg)</label>
        <input class="input" id="w" type="number" value="120"/>
      </div>
      <div>
        <label class="label">L (cm)</label>
        <input class="input" id="l" type="number" value="100"/>
      </div>
      <div>
        <label class="label">W (cm)</label>
        <input class="input" id="wi" type="number" value="80"/>
      </div>
      <div>
        <label class="label">H (cm)</label>
        <input class="input" id="h" type="number" value="60"/>
      </div>
    </div>

    <div class="flex mt12">
      <button class="btn" id="btn-quote">Get quote</button>
      <button class="btn outline" id="btn-intent">Reserve</button>
      <div class="small right" id="status"></div>
    </div>

    <div class="mt12 small" id="result">—</div>
  </div>

  <div class="card mt16">
    <div class="h1">Current pools</div>
    <div class="small">Live view of open lanes & fill</div>
    <table class="table mt12" id="pools">
      <thead><tr><th>Lane</th><th>Mode</th><th>Cutoff</th><th>Fill</th><th>Status</th></tr></thead>
      <tbody></tbody>
    </table>
  </div>
</div>
`;

export class ContainoCheckoutElement extends HTMLElement {
  #shadow: ShadowRoot;
  #apiBase = '';
  #apiKey: string | undefined;
  #userId: string | undefined;
  #interval: any;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
    this.#shadow.appendChild(template.content.cloneNode(true));
  }

  static get observedAttributes() {
    return [
      'api-base',
      'api-key',
      'publishable-key',
      'user-id',
      'origin',
      'dest',
      'mode',
      'cutoff-iso',
    ];
  }

  attributeChangedCallback(name: string, _old: string, val: string) {
    if (name === 'api-base') this.#apiBase = val;
    if (name === 'api-key' || name === 'publishable-key') this.#apiKey = val || undefined;
    if (name === 'user-id') this.#userId = val;

    const byId = (id: string) => this.#shadow.getElementById(id) as HTMLInputElement | null;
    if (name === 'origin') byId('origin')?.setAttribute('value', (val || '').toUpperCase());
    if (name === 'dest') byId('dest')?.setAttribute('value', (val || '').toUpperCase());
    if (name === 'mode')
      (this.#shadow.getElementById('mode') as HTMLSelectElement | null)?.setAttribute('value', val);
    if (name === 'cutoff-iso') byId('cutoff')?.setAttribute('value', val);

    if (['api-base', 'api-key', 'publishable-key', 'user-id'].includes(name)) {
      this.#ensureInit();
    }
  }

  connectedCallback() {
    const cutoff = this.#shadow.getElementById('cutoff') as HTMLInputElement;
    if (!cutoff.value) cutoff.value = new Date(Date.now() + 7 * 86400_000).toISOString();

    (this.#shadow.getElementById('btn-quote') as HTMLButtonElement).onclick = () => this.#onQuote();
    (this.#shadow.getElementById('btn-intent') as HTMLButtonElement).onclick = () =>
      this.#onIntent();

    this.#ensureInit();
    this.#loadPools();
    this.#interval = setInterval(() => this.#loadPools(), 30_000);
  }

  disconnectedCallback() {
    if (this.#interval) clearInterval(this.#interval);
  }

  #ensureInit() {
    if (!this.#apiBase) return;
    init({ apiBase: this.#apiBase, apiKey: this.#apiKey, defaultUserId: this.#userId });
  }

  #setStatus(txt: string) {
    const el = this.#shadow.getElementById('status')!;
    el.textContent = txt;
  }
  #setResult(txt: string) {
    const el = this.#shadow.getElementById('result')!;
    el.textContent = txt;
  }

  #opts(): PoolOrderOptions & { idempotencyKey?: string } {
    const v = (id: string) => (this.#shadow.getElementById(id) as HTMLInputElement).value;
    return {
      originPort: v('origin').toUpperCase(),
      destPort: v('dest').toUpperCase(),
      mode: (v('mode') as Mode) || 'sea',
      cutoffAt: v('cutoff'),
      weightKg: Number(v('w')),
      dimsCm: { length: Number(v('l')), width: Number(v('wi')), height: Number(v('h')) },
      idempotencyKey: (globalThis as any)?.crypto?.randomUUID?.() ?? String(Date.now()),
      metadata: { userId: this.#userId },
    };
  }

  async #onQuote() {
    try {
      this.#setStatus('Quoting…');
      const q = await quote(this.#opts());
      const total = (q as any).userPrice ?? q.price ?? 0;
      const eta = (q as any).eta ?? q.etaDays ?? null;
      this.#setResult(`Total: $${Number(total).toFixed(0)}${eta ? ` • ETA: ${eta} days` : ''}`);
      this.dispatchEvent(new CustomEvent('containo:quote', { detail: q }));
      this.#setStatus('OK');
    } catch (e: any) {
      this.#setStatus('Quote failed');
      this.#setResult(String(e?.message ?? e));
    }
  }

  async #onIntent() {
    try {
      this.#setStatus('Reserving…');
      const r = await intent(this.#opts());
      this.#setResult(`Reserved. Intent id: ${r.id} • Volume: ${r.volumeM3} m³`);
      this.dispatchEvent(new CustomEvent('containo:intent', { detail: r }));
      this.#setStatus('OK');
    } catch (e: any) {
      this.#setStatus('Reserve failed');
      this.#setResult(String(e?.message ?? e));
    }
  }

  async #loadPools() {
    try {
      const rows = await getPools();
      const tb = this.#shadow.querySelector<HTMLTableSectionElement>('#pools tbody')!;
      tb.innerHTML = '';
      rows.forEach((p: Pool) => {
        const used = Number(p.usedM3),
          cap = Number(p.capacityM3);
        const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;

        const tr = document.createElement('tr');

        const tdLane = document.createElement('td');
        tdLane.textContent = `${p.originPort} → ${p.destPort}`;
        tr.appendChild(tdLane);

        const tdMode = document.createElement('td');
        tdMode.textContent = p.mode;
        tr.appendChild(tdMode);

        const tdCutoff = document.createElement('td');
        tdCutoff.textContent = new Date(p.cutoffAt).toLocaleString();
        tr.appendChild(tdCutoff);

        const tdFill = document.createElement('td');
        tdFill.innerHTML = `<div class="fillbar"><div style="width:${pct}%"></div></div>
          <div class="small mono">${used}/${cap} m³ (${pct}%)</div>`;
        tr.appendChild(tdFill);

        const tdStatus = document.createElement('td');
        tdStatus.innerHTML = `<span class="badge">${p.status}</span>`;
        tr.appendChild(tdStatus);

        tb.appendChild(tr);
      });
    } catch (e) {
      /* empty */
    }
  }
}
