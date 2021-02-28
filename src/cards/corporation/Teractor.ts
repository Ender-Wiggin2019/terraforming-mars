import {Tags} from '../Tags';
import {CorporationCard} from './CorporationCard';
import {Player} from '../../Player';
import {Game} from '../../Game';
import {IProjectCard} from '../IProjectCard';
import {CardName} from '../../CardName';
import {CardType} from '../CardType';
import {CardMetadata} from '../CardMetadata';
import {CardRenderer} from '../render/CardRenderer';

export class Teractor implements CorporationCard {
    public name = CardName.TERACTOR;
    public tags = [Tags.EARTH];
    public startingMegaCredits: number = 60;
    public cardType = CardType.CORPORATION;

    public getCardDiscount(_player: Player, _game: Game, card: IProjectCard) {
      return card.tags.filter((tag) => tag === Tags.EARTH).length * 3;
    }
    // public play() {
    //   return undefined;
    // }

    //测试用修改
    public play(player: Player, game: Game) {
      for (let i = 0; i < 360; i++) { 
          player.cardsInHand.push(game.dealer.dealCard());
      }
      // game.increaseOxygenLevel(player, 2);
      // game.increaseOxygenLevel(player, 2);
      // game.increaseOxygenLevel(player, 2);
      // game.increaseOxygenLevel(player, 2);
      // game.increaseOxygenLevel(player, 2);
      // game.increaseOxygenLevel(player, 2);
      return undefined;
  }
    public metadata: CardMetadata = {
      cardNumber: 'R30',
      description: 'You start with 60 MC.',
      renderData: CardRenderer.builder((b) => {
        b.br.br;
        b.megacredits(60);
        b.corpBox('effect', (ce) => {
          ce.effectBox((eb) => {
            eb.earth(1).played.startEffect.megacredits(-3);
            eb.description('Effect: When you play an Earth tag, you pay 3 MC less for it.');
          });
        });
      }),
    }
}
