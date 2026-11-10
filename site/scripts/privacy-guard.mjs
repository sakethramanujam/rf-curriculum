#!/usr/bin/env node
/**
 * Privacy guard: fail the build if the published site leaks local-network or
 * personal identifiers. Run after `vite build`:  node scripts/privacy-guard.mjs dist
 *
 * Literal patterns are generic (private IPs, home-directory paths). Private names
 * (hostnames, usernames, handles) are checked by SHA-256 so the public repo never
 * contains them in plain text. To add one, append sha256(lowercase name) and its length.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LITERALS = ['192.168.', '/home/', '/Users/'];
/** Any dotted quad in 100.0.0.0/8 (covers Tailscale's 100.64.0.0/10 CGNAT range). */
export const IP100 = /(^|[^0-9.])(100\.\d{1,3}\.\d{1,3}\.\d{1,3})(?![0-9])/;
export const HASHED = [
  { len: 7, sha256: '834cc12fc35adde7d0651130fc5fb4826c18d9fdf44544ca79bef40d052d40f9' },
  { len: 8, sha256: 'e8c7a8ff7336f955315e22b25b399247803bb2546d2b3fc43105237ea793b843' },
  { len: 12, sha256: '0cd0191d000ee3802c98212d8b4a77e4966e2096d35f98d550a985ee6c3b9405' },
  { len: 12, sha256: 'd45cc15f2069bce2a36bd32322ba3d430cac4f69c6b7c5a3232079e3e36fb70a' },
];

const TEXT_EXT = new Set(['.html', '.htm', '.js', '.mjs', '.cjs', '.css', '.json', '.svg', '.txt', '.md', '.map', '.xml', '.webmanifest', '']);
const sha = (s) => createHash('sha256').update(s).digest('hex');

/** Returns a list of human-readable findings for one text blob. */
export function scanText(text, hashed = HASHED) {
  const out = [];
  for (const lit of LITERALS) {
    const i = text.indexOf(lit);
    if (i >= 0) out.push(`literal "${lit}" at offset ${i}`);
  }
  const m = IP100.exec(text);
  if (m) out.push(`100.x.x.x address ${m[2]}`);
  const lower = text.toLowerCase();
  const byLen = new Map();
  for (const h of hashed) {
    if (!byLen.has(h.len)) byLen.set(h.len, new Set());
    byLen.get(h.len).add(h.sha256);
  }
  // Slide over runs of [a-z0-9] only; names never span punctuation.
  const runs = lower.match(/[a-z0-9]+/g) ?? [];
  const seen = new Set();
  for (const run of runs) {
    for (const [len, set] of byLen) {
      if (run.length < len) continue;
      for (let i = 0; i + len <= run.length; i++) {
        const w = run.slice(i, i + len);
        if (seen.has(w)) continue;
        seen.add(w);
        if (set.has(sha(w))) out.push(`private identifier (sha256 match, ${len} chars)`);
      }
    }
  }
  return out;
}

function* walk(dir) {
  if (!statSync(dir).isDirectory()) { yield dir; return; }
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

function main() {
  const dirs = process.argv.slice(2);
  if (!dirs.length) dirs.push('dist');
  let bad = 0, files = 0;
  for (const d of dirs) {
    for (const f of walk(d)) {
      if (!TEXT_EXT.has(extname(f).toLowerCase())) continue;
      files++;
      const hits = scanText(readFileSync(f, 'utf8'));
      for (const h of hits) { bad++; console.error(`✗ ${relative(process.cwd(), f)}: ${h}`); }
    }
  }
  if (bad) { console.error(`privacy-guard: ${bad} finding(s) in ${files} files`); process.exit(1); }
  console.log(`privacy-guard: ${files} files clean`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
