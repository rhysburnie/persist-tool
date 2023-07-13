import PersistTool, { AS_NOOP, OBFUSCATION } from './PersistTool.js';
export { AS_NOOP };
export const batchStore = new Map();
const TIMER_KEY = Symbol();
const IN_PROGRESS = Symbol();

export default class PersistToolBatch extends PersistTool {
  #delay;
  #group;

  static AS_NOOP = AS_NOOP;
  static OBFUSCATION = OBFUSCATION;

  constructor(options = {}) {
    super(options);
    this.#delay = this.options.delay || 500;
    // multiple instances  have the same 'group' value based on prefix / suffix values
    this.#group = this.options.prefix + this.options.suffix;
  }

  setItem(key, value, opts = {}, obfuscate) {
    if (this.isNoop) return;
    let fullKey;
    if (value === null || typeof value === 'undefined') {
      this.removeItem(key, opts);
    } else {
      this.setBatchItem(key, value, opts, obfuscate, true);
      fullKey = this.fullKey(key);
    }
    return fullKey;
  }

  getItem(key, fallback = null, opts = {}, deobfuscate) {
    if (this.isNoop) return fallback;
    // I read you can do this `super.getItem(key, fallback, opts, deobfuscate)`
    // But I cant get that to work
    let value = this.getBatchItem(key, opts);
    if (!value) {
      value = PersistTool.prototype.getItem.call(
        this,
        key,
        fallback,
        opts,
        deobfuscate,
      );
      if (value !== fallback)
        this.setBatchItem(key, value, opts /* set to `items` store only */);
    }
    return value;
  }

  removeItem(key, opts) {
    this.removeBatchItem(key, opts);
    PersistTool.prototype.removeItem.call(this, key, opts);
  }

  getBatchItem(key, opts = {}) {
    if (this.isNoop) return;
    return getBatchStore(this.getEngine(opts), this.#group).get('items')[key];
  }

  setBatchItem(key, value, opts = {}, obfuscate, pending) {
    if (this.isNoop) return;
    const store = getBatchStore(this.getEngine(opts), this.#group);
    // get items and pending objects and add to them
    store.get('items')[key] = value;
    if (!pending) return;
    store.get('pending')[key] = { value, opts, obfuscate };
    if (!store.has(IN_PROGRESS)) {
      clearTimeout(store.get(TIMER_KEY));
      store.set(
        TIMER_KEY,
        setTimeout(() => {
          store.set(IN_PROGRESS, true);

          const pending = { ...store.get('pending') };
          const entries = Object.entries(pending);

          if (entries.length) {
            store.set('pending', {});
            for (const [key, { value, opts, obfuscate }] of entries) {
              PersistTool.prototype.setItem.call(
                this,
                key,
                value,
                opts,
                obfuscate,
              );
            }
          }

          store.delete(IN_PROGRESS);
        }, this.#delay),
      );
    }
  }

  removeBatchItem(key, opts = {}) {
    if (this.isNoop) return;
    const store = getBatchStore(this.getEngine(opts), this.#group);
    store.get('items')[key] = undefined;
    store.get('pending')[key] = undefined;
    delete store.get('items')[key];
    delete store.get('pending')[key];
    // I feel like we only need delete but the old tool also set undefined
    // so perhaps there was a weird edge case reason, surely delete also results
    // in refs being undefined?
  }
}

export function getBatchStore(engine, group) {
  if (!batchStore.has(engine)) batchStore.set(engine, new Map());
  const engineStore = batchStore.get(engine);
  if (!engineStore.has(group)) {
    engineStore.set(group, new Map(Object.entries({ items: {}, pending: {} })));
  }
  return engineStore.get(group);
}
