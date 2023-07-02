Criteria:

* detect support, including whether it is able to store ie. max limit may be reached
* prefix and/or suffix the key
* Optional Encrypt (obfuscate) the value
* localStorage
* sessionStorage
* Optional batch storage calls (for usecases that would result in very frequent storage calls)

Maybe:
* Indexeddb support
* CacheStorage

```
const persist = new PersistTool()

fallback = persist.getItem('notSetYet', 123) 
persist.setItem('ok',true);
persist.obfuscation.setItem('somewhatSecret', 'value');
// alias of
persist.obfuscation.setItem('somewhatSecret', 'value', {/* opts */}, PersistTool.OBFUSCATION);
persist.getItem('somewhatSecret') // some gibberish
persist.obfuscation.getItem('somewhatSecret') // 'value'
// alias of
persist.getItem('somewhatSecret', 'fallback', {/* opts */}, PersistTool.OBFUSCATION)
```