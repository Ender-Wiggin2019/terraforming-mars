
import {IActionCard} from '../../ICard';
import {Tags} from '../../Tags';
import {Player} from '../../../Player';
import {Game} from '../../../Game';
import {CorporationCard} from '../../corporation/CorporationCard';
import {CardName} from '../../../CardName';
import {CardType} from '../../CardType';
import {PartyHooks} from '../../../turmoil/parties/PartyHooks';
import {REDS_RULING_POLICY_COST} from '../../../constants';
import {PartyName} from '../../../turmoil/parties/PartyName';
import { CardMetadata } from '../../CardMetadata';
import { CardRenderer } from '../../render/CardRenderer';
import { CardRenderItemSize } from '../../render/CardRenderItemSize';

export class _UnitedNationsMarsInitiative_ implements IActionCard, CorporationCard {
    public name: CardName = CardName._UNITED_NATIONS_MARS_INITIATIVE_;
    public tags: Array<Tags> = [Tags.EARTH];
    public startingMegaCredits: number = 40;
    public cardType: CardType = CardType.CORPORATION;

    public play() {
      return undefined;
    }
    public canAct(player: Player, game: Game): boolean {
      const hasIncreasedTR = player.hasIncreasedTerraformRatingThisGeneration;
      const actionCost = 5;

      if (PartyHooks.shouldApplyPolicy(game, PartyName.REDS)) {
        return hasIncreasedTR && player.canAfford(REDS_RULING_POLICY_COST + actionCost);
      }

      return hasIncreasedTR && player.canAfford(actionCost);
    }

    public action(player: Player, game: Game) {
      player.megaCredits -= 5;
      player.increaseTerraformRating(game);
      return undefined;
    }
    public metadata: CardMetadata = {
      cardNumber: 'R32',
      description: 'You start with 40 MC.',
      renderData: CardRenderer.builder((b) => {
        // TODO(chosta): find a not so hacky solutions to spacing
        b.br.br.br;
        b.empty().nbsp.nbsp.nbsp.nbsp.megacredits(40);
        b.corpBox('action', (ce) => {
          ce.effectBox((eb) => {
            ce.vSpace(CardRenderItemSize.LARGE);
            eb.megacredits(5).startAction.tr(1, CardRenderItemSize.SMALL).asterix();
            eb.description(undefined);
          });
          ce.vSpace();
          ce.effectBox((eb) => {
            eb.tr(1, CardRenderItemSize.SMALL).asterix().startEffect.megacredits(2);
            eb.description('Action:If your TR was raised this generation, you may pay 5 MC to raise 1 step. When you raise TR in generation, gain 2 MC.');
          });
        });
      }),
    }
}


