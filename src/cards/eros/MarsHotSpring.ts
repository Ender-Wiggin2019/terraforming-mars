import {IProjectCard} from '../IProjectCard';
import {Tags} from '../Tags';
import {Player} from '../../Player';
import {Game} from '../../Game';
import {CardType} from '../CardType';
import {Resources} from '../../Resources';
import {CardName} from '../../CardName';
import {SelectSpace} from '../../inputs/SelectSpace';
import {TileType} from '../../TileType';
import {ISpace} from '../../boards/ISpace';
import {Board} from '../../boards/Board';
import {CardMetadata} from '../CardMetadata';
import {CardRequirements} from '../CardRequirements';
import {CardRenderer} from '../render/CardRenderer';

export class MarsHotSpring implements IProjectCard {
    public cost = 12;
    public tags = [Tags.BUILDING];
    public cardType = CardType.AUTOMATED;
    public name = CardName.MARS_HOT_SPRING;

    public canPlay(player: Player, game: Game): boolean {
      const meetsOceanRequirements = game.board.getOceansOnBoard() >= 3 - player.getRequirementsBonus(game);
      const canPlaceTile = this.getAvailableSpaces(player, game).length > 0;

      return meetsOceanRequirements && canPlaceTile;
    }
    public play(player: Player, game: Game) {
      player.addProduction(Resources.MEGACREDITS, 2);
      player.addProduction(Resources.HEAT, 2);

      const availableSpaces = this.getAvailableSpaces(player, game);
      if (availableSpaces.length < 1) return undefined;

      return new SelectSpace('Select space for tile', availableSpaces, (foundSpace: ISpace) => {
        game.addTile(player, foundSpace.spaceType, foundSpace, {tileType: TileType.HOT_SPRING});
        return undefined;
      });
    }

    private getAvailableSpaces(player: Player, game: Game): Array<ISpace> {
      return game.board.getAvailableSpacesOnLand(player)
        .filter(
          (space) => game.board.getAdjacentSpaces(space).filter(
            (adjacentSpace) => Board.isOceanSpace(adjacentSpace),
          ).length > 0,
        );
    }
    public metadata: CardMetadata = {
      cardNumber: 'Q06',
      requirements: CardRequirements.builder((b) => b.oceans(3)),
      renderData: CardRenderer.builder((b) => {
        b.productionBox((pb) => pb.megacredits(2).nbsp.heat(2).digit).br;
        b.tile(TileType.HOT_SPRING, true, false).asterix();
      }),
      description: 'Requires 3 ocean tiles. Increase your MC and Heat production 2 steps. Place this tile ADJACENT TO an ocean tile.',
    };
}

