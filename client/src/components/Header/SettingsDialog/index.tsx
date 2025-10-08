import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { observer } from 'mobx-react-lite';
import { Settings2 } from 'lucide-react';

import { settingsStore } from '@/stores';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { DialogHeader } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

type TSettingsTab = 'general' | 'cryptoz';

const TAB_LABELS: Record<TSettingsTab, string> = {
  general: 'Общие',
  cryptoz: 'Криптоз',
};

export const SettingsDialog = observer(function SettingsDialog({ gameName }: { gameName?: string }) {
  const [activeTab, setActiveTab] = useState<TSettingsTab>('general');

  const availableTabs = useMemo<TSettingsTab[]>(() => {
    const tabs: TSettingsTab[] = ['cryptoz'];

    return tabs;
  }, [gameName]);

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [activeTab, availableTabs]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button aria-label="Открыть настройки" className="gap-2" variant="ghost">
          <Settings2 className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Настройки</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-2 border-b border-border pb-2">
          {availableTabs.map(tab => (
            <button
              className={cn(
                'rounded-md px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                activeTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
        <div className="space-y-4 pt-4">
          {activeTab === 'general' && (
            <p className="text-sm text-muted-foreground">
              Общие настройки появятся здесь позднее.
            </p>
          )}

          {activeTab === 'cryptoz' && (
            <div className="space-y-2">
              <label className="flex items-center gap-3">
                <input
                  checked={settingsStore.cryptoz.showFullHandCards}
                  className="size-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onChange={event => settingsStore.setCryptozShowFullHandCards(event.target.checked)}
                  type="checkbox"
                />
                <span className="text-sm font-medium">Отображать карты в руке полностью</span>
              </label>
              <p className="text-sm text-muted-foreground">
                Карты перестанут опускаться и будут показаны на полную высоту.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
