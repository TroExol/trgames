import { useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

export const Component = observer(function LucidPartyPage() {
  const { partyId } = useParams();

  return (
    <main className="min-h-dvh px-4 py-6">
      <p className="font-golos">{partyId}</p>
    </main>
  );
});
