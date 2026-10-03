import { LucidShared } from '@trgames/shared';

import { makeFallbackParty } from '@/games/lucid/vitest/factories';
import { applyMove } from '@/games/lucid/core/reducer';
import { canPlay } from '@/games/lucid/core/handCards';
import { chooseAutoMove } from '@/games/lucid/core/autoMove';

const MAX_MOVES = 5000;
const LAW_MARK = ' вводит закон';
const BUY_MARK = ' покупает ';

export interface TBalanceRow {
  players: number;
  turnsPerPlayer: number;
  lawsPlaced: number;
  drawnEvents: number;
  cardsBought: number;
}

interface TMeasureParams {
  playerCounts: number[];
  seeds: string[];
  buyer?: boolean;
}

const chooseBuyerMove = (state: LucidShared.TState): LucidShared.TMove | null => {
  const { G, ctx, stateId } = state;
  const playerId = ctx.currentPlayer;

  if (ctx.phase === LucidShared.EPhase.SHOP) {
    const hand = G.cards.hands[playerId] ?? [];
    const affordable = G.players[playerId].resource >= LucidShared.SHOP_PRICE && G.cards.shopOffer.length > 0;
    const discardUid = hand.length >= LucidShared.HAND_LIMIT ? hand[0].uid : undefined;

    return {
      type: LucidShared.EMoveType.BUY_CARD,
      playerId,
      stateId,
      index: affordable ? 0 : null,
      ...(affordable && discardUid !== undefined ? { discardUid } : {}),
    };
  }

  if (ctx.phase === LucidShared.EPhase.CARDS) {
    const hand = G.cards.hands[playerId] ?? [];
    const targetId = G.order.find(id => id !== playerId && G.players[id].position !== G.track.finishId);

    for (const item of hand) {
      const isFate = item.card === LucidShared.EShopCard.HAND_OF_FATE;

      if (canPlay(G, playerId, item, isFate ? targetId : undefined)) {
        return {
          type: LucidShared.EMoveType.PLAY_CARD,
          playerId,
          stateId,
          uid: item.uid,
          ...(isFate ? { targetId } : {}),
        };
      }
    }
  }

  return chooseAutoMove(state);
};

const playParty = (seed: string, playerCount: number, buyer: boolean): Omit<TBalanceRow, 'players'> => {
  let state = makeFallbackParty({ seed, playerCount });
  let lawsPlaced = 0;
  let drawnEvents = 0;
  let cardsBought = 0;

  for (let move = 0; state.ctx.phase !== LucidShared.EPhase.ENDED; move++) {
    const next = buyer ? chooseBuyerMove(state) : chooseAutoMove(state);

    if (move >= MAX_MOVES || !next) {
      throw new Error(`Партия не дошла до победы: сид ${seed}, игроков ${playerCount}`);
    }

    const after = applyMove(state, next);

    const newLines = after.G.log.slice(state.G.log.length);

    lawsPlaced += newLines.filter(line => line.includes(LAW_MARK)).length;
    cardsBought += newLines.filter(line => line.includes(BUY_MARK)).length;

    if (state.G.turn.eventCellId === undefined && after.G.turn.eventCellId !== undefined) {
      drawnEvents++;
    }

    state = after;
  }

  return { turnsPerPlayer: state.ctx.turn / playerCount, lawsPlaced, drawnEvents, cardsBought };
};

export const measureParties = ({ playerCounts, seeds, buyer = false }: TMeasureParams): TBalanceRow[] =>
  playerCounts.map(players => {
    const parties = seeds.map(seed => playParty(seed, players, buyer));
    const mean = (pick: (party: Omit<TBalanceRow, 'players'>) => number) =>
      Math.round((parties.reduce((sum, party) => sum + pick(party), 0) / parties.length) * 10) / 10;

    return {
      players,
      turnsPerPlayer: mean(party => party.turnsPerPlayer),
      lawsPlaced: mean(party => party.lawsPlaced),
      drawnEvents: mean(party => party.drawnEvents),
      cardsBought: mean(party => party.cardsBought),
    };
  });
