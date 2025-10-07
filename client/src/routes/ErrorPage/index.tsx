import { useRouteError } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { RootLayout } from '@/routes/RootLayout';

export const ErrorPage = observer(function ErrorPage() {
  const error = useRouteError() as { message?: string; statusText?: string };
  console.error(error);

  return (
    <RootLayout>
      <div className="flex w-full flex-col items-center justify-center">
        <h1>Упс!</h1>
        <p>Произошла какая-то ошибка</p>
        <p>
          <i>{error.statusText ?? error.message}</i>
        </p>
      </div>
    </RootLayout>
  );
});
