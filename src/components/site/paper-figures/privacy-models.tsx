import { Arrow, Box, Diagram, Label } from './kit';

/* Boxes come in the paper's two heights, centred on the line of their row. */
const W = 88;
const SMALL = 28;
const TALL = 46;
/** Centre line of the traditional row and of the new one. */
const TOP = 52;
const BOTTOM = 144;
/** How far a wall reaches above and below its row. */
const WALL = 32;

/**
 * The paper's section 10 diagram: the traditional privacy model, where a wall
 * stands between everyone involved and the public, and the new one, where the
 * wall stands between identities and transactions.
 */
export default function PrivacyModels() {
  return (
    <Diagram
      width={560}
      height={178}
      label="Two rows. Traditional privacy model: identities, transactions, the trusted third party and the counterparty are linked in a row, and a wall separates all of them from the public. New privacy model: a wall separates identities from transactions, and transactions flow to the public."
    >
      <Label x={16} y={12}>
        Traditional Privacy Model
      </Label>
      <Box x={16} y={TOP - SMALL / 2} w={W} h={SMALL} label="Identities" />
      <Box x={126} y={TOP - SMALL / 2} w={W} h={SMALL} label="Transactions" />
      <Box x={246} y={TOP - TALL / 2} w={W} h={TALL} lines={['Trusted', 'Third Party']} />
      <Box x={366} y={TOP - TALL / 2} w={W} h={TALL} label="Counterparty" />
      <Box x={486} y={TOP - TALL / 2} w={70} h={TALL} label="Public" />

      <Label x={16} y={104}>
        New Privacy Model
      </Label>
      <Box x={16} y={BOTTOM - SMALL / 2} w={W} h={SMALL} label="Identities" />
      <Box x={146} y={BOTTOM - SMALL / 2} w={W} h={SMALL} label="Transactions" />
      <Box x={266} y={BOTTOM - TALL / 2} w={W} h={TALL} label="Public" />

      {/* Lines, arrows and walls last, so the boxes do not paint over them. */}
      <Arrow from={[104, TOP]} to={[126, TOP]} head={false} />
      <Arrow from={[214, TOP]} to={[246, TOP]} />
      <Arrow from={[334, TOP]} to={[366, TOP]} />
      <Arrow from={[470, TOP - WALL]} to={[470, TOP + WALL]} head={false} />
      <Arrow from={[125, BOTTOM - WALL]} to={[125, BOTTOM + WALL]} head={false} />
      <Arrow from={[234, BOTTOM]} to={[266, BOTTOM]} />
    </Diagram>
  );
}
