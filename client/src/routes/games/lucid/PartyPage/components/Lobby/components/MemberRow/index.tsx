import type { LucidShared } from '@trgames/shared';

import { observer } from 'mobx-react-lite';

import { Badge } from '@/components/ui/Badge';

interface TProps {
  isOwner: boolean;
  member: LucidShared.TLobbyMember;
}

// Предложения видны всем до жеребьёвки — это социальный момент, на чужую
// выдумку хочется ответить своей
export const MemberRow = observer(function MemberRow({ isOwner, member }: TProps) {
  const themeText = member.themeProposal
    ? `«${member.themeProposal}»`
    : member.hasAnswered
      ? 'не предлагает тему'
      : 'думает';

  return (
    <li className="border-current/10 flex flex-col gap-1 border-b py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-golos font-medium">{member.nickname}</span>
        {isOwner && <Badge variant="secondary">создатель</Badge>}
        {!member.isConnected && <Badge variant="destructive">связь потеряна</Badge>}
      </div>
      <p className="font-golos text-sm text-muted-foreground">{themeText}</p>
    </li>
  );
});
