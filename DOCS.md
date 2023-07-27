## Modules

<dl>
<dt><a href="#module_PersistTool">PersistTool</a></dt>
<dd></dd>
<dt><a href="#module_PersistToolBatch">PersistToolBatch</a></dt>
<dd><p>Same API as <code>PersistTool</code> with <code>delay</code> option that batches the <code>Storage.setItem</code> but immedietly sets value to an insternal store for retrival.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#TypeAsNoop">TypeAsNoop</a> : <code>Symbol</code></dt>
<dd><p><code>PersistTool.AS_NOOP</code></p>
</dd>
<dt><a href="#TypePersistToolOptionsDefault">TypePersistToolOptionsDefault</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#TypePersistToolOptions">TypePersistToolOptions</a> : <code><a href="#TypePersistToolOptionsDefault">TypePersistToolOptionsDefault</a></code> | <code><a href="#TypeAsNoop">TypeAsNoop</a></code></dt>
<dd></dd>
<dt><a href="#TypeGetFallback">TypeGetFallback</a> : <code>*</code></dt>
<dd></dd>
<dt><a href="#TypePersistToolBatchOptionsDefault">TypePersistToolBatchOptionsDefault</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#TypeBatchAsNoop">TypeBatchAsNoop</a> : <code>PersistTool.TypeAsNoop</code></dt>
<dd><p><code>PersistToolBatch.AS_NOOP</code></p>
</dd>
<dt><a href="#TypePersistToolOptions">TypePersistToolOptions</a> : <code><a href="#TypePersistToolBatchOptionsDefault">TypePersistToolBatchOptionsDefault</a></code> | <code><a href="#TypeBatchAsNoop">TypeBatchAsNoop</a></code></dt>
<dd></dd>
</dl>

<a name="module_PersistTool"></a>

## PersistTool

* [PersistTool](#module_PersistTool)
    * [~PersistTool](#module_PersistTool..PersistTool)
        * [new PersistTool([options])](#new_module_PersistTool..PersistTool_new)
        * [.obfuscation](#module_PersistTool..PersistTool+obfuscation) : <code>Object</code>
        * [.setItem(key, value, [opts])](#module_PersistTool..PersistTool+setItem) ⇒ <code>String</code> \| <code>undefined</code>
        * [.getItem(key, [fallback], [opts])](#module_PersistTool..PersistTool+getItem) ⇒ <code>\*</code> \| <code>null</code> \| [<code>TypeGetFallback</code>](#TypeGetFallback)
        * [.removeItem(key, [opts])](#module_PersistTool..PersistTool+removeItem)
        * [.on(key, handler)](#module_PersistTool..PersistTool+on)
        * [.off([key], [handler])](#module_PersistTool..PersistTool+off)
        * [.clearItems([opts])](#module_PersistTool..PersistTool+clearItems)
        * [.fullKey(key)](#module_PersistTool..PersistTool+fullKey) ⇒ <code>String</code>
        * [.unFullKey(fullKey)](#module_PersistTool..PersistTool+unFullKey) ⇒ <code>String</code>
        * [.getKeys([opts])](#module_PersistTool..PersistTool+getKeys) ⇒ <code>Array</code>

<a name="module_PersistTool..PersistTool"></a>

### PersistTool~PersistTool
**Kind**: inner class of [<code>PersistTool</code>](#module_PersistTool)  

* [~PersistTool](#module_PersistTool..PersistTool)
    * [new PersistTool([options])](#new_module_PersistTool..PersistTool_new)
    * [.obfuscation](#module_PersistTool..PersistTool+obfuscation) : <code>Object</code>
    * [.setItem(key, value, [opts])](#module_PersistTool..PersistTool+setItem) ⇒ <code>String</code> \| <code>undefined</code>
    * [.getItem(key, [fallback], [opts])](#module_PersistTool..PersistTool+getItem) ⇒ <code>\*</code> \| <code>null</code> \| [<code>TypeGetFallback</code>](#TypeGetFallback)
    * [.removeItem(key, [opts])](#module_PersistTool..PersistTool+removeItem)
    * [.on(key, handler)](#module_PersistTool..PersistTool+on)
    * [.off([key], [handler])](#module_PersistTool..PersistTool+off)
    * [.clearItems([opts])](#module_PersistTool..PersistTool+clearItems)
    * [.fullKey(key)](#module_PersistTool..PersistTool+fullKey) ⇒ <code>String</code>
    * [.unFullKey(fullKey)](#module_PersistTool..PersistTool+unFullKey) ⇒ <code>String</code>
    * [.getKeys([opts])](#module_PersistTool..PersistTool+getKeys) ⇒ <code>Array</code>

<a name="new_module_PersistTool..PersistTool_new"></a>

#### new PersistTool([options])
**Returns**: <code>Object</code> - instance  

| Param | Type |
| --- | --- |
| [options] | [<code>TypePersistToolOptions</code>](#TypePersistToolOptions) | 

<a name="module_PersistTool..PersistTool+obfuscation"></a>

#### persistTool.obfuscation : <code>Object</code>
**Kind**: instance property of [<code>PersistTool</code>](#module_PersistTool..PersistTool)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| setItem | <code>function</code> | same as `setItem` but uses obfuscation |
| getItem | <code>function</code> | same as `setItem` but uses obfuscation |

<a name="module_PersistTool..PersistTool+setItem"></a>

#### persistTool.setItem(key, value, [opts]) ⇒ <code>String</code> \| <code>undefined</code>
Sets item to the default Storage or Storage specified in opts with `fullKey` as key.

**Kind**: instance method of [<code>PersistTool</code>](#module_PersistTool..PersistTool)  
**Returns**: <code>String</code> \| <code>undefined</code> - `fullKey` on undefined if `isNoop`  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> |  |
| value | <code>\*</code> |  |
| [opts] | <code>Object</code> |  |
| [opts.sessionStorage] | <code>Storage</code> | use this store instead of the default |
| [opts.localStorage] | <code>Storage</code> | use this store instead of the default (is the default anyway) |

<a name="module_PersistTool..PersistTool+getItem"></a>

#### persistTool.getItem(key, [fallback], [opts]) ⇒ <code>\*</code> \| <code>null</code> \| [<code>TypeGetFallback</code>](#TypeGetFallback)
Sets item to the default Storage or Storage specified in opts with `fullKey` as key.

**Kind**: instance method of [<code>PersistTool</code>](#module_PersistTool..PersistTool)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>String</code> |  |  |
| [fallback] | <code>\*</code> | <code></code> |  |
| [opts] | <code>Object</code> |  |  |
| [opts.raw] | <code>Boolean</code> |  | get the raw storage value (instead of parsing with JSON) |
| [opts.sessionStorage] | <code>Storage</code> |  | use this store instead of the default |
| [opts.localStorage] | <code>Storage</code> |  | use this store instead of the default (is the default anyway) |

<a name="module_PersistTool..PersistTool+removeItem"></a>

#### persistTool.removeItem(key, [opts])
**Kind**: instance method of [<code>PersistTool</code>](#module_PersistTool..PersistTool)  
**Void**:   

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> |  |
| [opts] | <code>Object</code> |  |
| [opts.sessionStorage] | <code>Storage</code> | use this store instead of the default |
| [opts.localStorage] | <code>Storage</code> | use this store instead of the default (is the default anyway) |

<a name="module_PersistTool..PersistTool+on"></a>

#### persistTool.on(key, handler)
**Kind**: instance method of [<code>PersistTool</code>](#module_PersistTool..PersistTool)  
**Void**:   

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | listen for StorageEvent changes to this key |
| handler | <code>function</code> |  |

<a name="module_PersistTool..PersistTool+off"></a>

#### persistTool.off([key], [handler])
**Kind**: instance method of [<code>PersistTool</code>](#module_PersistTool..PersistTool)  
**Void**:   

| Param | Type | Description |
| --- | --- | --- |
| [key] | <code>String</code> | stop listening for StorageEvent changes to this key, if omitted and handler omitted all handlers of instance keys will be removed |
| [handler] | <code>function</code> | if omitted all handlers for key will be removed |

<a name="module_PersistTool..PersistTool+clearItems"></a>

#### persistTool.clearItems([opts])
**Kind**: instance method of [<code>PersistTool</code>](#module_PersistTool..PersistTool)  
**Void**:   

| Param | Type | Description |
| --- | --- | --- |
| [opts] | <code>Object</code> |  |
| [opts.sessionStorage] | <code>Storage</code> | use this store instead of the default |
| [opts.localStorage] | <code>Storage</code> | use this store instead of the default (is the default anyway) |

<a name="module_PersistTool..PersistTool+fullKey"></a>

#### persistTool.fullKey(key) ⇒ <code>String</code>
**Kind**: instance method of [<code>PersistTool</code>](#module_PersistTool..PersistTool)  
**Returns**: <code>String</code> - fullKey  

| Param | Type |
| --- | --- |
| key | <code>String</code> | 

<a name="module_PersistTool..PersistTool+unFullKey"></a>

#### persistTool.unFullKey(fullKey) ⇒ <code>String</code>
**Kind**: instance method of [<code>PersistTool</code>](#module_PersistTool..PersistTool)  
**Returns**: <code>String</code> - key  

| Param | Type |
| --- | --- |
| fullKey | <code>String</code> | 

<a name="module_PersistTool..PersistTool+getKeys"></a>

#### persistTool.getKeys([opts]) ⇒ <code>Array</code>
**Kind**: instance method of [<code>PersistTool</code>](#module_PersistTool..PersistTool)  
**Returns**: <code>Array</code> - - `fullKey` values of the instance  

| Param | Type | Description |
| --- | --- | --- |
| [opts] | <code>Object</code> |  |
| [opts.sessionStorage] | <code>Storage</code> | use this store instead of the default |
| [opts.localStorage] | <code>Storage</code> | use this store instead of the default (is the default anyway) |

<a name="module_PersistToolBatch"></a>

## PersistToolBatch
Same API as `PersistTool` with `delay` option that batches the `Storage.setItem` but immedietly sets value to an insternal store for retrival.


* [PersistToolBatch](#module_PersistToolBatch)
    * [~PersistToolBatch](#module_PersistToolBatch..PersistToolBatch)
        * [new PersistToolBatch([options])](#new_module_PersistToolBatch..PersistToolBatch_new)
        * [._](#module_PersistToolBatch..PersistToolBatch+_)

<a name="module_PersistToolBatch..PersistToolBatch"></a>

### PersistToolBatch~PersistToolBatch
**Kind**: inner class of [<code>PersistToolBatch</code>](#module_PersistToolBatch)  

* [~PersistToolBatch](#module_PersistToolBatch..PersistToolBatch)
    * [new PersistToolBatch([options])](#new_module_PersistToolBatch..PersistToolBatch_new)
    * [._](#module_PersistToolBatch..PersistToolBatch+_)

<a name="new_module_PersistToolBatch..PersistToolBatch_new"></a>

#### new PersistToolBatch([options])
**Returns**: <code>Object</code> - instance  

| Param | Type |
| --- | --- |
| [options] | [<code>TypePersistToolBatchOptionsDefault</code>](#TypePersistToolBatchOptionsDefault) | 

<a name="module_PersistToolBatch..PersistToolBatch+_"></a>

#### persistToolBatch.\_
these are exposed for testing purposes
but i dont want them confusing the matter
if you inspect the instance

**Kind**: instance property of [<code>PersistToolBatch</code>](#module_PersistToolBatch..PersistToolBatch)  
<a name="TypeAsNoop"></a>

## TypeAsNoop : <code>Symbol</code>
`PersistTool.AS_NOOP`

**Kind**: global typedef  
<a name="TypePersistToolOptionsDefault"></a>

## TypePersistToolOptionsDefault : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| [prefix] | <code>String</code> | <code>&#x27;&#x27;</code> |  |
| [suffix] | <code>String</code> | <code>&#x27;&#x27;</code> |  |
| [seperator] | <code>String</code> | <code>&#x27;&#x27;</code> |  |
| [secret] | <code>Number</code> \| <code>\*</code> | <code>42</code> | or whatever secret type if using custom obfuscate / deobfuscate |
| [obfuscate] | <code>function</code> | <code>obfuscate</code> | a simple obfuscate |
| [deobfuscate] | <code>function</code> | <code>deobfuscate</code> | a simple deobfuscate |

<a name="TypePersistToolOptions"></a>

## TypePersistToolOptions : [<code>TypePersistToolOptionsDefault</code>](#TypePersistToolOptionsDefault) \| [<code>TypeAsNoop</code>](#TypeAsNoop)
**Kind**: global typedef  
<a name="TypeGetFallback"></a>

## TypeGetFallback : <code>\*</code>
**Kind**: global typedef  
<a name="TypePersistToolBatchOptionsDefault"></a>

## TypePersistToolBatchOptionsDefault : <code>Object</code>
**Kind**: global typedef  
**Extends**: <code>ParsistTool.TypePersistToolOptionsDefault</code>  
**Properties**

| Name | Type | Default |
| --- | --- | --- |
| [delay] | <code>Number</code> | <code>500</code> | 

<a name="TypeBatchAsNoop"></a>

## TypeBatchAsNoop : <code>PersistTool.TypeAsNoop</code>
`PersistToolBatch.AS_NOOP`

**Kind**: global typedef  
<a name="TypePersistToolOptions"></a>

## TypePersistToolOptions : [<code>TypePersistToolBatchOptionsDefault</code>](#TypePersistToolBatchOptionsDefault) \| [<code>TypeBatchAsNoop</code>](#TypeBatchAsNoop)
**Kind**: global typedef  
