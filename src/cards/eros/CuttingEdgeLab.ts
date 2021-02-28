import { IProjectCard } from "../IProjectCard";
import { Tags } from "../Tags";
import { CardType } from "../CardType";
import { Player } from "../../Player";
import { ResourceType } from "../../ResourceType";
import { Game } from '../../Game';
import { CardName } from '../../CardName';
import { IResourceCard } from '../ICard';
import { LogHelper } from "../../LogHelper";

export class CuttingEdgeLab implements IProjectCard, IResourceCard {
    public cost: number = 8;
    public tags: Array<Tags> = [Tags.SCIENCE];
    public name: CardName = CardName.CUTTING_EDGE_LAB;
    public cardType: CardType = CardType.ACTIVE;
    public resourceType: ResourceType = ResourceType.SCIENCE;
    public resourceCount: number = 0;

    public play() {
        return undefined;
    }



    public onCardPlayed(player: Player, game: Game, card: IProjectCard): void {
        console.log(card);
        console.log(card.hasRequirements);
        if (card.canPlay && (card.hasRequirements === undefined || card.hasRequirements)){
            player.addResourceTo(this);
            LogHelper.logAddResource(game, player, this);
        }
      } 

      public getVictoryPoints(): number {
        return Math.floor(this.resourceCount / 3);
    }
}    