import {IProjectCard} from '../IProjectCard';
import {Tags} from '../Tags';
import {CardType} from '../CardType';
import {Player} from '../../Player';
import {CardName} from '../../CardName';
import {Game} from '../../Game';
import {BuildColony} from '../../deferredActions/BuildColony';
import {CardMetadata} from '../CardMetadata';
import {CardRequirements} from '../CardRequirements';
import {CardRenderer} from '../render/CardRenderer';
import { Colony } from '../../colonies/Colony';
import { ColonyModel } from '../../models/ColonyModel';
import { SelectColony } from '../../inputs/SelectColony';
import { ColonyName } from '../../colonies/ColonyName';

export class JovianExpedition implements IProjectCard {
    public cost = 25;
    public tags = [Tags.JOVIAN, Tags.SPACE];
    public name = CardName.JOVIAN_EXPEDITION;
    public cardType = CardType.AUTOMATED;

    public canPlay(player: Player, game: Game): boolean {
      let coloniesCount: number = 0;
      game.colonies.forEach((colony) => {
        coloniesCount += colony.colonies.filter((owner) => owner === player).length;
      });
      return coloniesCount > 0;
    }

    public play(player: Player, game: Game) {
        if (game.colonyDealer === undefined || !game.gameOptions.coloniesExtension) return undefined;

        const availableColonies: Colony[] = game.colonyDealer.discardedColonies;
        if (availableColonies.length === 0) return undefined;

        const coloniesModel: Array<ColonyModel> = game.getColoniesModel(availableColonies);
        const selectColony = new SelectColony('Select colony tile to add', 'Add colony tile', coloniesModel, (colonyName: ColonyName) => {
            if (game.colonyDealer !== undefined) {
            availableColonies.forEach((colony) => {
                if (colony.name === colonyName) {
                game.colonies.push(colony);
                game.colonies.sort((a, b) => (a.name > b.name) ? 1 : -1);
                game.log('${0} added a new Colony tile: ${1}', (b) => b.player(player).colony(colony));
                this.checkActivation(colony, game);
                game.defer(new BuildColony(player, game, false, 'Select colony for Jovian Expedition'));
                return undefined;
                }
                return undefined;
            });
            return undefined;
            } else return undefined;
        },
        );
        return selectColony;
    }


    private checkActivation(colony: Colony, game: Game): void {
        if (colony.resourceType === undefined) return;
        game.getPlayers().forEach((player) => {
          if (player.corporationCard !== undefined && player.corporationCard.resourceType === colony.resourceType) {
            colony.isActive = true;
            return;
          }
          const resourceCard = player.playedCards.find((card) => card.resourceType === colony.resourceType);
          if (resourceCard !== undefined) {
            colony.isActive = true;
            return;
          }
        });
      }

    public getVictoryPoints(_player: Player) {
      return 1;
    }

    public metadata: CardMetadata = {
      cardNumber: 'Q08',
      requirements: CardRequirements.builder((b) => b.colonies()),
      renderData: CardRenderer.builder((b) => {
        b.placeColony().nbsp.colonies(1);
      }),
      description: 'Requires a colony. Add a colony tile and place a colony.',
      victoryPoints: 1,
    }
}
