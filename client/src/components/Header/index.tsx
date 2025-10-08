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
