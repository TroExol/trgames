import { Outlet } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

export const RootLayout = observer(function RootLayout() {
  return (
    <div className="min-h-dvh font-golos">
      <Outlet />
    </div>
  );
});
