import {IProjectCard} from '../IProjectCard';
import {CardType} from '../CardType';
import {Player} from '../../Player';
import {Game} from '../../Game';
import {CardName} from '../../CardName';
import {CardMetadata} from '../CardMetadata';
import {CardRenderer} from '../render/CardRenderer';
import { Tags } from '../Tags';

export class EnergySupply implements IProjectCard {
    public cost = 3;
    public tags = [Tags.ENERGY];
    public name = CardName.ENERGY_SUPPLY;
    public cardType = CardType.EVENT;

    public play(player: Player, _game: Game) {
      player.energy += 3;
      return undefined;
    }

    public metadata: CardMetadata = {
      cardNumber: 'Q18',
      renderData: CardRenderer.builder((b) => b.energy(3)),
      description: 'Gain 3 energy.',
    }
}
