import {IProjectCard} from './../IProjectCard';
import {Tags} from './../Tags';
import {CardType} from './../CardType';
import {Player} from '../../Player';
import {IActionCard} from './../ICard';
import {CardName} from '../../CardName';
import {CardRequirements} from '../CardRequirements';
import {CardRenderer} from '../render/CardRenderer';
import { DiscardCards } from '../../deferredActions/DiscardCards';
import { DrawCards } from '../../deferredActions/DrawCards';
import { Card } from '../Card';
import { Priority } from '../../deferredActions/DeferredAction';

export class Ansible extends Card implements IActionCard, IProjectCard {
    constructor() {
        super({
          cardType: CardType.ACTIVE,
          name: CardName.ANSIBLE,
          tags: [Tags.SCIENCE],
          cost: 18,
    
          requirements: CardRequirements.builder((b) => b.tag(Tags.SCIENCE, 7)),
          metadata: {
            cardNumber: 'Q14',
            renderData: CardRenderer.builder((b) => {
              b.effect('Action: Discard 1 card from your hand and THEN draw 3 cards. All OPPONENTS draw 1 card.',(eb) => {
                eb.empty().startAction.minus().cards(1);
                eb.plus().cards(3).digit.nbsp.plus().cards(1).any.asterix();
              });
            }),
            description: 'Requires 7 science tags.',
            victoryPoints: 2,
          },
        });
    }
    public canPlay(player: Player): boolean {
      return player.getTagCount(Tags.SCIENCE) >= 7;
    }

    public play() {
      return undefined;
    }

    public canAct(player: Player): boolean {
        return player.cardsInHand.length > 0;
    }

    public getVictoryPoints() {
      return 2;
    }

    public action(player: Player) {
        player.game.defer(new DiscardCards(player), Priority.DISCARD_BEFORE_DRAW);
        player.game.defer(DrawCards.keepAll(player, 3));
        const otherPlayers = player.game.getPlayers().filter((p) => p.id !== player.id);
        for (const p of otherPlayers) {
          player.game.defer(DrawCards.keepAll(p));
        }
        return undefined;
    }
}

