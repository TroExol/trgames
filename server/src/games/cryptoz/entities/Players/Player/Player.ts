import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import { CryptozShared } from '@trgames/shared';

import type { AbstractStoneShard } from '@/games/cryptoz/entities/StoneShards/AbstractStoneShard';
import type { TurnStartedTrigger } from '@/games/cryptoz/customTriggers/TurnStartedTrigger';
import type { StoneShardTookTrigger } from '@/games/cryptoz/customTriggers/StoneShardTookTrigger';
import type { StoneShardDiscardedTrigger } from '@/games/cryptoz/customTriggers/StoneShardDiscardedTrigger';
import type { KillingTrigger } from '@/games/cryptoz/customTriggers/KillingTrigger';
import type { KilledTrigger } from '@/games/cryptoz/customTriggers/KilledTrigger';
import type { HealedTrigger } from '@/games/cryptoz/customTriggers/HealedTrigger';
import type { HandFilledOnTurnEndTrigger } from '@/games/cryptoz/customTriggers/HandFilledOnTurnEndTrigger';
import type { DamageTrigger } from '@/games/cryptoz/customTriggers/DamageTrigger';
import type { DamageTookTrigger } from '@/games/cryptoz/customTriggers/DamageTookTrigger';
import type { CardTookTrigger } from '@/games/cryptoz/customTriggers/CardTookTrigger';
import type { CardRemovedTrigger } from '@/games/cryptoz/customTriggers/CardRemovedTrigger';
import type { CardPlayedTrigger } from '@/games/cryptoz/customTriggers/CardPlayedTrigger';
import type { CardDiscardedTrigger } from '@/games/cryptoz/customTriggers/CardDiscardedTrigger';
import type { CardBoughtTrigger } from '@/games/cryptoz/customTriggers/CardBoughtTrigger';
import type { AbilityTookTrigger } from '@/games/cryptoz/customTriggers/AbilityTookTrigger';
import type { AbilityDiscardedTrigger } from '@/games/cryptoz/customTriggers/AbilityDiscardedTrigger';
import type { PriceModifier } from '@/games/cryptoz/customModifiers/PriceModifier';
import type { HealModifier } from '@/games/cryptoz/customModifiers/HealModifier';
import type { GloryShardsModifier } from '@/games/cryptoz/customModifiers/GloryShardsModifier';
import type { DamageModifier } from '@/games/cryptoz/customModifiers/DamageModifier';
import type { CountStoneShardsModifier } from '@/games/cryptoz/customModifiers/CountStoneShardsModifier';
import type { CountSealsModifier } from '@/games/cryptoz/customModifiers/CountSealsModifier';
import type { CardGloryShardsModifier } from '@/games/cryptoz/customModifiers/CardGloryShardsModifier';
import type { CardEssenceModifier } from '@/games/cryptoz/customModifiers/CardEssenceModifier';
import type { CanEvadeModifier } from '@/games/cryptoz/customModifiers/CanEvadeModifier';

import { t } from '@/i18n';
import { sleep } from '@/helpers/utils';
import { TriggerGroup } from '@/helpers/Triggers/TriggerGroup';
import { ModifierGroup } from '@/helpers/Modifiers/ModifierGroup';
import { Logger } from '@/helpers/Logger';
import { EStoneShardGroupType, StoneShardGroup } from '@/games/cryptoz/entities/StoneShards/StoneShardGroup';
import { AbilityGroup, EAbilityGroupType } from '@/games/cryptoz/entities/Abilities/AbilityGroup';
import { TurnEndedTrigger } from '@/games/cryptoz/customTriggers/TurnEndedTrigger';
import { EssenceModifier } from '@/games/cryptoz/customModifiers/EssenceModifier';

import type {
  TPlayerConstructor,
  TSelectAbilityAndCompanionResponse,
  TTryEvadeParams,
} from './types';
import type { Room } from '../../Rooms/Room';
import type { AbstractCard } from '../../Cards/AbstractCard';
import type { AbstractAbility } from '../../Abilities/AbstractAbility';

import { PlayerGroup } from '../PlayerGroup';
import { getInitialPlayerDeck } from '../../Cards/utils';
import { CardGroup, ECardGroupType } from '../../Cards/CardGroup';

export class Player {
  private readonly room: Room;
  public readonly logger: Logger;
  public readonly nickname: string;
  public readonly participant: 'player' | 'viewer';
  public health = 20;
  public maxHealth = 25;
  public maxHand = 5;
  public companion: AbstractCard | undefined;
  public readonly abilities = new AbilityGroup(EAbilityGroupType.DECK);
  public readonly stoneShards = new StoneShardGroup(EStoneShardGroupType.DECK);
  public readonly seals = new CardGroup(ECardGroupType.SEAL);
  public readonly hand = new CardGroup(ECardGroupType.HAND);
  public readonly arena = new CardGroup(ECardGroupType.ARENA);
  public readonly discard = new CardGroup(ECardGroupType.DISCARD);
  public readonly deck: CardGroup<ECardGroupType.DECK>;
  public isReady = false;

  // Данные на ход
  public readonly playedCards = new CardGroup(ECardGroupType.ANY);
  public readonly receivedCards = new CardGroup(ECardGroupType.ANY);
  public readonly boughtCards = new CardGroup(ECardGroupType.ANY);
  public essenceWasted = 0;

  // Для изменения цены покупки
  public readonly modifiersPrice = new ModifierGroup<PriceModifier>();
  public readonly modifiersDamageToOther = new ModifierGroup<DamageModifier>();
  public readonly modifiersDamageToSelf = new ModifierGroup<DamageModifier>();
  public readonly modifiersGloryShards = new ModifierGroup<GloryShardsModifier>();
  public readonly modifiersCardGloryShards = new ModifierGroup<CardGloryShardsModifier>();
  public readonly modifiersHeal = new ModifierGroup<HealModifier>();
  public readonly modifiersEssence = new ModifierGroup<EssenceModifier>();
  public readonly modifiersCardEssence = new ModifierGroup<CardEssenceModifier>();
  public readonly modifiersCountStoneShards = new ModifierGroup<CountStoneShardsModifier>();
  public readonly modifiersCountSeals = new ModifierGroup<CountSealsModifier>();
  public readonly modifiersCanEvade = new ModifierGroup<CanEvadeModifier>();

  public readonly triggersOnKilled = new TriggerGroup<KilledTrigger>();
  public readonly triggersOnDamageTook = new TriggerGroup<DamageTookTrigger>();
  public readonly triggersOnDamage = new TriggerGroup<DamageTrigger>();
  public readonly triggersOnKilling = new TriggerGroup<KillingTrigger>();
  public readonly triggersOnHealed = new TriggerGroup<HealedTrigger>();
  public readonly triggersOnTurnEnded = new TriggerGroup<TurnEndedTrigger>();
  public readonly triggersOnHandFilledOnTurnEnd = new TriggerGroup<HandFilledOnTurnEndTrigger>();
  public readonly triggersOnTurnStarted = new TriggerGroup<TurnStartedTrigger>();
  public readonly triggersOnCardBought = new TriggerGroup<CardBoughtTrigger>();
  public readonly triggersOnCardPlayed = new TriggerGroup<CardPlayedTrigger>();
  public readonly triggersOnCardDiscarded = new TriggerGroup<CardDiscardedTrigger>();
  public readonly triggersOnCardTook = new TriggerGroup<CardTookTrigger>();
  public readonly triggersOnCardRemoved = new TriggerGroup<CardRemovedTrigger>();
  public readonly triggersOnAbilityDiscarded = new TriggerGroup<AbilityDiscardedTrigger>();
  public readonly triggersOnAbilityTook = new TriggerGroup<AbilityTookTrigger>();
  public readonly triggersOnStoneShardDiscarded = new TriggerGroup<StoneShardDiscardedTrigger>();
  public readonly triggersOnStoneShardTook = new TriggerGroup<StoneShardTookTrigger>();

  public static readonly CARD_ZONES = [
    'hand',
    'seals',
    'discard',
    'deck',
    'arena',
  ] as const;

  constructor({
    nickname,
    room,
    participant,
  }: TPlayerConstructor) {
    this.nickname = nickname;
    this.participant = participant;
    this.room = room;
    this.logger = new Logger({ roomUuid: room.uuid, gameName: room.gameName, prefix: `Участник ${nickname}` });
    this.deck = getInitialPlayerDeck(room, nickname);
    this.fillHand();
    this.addEssenceOnTurn(10);
  }

  public resetAttributes = (): void => {
    this.logger.info('Сбросил атрибуты в конце хода');
    this.essenceWasted = 0;
    this.playedCards.clear();
    this.receivedCards.clear();
    this.boughtCards.clear();
    this.abilities.array.forEach(ability => ability.resetAttributes());
    this.allCards.array.forEach(card => card.resetAttributes());
  };

  public fillHand = (): void => {
    while (this.hand.count < this.maxHand && (this.deck.count || this.discard.count)) {
      const card = this.deck.top;
      if (!card) {
        this.fillDeck();
        continue;
      }
      this.deck.removeCard(card);
      this.hand.addCardToTop(card);
    }
  };

  /**
   * Выдает карты в руку из личной стопки
   */
  public takeCards = (count: number): void => {
    let countTook = 0;
    while (countTook < count && (this.deck.count || this.discard.count)) {
      const card = this.deck.top;
      if (!card) {
        this.fillDeck();
        continue;
      }
      countTook++;
      this.deck.removeCard(card);
      this.hand.addCardToTop(card);
      this.triggersOnCardTook.apply('hand', card, this.deck, card.ownerNickname);
    }
    if (countTook === 0) {
      return;
    }
    const message = t('cryptoz.logs.tookCardsToHand', 'ru', { nickname: this.nickname, count: countTook });
    this.room.addLog(message);
    this.logger.info(message);
  };

  private readonly takeCardsTo = (
    target: 'hand' | 'deck' | 'discard',
    cardsOrCount: CardGroup<ECardGroupType.ANY> | number,
    from: CardGroup<ECardGroupType.ANY>,
  ): void => {
    const cardsToTake: AbstractCard[] = [];

    const takeCardsByCount = (count: number) => {
      if (count <= 0) {
        return;
      }

      while (cardsToTake.length < count) {
        const card = from.top;
        // Карты закончились
        if (!card) {
          break;
        }
        const removedCard = from.removeCard(card);
        if (!removedCard) {
          break;
        }
        if (removedCard.theSameType(CryptozShared.ECardType.CHAOS)) {
          this.room.removed.chaos.addCardToTop(removedCard);
          continue;
        }
        cardsToTake.push(removedCard);
      }
    };

    if (typeof cardsOrCount === 'number') {
      takeCardsByCount(cardsOrCount);
    } else {
      const cards = cardsOrCount;

      if (!cards.count) {
        return;
      }

      _.eachRight(cards.array, card => {
        const removedCard = from.removeCard(card);
        if (!removedCard) {
          return;
        }
        if (removedCard.theSameType(CryptozShared.ECardType.CHAOS)) {
          this.room.removed.chaos.addCardToTop(removedCard);
          return;
        }
        cardsToTake.push(removedCard);
      });
    }

    if (!cardsToTake.length) {
      return;
    }

    cardsToTake.forEach(card => {
      const prevOwnerNickname = card.ownerNickname;
      card.changeOwner(this.nickname);
      if (prevOwnerNickname !== this.nickname) {
        this.receivedCards.addCardToTop(card);
      }
      this[target].addCardToTop(card);
      if (this.room.isGameEnded || !this.room.isGameStarted) {
        return;
      }
      this.triggersOnCardTook.apply(target, card, from, prevOwnerNickname);
    });

    if (this.room.isGameEnded || !this.room.isGameStarted) {
      return;
    }

    let message = '';
    switch (target) {
      case 'deck':
        message = t('cryptoz.logs.tookCardsToDeck', 'ru', {
          nickname: this.nickname,
          count: cardsToTake.length,
        });
        break;
      case 'discard':
        message = t('cryptoz.logs.tookCardsToDiscard', 'ru', {
          nickname: this.nickname,
          count: cardsToTake.length,
        });
        break;
      case 'hand':
        message = t('cryptoz.logs.tookCardsToHand', 'ru', {
          nickname: this.nickname,
          count: cardsToTake.length,
        });
        break;
      default: {
        // noinspection UnnecessaryLocalVariableJS
        const non: never = target;
        console.error(non);
      }
    }
    this.room.addLog(message);
    this.logger.info(message);
  };

  public takeCardsToHand = (
    cardsOrCount: CardGroup<ECardGroupType.ANY> | number,
    from: CardGroup<ECardGroupType.ANY>,
  ): ReturnType<typeof this.takeCardsTo> => {
    return this.takeCardsTo('hand', cardsOrCount, from);
  };

  public takeCardsToDeck = (
    cardsOrCount: CardGroup<ECardGroupType.ANY> | number,
    from: CardGroup<ECardGroupType.ANY>,
  ): ReturnType<typeof this.takeCardsTo> => {
    return this.takeCardsTo('deck', cardsOrCount, from);
  };

  public takeCardsToDiscard = (
    cardsOrCount: CardGroup<ECardGroupType.ANY> | number,
    from: CardGroup<ECardGroupType.ANY>,
  ): ReturnType<typeof this.takeCardsTo> => {
    return this.takeCardsTo('discard', cardsOrCount, from);
  };

  public discardHand = (cards: CardGroup<ECardGroupType.ANY>): void => {
    let countDiscarded = 0;
    _.eachRight(cards.array, card => {
      if (!this.hand.removeCard(card)) {
        return;
      }
      countDiscarded++;
      this.discard.addCardToTop(card);
      this.triggersOnCardDiscarded.apply(card, this.hand);
    });
    if (!countDiscarded) {
      return;
    }
    const message = t('cryptoz.logs.discardedCards', 'ru', {
      nickname: this.nickname,
      count: countDiscarded,
    });
    this.room.addLog(message);
    this.logger.info(message);
  };

  public discardSeal = (cards: CardGroup<ECardGroupType.ANY>): void => {
    let countDiscarded = 0;
    _.eachRight(cards.array, card => {
      if (!this.seals.removeCard(card)) {
        return;
      }
      countDiscarded++;
      this.discard.addCardToTop(card);
      this.triggersOnCardDiscarded.apply(card, this.seals);
    });
    if (!countDiscarded) {
      return;
    }
    const message = t('cryptoz.logs.discardedSeals', 'ru', {
      nickname: this.nickname,
      count: countDiscarded,
    });
    this.room.addLog(message);
    this.logger.info(message);
  };

  public removeCards = (cards: CardGroup<ECardGroupType.ANY>, from: 'hand' | 'deck' | 'discard' | 'seals'): void => {
    let countRemovedCards = 0;
    _.eachRight(cards.array, card => {
      if (!this[from].removeCard(card)) {
        return;
      }
      card.changeOwner();
      let removedTo: CardGroup<ECardGroupType.ANY>;
      if (card.theSameType(CryptozShared.ECardType.CURSED_SEAL)) {
        this.room.cursedSeals.addCardToBottom(card);
        removedTo = this.room.cursedSeals;
      } else if (card.theSameType(CryptozShared.ECardType.DARKNESS_MADNESS)) {
        this.room.darknessMadness.addCardToBottom(card);
        removedTo = this.room.darknessMadness;
      } else {
        this.room.removed.cards.addCardToTop(card);
        removedTo = this.room.removed.cards;
      }
      this.triggersOnCardRemoved.apply(card, this[from], removedTo);
      countRemovedCards++;
    });
    if (!countRemovedCards) {
      return;
    }
    const message = t('cryptoz.logs.removedCards', 'ru', {
      nickname: this.nickname,
      count: countRemovedCards,
    });
    this.room.addLog(message);
    this.logger.info(message);
  };

  public fillDeck = (): void => {
    if (!this.discard.count) {
      return;
    }
    _.eachRight(this.discard.array, card => {
      this.discard.removeCard(card);
      this.deck.addCardToBottom(card);
    });
    this.deck.shuffle();
    const message = t('cryptoz.logs.filledDeck', 'ru', { nickname: this.nickname });
    this.room.addLog(message);
    this.logger.info(message);
  };

  public takeStoneShard = async (
    stoneShard: AbstractStoneShard,
    from: StoneShardGroup<EStoneShardGroupType.ANY>,
    killer?: Player | null,
  ): Promise<void> => {
    if (!from.removeStoneShard(stoneShard)) {
      return;
    }
    const prevOwnerNickname = stoneShard.ownerNickname;
    stoneShard.changeOwner(this.nickname);
    this.stoneShards.addStoneShardToBottom(stoneShard);
    this.triggersOnStoneShardTook.apply(stoneShard, from, prevOwnerNickname);
    const message = t('cryptoz.logs.gotStoneShard', 'ru', { nickname: this.nickname });
    this.room.addLog(message);
    this.logger.info(message);
    await stoneShard.play(killer ?? null);
  };

  public takeAbility = (
    ability: AbstractAbility,
    from: AbilityGroup<EAbilityGroupType.ANY>,
  ): void => {
    if (!from.removeAbility(ability)) {
      return;
    }
    const prevOwnerNickname = ability.ownerNickname;
    ability.changeOwner(this.nickname);
    this.abilities.addAbilityToBottom(ability);
    this.triggersOnAbilityTook.apply(ability, from, prevOwnerNickname);
    const message = t('cryptoz.logs.gotAbility', 'ru', { nickname: this.nickname });
    this.room.addLog(message);
    this.logger.info(message);
  };

  public discardStoneShard = (stoneShards: StoneShardGroup<EStoneShardGroupType.ANY>): void => {
    let countDiscardedStoneShards = 0;
    _.eachRight(stoneShards.array, stoneShard => {
      if (!this.stoneShards.removeStoneShard(stoneShard)) {
        return;
      }
      stoneShard.changeOwner();
      this.room.stoneShards.addStoneShardToTop(stoneShard);
      this.triggersOnStoneShardDiscarded.apply(stoneShard);
      countDiscardedStoneShards++;
    });

    if (!countDiscardedStoneShards) {
      return;
    }
    const message = t('cryptoz.logs.discardedStoneShards', 'ru', {
      nickname: this.nickname,
      count: countDiscardedStoneShards,
    });
    this.room.addLog(message);
    this.logger.info(message);
  };

  public discardAbilities = (abilities: AbilityGroup<EAbilityGroupType.ANY>): void => {
    let countDiscardedAbilities = 0;
    _.eachRight(abilities.array, ability => {
      if (!this.abilities.removeAbility(ability)) {
        return;
      }
      ability.changeOwner();
      this.room.abilities.addAbilityToTop(ability);
      this.triggersOnAbilityDiscarded.apply(ability);
      countDiscardedAbilities++;
    });

    if (!countDiscardedAbilities) {
      return;
    }
    const message = t('cryptoz.logs.discardedAbilities', 'ru', {
      nickname: this.nickname,
      count: countDiscardedAbilities,
    });
    this.room.addLog(message);
    this.logger.info(message);
  };

  public addEssenceOnTurn(essence: number): void {
    if (!this.room.activePlayer?.theSame(this)) {
      return;
    }
    const essenceModifierId = uuidv4();
    const onTurnEndedTriggerId = uuidv4();
    this.modifiersEssence.addModifier(new EssenceModifier(essenceModifierId, p => p + essence));
    this.triggersOnTurnEnded.addTrigger(new TurnEndedTrigger(onTurnEndedTriggerId, () => {
      this.modifiersEssence.removeModifierById(essenceModifierId);
      this.triggersOnTurnEnded.removeTriggerById(onTurnEndedTriggerId);
    }));
  }

  public theSame = (player: Player): boolean => {
    return this === player;
  };

  public theSameNickname = (nickname: string): boolean => {
    return this.nickname === nickname;
  };

  public attack = (target: Player, damage: number, giveStoneShard = true): boolean => {
    const correctDamage = _.min([damage, target.health])!;
    const killed = target.takeDamage(correctDamage, this, giveStoneShard);
    this.triggersOnDamage.apply(correctDamage, target);
    if (killed) {
      this.triggersOnKilling.apply(target);
    }
    return killed;
  };

  /**
   * @return boolean true - умер, false - остался жив
   */
  public takeDamage = (damage: number, attacker?: Player | null, giveStoneShard = true): boolean => {
    const correctDamage = _.min([damage, this.health])!;
    this.health -= correctDamage;

    this.triggersOnDamageTook.apply(correctDamage, attacker ?? undefined);

    if (this.health > 0) {
      let message = t('cryptoz.logs.tookDamage', 'ru', {
        nickname: this.nickname,
        count: correctDamage,
      });
      if (attacker) {
        message = t('cryptoz.logs.tookDamageFrom', 'ru', {
          nickname: this.nickname,
          count: correctDamage,
          attacker: attacker.nickname,
        });
      }
      this.room.addLog(message);
      this.logger.debug(message);
      return false;
    }

    this.health = 20;

    if (giveStoneShard) {
      const stoneShard = this.room.stoneShards.randomStoneShard;
      if (stoneShard) {
        void this.takeStoneShard(stoneShard, this.room.stoneShards, attacker ?? null);
      }
    }

    if (!attacker) {
      const message = t('cryptoz.logs.playerDied', 'ru', { nickname: this.nickname });
      this.room.addLog(message);
      this.logger.debug(message);
      this.triggersOnKilled.apply();
      return true;
    }

    const message = t('cryptoz.logs.playerKilled', 'ru', {
      attacker: attacker.nickname,
      victim: this.nickname,
    });
    this.room.addLog(message);
    this.logger.debug(message);
    this.room.darknessCrown.changeOwner(attacker.nickname);
    this.triggersOnKilled.apply(attacker);
    return true;
  };

  /**
   * @return boolean true - укрылся, false - не укрылся
   */
  public tryEvade = async ({
    attacker,
    cardAttack,
    cardsToShow,
    title,
    damage,
    evadeCards,
  }: TTryEvadeParams) => {
    this.logger.debug('Попытка укрыться от мракобоя');
    const ackUuid = uuidv4();
    this.room.socketService.addPendingAck(ackUuid, this);

    while (true) {
      const evadeCardsToSelect = evadeCards ?? this.evadeCards;
      this.logger.debug(`Карты укрытия для выбора: ${evadeCardsToSelect.ids.join(', ')}`);
      const canEvade = this.modifiersCanEvade.apply(true, cardAttack);
      this.logger.debug(`Можно укрыться: ${canEvade}`);

      if (!evadeCardsToSelect.count || !canEvade) {
        await sleep(_.random(1500, 3000));
        this.room.socketService.removePendingAck(ackUuid);
        return false;
      }

      const selectedCard = await this.room.socketService.selectEvadeCard({
        player: this,
        cardAttack,
        cardsToShow,
        cards: evadeCardsToSelect,
        title,
      });
      this.logger.debug(`Выбрана для укрытия: ${selectedCard?.id}`);

      if (!selectedCard) {
        this.room.socketService.removePendingAck(ackUuid);
        return false;
      }

      const hasInHand = !!this.hand.getCard(selectedCard);
      const hasInSeals = !!this.seals.getCard(selectedCard);
      if (!hasInHand && !hasInSeals) {
        this.logger.warn(`Карта укрытия не в руке или печатях: ${selectedCard?.id}`);
        continue;
      }

      let message = t('cryptoz.logs.evaded', 'ru', {
        nickname: this.nickname,
        cardName: selectedCard.name,
      });
      if (attacker) {
        message = t('cryptoz.logs.evadedFrom', 'ru', {
          nickname: this.nickname,
          cardName: selectedCard.name,
          attacker: attacker.nickname,
        });
      }
      this.room.addLog(message);
      this.logger.info(message);
      void selectedCard.playEvade({
        attacker,
        cardAttack,
        damage,
      });
      this.room.socketService.removePendingAck(ackUuid);
      return true;
    }
  };

  public selectAbilityAndCompanion = async (): Promise<TSelectAbilityAndCompanionResponse> => {
    this.room.companions.shuffle();
    this.room.abilities.shuffle();
    const companions = this.room.companions.removeCardsFromTop(2);
    const abilities = this.room.abilities.removeAbilitiesFromTop(2);

    const selected = await this.room.socketService.selectAbilityAndCompanion({ companions, abilities, player: this });

    if (!selected) {
      companions.array.forEach(companion => this.room.companions.addCardToBottom(companion));
      abilities.array.forEach(ability => this.room.abilities.addAbilityToBottom(ability));
      this.logger.warn('Не выбрал способность и помощника');

      if (!this.room.socketService.sockets.getSocketByNickname(this.nickname)) {
        return null;
      }

      this.room.socketService.emitToPlayers(new PlayerGroup([this]), CryptozShared.EEventTypes.showToast, {
        message: t('cryptoz.logs.needSelectAbilityAndCompanion', 'ru'),
      });

      return this.selectAbilityAndCompanion();
    }

    this.room.companions.addCardToBottom(companions.getCardsExceptCard(selected.companion).array[0]);
    this.room.abilities.addAbilityToBottom(abilities.getAbilitiesExceptAbility(selected.ability).array[0]);

    return selected;
  };

  public heal = (count: number): void => {
    const wasHp = this.health;
    this.health = _.min([this.health + count, this.maxHealth])!;
    if (wasHp !== this.health) {
      this.triggersOnHealed.apply(wasHp, this.health - wasHp);
      const message = t('cryptoz.logs.healed', 'ru', {
        nickname: this.nickname,
        count: this.health - wasHp,
      });
      this.room.addLog(message);
      this.logger.info(message);
    }
  };

  public buyCard = (cardType: CryptozShared.ECardType, card?: AbstractCard) => {
    if (!this.isActive) {
      this.logger.warn('Нельзя купить карту: не активный участник');
      return;
    }
    if (this.room.isGameEnded) {
      this.logger.warn('Нельзя купить карту: игра завершена');
      return;
    }
    if (!this.room.isGameStarted) {
      this.logger.warn('Нельзя купить карту: игра не начата');
      return;
    }
    if (this.room.socketService.pendingAck.size) {
      const nicknames = this.room.socketService.pendingAckNicknames.join(', ');
      this.room.logger.warn(`Нельзя купить карту: есть ожидающие действия других участников ${nicknames}`);
      this.room.socketService.emitToPlayers(new PlayerGroup([this]), CryptozShared.EEventTypes.showToast, {
        message: t('cryptoz.errors.waitOtherPlayers', 'ru', { nicknames }),
      });
      return;
    }

    let boughtCard: AbstractCard | undefined;
    let price: number | undefined;
    let boughtFrom: 'darknessMadness' | 'companion' | 'harbinger' | 'market' | undefined;

    const buyDarknessMadness = () => {
      const darknessMadness = this.room.darknessMadness.top;
      if (!darknessMadness) {
        this.logger.warn('Нет карт для покупки безумия тьмы');
        return;
      }
      const cardPrice = darknessMadness.getPrice(this);
      if (cardPrice > this.essenceToSpend) {
        this.logger.warn('Не хватает эссенции для покупки безумия тьмы');
        return;
      }
      this.room.darknessMadness.removeCard(darknessMadness);
      boughtCard = darknessMadness;
      price = cardPrice;
      boughtFrom = 'darknessMadness';
      const message = t('cryptoz.logs.boughtDarknessMadness', 'ru', {
        nickname: this.nickname,
      });
      this.room.addLog(message);
      this.logger.info(message);
    };

    const buyCompanion = () => {
      const companion = this.companion;
      if (!companion) {
        this.logger.warn('Нет карт для покупки помощника');
        return;
      }
      const cardPrice = companion.getPrice(this);
      if (cardPrice > this.essenceToSpend) {
        this.logger.warn('Не хватает эссенции для покупки помощника');
        return;
      }
      this.companion = undefined;
      boughtCard = companion;
      price = cardPrice;
      boughtFrom = 'companion';
      const message = t('cryptoz.logs.boughtCompanion', 'ru', {
        nickname: this.nickname,
      });
      this.room.addLog(message);
      this.logger.info(message);
    };

    const buyHarbinger = () => {
      const harbinger = this.room.harbingers.top;
      if (!harbinger) {
        this.logger.warn('Нет карт для покупки предвестника');
        return;
      }
      if (this.boughtCards.getCardByType(CryptozShared.ECardType.HARBINGER)) {
        this.logger.warn('Предвестник уже была куплена в этом ходу');
        return;
      }
      const cardPrice = harbinger.getPrice(this);
      if (cardPrice > this.essenceToSpend) {
        this.logger.warn('Не хватает эссенции для покупки предвестника');
        return;
      }
      this.room.harbingers.removeCard(harbinger);
      boughtCard = harbinger;
      price = cardPrice;
      boughtFrom = 'harbinger';
      const message = t('cryptoz.logs.boughtHarbinger', 'ru', {
        nickname: this.nickname,
      });
      this.room.addLog(message);
      this.logger.info(message);
    };

    const buyMarketCard = (cardToBuy: AbstractCard) => {
      const marketCard = this.room.market.getCard(cardToBuy);
      if (!marketCard) {
        this.logger.warn('Нет карт для покупки на рынке');
        return;
      }
      const cardPrice = marketCard.getPrice(this);
      if (cardPrice > this.essenceToSpend) {
        this.logger.warn('Не хватает эссенции для покупки на рынке');
        return;
      }
      this.room.market.removeCard(marketCard);
      boughtCard = marketCard;
      price = cardPrice;
      boughtFrom = 'market';
      const message = t('cryptoz.logs.boughtMarketCard', 'ru', {
        nickname: this.nickname,
      });
      this.room.addLog(message);
      this.logger.info(message);
    };

    switch (cardType) {
      case CryptozShared.ECardType.CHAOS:
      case CryptozShared.ECardType.CURSED_SEAL:
      case CryptozShared.ECardType.SPARK:
        this.logger.warn('Нельзя купить проклятую печать, стартовую карту, хаос');
        break;
      case CryptozShared.ECardType.COMPANION: {
        buyCompanion();
        break;
      }
      case CryptozShared.ECardType.DARKNESS_MADNESS: {
        buyDarknessMadness();
        break;
      }
      case CryptozShared.ECardType.HARBINGER: {
        buyHarbinger();
        break;
      }
      // Рынок
      default: {
        if (card) {
          buyMarketCard(card);
        }
      }
    }

    if (!boughtCard || price === undefined || !boughtFrom) {
      return;
    }

    this.discard.addCardToTop(boughtCard);
    boughtCard.changeOwner(this.nickname);
    this.essenceWasted += price;
    this.boughtCards.addCardToTop(boughtCard);
    this.triggersOnCardBought.apply(boughtCard, price, boughtFrom);
  };

  public toggleIsReady = () => {
    if (this.room.isGameStarted) {
      return;
    }
    if (!this.companion || !this.abilities.count) {
      this.logger.warn('Нельзя сменить готовность: не выбраны способность и помощник');
      this.room.socketService.emitToPlayers(new PlayerGroup([this]), CryptozShared.EEventTypes.showToast, {
        message: t('cryptoz.logs.needSelectAbilityAndCompanion', 'ru'),
      });
      return;
    }
    this.isReady = !this.isReady;
    this.logger.info(this.isReady ? 'готов' : 'не готов');
    if (
      this.room.players.count === this.room.settings.maxPlayers
      && this.room.players.array.every(player => player.isReady)
    ) {
      this.room.startedAt = Date.now();
      this.room.isGameStarted = true;
      const message = t('cryptoz.logs.gameStarted', 'ru');
      this.room.addLog(message);
      this.logger.info(message);
    }
  };

  public get evadeCards(): CardGroup<ECardGroupType.ANY> {
    return new CardGroup(ECardGroupType.ANY, [
      ...this.hand.array.filter(card => card.hasEvade),
      ...this.seals.array.filter(card => card.hasEvade),
    ]);
  };

  public get hasDarknessCrown(): boolean {
    return this.room.darknessCrown.ownerNickname === this.nickname;
  }

  public get hasNoctullos(): boolean {
    return !!this.allCards.getCardById(CryptozShared.ECardId.NOCTULLOS);
  }

  public get countStoneShards(): number {
    return this.modifiersCountStoneShards.apply(this.stoneShards.count);
  }

  public get countSeals(): number {
    return this.modifiersCountSeals.apply(this.seals.count);
  }

  public get allCards(): CardGroup<ECardGroupType.ANY> {
    return new CardGroup(ECardGroupType.ANY, [
      ...this.hand.array,
      ...this.seals.array,
      ...this.discard.array,
      ...this.deck.array,
      ...this.arena.array,
    ]);
  }

  public get essenceToSpend(): number {
    return this.modifiersEssence.apply(0) - this.essenceWasted;
  }

  public get essenceOfHand(): number {
    return this.hand.array.reduce((sum, card) => sum + card.getEssence(card.baseEssence, this), 0);
  }

  public get gloryShards(): number {
    const cardGloryShards = this.allCards.array.reduce((sum, card) => sum + card.getGloryShards(this), 0);
    return this.modifiersGloryShards.apply(cardGloryShards);
  }

  public get isActive(): boolean {
    return this.room.activePlayer === this;
  }

  public get isAdmin(): boolean {
    return this.room.adminPlayer === this;
  }

  public format = (forPlayer: Player): CryptozShared.TPlayer => {
    return {
      seals: this.seals.array.map(card => card.format(this)),
      countDeck: this.deck.count,
      discard: this.discard.array.map(card => card.format(this)),
      companion: this.companion?.format(this),
      hand: this.theSame(forPlayer) || this.room.activePlayer?.theSame(this)
        ? this.hand.array.map(card => card.format(this))
        : undefined,
      arena: this.arena.array.map(card => card.format(this)),
      countHand: this.hand.count,
      hasDarknessCrown: this.hasDarknessCrown,
      hasNoctullos: this.hasNoctullos,
      health: this.health,
      nickname: this.nickname,
      essenceToSpend: this.room.activePlayer && this.theSame(this.room.activePlayer)
        ? this.essenceToSpend
        : undefined,
      essenceOfHand: this.theSame(forPlayer)
        ? this.essenceOfHand
        : undefined,
      abilities: this.abilities.array.map(ability => ability.format()),
      stoneShards: this.stoneShards.array.map(stoneShard => stoneShard.format()),
      gloryShards: this.theSame(forPlayer)
        ? this.gloryShards
        : undefined,
      isOnline: !!this.room.socketService.sockets.getSocketByNickname(this.nickname),
      isReady: this.isReady,
    };
  };
}
