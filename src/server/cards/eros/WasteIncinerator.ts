import {IProjectCard} from '../IProjectCard';
import {Card} from '../Card';
import {IPlayer} from '../../IPlayer';
import {TileType} from '../../../common/TileType';
import {SelectSpace} from '../../inputs/SelectSpace';
import {Space} from '../../boards/Space';
import {Board} from '../../boards/Board';
import {CardRenderer} from '../render/CardRenderer';
import {CardName} from '../../../common/cards/CardName';
import {CardType} from '../../../common/cards/CardType';
import {CardMetadata} from '../../../common/cards/CardMetadata';
import {Tag} from '../../../common/cards/Tag';
import {AdjacencyBonus} from '../../ares/AdjacencyBonus';

export class WasteIncinerator extends Card implements IProjectCard {
  constructor(
    name: CardName = CardName.WASTE_INCINERATOR,
    adjacencyBonus: AdjacencyBonus | undefined = undefined,
    metadata: CardMetadata = {
      cardNumber: 'Q11',
      renderData: CardRenderer.builder((b) => {
        b.effect('When you sell patents, you can gain 2 heat instead of 1 MC. ', (eb) => {
          eb.cards(1).startEffect.heat(2).asterix;
        }).br;
        b.tile(TileType.WASTE_INCINERATOR, true, false).asterix();
      }),
      description: 'Place this tile adjacent to a city tile.',
    }) {
    super({
      type: CardType.ACTIVE,
      name,
      tags: [Tag.BUILDING],
      cost: 4,
      adjacencyBonus,

      metadata,
    });
  }

  private getAvailableSpaces(player: IPlayer): Array<Space> {
    return player.game.board.getAvailableSpacesOnLand(player)
      .filter((space) => player.game.board.getAdjacentSpaces(space).some((adjacentSpace) => Board.isCitySpace(adjacentSpace)));
  }
  public override bespokeCanPlay(player: IPlayer): boolean {
    return this.getAvailableSpaces(player).length > 0;
  }
  public override bespokePlay(player: IPlayer) {
    return new SelectSpace('Select space adjacent to a city tile', this.getAvailableSpaces(player)).andThen((foundSpace: Space) => {
      player.game.addTile(player, foundSpace, {tileType: TileType.WASTE_INCINERATOR});
      foundSpace.adjacency = this.adjacencyBonus;
      return undefined;
    });
  }
}


