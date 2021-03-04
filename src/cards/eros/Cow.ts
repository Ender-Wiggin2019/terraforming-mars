import {IActionCard, IResourceCard} from '../ICard';
import {IProjectCard} from '../IProjectCard';
import {Tags} from '../Tags';
import {CardType} from '../CardType';
import {Game} from '../../Game';
import {Player} from '../../Player';
import {ResourceType} from '../../ResourceType';
import {Resources} from '../../Resources';
import {CardName} from '../../CardName';
import {CardMetadata} from '../CardMetadata';
import {CardRequirements} from '../CardRequirements';
import {CardRenderer} from '../render/CardRenderer';
import {CardRenderItemSize} from '../render/CardRenderItemSize';
import {CardRenderDynamicVictoryPoints} from '../render/CardRenderDynamicVictoryPoints';

export class Cow implements IActionCard, IProjectCard, IResourceCard {
    public cost = 9;
    public cardType = CardType.ACTIVE;
    public resourceType = ResourceType.ANIMAL;
    public resourceCount: number = 0;
    public tags = [Tags.ANIMAL];
    public name = CardName.COW;
    public canPlay(player: Player, game: Game): boolean {
      return game.getOxygenLevel() >= 5 - player.getRequirementsBonus(game) && player.getProduction(Resources.PLANTS) >= 1;
    }
    public getVictoryPoints(): number {
        return Math.floor(this.resourceCount / 2);
    }
    public play() {
      return undefined;
    }
    public canAct(player: Player): boolean {
      return player.getResource(Resources.PLANTS) > 1;
    }
    public action(player: Player) {
      player.addResourceTo(this, 1);
      player.setResource(Resources.PLANTS, -2)
      player.setResource(Resources.MEGACREDITS, 5)
      return undefined;
    }
    public metadata: CardMetadata = {
      cardNumber: 'Q015',
      requirements: CardRequirements.builder((b) => b.oxygen(5)),
      renderData: CardRenderer.builder((b) => {
        b.effectBox((eb) => {
          eb.plants(2).startAction.megacredits(5).nbsp.animals(1);
          eb.description('Action: Spend 2 plants to dd 1 Animal to this card and gain 5 MC.');
        }).br;
        b.text('1 VP for each 2 Animals on this card.', CardRenderItemSize.TINY, true);
      }),
      description: 'Requires 5% oxygen.',
      victoryPoints: CardRenderDynamicVictoryPoints.animals(1, 2),
    }
}

