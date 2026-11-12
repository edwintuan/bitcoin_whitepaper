import { ACTOR_ORDER } from './actors';
import { SECTIONS } from './sections';
import type { ActorId } from './types';

/**
 * For each actor, the chapters whose "who runs this" block names it, in the
 * order of the paper. Derived from the chapters, so the engineering map can
 * never point at a chapter that does not mention the actor.
 */
export const ACTOR_SECTIONS: Record<ActorId, number[]> = Object.fromEntries(
  ACTOR_ORDER.map((actor) => [
    actor,
    SECTIONS.filter((section) => section.whoRuns.some((item) => item.actor === actor)).map((section) => section.number),
  ]),
) as Record<ActorId, number[]>;
