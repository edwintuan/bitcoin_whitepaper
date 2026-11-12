import { Arrow, Box, Diagram, Label } from './kit';

/** A block of items, and above it the hash that the block and the previous hash feed into. */
function Stamp({ x }: { x: number }) {
  return (
    <>
      <Box x={x + 48} y={6} w={48} h={34} label="Hash" />
      <Box x={x} y={56} w={190} h={72} />
      <Label x={x + 12} y={72}>
        Block
      </Label>
      <Box x={x + 12} y={90} w={48} h={24} label="Item" />
      <Box x={x + 71} y={90} w={48} h={24} label="Item" />
      <Box x={x + 130} y={90} w={48} h={24} label="..." />
    </>
  );
}

/** The paper's section 3 diagram: each hash covers a block of items and the hash before it. */
export default function TimestampChain() {
  return (
    <Diagram
      width={560}
      height={134}
      label="Two blocks of items. Each block is hashed together with the previous hash, and the resulting hash feeds into the hash of the next block."
    >
      <Stamp x={70} />
      <Stamp x={295} />
      {/* Arrows last, so the boxes do not paint over their heads. */}
      <Arrow from={[36, 17]} to={[118, 17]} />
      <Arrow from={[82, 56]} via={[[82, 29]]} to={[118, 29]} />
      <Arrow from={[166, 17]} to={[343, 17]} />
      <Arrow from={[307, 56]} via={[[307, 29]]} to={[343, 29]} />
      <Arrow from={[391, 17]} to={[522, 17]} />
    </Diagram>
  );
}
