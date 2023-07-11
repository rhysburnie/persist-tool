import { vi } from 'vitest';
import PersistToolBatch, {
  AS_NOOP as BATCH_AS_NOOP,
  getBatchStore,
  batchStore,
} from './src/PersistToolBatch.js';
import PersistTool, {
  wrappedEventHandler,
  eventHandlers,
  AS_NOOP,
} from './src/PersistTool.js';

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
    expect(PersistToolBatch.AS_NOOP).toBe(BATCH_AS_NOOP);
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
  test.todo('unskip the next test once final');
  test.skip('(slow timers in use) setItem, getItem, removeItem', async () => {
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

test.todo(
  'simplifed test from main class, things like prefix, obfuscate, sessionStorage',
);

test('rapid calls', async () => {
  expect(localStorage.length).toBe(0);
  const delay = 100;
  const instance = new PersistToolBatch({ delay });
  const store = getBatchStore(localStorage, ''); // only for testing
  const amount = 5000;
  let iAmount = amount;
  while (iAmount) {
    instance.setItem('test' + iAmount, iAmount);
    iAmount--;
  }
  expect(Object.keys(store.get('items')).length).toBe(amount);
  expect(Object.keys(store.get('pending')).length).toBe(amount);
  expect(localStorage.length).toBe(0);
  await wait(delay + 50);
  expect(localStorage.length).toBe(amount);
  expect(Object.keys(store.get('pending')).length).toBe(0);
});
