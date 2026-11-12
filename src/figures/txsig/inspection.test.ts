import { describe, expect, it } from 'vitest';
import { bytesToHex } from '@/lib/bytes';
import { generateKeyPair } from '@/lib/keys';
import { buildCoin } from './coin';
import { NOTHING_CHECKED, coinOf, rewrite, startStep, verifyOne } from './inspection';

const owners = Array.from({ length: 4 }, generateKeyPair);
const attacker = generateKeyPair().pub;
const honest = buildCoin(owners);
const firstSigner = bytesToHex(owners[0].pub);

describe('what the reader has checked', () => {
  it('starts with nothing rewritten and nothing checked', () => {
    expect(NOTHING_CHECKED.forged).toBeNull();
    expect(NOTHING_CHECKED.checks.size).toBe(0);
    expect(NOTHING_CHECKED.selected).toBeNull();
    expect(NOTHING_CHECKED.restored).toBeNull();
  });

  it('checks a transfer when the reader asks, and only that one', () => {
    const state = verifyOne(NOTHING_CHECKED, honest, 1, firstSigner);
    expect([...state.checks]).toEqual([[1, null]]);
    expect(state.selected).toBe(1);
    // The state it started from is left as it was.
    expect(NOTHING_CHECKED.checks.size).toBe(0);
  });

  it('keeps earlier results when another transfer is verified', () => {
    const one = verifyOne(NOTHING_CHECKED, honest, 0, firstSigner);
    const two = verifyOne(one, honest, 2, firstSigner);
    expect([...two.checks].sort()).toEqual([
      [0, null],
      [2, null],
    ]);
    expect(two.selected).toBe(2);
  });

  it('reports what a payee would find when a transfer of a rewritten coin is verified', () => {
    const coin = coinOf(honest, 1, attacker);
    expect(verifyOne(NOTHING_CHECKED, coin, 1, firstSigner).checks.get(1)).toBe('signature');
    expect(verifyOne(NOTHING_CHECKED, coin, 2, firstSigner).checks.get(2)).toBe('link');
    expect(verifyOne(NOTHING_CHECKED, coin, 0, firstSigner).checks.get(0)).toBeNull();
  });
});

describe('rewriting a transfer', () => {
  it('builds the coin with that one transfer paying the attacker', () => {
    const coin = coinOf(honest, 1, attacker);
    expect(coin[1].to).toBe(bytesToHex(attacker));
    expect(coin[1].sig).toBe(honest[1].sig);
    expect(coin[0]).toEqual(honest[0]);
    expect(coin[2]).toEqual(honest[2]);
    expect(coinOf(honest, null, attacker)).toEqual(honest);
  });

  it('checks the whole coin again', () => {
    const state = rewrite(NOTHING_CHECKED, honest, 1, attacker, firstSigner);
    expect(state.forged).toBe(1);
    expect([...state.checks]).toEqual([
      [0, null],
      [1, 'signature'],
      [2, 'link'],
    ]);
    expect(state.selected).toBe(1);
    expect(state.restored).toBeNull();
  });

  it('rewrites one transfer at a time, and says which one it put back', () => {
    const first = rewrite(NOTHING_CHECKED, honest, 0, attacker, firstSigner);
    const second = rewrite(first, honest, 2, attacker, firstSigner);
    expect(second.forged).toBe(2);
    expect(second.restored).toBe(0);
    expect(second.selected).toBe(2);
    expect([...second.checks]).toEqual([
      [0, null],
      [1, null],
      [2, 'signature'],
    ]);
  });

  it('does not report a transfer as put back when the same one is rewritten again', () => {
    const first = rewrite(NOTHING_CHECKED, honest, 1, attacker, firstSigner);
    expect(rewrite(first, honest, 1, attacker, firstSigner).restored).toBeNull();
  });

  it('puts the rewritten transfer back, with its check on show and passing', () => {
    const forged = rewrite(NOTHING_CHECKED, honest, 1, attacker, firstSigner);
    const back = rewrite(forged, honest, null, attacker, firstSigner);
    expect(back.forged).toBeNull();
    expect(back.selected).toBe(1);
    expect([...back.checks.values()]).toEqual([null, null, null]);
    expect(back.restored).toBeNull();
  });

  it('has nothing to put back when nothing was rewritten', () => {
    expect(rewrite(NOTHING_CHECKED, honest, null, attacker, firstSigner)).toBe(NOTHING_CHECKED);
  });

  it('drops the note about the transfer it put back once the reader does something else', () => {
    const first = rewrite(NOTHING_CHECKED, honest, 0, attacker, firstSigner);
    const second = rewrite(first, honest, 2, attacker, firstSigner);
    const coin = coinOf(honest, second.forged, attacker);
    expect(verifyOne(second, coin, 1, firstSigner).restored).toBeNull();
  });
});

describe('a guided step', () => {
  it('starts from the coin as it was signed: checks made on a rewritten coin go with the rewrite', () => {
    const forged = rewrite(NOTHING_CHECKED, honest, 1, attacker, firstSigner);
    expect(startStep(forged)).toEqual(NOTHING_CHECKED);
  });

  it('keeps the checks of a coin nobody rewrote, and closes the one on show', () => {
    const checked = verifyOne(NOTHING_CHECKED, honest, 0, firstSigner);
    const started = startStep(checked);
    expect(started.checks).toBe(checked.checks);
    expect(started.forged).toBeNull();
    expect(started.selected).toBeNull();
  });
});
