import type { Namespace } from 'socket.io';
import type { CryptozShared } from '@trgames/shared';

export type TGeneralNamespace =
  Namespace<CryptozShared.TGeneralClientToServerEvents, CryptozShared.TGeneralServerToClientEvents>;
