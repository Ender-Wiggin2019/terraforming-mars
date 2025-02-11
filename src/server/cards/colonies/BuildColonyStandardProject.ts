import {IPlayer} from '../../IPlayer';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {StandardProjectCard} from '../StandardProjectCard';
import {ColonyName} from '../../../common/colonies/ColonyName';
import {BuildColony} from '../../deferredActions/BuildColony';

export class BuildColonyStandardProject extends StandardProjectCard {
  constructor() {
    super({
      name: CardName.BUILD_COLONY_STANDARD_PROJECT,
      cost: 17,
      metadata: {
        cardNumber: 'SP5',
        renderData: CardRenderer.builder((b) =>
          b.standardProject('Spend 17 M€ to place a colony.', (eb) => {
            eb.megacredits(17).startAction.colonies();
          }),
        ),
      },
    });
  }

  protected override discount(player: IPlayer): number {
    const adhaiDiscount = Math.floor(player.resourcesOnCard(CardName.ADHAI_HIGH_ORBIT_CONSTRUCTIONS) / 2);
    return adhaiDiscount + super.discount(player);
  }

  private getOpenColonies(player: IPlayer) {
    let openColonies = player.game.colonies.filter((colony) => !colony.isFull() &&
      colony.colonies.includes(player) === false &&
      colony.isActive);

    // TODO(kberg): Europa sometimes costs additional 3.
    const canAffordVenus = player.canAfford({cost: this.cost, tr: {venus: 1}});
    if (!canAffordVenus) {
      openColonies = openColonies.filter((colony) => colony.name !== ColonyName.VENUS);
    }

    return openColonies;
  }

  public override canAct(player: IPlayer): boolean {
    return super.canAct(player) && this.getOpenColonies(player).length > 0;
  }

  actionEssence(player: IPlayer): void {
    player.game.defer(new BuildColony(player));
  }
}
