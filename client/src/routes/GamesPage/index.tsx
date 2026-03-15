import { useDocumentTitle } from 'usehooks-ts';
import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { EAnalyticsPage } from '@trgames/shared';

import { analyticsService } from '@/services';
import { CryptozCard } from '@/routes/GamesPage/components/gameCards/CryptozCard';

export const Component = observer(function GameListPage() {
  useDocumentTitle('TRGames - Настольные игры в онлайн формате');

  useEffect(() => {
    analyticsService.page(EAnalyticsPage.GAMES);
  }, []);

  return (
    <div className="container mx-auto flex grow flex-wrap place-content-center items-center gap-10 text-white">
      <CryptozCard />
    </div>
  );
});
