import { Fragment } from 'react';
import { observer } from 'mobx-react-lite';
import { LucidShared } from '@trgames/shared';

interface TProps {
  option: LucidShared.TOptionView;
  resourceName: string;
}

const TARGET_PREFIXES: Partial<Record<LucidShared.ETarget, string>> = {
  [LucidShared.ETarget.ALL]: 'все',
  [LucidShared.ETarget.FIRST]: 'лидер',
  [LucidShared.ETarget.LAST]: 'отстающий',
};

const hintLabel = (item: LucidShared.THintItem, resourceName: string): string => {
  const arrow = item.sign === -1 ? '↓' : '↑';
  const prefix = TARGET_PREFIXES[item.target];
  const body = {
    [LucidShared.EAtomKind.MOVE]: `${arrow} клетки`,
    [LucidShared.EAtomKind.RESOURCE]: `${arrow} ${resourceName}`,
    [LucidShared.EAtomKind.SKIP_TURN]: 'пропуск хода',
    [LucidShared.EAtomKind.SWAP_WITH_FIRST]: 'обмен с лидером',
  }[item.kind];

  return prefix && item.kind !== LucidShared.EAtomKind.SWAP_WITH_FIRST ? `${prefix} ${body}` : body;
};

const hintColor = (item: LucidShared.THintItem): string => {
  if (item.sign === 1) {
    return 'var(--lucid-text)';
  }

  return item.sign === -1 ? 'var(--lucid-accent)' : 'var(--lucid-muted)';
};

export const OptionOutcomes = observer(function OptionOutcomes({ option, resourceName }: TProps) {
  const branches = [
    {
      prefix: 'удача',
      isRevealed: option.revealed.success,
      effect: option.success,
      hint: option.hint.success,
    },
    {
      prefix: 'провал',
      isRevealed: option.revealed.failure,
      effect: option.failure,
      hint: option.hint.failure,
    },
  ];
  const visible = option.threshold ? branches : branches.slice(0, 1);
  const segments = visible.map(branch => {
    if (branch.isRevealed) {
      const text = branch.effect ? LucidShared.describeEffect(branch.effect, resourceName) : 'ничего';

      return { prefix: branch.prefix, content: text };
    }

    if (!branch.hint.length) {
      return { prefix: branch.prefix, content: '?' };
    }

    return {
      prefix: branch.prefix,
      content: branch.hint.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && ', '}
          <span style={{ color: hintColor(item) }}>{hintLabel(item, resourceName)}</span>
        </Fragment>
      )),
    };
  });

  return (
    <span className="text-sm leading-snug" style={{ color: 'var(--lucid-muted)' }}>
      {segments.map((segment, index) => (
        <Fragment key={segment.prefix}>
          {index > 0 && ' · '}
          {option.threshold ? `${segment.prefix} — ` : null}
          {segment.content}
        </Fragment>
      ))}
    </span>
  );
});
