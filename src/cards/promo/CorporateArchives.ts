import {Tags} from '../../common/cards/Tags';
import {PreludeCard} from '../prelude/PreludeCard';
import {Player} from '../../Player';
import {CardName} from '../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../../common/cards/render/Size';

export class CorporateArchives extends PreludeCard {
  constructor() {
    super({
      name: CardName.CORPORATE_ARCHIVES,
      tags: [Tags.SCIENCE],
      startingMegacredits: 13,


      metadata: {
        cardNumber: 'X58',
        description: 'Gain 13 M€',
        renderData: CardRenderer.builder((b) => {
          b.text('Look at the top 7 cards from the deck. ​Take 2 of them into hand and discard the other 5.', Size.SMALL, true);
          b.br;
          b.megacredits(13);
        }),
      },
    });
  }
  public play(player: Player) {
    player.megaCredits += this.startingMegaCredits;
    return player.drawCardKeepSome(7, {keepMax: 2});
  }
}
