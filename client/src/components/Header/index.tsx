import { Link, useParams } from 'react-router-dom';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { observer } from 'mobx-react-lite';
import { AlignJustify, Settings2 } from 'lucide-react';

import { settingsStore } from '@/stores';
import { useGameTheme } from '@/providers/GameThemeProvider';
import { cn } from '@/lib/utils';
import { useGameName } from '@/hooks/useGameName';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/NavigationMenu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Button, buttonVariants } from '@/components/ui/Button';
import { ModeToggle } from '@/components/ModeToggle';

import Logo from '/icon.svg';

type TSettingsTab = 'general' | 'cryptoz';

const TAB_LABELS: Record<TSettingsTab, string> = {
  general: 'Общие',
  cryptoz: 'Криптоз',
};

const SettingsDialog = observer(function SettingsDialog({ gameName }: { gameName?: string }) {
  const [activeTab, setActiveTab] = useState<TSettingsTab>('general');

  const availableTabs = useMemo<TSettingsTab[]>(() => {
    const tabs: TSettingsTab[] = ['general'];

    if (gameName === 'cryptoz') {
      tabs.push('cryptoz');
    }

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
          <span className="hidden text-sm font-medium sm:inline">Настройки</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Настройки</DialogTitle>
          <DialogDescription>
            Настройте интерфейс клиента под свои предпочтения.
          </DialogDescription>
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

export const Header = observer(function Header() {
  const { roomUuid } = useParams<{ roomUuid: string }>();
  const { gameName } = useGameName();
  const { gameTheme } = useGameTheme();
  const isRoomsPage = location.pathname === `/game/${gameName}`;
  const isRulesPage = location.pathname === `/game/${gameName}/rules`;
  const isUpdatesPage = location.pathname === `/game/${gameName}/updates`;

  return (
    <header
      className={cn('flex h-14 w-full shrink-0 items-center p-2 sm:px-4', roomUuid && '[@media(max-height:620px)]:hidden')}
    >
      <div className="mr-4 flex">
        <Link className="mr-4 flex items-center space-x-2 pr-1 lg:mr-5" to="/">
          <img alt="Логотип сайта в виде оранжевой буквы Т" src={Logo} />
          {' '}
          <span className="hidden font-bold lg:inline-block">TRGames</span>
        </Link>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={buttonVariants({ variant: 'ghost' })}>
                <Link to="/">
                  Список игр
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            {gameName && (
              <>
                {!isRoomsPage && (
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild className={buttonVariants({ variant: 'ghost' })}>
                      <Link to={`/game/${gameName}`}>
                        Список комнат
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}
              </>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <AlignJustify />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              {gameName && (
                <>
                  {!isRulesPage && (
                    <DropdownMenuItem>
                      <Link target="_blank" to={`/game/${gameName}/rules`}>
                        Правила игры
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {!isUpdatesPage && (
                    <DropdownMenuItem>
                      <Link target="_blank" to={`/game/${gameName}/updates`}>
                        Обновления
                      </Link>
                    </DropdownMenuItem>
                  )}
                </>
              )}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Контакты
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <a
                        href="https://t.me/troexol"
                        rel="noreferrer"
                        target="_blank"
                      >
                        Telegram
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <SettingsDialog gameName={gameName} />
        {!gameTheme && (<ModeToggle />)}
      </div>
    </header>
  );
});
