import { Outlet } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

export const RootLayout = observer(function RootLayout() {
  return (
    // Растягиваемся по общей раскладке, а не по высоте окна: над играми стоит
    // шапка сайта, и min-h-dvh добавлял бы её высоту к экрану, а высоту
    // потомкам всё равно не задавал — поле возвращалось бы к своим пропорциям
    <div className="flex w-full grow flex-col font-golos">
      <Outlet />
    </div>
  );
});
