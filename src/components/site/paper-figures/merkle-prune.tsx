import { Arrow, Box, Diagram, Label } from './kit';

/** Horizontal centres of the four leaves, measured from the block's left edge. */
const LEAVES = [41, 101, 161, 221];

/** One block of the diagram. With `pruned`, Tx0-2 are gone and Hash01 and Hash2 are kept in their place. */
function Block({ x, pruned, caption }: { x: number; pruned: boolean; caption: string }) {
  const kept = pruned ? [3] : [0, 1, 2, 3];
  return (
    <>
      <Box x={x} y={14} w={262} h={270} />
      <Label x={x + 10} y={28}>
        Block
      </Label>
      <Box x={x + 50} y={22} w={200} h={94} />
      <Label x={x + 60} y={37}>
        Block Header (Block Hash)
      </Label>
      <Box x={x + 68} y={50} w={80} h={22} label="Prev Hash" />
      <Box x={x + 158} y={50} w={62} h={22} label="Nonce" />
      <Box x={x + 90} y={84} w={82} h={22} label="Root Hash" />

      {/* Dashed boxes are hashes that need not be stored. */}
      <Box x={x + 40} y={150} w={62} h={22} label="Hash01" dashed={!pruned} />
      <Box x={x + 160} y={150} w={62} h={22} label="Hash23" dashed />
      {(pruned ? [2, 3] : [0, 1, 2, 3]).map((i) => (
        <Box key={i} x={x + LEAVES[i] - 23} y={208} w={46} h={22} label={`Hash${i}`} dashed={!(pruned && i === 2)} />
      ))}
      {kept.map((i) => (
        <Box key={i} x={x + LEAVES[i] - 23} y={252} w={46} h={22} label={`Tx${i}`} />
      ))}

      {/* Arrows last, so the boxes do not paint over their heads. */}
      {kept.map((i) => (
        <Arrow key={i} from={[x + LEAVES[i], 252]} to={[x + LEAVES[i], 231]} />
      ))}
      {pruned ? null : (
        <>
          <Arrow from={[x + LEAVES[0], 208]} to={[x + 60, 173]} />
          <Arrow from={[x + LEAVES[1], 208]} to={[x + 82, 173]} />
        </>
      )}
      <Arrow from={[x + LEAVES[2], 208]} to={[x + 180, 173]} />
      <Arrow from={[x + LEAVES[3], 208]} to={[x + 202, 173]} />
      <Arrow from={[x + 82, 150]} to={[x + 114, 107]} />
      <Arrow from={[x + 180, 150]} to={[x + 148, 107]} />

      <Label x={x + 131} y={300} anchor="middle" size={12}>
        {caption}
      </Label>
    </>
  );
}

/** The paper's section 7 diagram: a block's Merkle tree before and after pruning three spent transactions. */
export default function MerklePrune() {
  return (
    <Diagram
      width={560}
      height={312}
      smallestLabel={12}
      label="Two drawings of one block. In the first, four transactions are hashed in pairs into Hash01 and Hash23, and those into the root hash in the block header. In the second, transactions 0 to 2 have been pruned: only Hash01, Hash2 and transaction 3 are kept, and the root hash is unchanged."
    >
      <Block x={10} pruned={false} caption="Transactions Hashed in a Merkle Tree" />
      <Block x={288} pruned caption="After Pruning Tx0-2 from the Block" />
    </Diagram>
  );
}
