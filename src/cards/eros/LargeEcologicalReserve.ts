import {IProjectCard} from '../IProjectCard';
import {Tags} from '../Tags';
import {CardType} from '../CardType';
import {Player} from '../../Player';
import {CardName} from '../../CardName';
import {CardMetadata} from '../CardMetadata';
import {CardRequirements} from '../CardRequirements';
import { MAX_OXYGEN_LEVEL, REDS_RULING_POLICY_COST } from '../../constants';
import { PartyHooks } from '../../turmoil/parties/PartyHooks';
import { PartyName } from '../../turmoil/parties/PartyName';
import { Game } from '../../Game';
import { PlaceGreeneryTile } from '../../deferredActions/PlaceGreeneryTile';
import { CardRenderer } from '../render/CardRenderer';

export class LargeEcologicalReserve implements IProjectCard {
  public cost = 39;
  public tags = [Tags.PLANT, Tags.MICROBE, Tags.ANIMAL, Tags.BUILDING];
  public cardType = CardType.AUTOMATED;
  public name = CardName.LARGE_ECOLOGICAL_RESERVE;

public canPlay(player: Player, game: Game): boolean {
    const canPlaceTile = game.board.getAvailableSpacesOnLand(player).length > 0;
    const oxygenMaxed = game.getOxygenLevel() === MAX_OXYGEN_LEVEL;
    const oxygenIncreased = Math.min(MAX_OXYGEN_LEVEL-game.getOxygenLevel(), 2);

    if (PartyHooks.shouldApplyPolicy(game, PartyName.REDS) && !oxygenMaxed) {
        return player.canAfford(player.getCardCost(game, this) + oxygenIncreased*REDS_RULING_POLICY_COST, game, false, false, false, true) && canPlaceTile && player.checkMultipleTagPresence([Tags.PLANT, Tags.ANIMAL, Tags.MICROBE]);;
    }

    return canPlaceTile && player.checkMultipleTagPresence([Tags.PLANT, Tags.ANIMAL, Tags.MICROBE]);;
  }
  public play(player: Player, game: Game) {
    game.defer(new PlaceGreeneryTile(player, game, 'Select space for first greenery'));
    if (game.board.getAvailableSpacesOnLand(player).length > 0){
        game.defer(new PlaceGreeneryTile(player, game, 'Select space for second greenery'));
    }
    return undefined;
  }
  public getVictoryPoints() {
    return 1;
  }

  public metadata: CardMetadata = {
    description: 'Requires a Plant tag, a Microbe tag, and an Animal tag. Place 2 greenery tiles and raise oxygen 2 steps',
    cardNumber: 'Q02',
    requirements: CardRequirements.builder((b) => b.tag(Tags.PLANT).tag(Tags.ANIMAL).tag(Tags.MICROBE)),
    renderData: CardRenderer.builder((b) => {
        b.greenery().secondaryTag('oxygen').greenery().secondaryTag('oxygen');
      }),
    victoryPoints: 1,
  };
}



