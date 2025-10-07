export interface TMessage {
  uuid: string;
  message: string;
  date: string;
  senderNickname: string;
  senderParticipant: 'viewer' | 'player';
}
