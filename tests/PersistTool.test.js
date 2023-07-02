import { vi } from 'vitest';
import PersistTool, { wrappedEventHandler, eventHandlers } from './src/PersistTool.js';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('preflight', () => {
  test('preflight - localStorage test', () => {
    expect(window.localStorage).not.toBeUndefined();
    localStorage.setItem('test', 'abc');
    expect(localStorage.getItem('test')).toBe('abc');
    const handler = vi.fn();
    handler();
    expect(handler).toHaveBeenCalled();
    window.addEventListener('storage', handler);
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'mock',
      newvalue: 'mock'
    }));
    expect(handler).toHaveBeenCalledTimes(2);
    const testHandler = (e) => {
      localStorage.setItem(e.key, e.newValue);
    };
    window.addEventListener('storage', testHandler);
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'test',
      newValue: 'xyz'
    }));
    expect(localStorage.getItem('test')).not.toBe('abc');
    expect(localStorage.getItem('test')).toBe('xyz');
  });
  test('PersistTool exists', () => {
    expect(PersistTool).not.toBeUndefined();
    expect(PersistTool.AS_NOOP).not.toBeUndefined();
  })
});

describe('non prefixed or suffixed instances', () => {
  const persist = new PersistTool();
  test('', () => {
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
    expect(persist.getItem('test', 'not found', { localStorage })).toBe('test in ls');
    sessionStorage.removeItem('test'); // just in case
    expect(persist.getItem('test', 'not found', { sessionStorage })).toBe('not found');
    persist.setItem('test', 'test in ss', { sessionStorage });
    expect(persist.getItem('test', 'not found', { sessionStorage })).toBe('test in ss');
  });
});

describe('storage events', () => {
  test('(internal) wrappedEventHanler', () => {
    const instance = new PersistTool({prefix: '_', seperator: '_', suffix: '_'});
    const key = 'test';
    const expectedFullKey = '__test__';
    const results = [];

    expect(instance.fullKey(key)).toBe(expectedFullKey);
    expect(instance.unFullKey(expectedFullKey)).toBe(key);

    const handler = vi.fn((e, sync) => {
      results.push([e, sync]);
    });
    const wrapped = wrappedEventHandler(handler, instance);
    expect(wrapped).toBeTypeOf('function');
    const eventProps = {
      key: expectedFullKey, // real event key
      newValue: 'abc',
      oldValue: null,
      storageArea: localStorage,
      url: 'whatever'
    };
    
    expect(results.length).toBe(0);
    wrapped(new StorageEvent('storage', eventProps));
    
    expect(results.length).toBe(1);
    expect(results[0].length).toBe(2);

    expect(results[0][0].key).toBe('test'); // we return expected un prefixed key
    expect(results[0][0].fullKey).toBe(expectedFullKey);
    expect(results[0][0].e.key).toBe(expectedFullKey); // original even has fullKey
    expect(results[0][0].newValue).toBe(eventProps.newValue);
    expect(results[0][0].e.newValue).toBe(eventProps.newValue);
    expect(results[0][0].oldValue).toBe(eventProps.oldValue);
    expect(results[0][0].e.oldValue).toBe(eventProps.oldValue);
    expect(results[0][0].storageArea).toBe(eventProps.storageArea);
    expect(results[0][0].e.storageArea).toBe(eventProps.storageArea);
    expect(results[0][0].url).toBe(eventProps.url);
    expect(results[0][0].e.url).toBe(eventProps.url);

    expect(results[0][1]).toBeTypeOf('function');
  });
  
  test('on / off', () => {
    const instance = new PersistTool({prefix: '_', seperator: '_', suffix: '_'});
    const key = 'test';
    const expectedFullKey = '__test__';
    const eventProps = {
      key: expectedFullKey, // real event key
      newValue: 'abc',
      oldValue: null,
      storageArea: localStorage,
      url: 'whatever'
    };

    expect(eventHandlers).toBeInstanceOf(Map);
    expect(eventHandlers.size).toBe(0)
    const handler = () => {};
    instance.on(key, handler);
    const handlers = eventHandlers.get(expectedFullKey)
    expect(handlers).toBeInstanceOf(Map);
    expect(handlers.size).toBe(1);
    instance.off(key, handler);
    expect(handlers.size).toBe(0);


    expect(localStorage.getItem(expectedFullKey)).toBe(null);
    const handler2 = vi.fn((e, sync) => {
      instance.setItem(e.key, e.newValue);
    });
    instance.on(key, handler2);
    expect(handlers.size).toBe(1);
    expect(handler2).not.toHaveBeenCalled();
    window.dispatchEvent(new StorageEvent('storage', eventProps));
    expect(instance.getItem(key, 'xyz')).toBe(eventProps.newValue);
    expect(handler2).toHaveBeenCalledTimes(1);
    instance.off(key, handler2);
    expect(handlers.size).toBe(0);
    instance.setItem(key, 'xyz');
    expect(instance.getItem(key)).toBe('xyz');
    
    window.dispatchEvent(new StorageEvent('storage', eventProps));
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(instance.getItem(key)).toBe(null);

    // NOTE cant test if values changed or not
    // because the event seems to automatically sync the ls
    // tho that seems werid might be because its artificial
    // test that is the case first
    // if so just test that the handlers have been called
    
    // expect(localStorage.length).toBe(0);
  });
});