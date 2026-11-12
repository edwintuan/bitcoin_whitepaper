import { Arrow, Box, Diagram, Label } from './kit';

/** Left edges of the three block headers. */
const HEADERS = [24, 228, 432];

function Header({ x }: { x: number }) {
  return (
    <>
      <Box x={x} y={30} w={176} h={92} />
      <Label x={x + 10} y={45}>
        Block Header
      </Label>
      <Box x={x + 16} y={58} w={76} h={22} label="Prev Hash" />
      <Box x={x + 102} y={58} w={60} h={22} label="Nonce" />
      <Box x={x + 36} y={90} w={84} h={22} label="Merkle Root" />
    </>
  );
}

/**
 * The paper's section 8 diagram: the longest proof-of-work chain as three
 * block headers, with the Merkle branch for Tx3 hanging from the middle one.
 */
export default function SpvChain() {
  const mid = HEADERS[1];
  return (
    <Diagram
      width={632}
      height={290}
      smallestLabel={12}
      label="The longest proof-of-work chain drawn as three block headers, each holding a previous hash, a nonce and a Merkle root. Under the middle header hangs the Merkle branch for transaction 3: Hash01 and Hash23 lead to the Merkle root, Hash2 and Hash3 lead to Hash23, and transaction 3 leads to Hash3."
    >
      <Label x={6} y={12} size={12}>
        Longest Proof-of-Work Chain
      </Label>
      {HEADERS.map((x) => (
        <Header key={x} x={x} />
      ))}

      {/* The branch: solid boxes are the hashes handed over, dashed ones are computed. */}
      <Box x={mid - 10} y={156} w={62} h={22} label="Hash01" />
      <Box x={mid + 108} y={156} w={62} h={22} label="Hash23" dashed />
      <Box x={mid + 78} y={208} w={50} h={22} label="Hash2" />
      <Box x={mid + 148} y={208} w={50} h={22} label="Hash3" dashed />
      <Box x={mid + 152} y={254} w={42} h={22} label="Tx3" />
      <Label x={mid + 214} y={192} size={12}>
        Merkle Branch for Tx3
      </Label>

      {/* Arrows last, so the boxes do not paint over their heads. */}
      <Arrow from={[2, 69]} to={[HEADERS[0] + 16, 69]} />
      <Arrow from={[HEADERS[0] + 176, 69]} to={[HEADERS[1] + 16, 69]} />
      <Arrow from={[HEADERS[1] + 176, 69]} to={[HEADERS[2] + 16, 69]} />
      <Arrow from={[HEADERS[2] + 176, 69]} to={[630, 69]} />

      <Arrow from={[mid + 30, 156]} to={[mid + 62, 113]} />
      <Arrow from={[mid + 132, 156]} to={[mid + 96, 113]} />
      <Arrow from={[mid + 103, 208]} to={[mid + 128, 179]} />
      <Arrow from={[mid + 173, 208]} to={[mid + 152, 179]} />
      <Arrow from={[mid + 173, 254]} to={[mid + 173, 231]} />
    </Diagram>
  );
}
