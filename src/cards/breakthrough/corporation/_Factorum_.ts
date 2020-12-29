import {CorporationCard} from '../../corporation/CorporationCard';
import {Player} from '../../../Player';
import {Tags} from '../../Tags';
import {Game} from '../../../Game';
import {IActionCard} from '../../ICard';
import {Resources} from '../../../Resources';
import {SelectOption} from '../../../inputs/SelectOption';
import {OrOptions} from '../../../inputs/OrOptions';
import {CardName} from '../../../CardName';
import {CardType} from '../../CardType';

export class _Factorum_ implements IActionCard, CorporationCard {
    public name: CardName = CardName._FACTORUM_;
    public tags: Array<Tags> = [Tags.ENERGY, Tags.BUILDING];
    public startingMegaCredits: number = 45;
    public cardType: CardType = CardType.CORPORATION;

    public play(player: Player) {
      player.addProduction(Resources.STEEL);
      return undefined;
    }

    public canAct(player: Player): boolean {
      return player.energy === 0 || player.canAfford(3);
    }

    public action(player: Player, game: Game) {
      const increaseEnergy = new SelectOption(
        'Increase your energy production 1 step',
        'Increase production',
        () => {
          player.addProduction(Resources.ENERGY);
          return undefined;
        },
      );

      const drawBuildingCard = new SelectOption('Spend 3 MC to draw a building card', 'Draw card', () => {
        player.megaCredits -= 3;
        player.cardsInHand.push(game.drawCardsByTag(Tags.BUILDING, 1)[0]);

        const drawnCard = game.getCardsInHandByTag(player, Tags.BUILDING).slice(-1)[0];

        game.log('${0} drew ${1}', (b) => b.player(player).card(drawnCard));

        return undefined;
      });

      if (player.energy > 0) return drawBuildingCard;
      if (!player.canAfford(3)) return increaseEnergy;

      return new OrOptions(increaseEnergy, drawBuildingCard);
    }
}

