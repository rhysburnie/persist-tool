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
      expect(store).toBeTypeOf('object');
      expect(store.map).toBeInstanceOf(Map);
      expect(batchStore.get(localStorage)).toBe(store.map);
      const engineStore = batchStore.get(localStorage).get('group');
      expect(engineStore.items).toBe(store.items);
      expect(engineStore.pending).toBe(store.pending);

      expect(
        batchStore.get(localStorage).get('group').pending.test,
      ).toBeUndefined();

      store.pending.test = { huh: 'wot?' };

      expect(batchStore.get(localStorage).get('group').pending.test).toBeTypeOf(
        'object',
      );
      expect(engineStore.pending.test).toBe(store.pending.test);

      delete store.pending.test;
      expect(Object.keys(store.pending).length).toBe(0);

      expect(
        batchStore.get(localStorage).get('group').pending.test,
      ).toBeUndefined();
      expect(getBatchStore(localStorage, 'group').pending.test).toBeUndefined();

      store.pending.test = { huh: 'wot?' };
      expect(Object.keys(store.pending).length).toBe(1);

      expect(
        batchStore.get(localStorage).get('group').pending.test,
      ).not.toBeUndefined();
      expect(
        getBatchStore(localStorage, 'group').pending.test,
      ).not.toBeUndefined();

      delete engineStore.pending.test;
      expect(Object.keys(store.pending).length).toBe(0);

      expect(
        batchStore.get(localStorage).get('group').pending.test,
      ).toBeUndefined();
      expect(getBatchStore(localStorage, 'group').pending.test).toBeUndefined();
    });
  });

  test('some additional internals', async () => {
    const instance = new PersistToolBatch();
    expect(instance.getBatchItem('test')).toBeUndefined();
    expect(() =>
      instance.setBatchItem('test', 'OK', {}, false, true),
    ).not.toThrowError();

    const stateStart = JSON.stringify(getBatchStore(localStorage, 'group'));
    // let store = getBatchStore(
    //   instance.engine,
    //   instance.options.prefix + instance.options.suffix,
    // );
    // store.wtf = 123;
    // // console.log(store, instance.engine);
    // expect(store).not.toBeUndefined();
    // expect(store.pending.test).toBeTypeOf('object');
    expect(instance.getBatchItem('test')).toBe('OK');
    const stateEnd = JSON.stringify(getBatchStore(localStorage, 'group'));
    const ts = Date.now();
    await wait(1000);
    // console.log(store.pending);
    const now = Date.now();
    expect(now - ts > 500).toBe(true);

    console.log(stateStart, stateEnd);
    expect(stateStart).toBe(stateEnd);
    // console.log(now - ts, ts, now);
    // store = getBatchStore(
    //   instance.engine,
    //   instance.options.prefix + instance.options.suffix,
    // );
    // console.log('errrrrr', store.pending.test);
    // expect(store.pending.test).toBeTypeOf('objecta');

    // console.log(store.pending);
    expect(localStorage.getItem('test')).toBe(null);
    expect(instance.getItem('test')).toBe('OK');
    expect(() => instance.removeBatchItem('test')).not.toThrowError();
    expect(instance.getItem('test')).toBe(null);
  });
});
