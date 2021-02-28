import { IProjectCard } from "../IProjectCard";
import { Tags } from "../Tags";
import { CardType } from "../CardType";
import { CardName } from '../../CardName';
import { CardMetadata } from "../CardMetadata";
import { CardRenderer } from "../render/CardRenderer";

export class RespirationEnhance implements IProjectCard {
    public cost: number = 7;
    public tags: Array<Tags> = [Tags.SCIENCE, Tags.PLANT];
    public name: CardName = CardName.RESPIRATION_ENHANCE;
    public cardType: CardType = CardType.ACTIVE;

    public play() {
        return undefined;
    }
    public metadata: CardMetadata = {
        cardNumber: 'Q010',
        renderData: CardRenderer.builder((b) => {
            b.effectBox((eb) => {
              eb.greenery().asterix().startEffect.temperature(1);
              eb.description('Effect: When you place a greenery, you can choose to imcrease temperature 1 step, intead of oxygen.');
            }).br;
          }),
      }
}

