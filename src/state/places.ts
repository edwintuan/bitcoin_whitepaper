/**
 * Where the reader is, given the tops of the places on the page in order and
 * the height of the line they are taken to be reading at: the index of the
 * last place whose top the line has passed, or -1 above the first.
 */
export function placeAt(tops: readonly number[], line: number): number {
  let index = -1;
  for (let i = 0; i < tops.length && tops[i] <= line; i++) index = i;
  return index;
}
