import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { makeZip, zipSafe } from '../src/lib/zip.ts';

const enc = new TextEncoder();
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'zip-'));

test('produces an archive that real unzip accepts, with intact contents', () => {
  const files = [
    { name: 'form.pdf', data: enc.encode('%PDF-1.4 pretend form\n') },
    { name: 'receipts/giant.txt', data: enc.encode('milk 5.04\nbread 2.19\n') },
  ];
  const dir = tmp();
  const zip = path.join(dir, 'out.zip');
  fs.writeFileSync(zip, makeZip(files));

  // -t verifies every CRC in the archive.
  assert.match(execFileSync('unzip', ['-t', zip], { encoding: 'utf8' }), /No errors detected/);

  execFileSync('unzip', ['-o', '-q', zip, '-d', dir]);
  assert.equal(fs.readFileSync(path.join(dir, 'receipts/giant.txt'), 'utf8'), 'milk 5.04\nbread 2.19\n');
  assert.equal(fs.readFileSync(path.join(dir, 'form.pdf'), 'utf8'), '%PDF-1.4 pretend form\n');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('non-ASCII names still produce a structurally valid archive', () => {
  // zipSafe strips these before we ever write one, but the writer should not
  // corrupt the archive if a caller passes one through. macOS Info-ZIP mangles
  // such names on extraction, so only integrity is asserted here.
  const dir = tmp();
  const zip = path.join(dir, 'utf8.zip');
  fs.writeFileSync(zip, makeZip([{ name: '영수증.txt', data: enc.encode('hello') }]));
  assert.match(execFileSync('unzip', ['-t', zip], { encoding: 'utf8' }), /No errors detected/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('an empty archive is a bare end-of-central-directory record', () => {
  // Info-ZIP calls a zero-entry archive "empty" and exits non-zero, so check the
  // bytes rather than shelling out. The UI never offers a zip with no files.
  const out = makeZip([]);
  assert.equal(out.length, 22);
  assert.deepEqual([...out.slice(0, 4)], [0x50, 0x4b, 0x05, 0x06]);
});

test('zipSafe strips path separators and control characters', () => {
  assert.equal(zipSafe('../../etc/passwd'), '.._.._etc_passwd');
  assert.equal(zipSafe('Sarah Bae  receipt.jpg'), 'Sarah Bae receipt.jpg');
});
