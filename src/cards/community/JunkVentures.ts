import {Player} from '../../Player';
import {CardRenderer} from '../render/CardRenderer';
import {LogHelper} from '../../LogHelper';
import {DrawCards} from '../../deferredActions/DrawCards';
import {SimpleDeferredAction} from '../../deferredActions/DeferredAction';
import {Dealer} from '../../Dealer';
import {CardName} from '../../common/cards/CardName';
import {CardType} from '../../common/cards/CardType';
import {Size} from '../../common/cards/render/Size';
import {Card} from '../Card';
import {ICorporationCard} from '../corporation/ICorporationCard';

export class JunkVentures extends Card implements ICorporationCard {
  constructor() {
    super({
      cardType: CardType.CORPORATION,
      name: CardName.JUNK_VENTURES,
      tags: [],
      initialActionText: 'Discard the top 3 cards of the deck',
      startingMegaCredits: 40,

      metadata: {
        cardNumber: 'R49',
        description: 'You start with 40 M€. As your first action, discard the top 3 cards of the deck.',
        renderData: CardRenderer.builder((b) => {
          b.br.br;
          b.megacredits(40).text('DECK: ').minus().cards(3);
          b.corpBox('action', (cb) => {
            cb.text('ACTION: SHUFFLE THE DISCARD PILE, THEN DRAW 3 CARDS FROM IT. KEEP 1 AND DISCARD THE OTHER 2.', Size.SMALL, true);
          });
        }),
      },
    });
  }

  public play() {
    return undefined;
  }

  public initialAction(player: Player) {
    const discardedCards = new Set<CardName>();

    for (let i = 0; i < 3; i++) {
      const card = player.game.dealer.dealCard(player.game);
      player.game.dealer.discard(card);
      discardedCards.add(card.name);
    }

    LogHelper.logDiscardedCards(player.game, Array.from(discardedCards));
    return undefined;
  }

  public canAct(player: Player): boolean {
    return player.game.dealer.getDiscardedSize() >= 3;
  }

  public action(player: Player) {
    const game = player.game;
    const dealer = game.dealer;
    dealer.discarded = Dealer.shuffle(dealer.discarded);

    const drawnCards = dealer.discarded.splice(0, 3);
    game.defer(new SimpleDeferredAction(player, () => DrawCards.choose(player, drawnCards, {keepMax: 1})));
    game.cardDrew = true;
    return undefined;
  }
}
