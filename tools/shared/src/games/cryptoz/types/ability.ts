export type TAbilityId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface TAbility {
  uuid: string;
  id: TAbilityId;
  description: string;
  canPlayHandler: boolean;
  isPlaying: boolean;
  isPlayed: boolean;
  ownerNickname: string | undefined;
}
