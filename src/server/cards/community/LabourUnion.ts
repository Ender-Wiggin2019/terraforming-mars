import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {DiscardCards} from '../../deferredActions/DiscardCards';
import {CardName} from '../../../common/cards/CardName';
import {Size} from '../../../common/cards/render/Size';
import {Tag} from '../../../common/cards/Tag';
import {CorporationCard} from '../corporation/CorporationCard';

export class LabourUnion extends CorporationCard {
  constructor() {
    super({
      name: CardName.LABOUR_UNION,
      tags: [Tag.BUILDING],
      startingMegaCredits: 55,

      metadata: {
        cardNumber: 'R51',
        description: 'You start with 55 M€.',
        renderData: CardRenderer.builder((b) => {
          b.megacredits(55);
          b.corpBox('effect', (ce) => {
            ce.vSpace(Size.LARGE);
            ce.effect(undefined, (eb) => {
              eb.plate('Standard projects').startEffect.megacredits(-4);
            });
            ce.vSpace();
            ce.effect('Standard Projects cost 4 M€ less. At generation end, discard down to 8 cards.', (eb) => {
              eb.cards(1).startEffect.text('MAX 8 AT GEN END', Size.SMALL);
            });
            ce.vSpace(Size.SMALL);
          });
        }),
      },
    });
  }


  public onProductionPhase(player: IPlayer) {
    if (player.cardsInHand.length > 8) {
      const cardsToDiscard: number = player.cardsInHand.length - 8;
      player.game.defer(new DiscardCards(player, cardsToDiscard,cardsToDiscard));
    }
    return undefined;
  }
}
