import { vi } from 'vitest';
import PersistTool, {
  wrappedEventHandler,
  eventHandlers,
} from './src/PersistTool.js';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('preflight', () => {
  test('localStorage - confirm it works in test env', () => {
    expect(window.localStorage).not.toBeUndefined();
    localStorage.setItem('test', 'abc');
    expect(localStorage.getItem('test')).toBe('abc');
    const handler = vi.fn();
    handler();
    expect(handler).toHaveBeenCalled();
    window.addEventListener('storage', handler);
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'mock',
        newvalue: 'mock',
      }),
    );
    expect(handler).toHaveBeenCalledTimes(2);
    const testHandler = (e) => {
      localStorage.setItem(e.key, e.newValue);
    };
    window.addEventListener('storage', testHandler);
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'test',
        newValue: 'xyz',
      }),
    );
    expect(localStorage.getItem('test')).not.toBe('abc');
    expect(localStorage.getItem('test')).toBe('xyz');
    localStorage.removeItem('test');
    expect(localStorage.getItem('test')).toBe(null);
    window.removeEventListener('storage', testHandler);
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'test',
        newValue: 'xyz',
      }),
    );
    expect(localStorage.getItem('test')).toBe(null);
  });

  test('PersistTool exists', () => {
    expect(PersistTool).not.toBeUndefined();
    expect(PersistTool.AS_NOOP).not.toBeUndefined();
  });
});

describe('prefixed and or suffixed instances (and instanced with neither)', () => {
  test('non prefix / suffix', () => {
    const persist = new PersistTool();
    expect(persist.setItem).toBeTypeOf('function');
    expect(persist.getItem).toBeTypeOf('function');
    expect(persist.removeItem).toBeTypeOf('function');
    expect(persist.fullKey).toBeTypeOf('function');

    expect(persist.fullKey('test')).toBe('test');
    expect(localStorage.getItem('test')).toBe(null);
    persist.setItem('test', 123);
    expect(persist.getItem('test')).toBe(123);
    expect(localStorage.getItem('test')).toBe('123');
    persist.removeItem('test');
    expect(localStorage.getItem('test')).toBe(null);

    persist.setItem('test', 'test in ls');
    expect(persist.getItem('test', 'not found', { localStorage })).toBe(
      'test in ls',
    );

    expect(persist.getItem('test', 'not found', { sessionStorage })).toBe(
      'not found',
    );
    persist.setItem('test', 'test in ss', { sessionStorage });
    expect(persist.getItem('test', 'not found', { sessionStorage })).toBe(
      'test in ss',
    );

    // if you create a persist with the same options
    // obviously it will be using the same storage keys
    // even tho its technically another instance
    const persist2 = new PersistTool();
    persist2.setItem('something', 'whatever');
    expect(persist.getItem('something')).toBe('whatever');
  });

  test('prefixed and or suffixed', () => {
    let instance = new PersistTool({ prefix: 'myPrefix' });
    expect(instance.fullKey('test')).toBe('myPrefixtest');
    expect(instance.unFullKey('myPrefixtest')).toBe('test');

    instance = new PersistTool({ prefix: 'myPrefix', seperator: '_' });
    expect(instance.fullKey('test')).toBe('myPrefix_test');
    expect(instance.unFullKey('myPrefix_test')).toBe('test');

    instance = new PersistTool({ suffix: 'mySufffix' });
    expect(instance.fullKey('test')).toBe('testmySufffix');
    expect(instance.unFullKey('testmySufffix')).toBe('test');

    instance = new PersistTool({ suffix: 'mySufffix', seperator: '_' });
    expect(instance.fullKey('test')).toBe('test_mySufffix');
    expect(instance.unFullKey('test_mySufffix')).toBe('test');

    instance = new PersistTool({ prefix: 'myPrefix', suffix: 'mySufffix' });
    expect(instance.fullKey('test')).toBe('myPrefixtestmySufffix');
    expect(instance.unFullKey('myPrefixtestmySufffix')).toBe('test');

    instance = new PersistTool({
      prefix: 'myPrefix',
      suffix: 'mySufffix',
      seperator: '_',
    });
    expect(instance.fullKey('test')).toBe('myPrefix_test_mySufffix');
    expect(instance.unFullKey('myPrefix_test_mySufffix')).toBe('test');
  });
});

describe('storage events', () => {
  test('(internal) wrappedEventHanler', () => {
    const instance = new PersistTool({
      prefix: '_',
      seperator: '_',
      suffix: '_',
    });
    const key = 'test';
    const expectedFullKey = '__test__';
    const results = [];

    expect(instance.fullKey(key)).toBe(expectedFullKey);
    expect(instance.unFullKey(expectedFullKey)).toBe(key);

    const handler = vi.fn((sync, e) => {
      results.push([sync, e]);
    });
    const wrapped = wrappedEventHandler(handler, instance);
    expect(wrapped).toBeTypeOf('function');
    const eventProps = {
      key: expectedFullKey, // real event key
      newValue: 'abc',
      oldValue: null,
      storageArea: localStorage,
      url: 'whatever',
    };

    expect(results.length).toBe(0);
    wrapped(new StorageEvent('storage', eventProps));

    expect(results.length).toBe(1);
    expect(results[0].length).toBe(2);
    expect(results[0][0]).toBeTypeOf('function');
    expect(results[0][1].key).toBe('test'); // we return expected un prefixed key
    expect(results[0][1].fullKey).toBe(expectedFullKey);
    expect(results[0][1].e.key).toBe(expectedFullKey); // original even has fullKey
    expect(results[0][1].newValue).toBe(eventProps.newValue);
    expect(results[0][1].e.newValue).toBe(eventProps.newValue);
    expect(results[0][1].oldValue).toBe(eventProps.oldValue);
    expect(results[0][1].e.oldValue).toBe(eventProps.oldValue);
    expect(results[0][1].storageArea).toBe(eventProps.storageArea);
    expect(results[0][1].e.storageArea).toBe(eventProps.storageArea);
    expect(results[0][1].url).toBe(eventProps.url);
    expect(results[0][1].e.url).toBe(eventProps.url);
  });

  describe('on / off', () => {
    const instance = new PersistTool({
      prefix: '_',
      seperator: '_',
      suffix: '_',
    });
    const key = 'test';
    const expectedFullKey = '__test__';
    const eventProps = {
      key: expectedFullKey, // real event key
      newValue: 'abc',
      oldValue: null,
      storageArea: localStorage,
      url: 'whatever',
    };
    test('handler management', () => {
      eventHandlers.clear();
      expect(eventHandlers).toBeInstanceOf(Map);
      expect(eventHandlers.size).toBe(0);
      const handler = () => {};
      instance.on(key, handler);
      const handlers = eventHandlers.get(expectedFullKey);
      expect(handlers).toBeInstanceOf(Map);
      expect(handlers.size).toBe(1);
      instance.off(key, handler);
      expect(handlers.size).toBe(0);
    });
    //
    test('handlers run / dont run when expected', () => {
      eventHandlers.clear();
      expect(localStorage.getItem(expectedFullKey)).toBe(null);
      // event test
      const handler = vi.fn((sync, e) => {
        // Note: its better to just use the sync function
        instance.setItem(e.key, e.newValue);
      });
      // on - hadler is running
      instance.on(key, handler);
      const handlers = eventHandlers.get(expectedFullKey);
      expect(handlers.size).toBe(1);
      expect(handler).not.toHaveBeenCalled();
      window.dispatchEvent(new StorageEvent('storage', eventProps));
      expect(instance.getItem(key, 'xyz')).toBe(eventProps.newValue);
      expect(handler).toHaveBeenCalledTimes(1);
      // off - handler is not running
      instance.off(key, handler);
      expect(handlers.size).toBe(0);
      instance.setItem(key, 'xyz');
      expect(instance.getItem(key)).toBe('xyz');
      window.wot = true;
      window.dispatchEvent(new StorageEvent('storage', eventProps));
      expect(handler).toHaveBeenCalledTimes(1);
      expect(instance.getItem(key)).not.toBe(eventProps.newValue);
    });

    test('sync shortcut function works', () => {
      eventHandlers.clear();
      const instance = new PersistTool({
        prefix: '_',
        seperator: '_',
        suffix: '_',
      });
      const key = 'test';
      const expectedFullKey = '__test__';
      const eventProps = {
        key: expectedFullKey, // real event key
        newValue: 'abc',
        oldValue: null,
        storageArea: localStorage,
        url: 'whatever',
      };
      const handler = vi.fn((sync) => {
        /**
         * Rather than running:
         * instance.setItem(e.key, e.newValue);
         *
         * sync will do the same
         * it will also use the matching storageArea
         * which you would otherwise have to detect and specify
         *
         * sync and setItem will run removeItem
         * if the value null or undefined is detected
         * to save on storage space
         */
        sync();
      });
      expect(instance.getItem('test')).toBe(null);
      instance.on('test', handler);
      window.dispatchEvent(new StorageEvent('storage', eventProps));
      expect(instance.getItem('test')).toBe('abc');
      instance.removeItem('test');
      expect(instance.getItem('test')).toBe(null);
      instance.off('test', handler);
      window.dispatchEvent(new StorageEvent('storage', eventProps));
      expect(instance.getItem('test')).toBe(null);
    });

    test('you can listen for multiple keys with the same handler', () => {
      eventHandlers.clear();
      const instance = new PersistTool(); // non reprefixed / suffixed
      const handler = vi.fn();
      const eventProps = {
        // key: '',
        // newValue: '',
        oldValue: null,
        storageArea: localStorage,
        url: 'whatever',
      };
      instance.on('test1,test2,test3', handler); // 3 keys
      window.dispatchEvent(
        new StorageEvent('storage', {
          ...eventProps,
          key: 'test1',
          newvalue: 1,
        }),
      );
      window.dispatchEvent(
        new StorageEvent('storage', {
          ...eventProps,
          key: 'test2',
          newvalue: 2,
        }),
      );
      window.dispatchEvent(
        new StorageEvent('storage', {
          ...eventProps,
          key: 'test3',
          newvalue: 3,
        }),
      );
      // some other key...
      window.dispatchEvent(
        new StorageEvent('storage', {
          ...eventProps,
          key: 'test4',
          newvalue: 4,
        }),
      );

      expect(handler).toHaveBeenCalledTimes(3);

      instance.off('test1,test2,test3', handler); // 3 keys
      window.dispatchEvent(
        new StorageEvent('storage', {
          ...eventProps,
          key: 'test1',
          newvalue: 1,
        }),
      );
      window.dispatchEvent(
        new StorageEvent('storage', {
          ...eventProps,
          key: 'test2',
          newvalue: 2,
        }),
      );
      window.dispatchEvent(
        new StorageEvent('storage', {
          ...eventProps,
          key: 'test3',
          newvalue: 3,
        }),
      );
      expect(handler).not.toHaveBeenCalledTimes(6);
      expect(handler).toHaveBeenCalledTimes(3);
    });
  });
});

describe('obfuscation', () => {
  const instance = new PersistTool();
  const instance2 = new PersistTool({ secret: 7 });

  test('default obfuscation', () => {
    expect(instance.obfuscation).toBeTypeOf('object');
    expect(instance.obfuscation.setItem).toBeTypeOf('function');
    expect(instance.obfuscation.getItem).toBeTypeOf('function');

    expect(instance.getItem('test')).toBe(null);
    instance.obfuscation.setItem('test', 'Hello World!');
    expect(instance.getItem('test')).not.toBe(null);
    expect(instance.getItem('test')).not.toBe('Hello World!');
    expect(instance.obfuscation.getItem('test')).toBe('Hello World!');

    // diff obfuscation settings, so cant read value
    expect(instance2.getItem('test')).not.toBe(null);
    expect(instance2.getItem('test')).not.toBe('Hello World!');
    expect(instance2.obfuscation.getItem('test')).not.toBe('Hello World!');
    expect(instance2.obfuscation.getItem('test')).not.toBe(
      instance.obfuscation.getItem('test'),
    );
  });

  test('providing custom obfuscation', async () => {
    const CryptoJS = await import('crypto-js');
    expect(CryptoJS).not.toBeUndefined();
    expect(CryptoJS.AES).not.toBeUndefined();

    const obfuscate = (str, secret) =>
      CryptoJS.AES.encrypt(str, secret).toString();
    const deobfuscate = (str, secret) =>
      CryptoJS.AES.decrypt(str, secret).toString(CryptoJS.enc.Utf8);

    const instance = new PersistTool({
      obfuscate,
      deobfuscate,
      secret: 'providing custom obfuscation',
    });

    expect(instance.getItem('test')).toBe(null);
    instance.obfuscation.setItem('test', 'Hello World!');
    expect(instance.getItem('test')).not.toBe(null);
    expect(instance.getItem('test')).not.toBe('Hello World!');
    expect(instance.obfuscation.getItem('test')).toBe('Hello World!');
  });
});

test('no opperation instance', () => {
  eventHandlers.clear();
  const instance = new PersistTool(PersistTool.AS_NOOP);
  expect(instance.isNoop).toBe(true);
  const fullKey = instance.setItem('test', '???');
  expect(fullKey).toBeUndefined();
  expect(instance.getItem('test')).toBe(null);
  expect(localStorage.getItem('test')).toBe(null);
  localStorage.setItem('test', '???');
  expect(localStorage.getItem('test')).toBe('???');
  instance.removeItem('test');
  expect(instance.obfuscation.setItem('test', '???')).toBeUndefined();
  expect(instance.obfuscation.getItem('test')).toBe(null);
  expect(localStorage.getItem('test')).toBe('???');
  expect(instance.fullKey('test')).toBeUndefined();
  expect(instance.unFullKey('test')).toBeUndefined();
  // on / off does nothing
  expect(eventHandlers.size).toBe(0);
  instance.on('test', () => {});
  expect(eventHandlers.size).toBe(0);
  const mockHandler = () => {};
  const mockHandlers = new Map();
  mockHandlers.set(mockHandler, () => {});
  eventHandlers.set('mockHandlers', mockHandlers);
  expect(eventHandlers.size).toBe(1);
  expect(eventHandlers.get('mockHandlers').get(mockHandler)).toBeTypeOf(
    'function',
  );
  instance.off('mockHandlers', mockHandler);
  expect(eventHandlers.size).toBe(1);
});

describe('clear, key and length alternates', () => {
  test('clear, key and length throws error', () => {
    const instance = new PersistTool();
    expect(() => instance.clear()).toThrowError(/clearItems/);
    expect(() => instance.key(0)).toThrowError(/getKeys/);
    expect(() => instance.length).toThrowError(/getKeys/);
  });

  test('clearItems', () => {
    let instance = new PersistTool();
    // .clear exists but throw error telling you to use clearItems
    expect(() => instance.clear()).toThrowError(/clearItems/);
    // clarItem cant be safely acheive if no prefix / suffix
    expect(() => instance.clearItems()).toThrowError(/prefix/);
    instance = new PersistTool({ prefix: 'p', suffix: 's', seperator: ':' });
    // .clear exists but throw error telling you to use clearItems
    expect(() => instance.clear()).toThrowError(/clearItems/);
    const keys = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const expectedFullKeys = keys.map((key) => instance.fullKey(key));
    keys.forEach((key) => instance.setItem(key, 1));
    expect(localStorage.length).toBe(keys.length);
    const fullKeys = instance.getKeys();
    expect(fullKeys.length).toBe(keys.length);
    expect(fullKeys.join()).toBe(expectedFullKeys.join());
    expect(() => instance.clearItems()).not.toThrowError(/prefix/);
    expect(localStorage.length).toBe(0);
  });
});
