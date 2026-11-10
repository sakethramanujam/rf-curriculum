import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { scanText } from '../scripts/privacy-guard.mjs';

const h = (s: string) => ({ len: s.length, sha256: createHash('sha256').update(s).digest('hex') });

describe('privacy guard', () => {
  it('flags private IPs and home paths', () => {
    expect(scanText('fetch("http://192.168.1.10:8123")').length).toBe(1);
    expect(scanText('ssh 100.101.102.103').length).toBe(1);
    expect(scanText('cd /home/someone && ls').length).toBe(1);
    expect(scanText('open /Users/someone').length).toBe(1);
  });
  it('ignores ordinary numbers and URLs', () => {
    expect(scanText('const x = 100.5; const y = "1.100.2"; https://s3r1.co/rf-curriculum/')).toEqual([]);
  });
  it('matches hashed identifiers case-insensitively inside larger tokens', () => {
    const rules = [h('zebrafish')];
    expect(scanText('host: ZebraFish.local', rules).length).toBe(1);
    expect(scanText('my-zebrafish42-box', rules).length).toBe(1);
    expect(scanText('zebra fish', rules)).toEqual([]);
  });
});
