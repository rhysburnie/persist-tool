import { beforeEach, afterEach } from 'vitest';
import localStorageSupport from '../src/localStorageSupport.js';

test('Supported', () => {
  expect(localStorageSupport).toBeTypeOf('object');
  expect(localStorageSupport.has).toBe(true);
  expect(localStorageSupport.can).toBe(true);
})

// cant work out how to test this
test.skip('Not supported (fake disabled)', async () => {
  let localStorageReal = window.localStorage;
  // cant work out how to test ls not working
  // this doesnt seem to work
  window.localStorage = new Proxy(
    {},
    {
      get() {
        throw new Error('localStorage is not available');
      },
      set() {
        throw new Error('localStorage is not available');
      },
    }
  );
  // if no localstorage effectively mocked to throw errors
  // these should all fail but dont
  expect(() => localStorageSupport.check()).not.toThrow()
  expect(localStorageSupport.has).toBe(true);
  expect(localStorageSupport.can).toBe(true);
});