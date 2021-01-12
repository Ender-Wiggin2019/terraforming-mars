import {Player} from '../../../Player';
import {CorporationCard} from '../../corporation/CorporationCard';
import {ISpace} from '../../../boards/ISpace';
import {CardName} from '../../../CardName';
import {CardType} from '../../CardType';
import {CardMetadata} from '../../CardMetadata';
import {CardRenderer} from '../../render/CardRenderer';
import { CardRenderItemSize } from '../../render/CardRenderItemSize';
import { IActionCard } from '../../ICard';
import { Game } from '../../../Game';
import { SelectSpace } from '../../../inputs/SelectSpace';


export class _ArcadianCommunities_ implements IActionCard, CorporationCard {
    public name = CardName._ARCADIAN_COMMUNITIES_;
    public tags = [];
    public startingMegaCredits: number = 40;
    public cardType = CardType.CORPORATION;

    public initialActionText: string = 'Place a community (player marker) on a non-reserved area';
    public initialAction(player: Player, game: Game) {
      return new SelectSpace(
        'Select space for claim',
        game.board.getAvailableSpacesOnLand(player),
        (foundSpace: ISpace) => {
          foundSpace.player = player;

          game.log('${0} placed a Community (player marker)', (b) => b.player(player));

          return undefined;
        },
      );
    }

    public canAct(player: Player, game: Game): boolean {
      return game.board.getAvailableSpacesForMarker(player).length > 0;
    }

    public action(player: Player, game: Game) {
      return new SelectSpace(
        'Select space for claim',
        game.board.getAvailableSpacesForMarker(player),
        (foundSpace: ISpace) => {
          foundSpace.player = player;
          return undefined;
        },
      );
    }

    public play(player: Player) {
      player.steel = 10;
      return undefined;
    }

    public onTilePlaced(player: Player, space: ISpace, game: Game): void {
        let bonusResource: number = 0;
        if (space.player !== undefined && space.player.isCorporation(CardName._ARCADIAN_COMMUNITIES_)) {
            bonusResource = game.board.getAdjacentSpaces(space)
            .filter((space) => space.tile !== undefined && space.player !== undefined && space.player === player)
            .length;
        }
        player.megaCredits += bonusResource;
        
    }

  
    public metadata: CardMetadata = {
      cardNumber: 'R44',
      description: 'You start with 40 MC and 10 steel. As your first action, place a community on a non-reserved area.',
      renderData: CardRenderer.builder((b) => {
        b.br;
        b.megacredits(40).nbsp.steel(10).digit.nbsp.community().asterix();
        b.corpBox('action', (ce) => {
          ce.effectBox((eb) => {
            ce.vSpace(CardRenderItemSize.LARGE);
            eb.emptyTile('normal', CardRenderItemSize.SMALL).emptyTile('normal', CardRenderItemSize.SMALL).startEffect.megacredits(1);
            eb.description('Action: place a community on a non-reserved area adjacent to one of your tiles or marked areas.Effect: marked areas are reserved for you. when you place a tile there, gain 3 MC. When you place a tile, gain 1 MC for each tiles you own adjacent to it.');
          });
        });   
      }),
    }
}

