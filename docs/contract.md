# Contract — json-patch-core

Pure ESM in `src/patch.mjs`, zero runtime dependencies, Node >= 22.
RFC 6902 ops `add`/`remove`/`replace`/`test` (no `move`/`copy`/`from`);
RFC 6901 pointers with `~0`/`~1`, `-` appends on `add`.

| Export | Result |
| --- | --- |
| `MAX_OPS` (1000) · `MAX_DOC_CHARS` (1M) | Hard bounds. |
| `parsePointer(ptr)` | Unescaped token list (`''` = whole document). |
| `applyPatch(doc, ops)` | New document on a deep clone — input never mutated. First failure throws with `.opIndex`. |

Root: `add`/`replace` swap the whole document, `test` checks it,
`remove` fails `BAD_ROOT_OP`.

Errors: `NOT_STRING` · `BAD_POINTER` · `NOT_ARRAY` · `TOO_MANY_OPS` ·
`BAD_DOC` · `DOC_TOO_BIG` · `BAD_OP` · `BAD_PATH` · `MISSING_VALUE` ·
`NO_SUCH_PATH` · `BAD_INDEX` · `TEST_FAILED` · `BAD_ROOT_OP`.
