import { useId } from 'react';
import { Arrow, Box, Diagram, Label } from './kit';

/** Left edge of each transaction box. */
const COLUMNS = [45, 231, 417];

/** The paper's dotted arrows: "Verify" and "Sign". The kit draws solid ones only. */
function Dotted({ points, head }: { points: [number, number][]; head: string }) {
  return (
    <polyline
      className="paper-line"
      strokeDasharray="2.5 2.5"
      points={points.map(([x, y]) => `${x},${y}`).join(' ')}
      markerEnd={`url(#${head})`}
    />
  );
}

/** A label set along a slanted arrow, as "Verify" and "Sign" are in the paper. */
function Slanted({ x, y, angle, children }: { x: number; y: number; angle: number; children: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={12} transform={`rotate(${angle} ${x} ${y})`}>
      {children}
    </text>
  );
}

/** One transaction: the new owner's public key, the hash, and the previous owner's signature. */
function Transaction({ x, owner }: { x: number; owner: number }) {
  return (
    <>
      <Box x={x} y={8} w={128} h={232} />
      <Label x={x + 12} y={25}>
        Transaction
      </Label>
      <Box x={x + 12} y={42} w={104} h={46} lines={[`Owner ${owner}'s`, 'Public Key']} />
      <Box x={x + 36} y={124} w={46} h={24} label="Hash" />
      <Box x={x + 24} y={182} w={82} h={46} lines={[`Owner ${owner - 1}'s`, 'Signature']} />
      <Box x={x + 12} y={275} w={104} h={46} lines={[`Owner ${owner}'s`, 'Private Key']} />
    </>
  );
}

/**
 * The paper's section 2 diagram: a coin as a chain of signatures. Each
 * transaction hashes the previous transaction with the next owner's public
 * key; the previous owner signs that hash with a private key, and anyone can
 * verify the signature with that owner's public key.
 */
export default function TxChain() {
  const head = useId();
  return (
    <Diagram
      width={560}
      height={330}
      label="Three transactions in a row. Each holds the new owner's public key, a hash, and the previous owner's signature. The hash takes in the previous transaction and the new owner's public key, and the previous owner signs it. Beneath each transaction is its new owner's private key. A dotted arrow labelled Sign runs from that private key to the owner's signature in the next transaction, and a dotted arrow labelled Verify runs from the owner's public key to the same signature."
    >
      <defs>
        <marker id={head} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0.5L7.5 4L0 7.5Z" fill="currentColor" />
        </marker>
      </defs>

      {COLUMNS.map((x, index) => (
        <Transaction key={x} x={x} owner={index + 1} />
      ))}

      {/* Arrows last, so the boxes do not paint over their heads. */}
      {COLUMNS.map((x, index) => (
        <g key={x}>
          {/* The previous transaction enters the hash, together with the new owner's public key. */}
          <Arrow from={[index === 0 ? 10 : x - 58, 100]} via={[[x + 47, 100]]} to={[x + 47, 124]} />
          <Arrow from={[x + 70, 88]} to={[x + 70, 124]} />
          <Arrow from={[x + 59, 148]} to={[x + 59, 182]} />
        </g>
      ))}
      {COLUMNS.slice(0, -1).map((x) => (
        <g key={x}>
          <Dotted head={head} points={[[x + 105, 88], [x + 105, 142], [x + 210, 192]]} />
          <Slanted x={x + 160} y={159} angle={25}>
            Verify
          </Slanted>
          <Dotted head={head} points={[[x + 116, 287], [x + 210, 217]]} />
          <Slanted x={x + 158} y={246} angle={-37}>
            Sign
          </Slanted>
        </g>
      ))}
    </Diagram>
  );
}
