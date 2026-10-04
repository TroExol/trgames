import { LucidShared } from '@trgames/shared';

import { freshTurn } from '@/games/lucid/core/turn';
import { buildTrack } from '@/games/lucid/core/track';
import { createRandom } from '@/games/lucid/core/random';
import { createCards } from '@/games/lucid/core/cards';

const START_RESOURCE = 10;

interface TSetupPartyParams {
  seed: string;
  players: { id: LucidShared.TPlayerId; nickname: string }[];
  content: LucidShared.TPartyContent;
}

export const setupParty = ({
  seed,
  players,
  content,
}: TSetupPartyParams): LucidShared.TState => {
  // Разные потоки случайности: иначе форма трека и первые броски связаны
  const track = buildTrack({
    random: createRandom(`${seed}:track`),
    playerCount: players.length,
  });

  return {
    G: {
      players: players.reduce<Record<LucidShared.TPlayerId, LucidShared.TPlayer>>(
        (acc, player) => ({
          ...acc,
          [player.id]: {
            id: player.id,
            nickname: player.nickname,
            position: track.startId,
            resource: START_RESOURCE,
            skipTurns: 0,
          },
        }),
        {},
      ),
      order: players.map(player => player.id),
      track,
      events: content.events,
      theme: content.theme,
      cardNames: content.cardNames,
      random: createRandom(`${seed}:dice`),
      visited: [track.startId],
      log: [],
      branchChoices: [],
      pendingSteps: 0,
      cellHistory: {},
      cards: {
        ...createCards(createRandom(`${seed}:cards`)),
        hands: Object.fromEntries(players.map(player => [player.id, []])),
      },
      turn: freshTurn(),
    },
    ctx: {
      currentPlayer: players[0].id,
      turn: 1,
      numPlayers: players.length,
      phase: LucidShared.EPhase.ROLL,
    },
    stateId: 0,
  };
};
