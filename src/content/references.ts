/**
 * The paper's reference list and the facts that identify the paper itself.
 * Reference text is verbatim from page 9 of the PDF, straight quotes included;
 * the bracketed number is held in `n`, not repeated in `text`.
 */

export const REFERENCES: readonly { n: number; text: string }[] = [
  { n: 1, text: 'W. Dai, "b-money," http://www.weidai.com/bmoney.txt, 1998.' },
  {
    n: 2,
    text: 'H. Massias, X.S. Avila, and J.-J. Quisquater, "Design of a secure timestamping service with minimal trust requirements," In 20th Symposium on Information Theory in the Benelux, May 1999.',
  },
  {
    n: 3,
    text: 'S. Haber, W.S. Stornetta, "How to time-stamp a digital document," In Journal of Cryptology, vol 3, no 2, pages 99-111, 1991.',
  },
  {
    n: 4,
    text: 'D. Bayer, S. Haber, W.S. Stornetta, "Improving the efficiency and reliability of digital time-stamping," In Sequences II: Methods in Communication, Security and Computer Science, pages 329-334, 1993.',
  },
  {
    n: 5,
    text: 'S. Haber, W.S. Stornetta, "Secure names for bit-strings," In Proceedings of the 4th ACM Conference on Computer and Communications Security, pages 28-35, April 1997.',
  },
  {
    n: 6,
    text: 'A. Back, "Hashcash - a denial of service counter-measure," http://www.hashcash.org/papers/hashcash.pdf, 2002.',
  },
  {
    n: 7,
    text: 'R.C. Merkle, "Protocols for public key cryptosystems," In Proc. 1980 Symposium on Security and Privacy, IEEE Computer Society, pages 122-133, April 1980.',
  },
  { n: 8, text: 'W. Feller, "An introduction to probability theory and its applications," 1957.' },
];

export const WHITEPAPER_META = {
  title: 'Bitcoin: A Peer-to-Peer Electronic Cash System',
  author: 'Satoshi Nakamoto',
  url: 'https://bitcoin.org/bitcoin.pdf',
  sha256: 'b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553',
} as const;
