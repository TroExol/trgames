export interface TSocketServiceConnectParams {
  roomUuid: string;
  nickname: string;
  participant: 'player' | 'viewer';
  roomPassword?: string;
}
