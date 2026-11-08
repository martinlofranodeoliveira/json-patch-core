# json-patch-core

RFC 6902 JSON Patch subset: add/remove/replace/test with strict
pointers, applied to a clone. Zero runtime dependencies, Node >= 22.

Part of the LOFRANO TECNOLOGIA open-source lab. MIT.

```js
import { applyPatch } from './src/patch.mjs';
applyPatch({ foo: 'bar' }, [{ op: 'add', path: '/baz', value: 'qux' }]);
// { foo: 'bar', baz: 'qux' }
```

```sh
npm test          # 7 tests, node:test, no dependencies
npm run demo
```

At most 1000 ops; input never mutated. MIT — see `LICENSE`.
[Versão em português](README.pt-BR.md).
