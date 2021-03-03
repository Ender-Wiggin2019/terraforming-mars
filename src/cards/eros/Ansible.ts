import {IProjectCard} from './../IProjectCard';
import {Tags} from './../Tags';
import {CardType} from './../CardType';
import {Player} from '../../Player';
import {Game} from '../../Game';
import {IActionCard} from './../ICard';
import {CardName} from '../../CardName';
import {CardMetadata} from '../CardMetadata';
import {CardRequirements} from '../CardRequirements';
import {CardRenderer} from '../render/CardRenderer';
import { DiscardCards } from '../../deferredActions/DiscardCards';
import { DrawCards } from '../../deferredActions/DrawCards';

export class Ansible implements IActionCard, IProjectCard {
    public cost = 18;
    public tags = [Tags.SCIENCE];
    public cardType = CardType.ACTIVE;
    public name = CardName.ANSIBLE;

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

    public action(player: Player, game: Game) {
        game.defer(new DiscardCards(player, game));
        game.defer(new DrawCards(player, game, 3));
        const otherPlayers = game.getPlayers().filter((p) => p.id !== player.id);
        for (const p of otherPlayers) {
            game.defer(new DrawCards(p, game));
        }
        return undefined;
    }

    public metadata: CardMetadata = {
      cardNumber: 'Q14',
      requirements: CardRequirements.builder((b) => b.tag(Tags.SCIENCE, 7)),
      renderData: CardRenderer.builder((b) => {
        b.effectBox((eb) => {
          eb.empty().startAction.minus().cards(1);
          eb.plus().cards(3).digit.nbsp.plus().cards(1).any.asterix();
          eb.description('Action: Discard 1 card from your hand and THEN draw 3 cards. All OPPONENTS draw 1 card.');
        });
      }),
      description: 'Requires 7 science tags.',
      victoryPoints: 2,
    };
}

