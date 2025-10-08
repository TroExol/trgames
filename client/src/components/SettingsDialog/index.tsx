import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Settings } from 'lucide-react';

import { settingsStore } from '@/stores';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/Label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

type TSettingsTab = 'general' | 'cryptoz';

export const SettingsDialog = observer(function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TSettingsTab>('cryptoz');

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setActiveTab('cryptoz');
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button
          aria-label="Открыть настройки"
          size="icon"
          variant="ghost"
        >
          <Settings className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Настройки</DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <div className="flex gap-2 sm:w-48 sm:flex-col">
            <Button
              className={cn(activeTab === 'general' && 'bg-muted text-foreground hover:bg-muted')}
              onClick={() => setActiveTab('general')}
              type="button"
              variant="ghost"
            >
              Общее
            </Button>
            <Button
              className={cn(activeTab === 'cryptoz' && 'bg-muted text-foreground hover:bg-muted')}
              onClick={() => setActiveTab('cryptoz')}
              type="button"
              variant="ghost"
            >
              Криптоз
            </Button>
          </div>
          <div className="flex-1">
            {activeTab === 'general' && (
              <p className="text-sm text-muted-foreground">
                Общие настройки появятся здесь позже.
              </p>
            )}
            {activeTab === 'cryptoz' && (
              <div className="space-y-3">
                <div>
                  <Label className="flex cursor-pointer items-center gap-3 text-sm">
                    <input
                      checked={settingsStore.cryptoz.showFullHandCards}
                      className="size-4 accent-primary"
                      onChange={event => settingsStore.setCryptozShowFullHandCards(event.target.checked)}
                      type="checkbox"
                    />
                    Отображать карты в руке полностью
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Карты будут отображаться без смещения вниз.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
