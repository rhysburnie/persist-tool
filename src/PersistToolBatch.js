import PersistTool, { AS_NOOP } from './PersistTool.js';
export { AS_NOOP };
export const batchStore = new Map();
const TIMER_KEY = Symbol();
const IN_PROGRESS = Symbol();

export default class PersistToolBatch extends PersistTool {
  #delay;
  #group;
  #setTimer;

  static AS_NOOP = AS_NOOP;

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
      this.removeBatchItem(key, opts);
      PersistTool.prototype.removeItem.call(this, key, opts);
    } else {
      this.setBatchItem(key, value, opts, obfuscate, true);
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
      if (value) this.setBatchItem(key, value, opts);
    }
    return value;
  }

  getBatchItem(key, opts = {}) {
    if (this.isNoop) return;
    return getBatchStore(this.getEngine(opts), this.#group).items[key];
  }

  setBatchItem(key, value, opts = {}, obfuscate, pending) {
    if (this.isNoop) return;
    const store = getBatchStore(this.getEngine(opts), this.#group);
    store.items[key] = value;
    if (pending) store.pending[key] = { value, opts, obfuscate };
    if (!store.map.has(IN_PROGRESS)) {
      clearTimeout(store.map.get(TIMER_KEY));
      store.map.set(
        TIMER_KEY,
        setTimeout(() => {
          store.map.set(IN_PROGRESS, true);

          const pending = { ...store.pending };
          const entries = Object.entries(pending);
          // console.log(entries.length, pending);
          if (entries.length) {
            // console.log('huh', store.pending, store, this.engine, this.#group);
            store.pending = {};
            for (const [key, { value, opts, obfuscate }] of entries) {
              // console.log('HEY', key, value, opts, obfuscate);
              // console.log(store.pending);
              // // delete store.pending[key];
              // console.log(store.pending);
              this.setItem(key, value, opts, obfuscate);
            }
          }

          store.map.delete(IN_PROGRESS);

          console.log(JSON.stringify(store));
        }, this.#delay),
      );
    }
  }

  removeBatchItem(key, opts = {}) {
    if (this.isNoop) return;
    const store = getBatchStore(this.getEngine(opts), this.#group);
    store.items[key] = undefined;
    store.pending[key] = undefined;
    delete store.items[key];
    delete store.pending[key];
    // I feel like we only need delete but the old tool also set undefined
    // so perhaps there was a weird edge case reason, surely delete also results
    // in refs being undefined?
  }
}

export function getBatchStore(engine, group) {
  if (!batchStore.has(engine)) batchStore.set(engine, new Map());
  const engineStore = batchStore.get(engine);
  if (!engineStore.has(group))
    engineStore.set(group, { items: {}, pending: {} });
  return {
    ...engineStore.get(group),
    map: engineStore,
  };
}
