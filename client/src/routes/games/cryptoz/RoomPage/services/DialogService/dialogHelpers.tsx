import type { CryptozShared } from '@trgames/shared';

import { dialogService } from '@/routes/games/cryptoz/RoomPage/services';
import { StoneShards } from '@/routes/games/cryptoz/RoomPage/components/widgets/dialogs/StoneShards';
import { SelectStartCards } from '@/routes/games/cryptoz/RoomPage/components/widgets/dialogs/SelectStartCards';
import { PlayAbility } from '@/routes/games/cryptoz/RoomPage/components/widgets/dialogs/PlayAbility';
import { EndGame } from '@/routes/games/cryptoz/RoomPage/components/widgets/dialogs/EndGame';
import { Cards } from '@/routes/games/cryptoz/RoomPage/components/widgets/dialogs/Cards';
import { Abilities } from '@/routes/games/cryptoz/RoomPage/components/widgets/dialogs/Abilities';

import type {
  TAbilitiesDialog,
  TCardsDialog,
  TEndGameDialog,
  TPlayAbilityDialog,
  TSelectStartCardsDialog,
  TSelectVariantDialog,
  TStoneShardsDialog,
  TSuggestEvadeDialog,
} from './types';

import { SuggestEvade } from '../../components/widgets/dialogs/SuggestEvade';
import { SelectVariant } from '../../components/widgets/dialogs/SelectVariant';

export const openCardsDialog = ({
  title,
  cards,
  cardsSubtitle,
  countCardsToSelect,
  variants,
  onSubmit,
  onClose,
  canClose = true,
  canCollapse = true,
}: TCardsDialog) => {
  // Создаем обертку для onSubmit, которая закроет только эту модалку
  const handleSubmit = (id: string | number, selectedCards: CryptozShared.TCard[]) => {
    // Вызываем оригинальный onSubmit
    onSubmit?.(id, selectedCards);

    // Закрываем только эту модалку
    dialogService.closeDialog(dialogId);
  };

  // Открываем модалку и получаем её ID
  const dialogId = dialogService.openDialog({
    content: (
      <Cards
        cards={cards}
        cardsSubtitle={cardsSubtitle}
        countCardsToSelect={countCardsToSelect}
        onSubmit={handleSubmit}
        variants={variants}
      />
    ),
    onClose,
    canClose,
    canCollapse,
    title,
  });
};

export const openAbilitiesDialog = ({
  title,
  abilities,
  countAbilitiesToSelect,
  variants,
  onSubmit,
  onClose,
  canClose = true,
  canCollapse = true,
}: TAbilitiesDialog) => {
  const handleSubmit = (id: string | number, selectedAbilities: CryptozShared.TAbility[]) => {
    // Вызываем оригинальный onSubmit
    onSubmit?.(id, selectedAbilities);

    // Закрываем только эту модалку
    dialogService.closeDialog(dialogId);
  };

  // Открываем модалку и получаем её ID
  const dialogId = dialogService.openDialog({
    content: (
      <Abilities
        abilities={abilities}
        countAbilitiesToSelect={countAbilitiesToSelect}
        onSubmit={handleSubmit}
        variants={variants}
      />
    ),
    onClose,
    canClose,
    canCollapse,
    title,
  });
};

export const openPlayAbilityDialog = ({
  title,
  onSubmit,
  canClose = true,
  canCollapse = true,
}: TPlayAbilityDialog) => {
  dialogService.openDialog({
    content: <PlayAbility onSubmit={onSubmit} />,
    canClose,
    canCollapse,
    title,
  });
};

export const openStoneShardsDialog = ({
  title,
  stoneShards,
  countStoneShardsToSelect,
  variants,
  onSubmit,
  onClose,
  canClose = true,
  canCollapse = true,
}: TStoneShardsDialog) => {
  const handleSubmit = (id: string | number, selectedStoneShards: CryptozShared.TStoneShard[]) => {
    // Вызываем оригинальный onSubmit
    onSubmit?.(id, selectedStoneShards);

    // Закрываем только эту модалку
    dialogService.closeDialog(dialogId);
  };

  // Открываем модалку и получаем её ID
  const dialogId = dialogService.openDialog({
    content: (
      <StoneShards
        countStoneShardsToSelect={countStoneShardsToSelect}
        onSubmit={handleSubmit}
        stoneShards={stoneShards}
        variants={variants}
      />
    ),
    onClose,
    canClose,
    canCollapse,
    title,
  });
};

export const openEndGameDialog = ({
  players,
}: TEndGameDialog) => {
  dialogService.openDialog({
    content: <EndGame players={players} />,
    canCollapse: false,
    title: 'Игра окончена',
  });
};

export const openSelectStartCardsDialog = ({
  companions,
  abilities,
  onSubmit,
}: TSelectStartCardsDialog) => {
  // Создаем обертку для onSubmit, которая закроет только эту модалку
  const handleSubmit = (companion: CryptozShared.TCard, ability: CryptozShared.TAbility) => {
    // Вызываем оригинальный onSubmit
    onSubmit(companion, ability);

    // Закрываем только эту модалку
    dialogService.closeDialog(dialogId);
  };

  // Открываем модалку и получаем её ID
  const dialogId = dialogService.openDialog({
    content: <SelectStartCards abilities={abilities} companions={companions} onSubmit={handleSubmit} />,
    canCollapse: false,
    canClose: false,
    title: 'Выбери способность и помощника',
  });
};

export const openSelectVariantDialog = ({
  title,
  variants,
  onSubmit,
  onClose,
  canClose = true,
  canCollapse = true,
}: TSelectVariantDialog) => {
  const handleSubmit = (id: string | number) => {
    // Вызываем оригинальный onSubmit
    onSubmit?.(id);

    // Закрываем только эту модалку
    dialogService.closeDialog(dialogId);
  };

  // Открываем модалку и получаем её ID
  const dialogId = dialogService.openDialog({
    content: <SelectVariant onSubmit={handleSubmit} title={title} variants={variants} />,
    onClose,
    canClose,
    canCollapse,
    title,
  });
};

export const openSuggestEvadeDialog = ({
  title,
  cards,
  cardsToShow,
  cardAttack,
  variants,
  onSubmit,
  onClose,
  canClose = true,
  canCollapse = true,
}: TSuggestEvadeDialog) => {
  const handleSubmit = (id: number, selectedCard: CryptozShared.TCard) => {
    // Вызываем оригинальный onSubmit
    onSubmit?.(id, selectedCard);

    // Закрываем только эту модалку
    dialogService.closeDialog(dialogId);
  };

  // Открываем модалку и получаем её ID
  const dialogId = dialogService.openDialog({
    content: (
      <SuggestEvade
        cardAttack={cardAttack}
        cards={cards}
        cardsToShow={cardsToShow}
        onSubmit={handleSubmit}
        title={title}
        variants={variants}
      />
    ),
    onClose,
    canClose,
    canCollapse,
    title,
  });
};
