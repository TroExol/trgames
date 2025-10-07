import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { t } from '@/i18n';

import { AbstractAbility } from '../AbstractAbility';

export class Ability4 extends AbstractAbility {
  constructor(room?: Room) {
    super({ id: 4, room });
  }

  protected getDescription = () => t('cryptoz.abilities.ability4.description', 'ru');

  public canPlayHandler = () => (this.owner?.health ?? 0) >= 4;

  protected playHandler = () => {
    this.owner?.takeDamage(4);
    this.owner?.takeCards(1);
    return Promise.resolve(true);
  };

  protected onChangeOwner = () => {};
}
