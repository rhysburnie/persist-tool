# PersistTool

Work In Progress

## Rationale

This tool was created as a replacement in a project where multiple methodologies were being used to persist data.

Based on the combined requirements the tool provides the following:

- automatically stringify / parse data
- optionally auto prefix and or suffix keys
- optionally provide mechanism to sync data changed between tabs
- optionally use obfuscation for the store values
- (undecided) provide ability to define the storage
  technically this already possible, however many alternates use
  promises, so to fully support we will have to use async / await
  no bit deal just not sure we need it at the mo.
- bactch calls
  the existing project has a Persist utility that batched calls
  with a debounce, this is due to calls being made frequently
  in short timeframes.
  ~~this would add more complexity to the code and I'm undecided
  about it, and perhaps it should be the responsibility of the consumer.~~
  extension class `PersistToolBatch`
- provide a "no opperation" instance (more on that later)

## API

Create an instance:

`const persist = new PersistTool()`

This would give you an api that writes to `localStorage` with keys that match exactly what you provide.
In other words, if you were to create multiple instances of `new PersistTool()` they would all read/write the same key in storage.

Use for global generic items.

**Batch version**

Same as normal except it has a `delay` option (default: 500ms)

`const persist = new PersistToolBatch();` /  `const persist = new PersistToolBatch({delay: 1000});`

setItem, getItem, removeItem work instantly writing to a store and the actual (setItem) persist to Storage is delayed on each call.
Thus after `delay` of the last setItem call all pendizng writes will be added to the Storage.

### Prefix / Suffix

**prefix**

`const persist = new PersistTool({prefix: 'myPrefix'})`

This would give you an api that writes to `localStorage` and prefix the keys.

`const fullKey = persist.setItem('test', 1) === 'myPrefixtest'`

Provide a seperator:

`const persist = new PersistTool({prefix: 'myPrefix', seperator: '_})`

`const fullKey = persist.setItem('test', 1) === 'myPrefix_test'`

**suffix**

`const persist = new PersistTool({suffix: 'mySuffix', seperator: '_})`

`const fullKey = persist.setItem('test', 1) === 'test_mySuffix'`

**both**

`const persist = new PersistTool({prefix: 'myPrefix', suffix: 'mySuffix', seperator: '_})`

`const fullKey = persist.setItem('test', 1) === 'myPrefix_test_mySuffix'`

Typically suffix is useful for cases where you may want to store items agains something like a unique user uid, but want the keys to be easy to read in the localStorage inspector.

### Expeted API Methods

The following methods typical to localStorage / sessionStorage and compatible alternatives are as follows:

The argument signatures of the native methods match, but have additional optional arguments after those.

- `setItem(key, value/*, opts*/)`
  - `obfuscation.setItem(key, value/*, opts*/)` obfuscated value in storage

- `getItem(key/*, fallback, opts*/)`
  - `obfuscation.getItem(key/*, fallback, opts*/)` get deobfusacetd value

- `removeItem(key/*,opts*/)`
- TODO missing native methods

Additional methods

- `on(key, handler)`
  `handler = (sync, e) => { sync() }`
  syncs change between tabs.
  Note: e is a plain object of: for if you need to do something other than just call `sync`
  Note: there is no need to chack if value is null and manually run `instance.removeItem`, `sync` will do that also.

  - `key` - this is the `key` you used not necessarily the actual store key (which may have prefix / suffix)
  - `fullKey` - may be same as key (if no prefix / suffix)
  - `newValue`
  - `oldvalue`
  - `storageArea`
  - `url`
  - `e` the original event, the only thing that may differ is `key` and other "real" event properties

- `off(key, handler)`

  
