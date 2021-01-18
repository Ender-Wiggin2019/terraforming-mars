
import {CorporationCard} from '../../corporation/CorporationCard';
import {Tags} from '../../Tags';
import {Player} from '../../../Player';
import {Resources} from '../../../Resources';
import {CardName} from '../../../CardName';
import {IProjectCard} from '../../IProjectCard';
import {Game} from '../../../Game';
import {CardType} from '../../CardType';
import { CardMetadata } from '../../CardMetadata';
import { CardRenderer } from '../../render/CardRenderer';
import { CardRenderItemSize } from '../../render/CardRenderItemSize';

export class _EcoLine_ implements CorporationCard {
    public name: CardName = CardName._ECOLINE_;
    public tags: Array<Tags> = [Tags.PLANT];
    public startingMegaCredits: number = 36;
    public cardType: CardType = CardType.CORPORATION;

    public play(player: Player) {
      player.addProduction(Resources.PLANTS, 2);
      player.plants = 3;
      player.plantsNeededForGreenery = 7;
      return undefined;
    }


    public onCardPlayed(player: Player, _game: Game, card: IProjectCard) {
      if (player.corporationCard !== undefined && player.corporationCard.name === this.name) {
        for (const tag of card.tags) {
          if (tag === Tags.PLANT) {
            player.setResource(Resources.MEGACREDITS, 2);
          }
        }
      }
    }
    public metadata: CardMetadata = {
      cardNumber: 'R17',
      description: 'You start with 2 plant production, 3 plants, and 36 MC.',
      renderData: CardRenderer.builder((b) => {
        b.br;
        b.productionBox((pb) => pb.plants(2)).nbsp.megacredits(36).plants(3).digit;
        b.corpBox('effect', (ce) => {
          ce.effectBox((eb) => {
            ce.vSpace(CardRenderItemSize.LARGE);
            eb.plants(7).digit.startAction.greenery();
            eb.description(undefined);
          });
          ce.effectBox((eb) => {
            eb.plants(1).played.startEffect.megacredits(2);
            eb.description('Effect: You may pay 7 plants to place greenery. When play a plant tag card, gain 2 MC.');
          });
        });
      }),
    }
}
  

