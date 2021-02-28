import {IProjectCard} from '../IProjectCard';
import {Tags} from '../Tags';
import {CardType} from '../CardType';
import {Player} from '../../Player';
import {CardName} from '../../CardName';
import {ResourceType} from '../../ResourceType';
import {Game} from '../../Game';
import {Resources} from '../../Resources';
import {IResourceCard} from '../ICard';
import {DecreaseAnyProduction} from '../../deferredActions/DecreaseAnyProduction';
import {CardMetadata} from '../CardMetadata';
import {CardRequirements} from '../CardRequirements';
import {CardRenderer} from '../render/CardRenderer';
import {CardRenderItemSize} from '../render/CardRenderItemSize';
import {CardRenderDynamicVictoryPoints} from '../render/CardRenderDynamicVictoryPoints';

export class ElectricSheep implements IProjectCard, IResourceCard {
    public cost = 10;
    public tags = [Tags.ENERGY, Tags.ANIMAL];
    public name = CardName.ELECTRIC_SHEEP;
    public cardType = CardType.ACTIVE;
    public resourceType = ResourceType.ANIMAL;
    public resourceCount: number = 0;

    public canAct(): boolean {
      return true;
    }

    public canPlay(player: Player): boolean {
      return player.getTagCount(Tags.ENERGY) >= 4;
    }

    public action(player: Player) {
      player.addResourceTo(this);
      return undefined;
    }

    public play(player: Player, game: Game) {
      game.defer(new DecreaseAnyProduction(player, game, Resources.ENERGY, 1));
      return undefined;
    }

    public getVictoryPoints(): number {
      return this.resourceCount;
    }

    public metadata: CardMetadata = {
      cardNumber: 'Q13',
      requirements: CardRequirements.builder((b) => b.tag(Tags.ENERGY, 4)),
      renderData: CardRenderer.builder((b) => {
        b.effectBox((eb) => {
          eb.empty().startAction.animals(1);
          eb.description('Action: Add 1 Animal to this card.');
        }).br;
        b.productionBox((pb) => pb.minus().energy(1).any).br;
        b.text('1 VP per Animal on this card.', CardRenderItemSize.TINY, true);
      }),
      description: {
        text: 'Requires 4 Power tags. Decrease any Energy production 1 step.',
        align: 'left',
      },
      victoryPoints: CardRenderDynamicVictoryPoints.animals(1, 1),
    };
}

