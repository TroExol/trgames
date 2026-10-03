import { LucidShared } from '@trgames/shared';

import { buildTrack } from '@/games/lucid/core/track';
import { createRandom } from '@/games/lucid/core/random';

const START_RESOURCE = 3;

interface TSetupPartyParams {
  seed: string;
  players: { id: LucidShared.TPlayerId; nickname: string }[];
  content: LucidShared.TPartyContent;
}

// Модель отвечает по нику, а не по playerId — здесь роли находят своих игроков.
// Ник, которого нет среди игроков, просто не находит адресата; при повторе ника
// в ответе модели побеждает последняя запись. Ни то ни другое не повод
// перегенерировать мир — просто часть игроков останется без роли
const rolesByNickname = (roles: LucidShared.TRole[] = []): Record<string, string> =>
  roles.reduce<Record<string, string>>((acc, entry) => ({ ...acc, [entry.nickname]: entry.role }), {});

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
  const roleByNickname = rolesByNickname(content.roles);

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
            role: roleByNickname[player.nickname],
          },
        }),
        {},
      ),
      order: players.map(player => player.id),
      track,
      events: content.events,
      theme: content.theme,
      random: createRandom(`${seed}:dice`),
      visited: [track.startId],
      log: [],
      branchChoices: [],
      pendingSteps: 0,
      cellHistory: {},
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
