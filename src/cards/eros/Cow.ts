import {IActionCard, IResourceCard} from '../ICard';
import {IProjectCard} from '../IProjectCard';
import {Tags} from '../Tags';
import {CardType} from '../CardType';
import {Player} from '../../Player';
import {ResourceType} from '../../ResourceType';
import {Resources} from '../../Resources';
import {CardRequirements} from '../CardRequirements';
import {CardRenderer} from '../render/CardRenderer';
import {CardRenderDynamicVictoryPoints} from '../render/CardRenderDynamicVictoryPoints';
import { Card } from '../Card';
import { GlobalParameter } from '../../GlobalParameter';
import { CardName } from '../../CardName';

export class Cow extends Card implements IActionCard, IProjectCard, IResourceCard {
    constructor() {
        super({
          cardType: CardType.ACTIVE,
          name: CardName.COW,
          tags: [Tags.ANIMAL],
          cost: 9,
          resourceType: ResourceType.ANIMAL,

          requirements: CardRequirements.builder((b) => b.oxygen(5)),
          metadata: {
            cardNumber: 'Q015',
            renderData: CardRenderer.builder((b) => {
                b.effect('Action: Spend 2 plants to dd 1 Animal to this card and gain 5 MC.',(eb) => {
                eb.plants(2).startAction.megacredits(5).nbsp.animals(1);
                }).br;
                b.vpText('1 VP for each 2 Animals on this card.');
            }),
            description: 'Requires 5% oxygen.',
            victoryPoints: CardRenderDynamicVictoryPoints.animals(1, 2),
            }
        });
    }
    public resourceCount = 0;
    public canPlay(player: Player): boolean {
      return player.game.checkMinRequirements(player, GlobalParameter.OXYGEN, 5);
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
}

