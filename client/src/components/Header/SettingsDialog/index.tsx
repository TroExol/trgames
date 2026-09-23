import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { observer } from 'mobx-react-lite';
import { Settings2 } from 'lucide-react';

import { settingsStore } from '@/stores';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/Slider';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { DialogHeader } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

enum ESettingsTab {
  CRYPTOZ = 'cryptoz',
  GENERAL = 'general',
  LUCID = 'lucid',
}

const TAB_LABELS: Record<ESettingsTab, string> = {
  [ESettingsTab.GENERAL]: 'Общие',
  [ESettingsTab.CRYPTOZ]: 'Криптоз',
  [ESettingsTab.LUCID]: 'Lucid',
};

// Игровой раздел, если он есть, интереснее пустой заглушки «Общих» — диалог
// открывается сразу на нём, как раньше открывался на единственной вкладке Cryptoz
const gameTabFor = (gameName?: string): ESettingsTab | undefined => {
  if (gameName === 'cryptoz') {
    return ESettingsTab.CRYPTOZ;
  }

  if (gameName === 'lucid') {
    return ESettingsTab.LUCID;
  }

  return undefined;
};

// Один канал звука: переключатель и своя громкость — ползунок недоступен
// на выключенном канале, чтобы не создавать впечатление, будто он всё ещё
// на что-то влияет
const SoundChannelSettings = observer(function SoundChannelSettings({
  enabled,
  label,
  onEnabledChange,
  onVolumeChange,
  volume,
}: {
  enabled: boolean;
  label: string;
  onEnabledChange: (value: boolean) => void;
  onVolumeChange: (value: number) => void;
  volume: number;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-3">
        <input
          checked={enabled}
          className="size-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onChange={event => onEnabledChange(event.target.checked)}
          type="checkbox"
        />
        <span className="text-sm font-medium">{label}</span>
      </label>
      <Slider
        aria-label={`Громкость: ${label}`}
        className="max-w-64"
        disabled={!enabled}
        max={1}
        min={0}
        onValueChange={([value]) => onVolumeChange(value)}
        step={0.05}
        value={[volume]}
      />
    </div>
  );
});

export const SettingsDialog = observer(function SettingsDialog({ gameName }: { gameName?: string }) {
  const [activeTab, setActiveTab] = useState<ESettingsTab>(() => gameTabFor(gameName) ?? ESettingsTab.GENERAL);

  // Игровой раздел виден только на странице своей игры — как у Cryptoz
  const availableTabs = useMemo<ESettingsTab[]>(() => {
    const tabs: ESettingsTab[] = [ESettingsTab.GENERAL];
    const gameTab = gameTabFor(gameName);

    if (gameTab) {
      tabs.push(gameTab);
    }

    return tabs;
  }, [gameName]);

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(gameTabFor(gameName) ?? availableTabs[0]);
    }
  }, [activeTab, availableTabs, gameName]);

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
          {activeTab === ESettingsTab.GENERAL && (
            <p className="text-sm text-muted-foreground">
              Общие настройки появятся здесь позднее.
            </p>
          )}

          {activeTab === ESettingsTab.CRYPTOZ && (
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

          {activeTab === ESettingsTab.LUCID && (
            <div className="space-y-4">
              <SoundChannelSettings
                enabled={settingsStore.general.music.enabled}
                label="Музыка"
                onEnabledChange={value => settingsStore.setMusicEnabled(value)}
                onVolumeChange={value => settingsStore.setMusicVolume(value)}
                volume={settingsStore.general.music.volume}
              />
              <SoundChannelSettings
                enabled={settingsStore.general.ui.enabled}
                label="Звуки интерфейса"
                onEnabledChange={value => settingsStore.setUiSoundEnabled(value)}
                onVolumeChange={value => settingsStore.setUiSoundVolume(value)}
                volume={settingsStore.general.ui.volume}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
