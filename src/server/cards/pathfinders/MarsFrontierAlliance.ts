import {CorporationCard} from '../corporation/CorporationCard';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../../server/IPlayer';
import {PlayerInput} from '../../../server/PlayerInput';
import {ChooseAlliedParty} from '../../../server/deferredActions/ChooseAlliedParty';
import {TurmoilUtil} from '../../turmoil/TurmoilUtil';

export class MarsFrontierAlliance extends CorporationCard {
  constructor() {
    super({
      name: CardName.MARS_FRONTIER_ALLIANCE,
      tags: [],
      startingMegaCredits: 40,

      metadata: {
        cardNumber: 'PfC20',
        hasExternalHelp: true,
        description:
          'You start with 40 M€. When you reveal this card, select any remaining political program tile (you may use its effect as a passive effect of your corporation or as ruling party this generation).',
        renderData: CardRenderer.builder((b) => {
          b.megacredits(40).nbsp.policy().br;
          b.effect(
            'After new ruling party is chosen, place the political program tile of the second most popular party on this card (you may use its effect as a passive effect of your corporation or as ruling party this generation).',
            (eb) => {
              eb.empty().startEffect.plus().policy().asterix();
            },
          ).br;
        }),
      },
    });
  }

  public override bespokePlay(player: IPlayer): PlayerInput | undefined {
    const game = player.game;
    const turmoil = TurmoilUtil.getTurmoil(game);

    game.defer(new ChooseAlliedParty(player, turmoil.parties, (selectedParty) => {
      player.setAlliedParty(selectedParty);
    }));
    return undefined;
  }
}
