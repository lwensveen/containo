import { getPools, init, intent, quote } from './api.js';
import { ContainoCheckoutElement } from './element.js';
import { ContainoPoolsSummary } from './elements/pools-summary.js';

export * from './types.js';
export { init, quote, intent, getPools };

let defined = false;

export function defineContainoElements() {
  if (defined) return;
  if (!customElements.get('containo-checkout')) {
    customElements.define('containo-checkout', ContainoCheckoutElement);
  }
  if (!customElements.get('containo-pools-summary')) {
    customElements.define('containo-pools-summary', ContainoPoolsSummary);
  }
  defined = true;
}

export function mount(
  el: HTMLElement,
  opts: { apiBase: string; userId?: string; apiKey?: string } & Partial<{
    origin: string;
    dest: string;
    mode: 'sea' | 'air';
    cutoffAt: string;
  }>
) {
  defineContainoElements();
  init({ apiBase: opts.apiBase, defaultUserId: opts.userId, apiKey: opts.apiKey });

  const node = document.createElement('containo-checkout');
  node.setAttribute('api-base', opts.apiBase);
  if (opts.apiKey) node.setAttribute('api-key', opts.apiKey);
  if (opts.userId) node.setAttribute('user-id', opts.userId);
  if (opts.origin) node.setAttribute('origin', opts.origin);
  if (opts.dest) node.setAttribute('dest', opts.dest);
  if (opts.mode) node.setAttribute('mode', opts.mode);
  if (opts.cutoffAt) node.setAttribute('cutoff-iso', opts.cutoffAt);

  el.replaceChildren(node);
}

export function mountSummary(
  el: HTMLElement,
  opts: {
    apiBase: string;
    origin?: string;
    dest?: string;
    mode?: 'sea' | 'air';
    limit?: number;
    minFill?: number; // 0..1
    refreshSeconds?: number; // 0 = disable
    hideEmpty?: boolean;
  }
) {
  defineContainoElements();

  const node = document.createElement('containo-pools-summary');
  node.setAttribute('api-base', opts.apiBase);
  if (opts.origin) node.setAttribute('origin', opts.origin);
  if (opts.dest) node.setAttribute('dest', opts.dest);
  if (opts.mode) node.setAttribute('mode', opts.mode);
  if (opts.limit != null) node.setAttribute('limit', String(opts.limit));
  if (opts.minFill != null) node.setAttribute('min-fill', String(opts.minFill));
  if (opts.refreshSeconds != null)
    node.setAttribute('refresh-seconds', String(opts.refreshSeconds));
  if (opts.hideEmpty != null) node.setAttribute('hide-empty', String(opts.hideEmpty));

  el.replaceChildren(node);
}

declare global {
  interface Window {
    Containo?: any;
  }
}

if (typeof window !== 'undefined') {
  defineContainoElements();
  window.Containo = {
    ...(window.Containo || {}),
    init,
    quote,
    intent,
    getPools,
    mount,
    mountCheckout: mount,
    mountSummary,
    defineElements: defineContainoElements,
  };
}
