import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parsePointer, applyPatch, PatchError } from '../src/patch.mjs';

describe('RFC 6902 appendix A', () => {
  it('A.1 adds an object member', () => {
    assert.deepEqual(
      applyPatch({ foo: 'bar' }, [{ op: 'add', path: '/baz', value: 'qux' }]),
      { foo: 'bar', baz: 'qux' },
    );
  });
  it('A.2 adds an array element', () => {
    assert.deepEqual(
      applyPatch({ foo: ['bar', 'baz'] }, [{ op: 'add', path: '/foo/1', value: 'qux' }]),
      { foo: ['bar', 'qux', 'baz'] },
    );
  });
  it('A.3 removes, A.4 replaces', () => {
    assert.deepEqual(applyPatch({ baz: 'qux', foo: 'bar' }, [{ op: 'remove', path: '/baz' }]), { foo: 'bar' });
    assert.deepEqual(applyPatch({ foo: 'bar' }, [{ op: 'replace', path: '/foo', value: 'baz' }]), { foo: 'baz' });
  });
  it('A.10 adds nested, A.12 tests values', () => {
    assert.deepEqual(
      applyPatch({ foo: 'bar' }, [{ op: 'add', path: '/child', value: { grandchild: {} } }]),
      { foo: 'bar', child: { grandchild: {} } },
    );
    assert.deepEqual(applyPatch({ baz: 'qux' }, [{ op: 'test', path: '/baz', value: 'qux' }]), { baz: 'qux' });
  });
  it('escapes ~0/~1 and appends with -', () => {
    assert.deepEqual(applyPatch({ '/': 1 }, [{ op: 'test', path: '/~1', value: 1 }]), { '/': 1 });
    assert.deepEqual(applyPatch({ '~': 2 }, [{ op: 'test', path: '/~0', value: 2 }]), { '~': 2 });
    assert.deepEqual(applyPatch([1], [{ op: 'add', path: '/-', value: 2 }]), [1, 2]);
  });
});

describe('errors', () => {
  it('fails test, missing paths and bad ops with index', () => {
    assert.throws(() => applyPatch({ a: 1 }, [{ op: 'test', path: '/a', value: 2 }]), (e) => e.code === 'TEST_FAILED' && e.opIndex === 0);
    assert.throws(() => applyPatch({ a: 1 }, [{ op: 'remove', path: '/b' }]), (e) => e.code === 'NO_SUCH_PATH');
    assert.throws(() => applyPatch({ a: 1 }, [{ op: 'move', path: '/a', value: 1 }]), (e) => e.code === 'BAD_OP');
    assert.throws(() => applyPatch({ a: 1 }, [{ op: 'add', path: 'a', value: 1 }]), (e) => e.code === 'BAD_POINTER');
    assert.throws(() => applyPatch({ a: 1 }, [{ op: 'add', path: '/b' }]), (e) => e.code === 'MISSING_VALUE');
    assert.ok(new PatchError('X') instanceof Error);
  });
  it('leaves the input untouched and replaces root', () => {
    const doc = { a: [1] };
    const out = applyPatch(doc, [{ op: 'add', path: '/a/-', value: 2 }]);
    assert.deepEqual(doc, { a: [1] });
    assert.deepEqual(out, { a: [1, 2] });
    assert.deepEqual(applyPatch([1], [{ op: 'replace', path: '', value: [2] }]), [2]);
  });
});
