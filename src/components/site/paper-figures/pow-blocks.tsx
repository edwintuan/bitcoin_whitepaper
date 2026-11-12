import { Arrow, Box, Diagram, Label } from './kit';

function Block({ x }: { x: number }) {
  return (
    <>
      <Label x={x} y={12}>
        Block
      </Label>
      <Box x={x} y={24} w={200} h={104} />
      <Box x={x + 14} y={38} w={82} h={30} label="Prev Hash" />
      <Box x={x + 104} y={38} w={82} h={30} label="Nonce" />
      <Box x={x + 14} y={84} w={42} h={30} label="Tx" />
      <Box x={x + 64} y={84} w={42} h={30} label="Tx" />
      <Label x={x + 132} y={99} anchor="middle">
        ...
      </Label>
    </>
  );
}

/** The paper's section 4 diagram: blocks chained by the hash of the one before, each with its nonce. */
export default function PowBlocks() {
  return (
    <Diagram
      width={560}
      height={140}
      label="Two blocks in a chain. Each holds the previous block's hash, a nonce, and transactions. An arrow runs from each block into the previous-hash field of the next."
    >
      <Block x={56} />
      <Block x={306} />
      {/* Arrows last, so the boxes do not paint over their heads. */}
      <Arrow from={[4, 53]} to={[70, 53]} />
      <Arrow from={[256, 53]} to={[320, 53]} />
      <Arrow from={[506, 53]} to={[556, 53]} />
    </Diagram>
  );
}
