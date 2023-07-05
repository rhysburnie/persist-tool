export const AS_NOOP = Symbol();
export const OBFUSCATION = Symbol();

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

  constructor(options = {}) {
    if (options === AS_NOOP) {
      this.#isNoop = true;
      return this;
    }
    this.#engine = options.engine || localStorage;
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

  isNoop() {
    return this.#isNoop;
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
        engine: !opts.localStorage && !opts.sessionStorage && this.#engine,
      },
      obfuscate === OBFUSCATION &&
        this.#canObfuscate &&
        this.#options.obfuscate,
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
        engine: !opts.localStorage && !opts.sessionStorage && this.#engine,
      },
      deobfuscate === OBFUSCATION &&
        this.#canDeobfuscate &&
        this.#options.deobfuscate,
    );
  }

  removeItem(key, opts = {}) {
    if (this.#isNoop) return;

    removeItem(this.fullKey(key), {
      ...opts,
      engine: !opts.localStorage && !opts.sessionStorage && this.#engine,
    });
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
    if (!eventHandlers.has(EVENT_HANDLERS_SETUP)) {
      window.addEventListener('storage', eventHandler);
      eventHandlers.set(EVENT_HANDLERS_SETUP, 1);
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
}

// ================================================================

export var eventHandlers = new Map();
var EVENT_HANDLERS_SETUP = Symbol();
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
    handler(__e__, () => instance.syncUpdate(__e__));
  };
}

function setItem(fullKey, value, opts = {}, obfuscate) {
  const engine = getEngine(opts);

  if (value === null || typeof value === 'undefined') {
    removeItem(fullKey, opts);
  } else {
    try {
      value = typeof value === 'string' ? value : JSON.stringify(value);

      if (obfuscate) {
        value = obfuscate(value, opts.secret);
      }
      engine.setItem(fullKey, value);
    } catch (err) {
      console.error(err);
    }
  }
  return fullKey;
}

function getItem(fullKey, fallback = null, opts = {}, deobfuscate) {
  let value;
  let rawValue;
  let engine = getEngine(opts);

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

function removeItem(fullKey, opts = {}) {
  getEngine(opts).removeItem(fullKey);
}

function getEngine(opts) {
  let engine = opts.engine;
  if (!engine && opts.sessionStorage) engine = opts.sessionStorage;
  if (!engine && opts.localStorage) engine = opts.localStorage;
  return engine;
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
