
import {CorporationCard} from '../../corporation/CorporationCard';
import {Tags} from '../../Tags';
import {Player} from '../../../Player';
import {Resources} from '../../../Resources';
import {CardName} from '../../../CardName';
import {CardType} from '../../CardType';
import { CardMetadata } from '../../CardMetadata';
import { CardRenderer } from '../../render/CardRenderer';
import { CardRenderItemSize } from '../../render/CardRenderItemSize';

export class _Helion_ implements CorporationCard {
    public name: CardName = CardName._HELION_;
    public tags: Array<Tags> = [Tags.SPACE];
    public startingMegaCredits: number = 48;
    public cardType: CardType = CardType.CORPORATION;

    public play(player: Player) {
      player.canUseHeatAsMegaCredits = true;
      player.addProduction(Resources.HEAT, 3);
      return undefined;
    }

    public metadata: CardMetadata = {
      cardNumber: 'R18',
      description: 'You start with 3 heat production and 48 MC.',
      renderData: CardRenderer.builder((b) => {
        // b.br;
        b.productionBox((pb) => pb.heat(3)).nbsp.megacredits(48);
        // b.text('(You start with 3 heat production and 42 MC.)', CardRenderItemSize.TINY, false, false);
        b.corpBox('effect', (ce) => {
          ce.effectBox((eb) => {
            ce.vSpace(CardRenderItemSize.LARGE);
            eb.text('x').heat(1).startEffect.megacredits(0).multiplier;
            eb.description(undefined);
          });
          ce.effectBox((eb) => {
            eb.temperature(1).any.startEffect.heat(2);
            eb.description('Effect: You may use heat as MC. You may not use MC as heat. Any player increase Temperature, that player gain 2 heat.');
            // eb.description('Effect: You may use heat as MC. You may not use MC as heat.');
          });
        });
      }),
    }
}

