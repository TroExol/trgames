#!/bin/sh
# Принимает на stdin tar.gz сборки из workflow Deploy и выкатывает её.
# Ключ GitHub Actions в authorized_keys запускает только этот скрипт
set -eu

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
tar xzf - --no-same-owner -C "$tmp"

mkdir -p /root/trgames/server
install -m 600 "$tmp/.env" /root/trgames/server/.env
cp "$tmp/server.js" /root/trgames/server/server.js
cp "$tmp/compose.yml" /root/trgames/compose.yml

rm -rf /srv/trgames.new /srv/trgames.old
cp -r "$tmp/www" /srv/trgames.new
chmod -R a+rX /srv/trgames.new
if [ -d /srv/trgames ]; then mv /srv/trgames /srv/trgames.old; fi
mv /srv/trgames.new /srv/trgames
rm -rf /srv/trgames.old

docker compose -f /root/trgames/compose.yml up -d --force-recreate
echo 'Деплой готов'
