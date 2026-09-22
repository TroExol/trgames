import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

export const LucidCard = observer(function LucidCard() {
  return (
    <Link
      className="font-unbounded relative overflow-hidden rounded-3xl border-4 border-border
        bg-black/40 p-20 text-center text-4xl font-bold transition-shadow
        hover:shadow-lg hover:shadow-accent"
      to="/game/lucid"
    >
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full opacity-30"
        preserveAspectRatio="none"
        viewBox="0 0 200 120"
      >
        <path
          d="M10 60 H60 l20 -20 h40 l20 20 h50 M60 60 l20 20 h40 l20 -20"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="4"
        />
      </svg>
      <span className="relative">lucid</span>
    </Link>
  );
});
