import { IProjectCard } from "../IProjectCard";
import { Tags } from "../Tags";
import { CardType } from "../CardType";
import { Player } from "../../Player";
import { CardName } from "../../CardName";
import { CardMetadata } from "../CardMetadata";
import { CardRequirements } from "../CardRequirements";

export class InterplanetaryAlliance implements IProjectCard {
    public cost: number = 5;
    public tags: Array<Tags> = [Tags.VENUS, Tags.JOVIAN, Tags.EARTH];
    public name: CardName = CardName.INTERPLANETARY_ALLIANCE;
    public cardType: CardType = CardType.AUTOMATED;
    public canPlay(player: Player): boolean {
        return  player.checkMultipleTagPresence([Tags.VENUS, Tags.EARTH, Tags.JOVIAN]);
      }
    public play() {
        return undefined;
    }
    public getVictoryPoints(): number {
        return 1;
    }
    public metadata: CardMetadata = {
        description: 'Requires that you have a Venus tag, an Earth tag and a Jovian tag.',
        cardNumber: 'Q03',
        requirements: CardRequirements.builder((b) =>
          b.tag(Tags.VENUS).tag(Tags.EARTH).tag(Tags.JOVIAN),
        ),
        victoryPoints: 1,
      };
  }
  
