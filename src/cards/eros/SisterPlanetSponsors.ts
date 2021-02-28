import { IProjectCard } from "../IProjectCard";
import { Tags } from "../Tags";
import { CardType } from "../CardType";
import { Player } from "../../Player";
import { Resources } from "../../Resources";
import { CardName } from "../../CardName";
import { Game } from "../../Game";
import { CardMetadata } from "../CardMetadata";
import { CardRenderer } from "../render/CardRenderer";
import { CardRequirements } from "../CardRequirements";

export class SisterPlanetSponsors implements IProjectCard {
    public cost: number = 12;
    public tags: Array<Tags> = [Tags.VENUS, Tags.EARTH];
    public name: CardName = CardName.SISTER_PLANET_SPONSORS;
    public cardType: CardType = CardType.AUTOMATED;
    public canPlay(player: Player): boolean {
        return  player.checkMultipleTagPresence([Tags.VENUS, Tags.EARTH]);
      }
    public play(player: Player, game:Game) {
        player.addProduction(Resources.MEGACREDITS,3);
        for (const player of game.getPlayers()) {
            player.addProduction(Resources.MEGACREDITS,1);
        }
        return undefined;
    }
    public getVictoryPoints(): number {
        return 1;
    }
    public metadata: CardMetadata = {
        cardNumber: 'Q05',
        requirements: CardRequirements.builder((b) => b.tag(Tags.VENUS).tag(Tags.EARTH)),
        renderData: CardRenderer.builder((b) => {
          b.productionBox((pb) => pb.megacredits(4).nbsp.megacredits(1).any.asterix());
        }),
        description: 'Requires Venus and Earth tags. Increase your MC production 4 steps. ALL OPPONENTS increase their mc production 1 step.',
        victoryPoints: 1, 
      }
  }
  
