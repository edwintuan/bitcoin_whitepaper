import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UI } from '@/content/ui';
import { SettingsProvider } from '@/i18n/settings';
import { formatCount } from '@/text/format';
import { COPY } from './copy';
import { FLOWS, PARTS } from './machine';
import type { PartId } from './machine';
import { PartPanel } from './PartPanel';
import { runOnce } from './run';
import type { MachineRun } from './run';

const show = (id: PartId, run: MachineRun = runOnce(), lang: 'en' | 'zh' = 'en') =>
  render(
    <SettingsProvider initialLang={lang} initialDepth="curious">
      <PartPanel id={id} run={run} />
    </SettingsProvider>,
  ).container;

const specimen = (container: HTMLElement) => container.querySelector('.mch-specimen dd')?.textContent ?? '';

describe('what the selected part shows', () => {
  it('marks the signature valid because the node’s check passed', () => {
    const container = show('nodes');
    expect(container.querySelector('.tag-valid')?.textContent).toContain(COPY.valid.en);
    expect(container.querySelector('.tag-invalid')).toBeNull();
  });

  it('says so when the node’s check of the signature fails', () => {
    const container = show('nodes', { ...runOnce(), signatureValid: false });
    expect(container.querySelector('.tag-invalid')?.textContent).toContain(COPY.invalid.en);
    expect(container.querySelector('.tag-valid')).toBeNull();
  });

  it('marks the Merkle branch verified because it checked out against the root', () => {
    const container = show('light');
    expect(container.querySelector('.tag-valid')?.textContent).toContain(COPY.verified.en);
  });

  it('says so when the Merkle branch does not check out', () => {
    const container = show('light', { ...runOnce(), proofValid: false });
    expect(container.querySelector('.tag-invalid')?.textContent).toContain(COPY.unverified.en);
    expect(container.querySelector('.tag-valid')).toBeNull();
  });

  it('takes the number of transactions in the block from the block itself', () => {
    const run = runOnce();
    const label = (container: HTMLElement) => container.querySelector('.mch-specimen dt')?.textContent ?? '';
    expect(label(show('block'))).toContain(`${run.blockTxids.length} transactions`);
    expect(label(show('block', { ...run, blockTxids: [...run.blockTxids, run.txid] }))).toContain('5 transactions');
  });

  it('shows the nonce the header was mined with', () => {
    const run = runOnce();
    expect(specimen(show('pow'))).toContain(formatCount(run.header.nonce));
  });

  it('warns that keys are throwaway where it shows an address, and nowhere else', () => {
    const wallet = show('wallet');
    expect(wallet.textContent).toContain(UI.demoKeysWarning.en);
    // The address is shortened on the page and is not offered whole in a tooltip.
    expect(wallet.querySelector('[title]')).toBeNull();
    for (const part of PARTS) {
      if (part.id !== 'wallet') expect(show(part.id).textContent, part.id).not.toContain(UI.demoKeysWarning.en);
    }
  });
});

describe('the hand-offs listed for a part', () => {
  it('lists what the part receives before what it hands on, one line for each connection', () => {
    for (const part of PARTS) {
      const container = show(part.id);
      const lines = [...container.querySelectorAll('.mch-flows li')];
      const incoming = FLOWS.filter((flow) => flow.to === part.id);
      const outgoing = FLOWS.filter((flow) => flow.from === part.id);
      expect(lines.map((line) => line.getAttribute('data-way'))).toEqual([...incoming.map(() => 'in'), ...outgoing.map(() => 'out')]);
      expect(lines.map((line) => line.textContent)).toEqual([
        ...incoming.map((flow) => COPY.flows[flow.id].taken.en),
        ...outgoing.map((flow) => COPY.flows[flow.id].given.en),
      ]);
    }
  });

  it('names the part at the other end in every Chinese line', () => {
    for (const flow of FLOWS) {
      expect(COPY.flows[flow.id].given.zh, flow.id).toContain(`「${COPY.parts[flow.to].name.zh}」`);
      expect(COPY.flows[flow.id].taken.zh, flow.id).toContain(`「${COPY.parts[flow.from].name.zh}」`);
    }
  });

  it('writes every English line as a sentence about the selected part, without quoting a part’s name as a label', () => {
    for (const flow of FLOWS) {
      for (const line of [COPY.flows[flow.id].given.en, COPY.flows[flow.id].taken.en]) {
        expect(line, flow.id).toMatch(/^[A-Z].*\.$/);
        // The template this replaces printed names with their capitals: "from The chain", "to Transaction".
        expect(line, flow.id).not.toMatch(/ (The chain|Transaction|Mempool|Proof-of-work|Incentive|Light wallet|Network of nodes|Wallet and keys|Block and Merkle root)[ .]/);
      }
    }
  });
});
