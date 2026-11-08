#!/usr/bin/env node
// Demo: RFC-style patch, asserts exact output. --assert exits non-zero on mismatch.
import { applyPatch } from '../src/patch.mjs';

let failed = 0;
const got = applyPatch({ foo: 'bar' }, [
  { op: 'add', path: '/baz', value: 'qux' },
  { op: 'test', path: '/baz', value: 'qux' },
]);
const pass = JSON.stringify(got) === JSON.stringify({ foo: 'bar', baz: 'qux' });
console.log(`${pass ? 'PASS' : 'FAIL'} add+test -> ${JSON.stringify(got)}`);
if (!pass) failed++;
if (process.argv.includes('--assert') && failed > 0) process.exit(1);
if (failed > 0) process.exitCode = 1;
console.log(failed === 0 ? 'demo: all cases as expected' : `demo: ${failed} mismatch(es)`);
