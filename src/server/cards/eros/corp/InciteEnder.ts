import {CardRenderer} from '../../render/CardRenderer';
import {IPlayer} from '../../../IPlayer';
import {SendDelegateToArea} from '../../../deferredActions/SendDelegateToArea';
import {IGlobalEvent} from '../../../turmoil/globalEvents/IGlobalEvent';
import {SimpleDeferredAction} from '../../../deferredActions/DeferredAction';
import {CardName} from '../../../../common/cards/CardName';
import {Tag} from '../../../../common/cards/Tag';
import {SelectGlobalEvent} from '../../../inputs/SelectGlobalEvent';
import {CorporationCard} from '../../corporation/CorporationCard';

export class InciteEnder extends CorporationCard {
  constructor() {
    super({
      name: CardName.INCITE_ENDER,
      tags: [Tag.SCIENCE],
      startingMegaCredits: 54,

      metadata: {
        cardNumber: 'Q24',
        description: `You start with 54 M€. As your first action, place two delegates in one party.`,
        renderData: CardRenderer.builder((b) => {
          b.br;
          b.megacredits(54).nbsp.delegates(2);
          b.corpBox('action', (ce) => {
            ce.vSpace();
            ce.action('Look at the top 3 cards of global events deck and discard any of them.', (eb) => {
              eb.empty().startAction.text('3').globalEvent().asterix();
            });
            ce.effect('Get 1 influence per leader of the Non-dominant party.', (eb) => {
              eb.startEffect.plus().influence({amount: 1}).slash().partyLeaders().empty().asterix();
            });
          });
        }),
      },
    });
  }


  public initialAction(player: IPlayer) {
    if (player.game.turmoil) {
      const title = 'Incite first action - Select where to send two delegates';
      player.game.defer(new SendDelegateToArea(player, title, {count: 2}));
    }
    return undefined;
  }

  public canAct(): boolean {
    return true;
  }

  public action(player: IPlayer) {
    if (!player.game.turmoil) {
      return undefined;
    }

    const cards: Array<IGlobalEvent> = [];
    const globalEventDealer = player.game.turmoil.globalEventDealer;
    let card = globalEventDealer.draw();
    if (card !== undefined) {
      cards.unshift(card);
    }
    card = globalEventDealer.draw();
    if (card !== undefined) {
      cards.unshift(card);
    }
    card = globalEventDealer.draw();
    if (card !== undefined) {
      cards.unshift(card);
    }

    const cb = (selected: Array<IGlobalEvent>) => {
      const chosecards = cards.filter((x) => !selected.includes(x));
      while (chosecards.length > 0) {
        globalEventDealer.putback(chosecards.shift());
      }
      const unchosecards = cards.filter((x) => selected.includes(x));
      while (unchosecards.length > 0) {
        globalEventDealer.putbottom(unchosecards.shift());
      }
      return undefined;
    };
    player.game.defer(new SimpleDeferredAction(
      player,
      () => new SelectGlobalEvent(
        cards,
        'Select card(s) to discard',
        'Discard',
        3,
        0,
      ).andThen(cb),
    ));
    return undefined;
  }
}
