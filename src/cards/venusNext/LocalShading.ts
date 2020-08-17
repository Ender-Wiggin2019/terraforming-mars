import { IProjectCard } from "../IProjectCard";
import { IActionCard, IResourceCard } from "../ICard";
import { Tags } from "../Tags";
import { CardType } from "../CardType";
import { Player } from "../../Player";
import { ResourceType } from "../../ResourceType";
import { OrOptions } from "../../inputs/OrOptions";
import { SelectOption } from "../../inputs/SelectOption";
import { Resources } from "../../Resources";
import { CardName } from "../../CardName";

export class LocalShading implements IActionCard,IProjectCard,IResourceCard {
    public cost: number = 4;
    public tags: Array<Tags> = [Tags.VENUS];
    public name: CardName = CardName.LOCAL_SHADING;
    public cardType: CardType = CardType.ACTIVE;
    public resourceType: ResourceType = ResourceType.FLOATER;
    public resourceCount: number = 0;

    public play() {
        return undefined;
    }
    public canAct(): boolean {
        return true;
    }    
    public action(player: Player) {
        if (this.resourceCount < 1) {
        player.addResourceTo(this);
            return undefined;
        }
        
        var opts: Array<SelectOption> = [];

        const addResource = new SelectOption("Add 1 floater to this card", "Add floater", () => this.addResource(player));
        const spendResource = new SelectOption("Remove 1 floater to increase MC production 1 step", "Remove floater", () => this.spendResource(player));

        opts.push(spendResource);
        opts.push(addResource);

        return new OrOptions(...opts);
    }

    private addResource(player: Player) {
        player.addResourceTo(this);
        return undefined;
    }

    private spendResource(player: Player) {
        player.removeResourceFrom(this);
        player.setProduction(Resources.MEGACREDITS);
        return undefined;
    }
}