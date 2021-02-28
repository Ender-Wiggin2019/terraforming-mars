import { IProjectCard } from "../IProjectCard";
import { Tags } from "../Tags";
import { CardType } from "../CardType";
import { Player } from "../../Player";
import { Resources } from "../../Resources";
import { CardName } from '../../CardName';
import { CardMetadata } from "../CardMetadata";
import { CardRenderer } from "../render/CardRenderer";
import { CardRequirements } from "../CardRequirements";
import { CardRenderItemSize } from "../render/CardRenderItemSize";

export class UrgentTerraformingCommand implements IProjectCard {
    public cost: number = 10;
    public tags: Array<Tags> = [Tags.EARTH];
    public name: CardName = CardName.URGENT_TERRAFORMING_COMMAND;
    public cardType: CardType = CardType.EVENT;
    public canPlay(player: Player): boolean {
        return player.getTerraformRating() >= 25 ;
      }
    public play(player: Player) {
        player.setResource(Resources.PLANTS, player.getProduction(Resources.PLANTS));
        player.setResource(Resources.HEAT, player.getProduction(Resources.HEAT));
        return undefined;
    }
    public metadata: CardMetadata = {
        cardNumber: 'Q16',
        requirements: CardRequirements.builder((b) => b.tr(25)),
        renderData: CardRenderer.builder((b) => {
          b.text('IMMEDIATE PRODUCE', CardRenderItemSize.SMALL, true).br;
          b.productionBox((pb) => pb.plants(1).nbsp.heat(1));
        }),
        description: 'Requires that you have at least 25 TR.',
    }
}
