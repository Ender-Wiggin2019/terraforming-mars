import {IProjectCard} from '../IProjectCard';
import {IActionCard, IResourceCard} from '../ICard';
import {Tags} from '../Tags';
import {CardType} from '../CardType';
import {Player} from '../../Player';
import {ResourceType} from '../../ResourceType';
import {CardName} from '../../CardName';
import {Resources} from '../../Resources';
import {CardMetadata} from '../CardMetadata';
import {CardRenderer} from '../render/CardRenderer';

export class SaturnSurfing implements IActionCard, IProjectCard, IResourceCard {
    public name = CardName.SATURN_SURFING;
    public cost = 13;
    public tags = [Tags.JOVIAN, Tags.EARTH];
    public cardType = CardType.ACTIVE;
    public resourceType = ResourceType.FLOATER;
    public resourceCount: number = 0;

    public play(player: Player) {
      player.addResourceTo(this, player.getTagCount(Tags.EARTH) + 1);
      return undefined;
    }

    public canAct(): boolean {
      return this.resourceCount > 0;
    }

    public action(player: Player) {
      player.setResource(Resources.MEGACREDITS, Math.min(5, this.resourceCount--));
      return undefined;
    }

    public getVictoryPoints() {
      return 1;
    }

    public metadata: CardMetadata = {
      cardNumber: 'X11',
      renderData: CardRenderer.builder((b) => {
        b.effectBox((eb) => {
          eb.floaters(1).startAction.megacredits(1).slash().floaters(1);
          eb.asterix().text('max 5');
          eb.description('Action: Spend 1 floater from here to gain 1 MC from each floater here, INCLUDING THE PAID FLOATER. Max 5.');
        }).br;
        b.floaters(1).slash().earth().played;
      }),
      description: 'Add 1 floater here for every Earth tag you have, including this.',
      victoryPoints: 1,
    }
}
