import { IProjectCard } from "../IProjectCard";
import { Tags } from "../Tags";
import { CardType } from "../CardType";
import { CardName } from '../../CardName';

export class WasteIncinerator implements IProjectCard {
    public cost: number = 4;
    public tags: Array<Tags> = [Tags.BUILDING];
    public name: CardName = CardName.WASTE_INCINERATOR;
    public cardType: CardType = CardType.ACTIVE;

    public play() {
        return undefined;
    }
}