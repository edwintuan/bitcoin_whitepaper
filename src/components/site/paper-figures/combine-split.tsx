import { Arrow, Box, Diagram, Label } from './kit';

/** The paper's section 9 diagram: one transaction with several inputs on the left and outputs on the right. */
export default function CombineSplit() {
  return (
    <Diagram
      width={320}
      height={150}
      label="A transaction drawn as a box. Three arrows enter it on the left, into inputs marked In, In and an ellipsis. Two arrows leave it on the right, from outputs marked Out and an ellipsis."
    >
      <Box x={92} y={8} w={136} h={134} />
      <Label x={102} y={23}>
        Transaction
      </Label>
      <Box x={112} y={36} w={38} h={24} label="In" />
      <Box x={112} y={70} w={38} h={24} label="In" />
      <Box x={112} y={104} w={38} h={24} label="..." />
      <Box x={170} y={36} w={38} h={24} label="Out" />
      <Box x={170} y={70} w={38} h={24} label="..." />

      {/* Arrows last, so the boxes do not paint over their heads. */}
      <Arrow from={[40, 48]} to={[112, 48]} />
      <Arrow from={[40, 82]} to={[112, 82]} />
      <Arrow from={[40, 116]} to={[112, 116]} />
      <Arrow from={[208, 48]} to={[280, 48]} />
      <Arrow from={[208, 82]} to={[280, 82]} />
    </Diagram>
  );
}
