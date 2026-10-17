# Деплой на vps-de

Игра открывается по адресу https://335227.snk.wtf.

## Как выкатить

1. Влей изменения в master.
2. Открой GitHub → Actions → Deploy → Run workflow. Ветка — master.

Workflow собирает клиент и сервер, пакует их в tar.gz и передаёт по SSH. На VPS скрипт `deploy.sh` раскладывает файлы и пересоздаёт контейнер.

## Что где лежит на VPS

| Путь | Что |
|---|---|
| `/srv/trgames` | Статика клиента. Её отдаёт Caddy |
| `/root/trgames/server` | `server.js`, `.env`, `lucid.db`, логи. Папка смонтирована в контейнер `trgames` |
| `/root/trgames/compose.yml` | Контейнер сервера. Копию берёт из `deploy/compose.yml` каждый деплой |
| `/root/trgames/deploy.sh` | Скрипт деплоя. Копия `deploy/deploy.sh`, обновляется вручную |

Деплой перезаписывает `server.js`, `.env`, `compose.yml` и `/srv/trgames`. База `lucid.db` и логи остаются.

## Секреты GitHub

Задай их в Settings → Secrets and variables → Actions.

| Секрет | Что |
|---|---|
| `OPENROUTER_API_KEY` | Ключ OpenRouter для lucid. Задай ему лимит расходов в OpenRouter |
| `VPS_SSH_KEY` | Приватный ключ деплоя. Пару к нему держит `authorized_keys` на VPS |

Чтобы сменить ключ OpenRouter, измени секрет и запусти Deploy.

## Разовая настройка VPS

1. Скопируй `deploy/deploy.sh` в `/root/trgames/deploy.sh` и сделай его исполняемым.
2. Добавь в `/root/.ssh/authorized_keys` открытый ключ деплоя с ограничением:
   `restrict,command="/root/trgames/deploy.sh" ssh-ed25519 AAAA… github-actions-trgames`
3. Добавь в блок `335227.snk.wtf:443` файла `/etc/caddy/Caddyfile` два `handle`. Другие `handle` блока не меняй.
   ```
   handle /socket.io/* {
   	reverse_proxy 127.0.0.1:4001
   }
   handle {
   	encode zstd gzip
   	root * /srv/trgames
   	try_files {path} /index.html
   	file_server
   }
   ```
4. Проверь конфиг командой `caddy validate --config /etc/caddy/Caddyfile` и перезагрузи Caddy командой `systemctl reload caddy`.
