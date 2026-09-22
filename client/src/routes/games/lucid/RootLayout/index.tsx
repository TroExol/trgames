import { Outlet } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

export const RootLayout = observer(function RootLayout() {
  return (
    <div className="font-golos min-h-dvh">
      <Outlet />
    </div>
  );
});
