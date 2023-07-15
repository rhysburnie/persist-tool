import { vi } from 'vitest';
import PersistToolBatch, {
  getBatchStore,
  batchStore,
} from './src/PersistToolBatch.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  test('PersistToolBatch exists - noop works', () => {
    expect(PersistToolBatch).not.toBeUndefined();
    const instance = new PersistToolBatch(PersistToolBatch.AS_NOOP);
    expect(instance.isNoop).toBe(true);
    expect(/*fullKey = */ instance.setItem('test')).toBeUndefined();
    expect(instance.getItem('test')).toBe(null);
    expect(instance.getItem('test', 'fallback')).toBe('fallback');
  });

  describe('internals', () => {
    test('getBatchStore', async () => {
      expect(getBatchStore).toBeTypeOf('function');
      const store = getBatchStore(localStorage, 'group');
      expect(store).toBeInstanceOf(Map);
      const engineStore = batchStore.get(localStorage).get('group');
      expect(engineStore.get('items')).toBe(store.get('items'));
      expect(engineStore.get('pending')).toBe(store.get('pending'));
      expect(
        batchStore.get(localStorage).get('group').get('pending').test,
      ).toBeUndefined();
      store.get('pending').test = { huh: 'wot?' };
      expect(
        batchStore.get(localStorage).get('group').get('pending').test,
      ).toBeTypeOf('object');
      expect(engineStore.get('pending').test).toBe(store.get('pending').test);
      delete store.get('pending').test;
      expect(Object.keys(store.get('pending')).length).toBe(0);
      expect(
        batchStore.get(localStorage).get('group').get('pending').test,
      ).toBeUndefined();
      expect(
        getBatchStore(localStorage, 'group').get('pending').test,
      ).toBeUndefined();
      store.get('pending').test = { huh: 'wot?' };
      expect(Object.keys(store.get('pending')).length).toBe(1);
      expect(
        batchStore.get(localStorage).get('group').get('pending').test,
      ).not.toBeUndefined();
      expect(
        getBatchStore(localStorage, 'group').get('pending').test,
      ).not.toBeUndefined();
      delete engineStore.get('pending').test;
      expect(Object.keys(store.get('pending')).length).toBe(0);
      expect(
        batchStore.get(localStorage).get('group').get('pending').test,
      ).toBeUndefined();
      expect(
        getBatchStore(localStorage, 'group').get('pending').test,
      ).toBeUndefined();
    });

    test('some additional internals', async () => {
      const instance = new PersistToolBatch();
      expect(instance.getBatchItem('test')).toBeUndefined();
      let store = getBatchStore(
        instance.engine,
        instance.options.prefix + instance.options.suffix,
      );
      expect(store).not.toBeUndefined();
      expect(Object.keys(store.get('pending')).length).toBe(0);
      expect(() =>
        instance.setBatchItem('test', 'OK', {}, false, true),
      ).not.toThrowError();
      expect(Object.keys(store.get('pending')).length).toBe(1);
      expect(store.get('pending').test).toBeTypeOf('object');
      expect(instance.getBatchItem('test')).toBe('OK');
      expect(localStorage.getItem(instance.fullKey('test'))).toBe(null);
      const ts = Date.now();
      await wait(1000);

      const now = Date.now();
      expect(now - ts > 500).toBe(true);
      expect(localStorage.getItem(instance.fullKey('test'))).toBe('OK');
      expect(Object.keys(store.get('pending')).length).toBe(0);
      expect(instance.getItem('test')).toBe('OK');
      expect(() => instance.removeItem('test')).not.toThrowError();
      expect(instance.getItem('test')).toBe(null);
    });
  });
});

describe('batch verions works as non batched', () => {
  test('(slow timers in use) setItem, getItem, removeItem', async () => {
    const delay = 5000; // extreme
    const instance = new PersistToolBatch({ delay });
    const store = getBatchStore(localStorage, ''); // only for testing

    expect(instance.getItem('test')).toBe(null);

    instance.setItem('test', 123);
    expect(instance.getItem('test')).toBe(123);
    expect(localStorage.getItem('test')).toBe(null);
    expect(Object.keys(store.get('items')).length).toBe(1);
    expect(Object.keys(store.get('pending')).length).toBe(1);
    await wait(delay + 50);
    expect(localStorage.getItem('test')).toBe('123');
    expect(Object.keys(store.get('pending')).length).toBe(0);

    instance.setItem('test', 456);
    expect(instance.getItem('test')).toBe(456);
    expect(localStorage.getItem('test')).toBe('123');

    // remove
    expect(() => instance.removeItem('test')).not.toThrowError();
    expect(Object.keys(store.get('items')).length).toBe(0);
    expect(Object.keys(store.get('pending')).length).toBe(0);
    expect(instance.getItem('test')).toBe(null);
    expect(localStorage.getItem('test')).toBe(null);
    await wait(delay + 50);
    expect(instance.getItem('test')).toBe(null);
    expect(localStorage.getItem('test')).toBe(null);
  }, 15000);
});

describe('simplifed tests from main class', () => {
  test('prefix / suffix', async () => {
    const instance = new PersistToolBatch({
      prefix: 'myPrefix',
      suffix: 'mySufffix',
      seperator: '_',
      delay: 100,
    });

    expect(instance.fullKey('test')).toBe('myPrefix_test_mySufffix');
    expect(instance.getItem('test')).toBe(null);
    expect(localStorage.getItem(instance.fullKey('test'))).toBe(null);
    expect(instance.setItem('test', true)).toBe(instance.fullKey('test'));
    expect(instance.getItem('test')).not.toBe(null);
    expect(localStorage.getItem(instance.fullKey('test'))).toBe(null);
    await wait(500);
    expect(instance.getItem('test')).not.toBe(null);
    expect(localStorage.getItem(instance.fullKey('test'))).not.toBe(null);
    instance.removeItem('test');
    expect(localStorage.getItem(instance.fullKey('test'))).toBe(null);
    expect(instance.getItem('test', 'fallback')).toBe('fallback');
  });

  test('obfuscation', async () => {
    const instance = new PersistToolBatch({
      prefix: 'myPrefix',
      suffix: 'mySufffix',
      seperator: '_',
      delay: 100,
    });

    expect(instance.obfuscation.getItem('test')).toBe(null);
    expect(localStorage.getItem(instance.fullKey('test'))).toBe(null);
    expect(instance.obfuscation.setItem('test', true)).toBe(
      instance.fullKey('test'),
    );
    expect(instance.getItem('test')).not.toBe(null);
    expect(localStorage.getItem(instance.fullKey('test'))).toBe(null);
    await wait(500);
    expect(instance.obfuscation.getItem('test')).toBe(true);
    expect(localStorage.getItem(instance.fullKey('test'))).not.toBe(null);
    expect(localStorage.getItem(instance.fullKey('test'))).not.toBe(
      instance.obfuscation.getItem('test'),
    );
    expect(instance.getItem(instance.fullKey('test'))).not.toBe(
      instance.obfuscation.getItem('test'),
    );
    instance.removeItem('test');
    expect(localStorage.getItem(instance.fullKey('test'))).toBe(null);
    expect(instance.obfuscation.getItem('test', 'fallback')).toBe('fallback');
  });

  test('on / off', async () => {
    const instance = new PersistToolBatch({
      prefix: 'myPrefix',
      suffix: 'mySufffix',
      seperator: '_',
      delay: 100,
    });

    const handler = vi.fn((sync) => sync());

    const eventProps = {
      key: instance.fullKey('test'), // real event key
      newValue: true,
      oldValue: null,
      storageArea: localStorage,
      url: 'whatever',
    };

    expect(handler).not.toHaveBeenCalled();
    expect(instance.obfuscation.getItem('test')).toBe(null);
    expect(localStorage.getItem(instance.fullKey('test'))).toBe(null);
    instance.on('test', handler);
    window.dispatchEvent(new StorageEvent('storage', eventProps));
    expect(handler).toHaveBeenCalled();
    expect(instance.obfuscation.getItem('test')).not.toBe(null);
    expect(localStorage.getItem(instance.fullKey('test'))).toBe(null);
    await wait(500);
    expect(localStorage.getItem(instance.fullKey('test'))).not.toBe(null);
    handler.mockReset();
    expect(handler).not.toHaveBeenCalled();
    instance.removeItem('test');
    instance.off('test', handler);
    expect(instance.obfuscation.getItem('test')).toBe(null);
    expect(localStorage.getItem(instance.fullKey('test'))).toBe(null);
    window.dispatchEvent(new StorageEvent('storage', eventProps));
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('', () => {
  test('rapid calls', async () => {
    expect(localStorage.length).toBe(0);
    const delay = 1000;
    const instance = new PersistToolBatch({ delay });
    const store = getBatchStore(localStorage, ''); // only for testing
    const amount = 5000;
    let iAmount = amount;
    while (iAmount) {
      instance.setItem(
        'test' + iAmount,
        `
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
     incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
     nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
     Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
     eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, 
     sunt in culpa qui officia deserunt mollit anim id est laborum.
    `,
      );
      iAmount--;
    }
    expect(Object.keys(store.get('items')).length).toBe(amount);
    expect(Object.keys(store.get('pending')).length).toBe(amount);
    expect(localStorage.length).toBe(0);
    await wait(delay + 50);
    // if this fails it can be due to a failure in another test() above
    expect(localStorage.length).toBe(amount);
    expect(Object.keys(store.get('pending')).length).toBe(0);
  });
});

describe('clear, key and length alternates', () => {
  test('clearItems', async () => {
    let instance = new PersistToolBatch();
    // .clear exists but throw error telling you to use clearItems
    expect(() => instance.clear()).toThrowError(/clearItems/);
    // clarItem cant be safely acheive if no prefix / suffix
    expect(() => instance.clearItems()).toThrowError(/prefix/);
    instance = new PersistToolBatch({
      prefix: 'p',
      suffix: 's',
      seperator: ':',
    });
    // .clear exists but throw error telling you to use clearItems
    expect(() => instance.clear()).toThrowError(/clearItems/);
    const keys = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const expectedFullKeys = keys.map((key) => instance.fullKey(key));
    keys.forEach((key) => instance.setItem(key, 1));
    await wait(1000);
    expect(localStorage.length).toBe(keys.length);
    const fullKeys = instance.getKeys();
    expect(fullKeys.length).toBe(keys.length);
    // expect(fullKeys.join()).toBe(expectedFullKeys.join());
    expect(() => instance.clearItems()).not.toThrowError(/prefix/);
    expect(localStorage.length).toBe(0);
  });

  test('getKeys', async () => {
    let instance = new PersistToolBatch({ prefix: 'p' });
    instance.setItem('test', true);
    expect(instance.getItem('test')).toBe(true);
    expect(instance.getKeys().length).toBe(1);
    expect(localStorage.length).toBe(0);
    await wait(1500);
    expect(localStorage.length).toBe(1);
  }, 2000);
});
