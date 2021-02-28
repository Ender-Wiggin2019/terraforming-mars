import { IProjectCard } from "../IProjectCard";
import { Tags } from "../Tags";
import { CardType } from "../CardType";
import { Player } from "../../Player";
import { Resources } from "../../Resources";
import { CardName } from "../../CardName";
import { Game } from "../../Game";
import { CardMetadata } from "../CardMetadata";
import { CardRenderer } from "../render/CardRenderer";

export class SolarCosmicRays implements IProjectCard {
    public cost: number = 27;
    public tags: Array<Tags> = [Tags.SPACE];
    public name: CardName = CardName.SOLAR_COSMIC_RAYS;
    public cardType: CardType = CardType.AUTOMATED;

    public play(player: Player, game:Game) {
        player.addProduction(Resources.ENERGY,1);
        let alllEnergyProd = 0;
        for (const player of game.getPlayers()) {
            alllEnergyProd += player.getProduction(Resources.ENERGY);
        }
        player.addProduction(Resources.HEAT, alllEnergyProd);
        return undefined;
    }
    
    public metadata: CardMetadata = {
        cardNumber: 'Q01',
        renderData: CardRenderer.builder((b) => {
        b.productionBox((pb) => pb.energy(1)).nbsp;
          b.productionBox((pb) => pb.heat(1).slash().energy(1).any.asterix());
        }),
        description: 'Increase your energy production 1 steps. For each energy production in play, you increase your heat production 1 step.',
      }
}
  
