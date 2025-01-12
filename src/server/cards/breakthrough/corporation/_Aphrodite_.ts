
import {IPlayer} from '../../../IPlayer';
import {CardRenderer} from '../../render/CardRenderer';
import {Aphrodite} from '../../venusNext/Aphrodite';
import {all} from '../../Options';
import {CardName} from '../../../../common/cards/CardName';
import {CardMetadata} from '../../../../common/cards/CardMetadata';

export class _Aphrodite_ extends Aphrodite {
  public override get name() {
    return CardName._APHRODITE_;
  }
  public override get startingMegaCredits() : number {
    return 40;
  }

  public initialAction(player: IPlayer) {
    player.game.increaseVenusScaleLevel(player, 2);
    return undefined;
  }

  public override play(_player: IPlayer) {
    return undefined;
  }

  public override get metadata(): CardMetadata {
    return {
      cardNumber: 'R01',
      description: 'You start with 40 M€. As your first action, raise Venus Scale 2 steps.',
      renderData: CardRenderer.builder((b) => {
        b.br;
        b.megacredits(40).nbsp.venus(1).venus(1);
        b.corpBox('effect', (ce) => {
          ce.effect('Whenever Venus is terraformed 1 step, you gain 2 plant.', (eb) => {
            eb.venus(1, {all}).startEffect.plants(2);
          });
        });
      }),
    };
  }
}
