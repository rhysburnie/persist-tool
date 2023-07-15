export const AS_NOOP = Symbol();
export const OBFUSCATION = Symbol();
const HANDLER_IS_SETUP = Symbol();
export const eventHandlers = new Map();
export const persistToolOptions = {
  prefix: '',
  suffix: '',
  seperator: '',
  secret: 42,
  obfuscate,
  deobfuscate,
};

export default class PersistTool {
  #engine;
  #options = persistToolOptions;
  #isNoop = false;
  #canObfuscate = false;
  #canDeobfuscate = false;
  static AS_NOOP = AS_NOOP;
  static OBFUSCATION = OBFUSCATION;
  get engine() {
    return this.#engine;
  }
  get options() {
    return this.#options;
  }
  get isNoop() {
    return this.#isNoop;
  }

  constructor(options = {}) {
    if (options === AS_NOOP) {
      this.#isNoop = true;
      return this;
    }
    this.#engine = options.engine || localStorage;
    if (![localStorage, sessionStorage].includes(this.#engine)) {
      console.warn(
        'PersistTool only supports synchronous apis like localStorage and sessionStorage',
      );
    }
    this.#options = {
      ...persistToolOptions,
      ...options,
    };
    if (this.#options.prefix)
      this.#options.prefix = this.#options.prefix + this.#options.seperator;
    if (this.#options.suffix)
      this.#options.suffix = this.#options.seperator + this.#options.suffix;
    this.#canObfuscate = typeof this.#options.obfuscate === 'function';
    this.#canDeobfuscate = typeof this.#options.deobfuscate === 'function';
  }

  setItem(key, value, opts = {}, obfuscate) {
    if (this.#isNoop) return;

    return setItem(
      this.fullKey(key),
      value,
      {
        ...opts,
        // these cant be supplies externally
        secret: this.#options.secret,
      },
      obfuscate === OBFUSCATION &&
        this.#canObfuscate &&
        this.#options.obfuscate,
      this.getEngine(opts),
    );
  }

  getItem(key, fallback = null, opts = {}, deobfuscate) {
    if (this.#isNoop) return fallback;

    return getItem(
      this.fullKey(key),
      fallback,
      {
        ...opts,
        // these cant be supplies externally
        secret: this.#options.secret,
      },
      deobfuscate === OBFUSCATION &&
        this.#canDeobfuscate &&
        this.#options.deobfuscate,
      this.getEngine(opts),
    );
  }

  removeItem(key, opts = {}) {
    if (this.#isNoop) return;

    removeItem(
      this.fullKey(key),
      {
        ...opts,
      },
      this.getEngine(opts),
    );
  }

  get obfuscation() {
    return {
      setItem: (key, value, opts) =>
        this.setItem(key, value, opts, OBFUSCATION),
      getItem: (key, fallback, opts) =>
        this.getItem(key, fallback, opts, OBFUSCATION),
      removeItem: this.removeItem,
    };
  }

  clearItems(opts = {}) {
    if (this.#isNoop) return;
    const prefix = this.#options.prefix;
    const suffix = this.#options.suffix;
    if (!(prefix || suffix))
      throw new Error(
        "clearItems can't be safely run without a prefix and or suffix",
      );
    const engine = this.getEngine(opts);
    this.getKeys().forEach((fullKey) => engine.removeItem(fullKey));
  }

  fullKey(key) {
    if (this.#isNoop) return;
    return this.#options.prefix + key + this.#options.suffix;
  }

  unFullKey(fullKey) {
    if (this.#isNoop) return;
    return fullKey.substring(
      this.#options.prefix.length,
      fullKey.length - this.#options.suffix.length,
    );
  }

  getKeys(opts = {}) {
    if (this.#isNoop) return [];
    const prefix = this.#options.prefix;
    const suffix = this.#options.suffix;
    if (!(prefix || suffix)) return []; // can't be reliably assessed
    const fullKeys = [];
    const engine = this.getEngine(opts);
    for (let i = 0, c = engine.length; i < c; i++) {
      const key = engine.key(i);
      if (key.startsWith(prefix) && key.endsWith(suffix)) fullKeys.push(key);
    }
    return fullKeys;
  }

  on(key, handler) {
    if (this.#isNoop) return;
    const keys = key
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k);
    keys.forEach((k) => {
      const fullKey = this.fullKey(k);
      if (!eventHandlers.has(fullKey)) eventHandlers.set(fullKey, new Map());
      eventHandlers
        .get(fullKey)
        .set(handler, wrappedEventHandler(handler, this));
    });
    // setup the main eventHandler if not setup
    if (!eventHandlers.has(HANDLER_IS_SETUP)) {
      window.addEventListener('storage', eventHandler);
      eventHandlers.set(HANDLER_IS_SETUP, 1);
    }
  }

  off(key, handler) {
    if (this.#isNoop) return;
    const keys = key
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k);
    keys.forEach((k) => {
      const fullKey = this.fullKey(k);
      if (eventHandlers.has(fullKey)) {
        eventHandlers.get(fullKey).delete(handler);
      }
    });
  }

  syncUpdate(__e__) {
    if (this.#isNoop) return;
    const opts = {};
    if (__e__.storageArea === localStorage) opts.localStorage = localStorage;
    if (__e__.storageArea === sessionStorage)
      opts.sessionStorage = sessionStorage;
    this.setItem(__e__.key, __e__.newValue, opts);
  }

  getEngine(opts) {
    if (opts.sessionStorage) return opts.sessionStorage;
    if (opts.localStorage) return opts.localStorage;
    return this.#engine;
  }

  clear() {
    throw new Error('Use clearItems');
  }

  key() {
    throw new Error('Use getKeys() to find key by index');
  }

  get length() {
    throw new Error('Use getKeys().length');
  }
}

// ================================================================

// single storage event handler handles all
function eventHandler(e) {
  if (eventHandlers.has(e.key)) {
    for (let wrappedHandler of eventHandlers.get(e.key).values()) {
      wrappedHandler(e);
    }
  }
}

export function wrappedEventHandler(handler, instance) {
  return (e) => {
    const __e__ = {
      e,
      key: instance.unFullKey(e.key),
      fullKey: e.key,
      newValue: e.newValue,
      oldValue: e.oldValue,
      storageArea: e.storageArea,
      url: e.url,
    };
    handler(() => instance.syncUpdate(__e__), __e__);
  };
}

function setItem(fullKey, value, opts = {}, obfuscate, engine) {
  if (value === null || typeof value === 'undefined') {
    removeItem(fullKey, opts);
    return;
  } else {
    try {
      value = typeof value === 'string' ? value : JSON.stringify(value);

      if (obfuscate) {
        value = obfuscate(value, opts.secret);
      }
      engine.setItem(fullKey, value);
    } catch (err) {
      console.error(err);
      return;
    }
    return fullKey;
  }
}

function getItem(fullKey, fallback = null, opts = {}, deobfuscate, engine) {
  let value;
  let rawValue;

  try {
    rawValue = engine.getItem(fullKey);
    if (deobfuscate) {
      rawValue = deobfuscate(rawValue, opts.secret);
    }
    value = opts.raw ? rawValue : JSON.parse(rawValue);
    if (value === null || typeof value === 'undefined') value = fallback;
  } catch (err) {
    // console.error(err);
    // console.log(rawValue, typeof rawValue, typeof rawValue === 'string' && rawValue !== 'undefined');
    value =
      typeof rawValue === 'string' && rawValue !== 'undefined'
        ? rawValue
        : fallback;
  }
  // console.log({value})
  return value;
}

function removeItem(fullKey, opts = {}, engine) {
  engine.removeItem(fullKey);
}

function obfuscate(str, secret) {
  return [...str]
    .map((c) => String.fromCharCode(c.charCodeAt(0) + secret))
    .join('');
}

function deobfuscate(str, secret) {
  return [...str]
    .map((c) => String.fromCharCode(c.charCodeAt(0) - secret))
    .join('');
}
