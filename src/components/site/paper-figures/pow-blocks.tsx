import { Arrow, Box, Diagram, Label } from './kit';

/** A block as page 3 draws it: its name inside, top left, over two rows of boxes. */
function Block({ x }: { x: number }) {
  return (
    <>
      <Box x={x} y={8} w={200} h={122} />
      <Label x={x + 14} y={25}>
        Block
      </Label>
      <Box x={x + 14} y={42} w={102} h={30} label="Prev Hash" />
      <Box x={x + 124} y={42} w={62} h={30} label="Nonce" />
      <Box x={x + 14} y={86} w={52} h={30} label="Tx" />
      <Box x={x + 74} y={86} w={52} h={30} label="Tx" />
      <Box x={x + 134} y={86} w={52} h={30} label="..." />
    </>
  );
}

/** The paper's section 4 diagram: blocks chained by the hash of the one before, each with its nonce. */
export default function PowBlocks() {
  return (
    <Diagram
      width={540}
      height={138}
      label="Two blocks in a chain. Each holds the previous block's hash, a nonce and transactions. One arrow enters the first block's previous-hash field; another runs from the first block into the second's."
    >
      <Block x={64} />
      <Block x={314} />
      {/* Arrows last, so the boxes do not paint over their heads. */}
      <Arrow from={[8, 57]} to={[78, 57]} />
      <Arrow from={[264, 57]} to={[328, 57]} />
    </Diagram>
  );
}
