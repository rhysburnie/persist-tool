// mport lzjs from 'lzjs';

// We dont actually use the longtermStore feature
// of this for benchmark so just define lzjs instead of adding a dep
const lzjs = {
  compress: () => {},
  decompress: () => {},
};

var knownPrefixes = new Set();

var scopeBatchItems = [];
var scopeBatchDebounce = [];

export default function (prefix, defaultStore, longtermStore, delay = 1000) {
  // do checks on store engine

  var batchDebounce = {
    default: null,
    longterm: null,
  };
  var batchItems = {
    default: {},
    longterm: {},
  };
  scopeBatchDebounce.push(batchDebounce);
  scopeBatchItems.push(batchItems);

  if (!longtermStore) longtermStore = defaultStore;
  knownPrefixes.add(prefix);
  return {
    async getItem(key, defaultValue) {
      var data = await batchGetItem(prefix + key);

      if (!data) return defaultValue;
      if (['W', 'N', 'U', 'S'].includes(data[0])) data = lzjs.decompress(data);
      if (typeof data === 'string') data = JSON.parse(data);

      return data;
    },
    async setItem(key, value, longterm) {
      value = longterm
        ? lzjs.compress(JSON.stringify(value))
        : JSON.stringify(value);
      await batchSetItem(prefix + key, value, longterm);
    },
    async removeItem(key) {
      await batchRemoveItem(prefix + key);
    },
    async wipeAll() {
      // console.log('Persist:wipeAll');

      scopeBatchItems.forEach((bi) => {
        bi.default = {};
        bi.longterm = {};
      });
      scopeBatchDebounce.forEach((bd) => {
        clearTimeout(bd.longterm);
        clearTimeout(bd.default);
      });

      var keys = [];
      if (defaultStore.keys) keys.push(...(await defaultStore.keys()));
      if (defaultStore.getAllKeys)
        keys.push(...(await defaultStore.getAllKeys()));
      if (longtermStore.keys) keys.push(...(await longtermStore.keys()));
      if (longtermStore.getAllKeys)
        keys.push(...(await longtermStore.getAllKeys()));

      try {
        keys.push(...Object.entries(defaultStore).map((i) => i[0]));
      } catch (error) {}

      keys = [...new Set(keys)];

      keys.forEach((key) => {
        knownPrefixes.forEach((prefix) => {
          if (key.indexOf(prefix) === 0) batchRemoveItem(key);
        });
      });
    },
  };

  function batchSetItem(key, value, longterm) {
    var storeType = longterm ? 'longterm' : 'default';
    batchItems[storeType][key] = value;
    clearTimeout(batchDebounce[storeType]);
    batchDebounce[storeType] = setTimeout(async (_) => {
      // console.log(
      //   'Perist:' + prefix + ':' + storeType,
      //   Object.keys(batchItems[storeType]).length,
      // );
      const lBatchItems = Object.assign({}, batchItems[storeType]);
      batchItems[storeType] = {};
      var storeEng = longterm ? longtermStore : defaultStore;

      // prevent keys living in both stores
      if (defaultStore !== longtermStore) {
        var clearFrom = longterm ? defaultStore : longtermStore;
        Object.keys(lBatchItems).forEach((key) => {
          clearFrom.removeItem(key);
        });
      }

      if (typeof storeEng.setItems === 'function') {
        const items = Object.keys(lBatchItems).map((k) => {
          return {
            key: k,
            value: lBatchItems[k],
          };
        });
        await storeEng.setItems(items);
        return;
      }

      if (typeof storeEng.multiSet === 'function') {
        const items = Object.keys(lBatchItems).map((k) => {
          return [k, lBatchItems[k]];
        });
        await storeEng.multiSet(items);
        return;
      }

      Object.keys(lBatchItems).forEach((k) => {
        storeEng.setItem(k, lBatchItems[k]);
      });
    }, delay);
  }

  async function batchGetItem(key) {
    let data;
    if (batchItems.default[key]) data = batchItems.default[key];
    if (!data && batchItems.longterm[key]) data = batchItems.longterm[key];
    if (!data) data = await defaultStore.getItem(key);
    if (!data) data = await longtermStore.getItem(key);
    return data;
  }

  function batchRemoveItem(key) {
    batchItems.default[key] = undefined;
    batchItems.longterm[key] = undefined;
    delete batchItems.default[key];
    delete batchItems.longterm[key];
    defaultStore.removeItem(key);
    longtermStore.removeItem(key);
  }
}

window.persistDebug = {
  localStorageSpace(fkey) {
    var allStrings = '';
    for (var key in window.localStorage) {
      // eslint-disable-next-line
      if (window.localStorage.hasOwnProperty(key)) {
        if (!fkey || key === fkey) allStrings += window.localStorage[key];
      }
    }
    return allStrings
      ? 3 + (allStrings.length * 16) / (8 * 1024) + ' KB'
      : 'Empty (0 KB)';
  },
};
