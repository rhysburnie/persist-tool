import { bench } from 'vitest';
import OldPersist from './old-ref-library-persist.js';
import PersistToolBatch from '../../src/PersistToolBatch.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// bench('preflight - (is bench working ex. normal sorting)', () => {
//   const x = [1, 5, 4, 2, 3];
//   x.sort((a, b) => {
//     return a - b;
//   });
// });

describe('Compare PersistToolBatch to older example persist utility', () => {
  localStorage.clear();
  const amount = 5000;
  const str = `
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
   incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
   nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
   Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
   eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, 
   sunt in culpa qui officia deserunt mollit anim id est laborum.
  `;

  bench('PersistToolBatch', () => {
    const instance = new PersistToolBatch({ prefix: 'batch', delay: 1000 });
    let iAmount = amount;
    while (iAmount) {
      instance.setItem('test' + iAmount, str);
      iAmount--;
    }
  });

  bench('old', async () => {
    const instance = new OldPersist('old', localStorage);
    let iAmount = amount;
    while (iAmount) {
      await instance.setItem('test' + iAmount, str);
      iAmount--;
    }
  });
});
