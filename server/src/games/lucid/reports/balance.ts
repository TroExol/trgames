import { LucidShared } from '@trgames/shared';

import { makeFallbackParty } from '@/games/lucid/vitest/factories';
import { applyMove } from '@/games/lucid/core/reducer';
import { chooseAutoMove } from '@/games/lucid/core/autoMove';

const MAX_MOVES = 5000;
const LAW_MARK = ' вводит закон';

export interface TBalanceRow {
  players: number;
  turnsPerPlayer: number;
  lawsPlaced: number;
  drawnEvents: number;
}

interface TMeasureParams {
  playerCounts: number[];
  seeds: string[];
}

const playParty = (seed: string, playerCount: number): Omit<TBalanceRow, 'players'> => {
  let state = makeFallbackParty({ seed, playerCount });
  let lawsPlaced = 0;
  let drawnEvents = 0;

  for (let move = 0; state.ctx.phase !== LucidShared.EPhase.ENDED; move++) {
    const next = chooseAutoMove(state);

    if (move >= MAX_MOVES || !next) {
      throw new Error(`Партия не дошла до победы: сид ${seed}, игроков ${playerCount}`);
    }

    const after = applyMove(state, next);

    lawsPlaced += after.G.log.slice(state.G.log.length).filter(line => line.includes(LAW_MARK)).length;

    if (state.G.turn.eventCellId === undefined && after.G.turn.eventCellId !== undefined) {
      drawnEvents++;
    }

    state = after;
  }

  return { turnsPerPlayer: state.ctx.turn / playerCount, lawsPlaced, drawnEvents };
};

export const measureParties = ({ playerCounts, seeds }: TMeasureParams): TBalanceRow[] =>
  playerCounts.map(players => {
    const parties = seeds.map(seed => playParty(seed, players));
    const mean = (pick: (party: Omit<TBalanceRow, 'players'>) => number) =>
      Math.round((parties.reduce((sum, party) => sum + pick(party), 0) / parties.length) * 10) / 10;

    return {
      players,
      turnsPerPlayer: mean(party => party.turnsPerPlayer),
      lawsPlaced: mean(party => party.lawsPlaced),
      drawnEvents: mean(party => party.drawnEvents),
    };
  });
