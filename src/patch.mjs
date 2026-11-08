// SPDX-License-Identifier: MIT
// RFC 6902 JSON Patch subset: add/remove/replace/test with RFC 6901
// pointers. Applied to a deep clone (input never mutated); first failure
// throws with .opIndex. No network, no I/O.

export const MAX_OPS = 1000;
export const MAX_DOC_CHARS = 1000000;

export class PatchError extends Error {
  constructor(code, detail = '', opIndex = undefined) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = 'PatchError';
    this.code = code;
    if (opIndex !== undefined) this.opIndex = opIndex;
  }
}

/** Split an RFC 6901 pointer into unescaped tokens. */
export function parsePointer(ptr) {
  if (typeof ptr !== 'string') throw new PatchError('NOT_STRING');
  if (ptr === '') return [];
  if (!ptr.startsWith('/')) throw new PatchError('BAD_POINTER');
  return ptr.slice(1).split('/').map((t) => t.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function clone(doc) {
  return JSON.parse(JSON.stringify(doc));
}

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Resolve parent of tokens; returns { parent, key }. Creates nothing. */
function resolveParent(doc, tokens, opIndex, forAdd) {
  let node = doc;
  for (let i = 0; i < tokens.length - 1; i++) {
    const t = tokens[i];
    if (Array.isArray(node)) {
      if (!/^(0|[1-9][0-9]*)$/.test(t) || Number(t) >= node.length) {
        throw new PatchError('NO_SUCH_PATH', tokens.slice(0, i + 1).join('/'), opIndex);
      }
      node = node[Number(t)];
    } else if (isObject(node)) {
      if (!(t in node)) throw new PatchError('NO_SUCH_PATH', tokens.slice(0, i + 1).join('/'), opIndex);
      node = node[t];
    } else {
      throw new PatchError('NO_SUCH_PATH', tokens.slice(0, i + 1).join('/'), opIndex);
    }
  }
  const key = tokens[tokens.length - 1];
  if (tokens.length === 0) return { parent: null, key: null };
  void forAdd;
  return { parent: node, key };
}

/** Apply ops to a clone; returns the new document. */
export function applyPatch(doc, ops) {
  if (!Array.isArray(ops)) throw new PatchError('NOT_ARRAY');
  if (ops.length > MAX_OPS) throw new PatchError('TOO_MANY_OPS');
  let out;
  try {
    out = clone(doc);
  } catch {
    throw new PatchError('BAD_DOC');
  }
  if (JSON.stringify(out).length > MAX_DOC_CHARS) throw new PatchError('DOC_TOO_BIG');
  ops.forEach((op, i) => {
    if (!op || typeof op !== 'object') throw new PatchError('BAD_OP', '', i);
    const { op: name, path, value } = op;
    if (!['add', 'remove', 'replace', 'test'].includes(name)) throw new PatchError('BAD_OP', '', i);
    if (typeof path !== 'string') throw new PatchError('BAD_PATH', '', i);
    const tokens = parsePointer(path);
    if ((name === 'add' || name === 'replace' || name === 'test') && !('value' in op)) {
      throw new PatchError('MISSING_VALUE', '', i);
    }
    if (tokens.length === 0) {
      if (name === 'test') {
        if (JSON.stringify(out) !== JSON.stringify(value)) throw new PatchError('TEST_FAILED', '', i);
      } else if (name === 'remove') {
        throw new PatchError('BAD_ROOT_OP', '', i);
      } else {
        out = clone(value); // add/replace the whole document
      }
      return;
    }
    const { parent, key } = resolveParent(out, tokens, i, name === 'add');
    if (parent === null) throw new PatchError('BAD_PATH', '', i);
    if (name === 'test') {
      const actual = Array.isArray(parent) ? parent[Number(key)] : parent[key];
      if (JSON.stringify(actual) !== JSON.stringify(value)) throw new PatchError('TEST_FAILED', '', i);
      return;
    }
    if (Array.isArray(parent)) {
      if (key === '-' && name === 'add') { parent.push(clone(value)); return; }
      if (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) > parent.length || (name !== 'add' && Number(key) >= parent.length)) {
        throw new PatchError(name === 'add' ? 'BAD_INDEX' : 'NO_SUCH_PATH', '', i);
      }
      const idx = Number(key);
      if (name === 'add') parent.splice(idx, 0, clone(value));
      else if (name === 'remove') parent.splice(idx, 1);
      else parent[idx] = clone(value);
      return;
    }
    if (!isObject(parent)) throw new PatchError('NO_SUCH_PATH', '', i);
    if (name === 'add') parent[key] = clone(value);
    else if (name === 'remove') {
      if (!(key in parent)) throw new PatchError('NO_SUCH_PATH', '', i);
      delete parent[key];
    } else {
      if (!(key in parent)) throw new PatchError('NO_SUCH_PATH', '', i);
      parent[key] = clone(value);
    }
  });
  return out;
}
