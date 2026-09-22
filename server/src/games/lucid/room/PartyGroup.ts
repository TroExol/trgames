import type { LucidShared } from '@trgames/shared';

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

  const save = (party: Party): void => {
    const snapshot = party.snapshot();

    storage.saveParty({
      uuid: party.uuid,
      theme: snapshot.theme?.name ?? '',
      document: snapshot,
    });
  };

  return {
    create: ({ uuid, ownerId }: TCreateParams): Party => {
      const party = new Party({ uuid, ownerId });

      parties.set(uuid, party);
      save(party);

      return party;
    },

    // Партия поднимается из базы только когда её спросили: держать в памяти
    // всё, что когда-либо игралось, незачем
    get: (uuid: string): Party | null => {
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
    },

    persist: (party: Party): void => save(party),

    remove: (uuid: string): void => {
      parties.delete(uuid);
      storage.removeParty(uuid);
    },
  };
};

export type TPartyGroup = ReturnType<typeof createPartyGroup>;
