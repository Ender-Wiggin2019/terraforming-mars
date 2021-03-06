import { IProjectCard } from "../IProjectCard";
import { Tags } from "../Tags";
import { CardType } from "../CardType";
import { Player } from "../../Player";
import { Resources } from "../../Resources";
import { CardName } from "../../CardName";
import { CardMetadata } from "../CardMetadata";
import { CardRenderer } from "../render/CardRenderer";

export class StarcorePlunder implements IProjectCard {
    public cost: number = 80;
    public tags: Array<Tags> = [Tags.PLANT, Tags.ENERGY, Tags.SPACE, Tags.BUILDING];
    public name: CardName = CardName.STARCORE_PLUNDER;
    public cardType: CardType = CardType.AUTOMATED;
    public canPlay(): boolean {
        return true;
    }

    public play(player: Player) {
        player.addProduction(Resources.MEGACREDITS,3);
        player.addProduction(Resources.STEEL,3);
        player.addProduction(Resources.TITANIUM,3);
        player.addProduction(Resources.PLANTS,3);
        player.addProduction(Resources.ENERGY,3);
        player.addProduction(Resources.HEAT,3);
        return undefined;;
    }
    // Cancel VP at first
    // public getVictoryPoints(): number {
    //     return 2;
    // }
    public metadata: CardMetadata = {
        cardNumber: 'Q07',
        renderData: CardRenderer.builder((b) => {
          b.production((pb) => {
              pb.megacredits(3).nbsp.steel(3).digit.nbsp.titanium(3).digit.br;
              pb.plants(3).digit.nbsp.energy(3).digit.nbsp.heat(3).digit;
            });
        }),
        description: 'Increase all production 3 steps. For each tag you already have, decrease 5 MC for the card cost. Cannot be copied by other cards.',
      }
  }
  
