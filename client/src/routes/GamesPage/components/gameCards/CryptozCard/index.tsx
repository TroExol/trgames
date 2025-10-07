import { observer } from 'mobx-react-lite';

import { BaseGameCard } from '@/routes/GamesPage/components/gameCards/BaseGameCard';
import cardImg from '@/assets/games/cryptoz/game-card.jpg';

export const CryptozCard = observer(function CryptozCard() {
  return (
    <BaseGameCard
      cardImg={cardImg}
      className="cryptoz"
      url="/game/cryptoz"
    >
      Криптоз
    </BaseGameCard>
  );
});
