import { useDocumentTitle } from 'usehooks-ts';
import { observer } from 'mobx-react-lite';

export const Component = observer(function LucidLobbyPage() {
  useDocumentTitle('lucid — новая партия');

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-4">
      <h1 className="font-unbounded text-4xl">lucid</h1>
    </main>
  );
});
