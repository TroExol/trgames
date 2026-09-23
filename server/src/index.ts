import { Server } from 'socket.io';

import { getProcessArg } from '@/helpers/utils';
import { loadEnv } from '@/helpers/loadEnv';
import { Lucid } from '@/games/lucid';
import { Cryptoz } from '@/games/cryptoz';

// До первого обращения к process.env: ключ провайдера читается при создании
// клиента модели
loadEnv();

const localhost = getProcessArg('--local') === 'true';

const io = new Server({
  cors: {
    origin: localhost ? '*' : 'https://toexol.ru',
    methods: ['GET', 'POST'],
  },
  cleanupEmptyChildNamespaces: true,
  connectionStateRecovery: {
    maxDisconnectionDuration: 0.5 * 60 * 1000,
    skipMiddlewares: false,
  },
});

io.on('connection', socket => {
  console.log('io: New client connected');

  socket.on('error', error => console.error(error));
});

Cryptoz.init(io);
Lucid.init(io);

io.listen(4001);

console.log('Сервер запущен');
