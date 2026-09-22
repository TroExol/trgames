import { Link, useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { AlignJustify } from 'lucide-react';

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
import { Button, buttonVariants } from '@/components/ui/Button';
import { ModeToggle } from '@/components/ModeToggle';

import { SettingsDialog } from './SettingsDialog';

import Logo from '/icon.svg';

export const Header = observer(function Header() {
  const { roomUuid, partyId } = useParams<{ roomUuid?: string; partyId?: string }>();
  const { gameName } = useGameName();
  const { gameTheme } = useGameTheme();
  const isRoomsPage = location.pathname === `/game/${gameName}`;
  // В lucid списка комнат нет: партия раздаётся ссылкой, и пункт уводит на
  // страницу создания. Слова «комната» в её словаре тоже нет — только «партия»
  const gamePageLabel = gameName === 'lucid' ? 'Новая партия' : 'Список комнат';
  const isRulesPage = location.pathname === `/game/${gameName}/rules`;
  const isUpdatesPage = location.pathname === `/game/${gameName}/updates`;
  // Правила и обновления написаны только для Криптоза, маршрутов lucid под них нет
  const hasStaticPages = Boolean(gameName) && gameName !== 'lucid';

  return (
    <header
      className={cn('flex h-14 w-full shrink-0 items-center p-2 sm:px-4', (roomUuid || partyId) && '[@media(max-height:620px)]:hidden')}
    >
      <div className="mr-4 flex">
        <Link className="mr-4 flex items-center space-x-2 pr-1 lg:mr-5" to="/">
          <img alt="Логотип сайта в виде оранжевой буквы Т" src={Logo} />
          {' '}
          <span className="hidden font-bold lg:inline-block">TRGames</span>
        </Link>
        {/* Ниже sm подписи навигации не помещаются в полосу и уводят страницу
            вбок: там эти же пункты живут во всплывающем меню справа */}
        <NavigationMenu className="hidden sm:flex">
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
                        {gamePageLabel}
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
              <DropdownMenuItem asChild className="cursor-pointer sm:hidden">
                <Link to="/">
                  Список игр
                </Link>
              </DropdownMenuItem>
              {gameName && !isRoomsPage && (
                <DropdownMenuItem asChild className="cursor-pointer sm:hidden">
                  <Link to={`/game/${gameName}`}>
                    {gamePageLabel}
                  </Link>
                </DropdownMenuItem>
              )}
              {/* Страницы правил и обновлений есть не у всякой игры: в lucid
                  их нет, и пункты вели бы в никуда */}
              {hasStaticPages && (
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
