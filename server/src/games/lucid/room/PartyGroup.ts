import type { LucidShared } from '@trgames/shared';

import { randomInt } from 'node:crypto';

import type { TStorage } from '@/games/lucid/storage/db';
import type { TPartySnapshot } from '@/games/lucid/room/Party';

import { Party } from '@/games/lucid/room/Party';

interface TCreatePartyGroupParams {
  storage: TStorage<TPartySnapshot>;
}

interface TCreateParams {
  uuid: string;
  ownerId: LucidShared.TPlayerId;
}

export const createPartyGroup = ({ storage }: TCreatePartyGroupParams) => {
  const parties = new Map<string, Party>();

  const generateCode = (): string => {
    let code: string;

    do {
      code = randomInt(0, 10_000).toString().padStart(4, '0');
    } while (storage.findPartyUuidByCode(code));

    return code;
  };

  const save = (party: Party): void => {
    // Пока шла долгая генерация, уборка могла удалить опустевшую партию из
    // группы: persist, который придёт следом из init.ts, не должен вернуть
    // её в базу зомби-записью, которая поднимется после перезапуска сервера
    if (!parties.has(party.uuid)) {
      return;
    }

    const snapshot = party.snapshot();

    storage.saveParty({
      uuid: party.uuid,
      code: party.code,
      theme: snapshot.theme?.name ?? '',
      document: snapshot,
    });
  };

  // Партия поднимается из базы только когда её спросили: держать в памяти
  // всё, что когда-либо игралось, незачем
  const get = (uuid: string): Party | null => {
    const inMemory = parties.get(uuid);

    if (inMemory) {
      return inMemory;
    }

    const stored = storage.loadParty(uuid);

    if (!stored) {
      return null;
    }

    const party = Party.fromSnapshot(stored);
    parties.set(uuid, party);

    return party;
  };

  return {
    create: ({ uuid, ownerId }: TCreateParams): Party => {
      const party = new Party({ uuid, code: generateCode(), ownerId });

      parties.set(uuid, party);
      save(party);

      return party;
    },

    get,

    findByCode: (code: string): Party | null => {
      const uuid = storage.findPartyUuidByCode(code);

      return uuid ? get(uuid) : null;
    },

    persist: (party: Party): void => save(party),

    remove: (uuid: string): void => {
      parties.delete(uuid);
      storage.removeParty(uuid);
    },
  };
};

export type TPartyGroup = ReturnType<typeof createPartyGroup>;
