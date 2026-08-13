**English** · [Русский](./README.ru.md)

<div align="center">

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]

<h1>TRGames</h1>

**Board games, online**

Play board games with friends straight from the browser — no install, no signup, nothing to download.

<a href="https://troexol.ru"><strong>Play &raquo;</strong></a>
&nbsp;&middot;&nbsp;
<a href="https://github.com/TroExol/trgames/issues/new?labels=bug&template=bug-report---.md">Report a bug</a>
&nbsp;&middot;&nbsp;
<a href="https://github.com/TroExol/trgames/issues/new?labels=enhancement&template=feature-request---.md">Request a feature</a>

</div>

## Games

- **Cryptoz** — a card game built around obscurantist roles, hideouts, seals, glory shards and the Crown of Dark

## Tech stack

| Layer | Technologies |
|-------|--------------|
| **Client** | React 18, TypeScript, Vite, MobX, Tailwind CSS, Radix UI, Framer Motion |
| **Server** | Node.js, Socket.io, i18n-js |
| **Shared types** | TypeScript (shared workspace) |
| **Testing** | Vitest |
| **UI documentation** | Storybook |

Real-time game state is synchronised over Socket.io, with game rules living entirely on the server and
a shared TypeScript workspace keeping client and server contracts in sync.

## Architecture

```
trgames/
├── client/                  # React SPA
│   └── src/
│       ├── components/      # Reusable UI components (Radix-based)
│       ├── routes/          # Pages (React Router v6, lazy loaded)
│       ├── stores/          # MobX stores
│       └── providers/       # Context providers (theme, game theme)
├── server/                  # Socket.io server
│   └── src/
│       ├── games/cryptoz/   # Game logic (cards, modifiers, triggers)
│       └── i18n/            # Localisation
├── tools/
│   ├── shared/              # Shared TypeScript types for client and server
│   └── eslint-plugin-trgames/  # Custom ESLint plugin
└── prompts/                 # Prompts used for content generation
```

## Quick start

### Requirements

- Node.js v22
- Yarn >= 1.22.22

### Install and run

```bash
git clone https://github.com/TroExol/trgames.git
cd trgames
npm install --global yarn@1.22.22  # if yarn is not installed
yarn install
yarn start:dev
```

Client: http://localhost:3000 &nbsp;|&nbsp; Server: http://localhost:4001

### Production build

```bash
cd client && yarn build    # builds into client/dist
cd ../server && yarn start # starts the server
```

## Development

### Useful commands

| Command | Description |
|---------|-------------|
| `yarn start:dev` | Run client and server with hot reload |
| `yarn lint` | Lint every workspace |
| `yarn workspace @trgames/server test` | Run server tests |
| `yarn workspace @trgames/client storybook` | Storybook on port 6006 |

### Linting

Linting runs automatically before each commit via a Husky pre-commit hook.

To run it manually:

```bash
yarn lint                              # all workspaces
yarn workspace @trgames/client lint    # client only
yarn workspace @trgames/server lint    # server only
```

### Environment variables

| Variable | Location | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | `client/.env` | Server URL used by Socket.io |

Server flags are passed on the CLI: `--local true` (CORS `*`), `--debug true` (verbose logging).

## License

This project is private.

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/TroExol/trgames.svg?style=for-the-badge
[contributors-url]: https://github.com/TroExol/trgames/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/TroExol/trgames.svg?style=for-the-badge
[forks-url]: https://github.com/TroExol/trgames/network/members
[stars-shield]: https://img.shields.io/github/stars/TroExol/trgames.svg?style=for-the-badge
[stars-url]: https://github.com/TroExol/trgames/stargazers
[issues-shield]: https://img.shields.io/github/issues/TroExol/trgames.svg?style=for-the-badge
[issues-url]: https://github.com/TroExol/trgames/issues
