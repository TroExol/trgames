import { observer } from 'mobx-react-lite';
import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';

export const ModeToggle = observer(function ModeToggle() {
  const { toggle } = useTheme();

  return (
    <Button onClick={toggle} size="icon" variant="outline">
      <Sun className="size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Переключить тему</span>
    </Button>
  );
});
