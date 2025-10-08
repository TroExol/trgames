import { useDocumentTitle } from 'usehooks-ts';
import { observer } from 'mobx-react-lite';

import { Typography } from '@/components/ui/Typography';

export const Component = observer(function CryptozUpdatesPage() {
  useDocumentTitle('Обновления игры Криптоз');

  return (
    <div className="*:mb-4">
      <Typography variant="h1">Обновления игры Криптоз</Typography>

      <Typography variant="h2">07.10.2025 v1.0.0</Typography>

      <Typography className="text-muted-foreground" variant="p">Рождение игры</Typography>
    </div>
  );
});
