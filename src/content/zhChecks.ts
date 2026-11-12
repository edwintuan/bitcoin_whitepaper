/**
 * Guards for the Traditional Chinese copy. The site writes Hong Kong usage;
 * these catch Taiwan or mainland renderings and stray simplified characters.
 * Used by content tests only.
 */

/** Rendering we do not use → the one we do. Longer entries first where they overlap. */
const PREFERRED: [avoid: string, use: string][] = [
  ['雜湊', '哈希'],
  ['數位簽章', '數碼簽署'],
  ['數位貨幣', '數碼貨幣'],
  ['公開金鑰', '公鑰'],
  ['私密金鑰', '私鑰'],
  ['金鑰', '密鑰'],
  ['網際網路', '互聯網'],
  ['網路', '網絡'],
  ['軟體', '軟件'],
  ['硬體', '硬件'],
  ['隱私', '私隱'],
  ['找零', '找續'],
  ['區塊標頭', '區塊頭'],
  ['梅克爾', '默克爾'],
  ['卜瓦松', '泊松'],
  ['機率', '概率'],
  ['資料庫', '數據庫'],
  ['使用者', '用戶'],
  ['線上', '網上'],
  ['通貨膨脹', '通脹'],
  ['商家', '商戶'],
  ['品質', '質素'],
  // Hong Kong writing has both forms of these; the site keeps to the one the paper's translation uses.
  ['帳戶', '賬戶'],
  ['帳目', '賬目'],
  ['記帳', '記賬'],
  ['關連', '關聯'],
];

/** Characters that exist only in Simplified Chinese. A sample, not the full set. */
const SIMPLIFIED = /[这个们为说过对时会发问题现实验证书签钥块链节点矿币络计类从该并应开关无专业务区]+/g;

/**
 * Returns a list of problems found in a Traditional Chinese string; empty when clean.
 * Each distinct problem is reported once.
 */
export function findZhProblems(text: string): string[] {
  const problems: string[] = [];
  let rest = text;
  for (const [avoid, use] of PREFERRED) {
    if (rest.includes(avoid)) {
      problems.push(`「${avoid}」→「${use}」`);
      // Remove it so a shorter entry does not report the same span again.
      rest = rest.split(avoid).join('　');
    }
  }
  const simplified = text.match(SIMPLIFIED);
  if (simplified) {
    for (const run of new Set(simplified)) problems.push(`simplified: ${run}`);
  }
  return problems;
}
