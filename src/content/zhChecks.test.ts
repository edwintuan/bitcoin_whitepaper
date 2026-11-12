import { describe, expect, it } from 'vitest';
import { findZhProblems } from './zhChecks';

describe('findZhProblems', () => {
  it('accepts Hong Kong usage', () => {
    expect(findZhProblems('礦工不斷更換隨機數，直到區塊的哈希值以足夠多的零開頭。')).toEqual([]);
    expect(findZhProblems('軟件錢包透過互聯網把交易廣播到網絡，並保護用戶的私隱。')).toEqual([]);
  });

  it('flags Taiwan and mainland renderings and names the preferred one', () => {
    expect(findZhProblems('雜湊函數')).toEqual(['「雜湊」→「哈希」']);
    expect(findZhProblems('保護隱私，並把找零退回')).toEqual(['「隱私」→「私隱」', '「找零」→「找續」']);
    expect(findZhProblems('軟體與硬體')).toEqual(['「軟體」→「軟件」', '「硬體」→「硬件」']);
  });

  it('keeps to one spelling where Hong Kong writing has two', () => {
    // The site writes 賬 for accounts and 關聯 for a link between things, as the paper's translation does.
    expect(findZhProblems('銀行帳戶')).toEqual(['「帳戶」→「賬戶」']);
    expect(findZhProblems('兩筆交易之間的關連')).toEqual(['「關連」→「關聯」']);
    expect(findZhProblems('賬戶之間的關聯')).toEqual([]);
  });

  it('flags simplified characters', () => {
    expect(findZhProblems('这个区块')).toEqual(['simplified: 这个区块']);
    expect(findZhProblems('驗證簽名')).toEqual([]);
  });

  it('reports each problem once', () => {
    expect(findZhProblems('網路、網路、網路')).toEqual(['「網路」→「網絡」']);
  });

  it('ignores Latin text and code', () => {
    expect(findZhProblems('SHA-256 與 secp256k1')).toEqual([]);
  });
});
