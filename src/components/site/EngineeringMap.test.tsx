import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ACTORS, ACTOR_ORDER } from '@/content/actors';
import { ACTOR_SECTIONS } from '@/content/actorSections';
import { SECTION_IDS } from '@/content/types';
import { SettingsProvider } from '@/i18n/settings';
import { EngineeringMap } from './EngineeringMap';

function setup() {
  render(
    <SettingsProvider initialLang="en" initialDepth="curious">
      <EngineeringMap />
    </SettingsProvider>,
  );
}

describe('EngineeringMap', () => {
  it('has one row per actor, in the order a payment meets them', () => {
    setup();
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual(ACTOR_ORDER.map((id) => ACTORS[id].name.en));
  });

  it('links each actor to every chapter that names it', () => {
    setup();
    const rows = screen.getAllByRole('row').slice(1);
    ACTOR_ORDER.forEach((id, index) => {
      const links = within(rows[index])
        .getAllByRole('link')
        .map((link) => link.getAttribute('href'));
      expect(links, id).toEqual(ACTOR_SECTIONS[id].map((number) => `#${SECTION_IDS[number]}`));
    });
  });
});
