import { CorporationCard } from "../../corporation/CorporationCard";
import { Player } from "../../../Player";
import { Tags } from "../../Tags";
import { Resources } from "../../../Resources";
import { CardName } from "../../../CardName";
import { CardType } from "../../CardType";
import {CardMetadata} from '../../CardMetadata';
import {CardRenderer} from '../../render/CardRenderer';

export class _Polyphemos_ implements CorporationCard {
    public name: CardName = CardName._POLYPHEMOS_;
    public tags: Array<Tags> = [];
    public startingMegaCredits: number = 50;
    public cardType: CardType = CardType.CORPORATION;
    

    public play(player: Player) {
        player.addProduction(Resources.MEGACREDITS, 5);
        player.titanium = 5;
        player.cardCost = 5;
        return undefined;
    }
    public metadata: CardMetadata = {
        cardNumber: 'R11',
        description: 'You start with 50MC. Increase your MC production 5 steps. Gain 5 titanium.',
        renderData: CardRenderer.builder((b) => {
          b.br;
          b.megacredits(50).nbsp.productionBox((pb) => pb.megacredits(5)).nbsp.titanium(5).digit;
          b.corpBox('effect', (ce) => {
            ce.effectBox((eb) => {
              eb.cards(1).asterix().startEffect.megacredits(5).slash().megacredits(3);
              eb.description('Effect: When you buy a card to hand, pay 5MC instead of 3, including the starting hand. When you sell patent, you gain 3 instead of 1.');
            });
          });
        }),
      }
  }
