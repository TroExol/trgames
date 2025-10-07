import type { Meta, StoryObj } from '@storybook/react';

import { Typography } from './Typography';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './NavigationMenu';

const meta = {
  title: 'UI/NavigationMenu',
  component: NavigationMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <NavigationMenu defaultValue="games">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            Игры
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[320px] gap-3 p-4 md:w-[420px] md:grid-cols-2">
              <NavigationMenuLink className="block rounded-md border p-3 transition hover:border-primary" href="#">
                <Typography className="font-semibold" variant="h4">
                  Криптозадачи
                </Typography>
                <Typography className="text-sm text-muted-foreground" variant="p">
                  Решайте логические задачи в кооперативном режиме.
                </Typography>
              </NavigationMenuLink>
              <NavigationMenuLink className="block rounded-md border p-3 transition hover:border-primary" href="#">
                <Typography className="font-semibold" variant="h4">
                  Викторина
                </Typography>
                <Typography className="text-sm text-muted-foreground" variant="p">
                  Соревнуйтесь с друзьями и проверяйте эрудицию.
                </Typography>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            О проекте
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[260px] p-4">
              <Typography className="text-muted-foreground" variant="p">
                Мы создаём коллекцию настольных игр в онлайн формате — играйте вместе из любой точки мира.
              </Typography>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};
