
import {CorporationCard} from '../../corporation/CorporationCard';
import {Player} from '../../../Player';
import {Tags} from '../../Tags';
import {ResourceType} from '../../../ResourceType';
import {Game} from '../../../Game';
import {IActionCard, ICard, IResourceCard} from '../../ICard';
import {SelectCard} from '../../../inputs/SelectCard';
import {CardName} from '../../../CardName';
import {LogHelper} from '../../../LogHelper';
import {IProjectCard} from '../../IProjectCard';
import {CardType} from '../../CardType';
// import {CardRenderer} from '../../render/CardRenderer';
// import { CardRenderDynamicVictoryPoints } from '../../render/CardRenderDynamicVictoryPoints';
// import { CardMetadata } from '../../CardMetadata';
export class _Celestic_ implements IActionCard, CorporationCard, IResourceCard {
    public name: CardName = CardName._CELESTIC_;
    public tags: Array<Tags> = [Tags.VENUS];
    public startingMegaCredits: number = 42;
    public cardType: CardType = CardType.CORPORATION;
    public resourceType: ResourceType = ResourceType.FLOATER;
    public resourceCount: number = 0;

    private static readonly floaterCards: Set<CardName> = new Set<CardName>([
      CardName.AEROSPORT_TOURNAMENT,
      CardName.AIR_SCRAPPING_EXPEDITION,
      CardName.AIR_RAID,
      CardName.AIRLINERS,
      CardName.ATMOSCOOP,
      CardName.FLOATER_LEASING,
      CardName.FLOATER_PROTOTYPES,
      CardName.FLOATER_TECHNOLOGY,
      CardName.HYDROGEN_TO_VENUS,
      CardName.NITROGEN_FROM_TITAN,
      CardName.STRATOSPHERIC_BIRDS,
    ]);

    public initialAction(player: Player, game: Game) {
      const requiredCardsCount = 2;
      if (game.hasCardsWithResource(ResourceType.FLOATER, requiredCardsCount)) {
        let drawnCount = 0;
        const floaterCards: Array<CardName> = [];
        const discardedCards: Array<IProjectCard> = [];

        while (drawnCount < requiredCardsCount) {
          const card = game.dealer.dealCard();
          if (_Celestic_.floaterCards.has(card.name) || card.resourceType === ResourceType.FLOATER) {
            player.cardsInHand.push(card);
            drawnCount++;
            floaterCards.push(card.name);
          } else {
            discardedCards.push(card);
            game.dealer.discard(card);
          }
        }

        game.log('${0} drew ${1} and ${2}', (b) => b.player(player).cardName(floaterCards[0]).cardName(floaterCards[1]));

        LogHelper.logDiscardedCards(game, discardedCards);
      }

      return undefined;
    }

    public play() {
      return undefined;
    }

    public canAct(): boolean {
      return true;
    }

    public getVictoryPoints(): number {
      return Math.floor(this.resourceCount / 3);
    }

    public action(player: Player, game: Game) {
      const floaterCards = player.getResourceCards(ResourceType.FLOATER);
      if (floaterCards.length === 1) {
        player.addResourceTo(this);
        LogHelper.logAddResource(game, player, floaterCards[0]);
        return undefined;
      }

      return new SelectCard(
        'Select card to add 1 floater',
        'Add floater',
        floaterCards,
        (foundCards: Array<ICard>) => {
          player.addResourceTo(foundCards[0], 1);
          LogHelper.logAddResource(game, player, foundCards[0]);
          return undefined;
        },
      );
    }
    // public metadata: CardMetadata = {
    //   cardNumber: 'R05',
    //   description: 'You start with 42 MC. As your first action, reveal cards from the deck until you have revealed 2 cards with a floater icon on it. Take them into hand and discard the rest.',
    //   renderData: CardRenderer.builder((b) => {
    //     b.megacredits(42).nbsp.cards(2).secondaryTag('floater');
    //     b.corpBox('action', (ce) => {
    //       ce.effectBox((eb) => {
    //         eb.startAction.floaters(1).asterix().floaters(1).startEffect.megacredits(1).asterix();
    //         eb.description('Action: Add a floater to ANY card. When you gain a floater to ANY CARD, gain 1 MC. 1 VP per 3 floaters on this card.');
    //       });
    //       ce.vSpace(); // to offset the description to the top a bit so it can be readable
    //     });
    //   }),
    //   victoryPoints: CardRenderDynamicVictoryPoints.floaters(1, 3),
    // }
}
