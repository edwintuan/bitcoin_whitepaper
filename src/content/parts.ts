import type { L, PartNumber } from './types';

export interface PartDef {
  number: PartNumber;
  roman: string;
  title: L<string>;
  /** One line on what this stretch of the paper is for. */
  blurb: L<string>;
  /** Section numbers, in order. */
  sections: number[];
}

/** The paper's thirteen parts, in its own order, grouped into six stretches. */
export const PARTS: PartDef[] = [
  {
    number: 1,
    roman: 'I',
    title: { en: 'The Problem', zh: '問題' },
    blurb: {
      en: 'Paying someone over the Internet needs a middleman. The paper asks whether it has to.',
      zh: '在互聯網上付款，總得經過一個中間人。白皮書問的是：非如此不可嗎？',
    },
    sections: [0, 1],
  },
  {
    number: 2,
    roman: 'II',
    title: { en: 'Owning a Coin', zh: '擁有一枚幣' },
    blurb: {
      en: 'Signatures prove who owns a coin. They cannot prove it was not spent twice.',
      zh: '簽署可以證明一枚幣屬於誰，卻證明不了它沒有被花過兩次。',
    },
    sections: [2],
  },
  {
    number: 3,
    roman: 'III',
    title: { en: 'Ordering History', zh: '為歷史排序' },
    blurb: {
      en: 'If everyone agrees which payment came first, double-spending stops. Agreement is bought with work.',
      zh: '只要所有人對「哪筆付款在先」達成一致，雙重支付便無從發生。這份一致，是用工作量換來的。',
    },
    sections: [3, 4],
  },
  {
    number: 4,
    roman: 'IV',
    title: { en: 'Running the Network', zh: '運行網絡' },
    blurb: {
      en: 'Thousands of strangers keep one ledger, and are paid to keep it honestly.',
      zh: '成千上萬互不相識的人共同維護一本賬，並因誠實維護而得到報酬。',
    },
    sections: [5, 6],
  },
  {
    number: 5,
    roman: 'V',
    title: { en: 'Making It Practical', zh: '讓它實用' },
    blurb: {
      en: 'Saving disk space, checking a payment from a phone, making change, staying private.',
      zh: '節省磁碟空間、用手機核實一筆付款、找續，以及保護私隱。',
    },
    sections: [7, 8, 9, 10],
  },
  {
    number: 6,
    roman: 'VI',
    title: { en: 'Is It Safe?', zh: '它安全嗎' },
    blurb: {
      en: 'How long to wait before a payment cannot be undone, with the arithmetic shown.',
      zh: '要等多久，一筆付款才無法撤回？算式全部列出。',
    },
    sections: [11, 12],
  },
];

export function partOfSection(sectionNumber: number): PartDef {
  const part = PARTS.find((p) => p.sections.includes(sectionNumber));
  if (!part) throw new Error(`No part contains section ${sectionNumber}`);
  return part;
}
