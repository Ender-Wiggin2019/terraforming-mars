import {CorporationCard} from '../corporation/CorporationCard';
import {Player} from '../../Player';
import {Tags} from '../Tags';
import {ResourceType} from '../../ResourceType';
import {IActionCard, ICard, IResourceCard} from '../ICard';
import {SelectCard} from '../../inputs/SelectCard';
import {CardName} from '../../CardName';
import {LogHelper} from '../../LogHelper';
import {CardType} from '../CardType';
import {CardMetadata} from '../CardMetadata';
import {CardRenderer} from '../render/CardRenderer';
import {CardRenderDynamicVictoryPoints} from '../render/CardRenderDynamicVictoryPoints';
import {AltSecondaryTag} from '../render/CardRenderItem';

export class Celestic implements IActionCard, CorporationCard, IResourceCard {
    public name = CardName.CELESTIC;
    public tags = [Tags.VENUS];
    public startingMegaCredits: number = 42;
    public resourceType = ResourceType.FLOATER;
    public cardType = CardType.CORPORATION;
    public resourceCount: number = 0;

    public static readonly floaterCards: Set<CardName> = new Set<CardName>([
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

    public initialActionText: string = 'Draw 2 cards with a floater icon on it';
    public initialAction(player: Player) {
      player.drawCard(2, {
        include: (card) => Celestic.floaterCards.has(card.name) || card.resourceType === ResourceType.FLOATER,
      });
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

    public action(player: Player) {
      const floaterCards = player.getResourceCards(ResourceType.FLOATER);
      if (floaterCards.length === 1) {
        player.addResourceTo(this);
        LogHelper.logAddResource(player, floaterCards[0]);
        return undefined;
      }

      return new SelectCard(
        'Select card to add 1 floater',
        'Add floater',
        floaterCards,
        (foundCards: Array<ICard>) => {
          player.addResourceTo(foundCards[0], 1);
          LogHelper.logAddResource(player, foundCards[0]);
          return undefined;
        },
      );
    }

    public metadata?: CardMetadata = {
      cardNumber: 'R05',
      description: 'You start with 42 MC. As your first action, reveal cards from the deck until you have revealed 2 cards with a floater icon on it. Take them into hand and discard the rest.',
      renderData: CardRenderer.builder((b) => {
        b.megacredits(42).nbsp.cards(2).secondaryTag(AltSecondaryTag.FLOATER);
        b.corpBox('action', (ce) => {
          ce.action('Add a floater to ANY card. 1 VP per 3 floaters on this card.', (eb) => {
            eb.empty().startAction.floaters(1).asterix();
          });
          ce.vSpace(); // to offset the description to the top a bit so it can be readable
        });
      }),
      victoryPoints: CardRenderDynamicVictoryPoints.floaters(1, 3),
    }
}
