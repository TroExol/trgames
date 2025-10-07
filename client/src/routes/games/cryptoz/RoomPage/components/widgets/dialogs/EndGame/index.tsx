import { observer } from 'mobx-react-lite';

import type { TEndGameProps } from './types';

export const EndGame = observer(function EndGame({
  players,
}: TEndGameProps) {
  return (
    <div className="flex flex-col gap-4">
      {players.map((player, index) => (
        <div key={player.nickname}>
          Место
          {' '}
          {index + 1}
          {': '}
          {player.nickname}
          {' '}
          набрал
          {' '}
          {player.gloryShards}
          {' '}
          осколков славы
        </div>
      ))}
    </div>
  );
});
