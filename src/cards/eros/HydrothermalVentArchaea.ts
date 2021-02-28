import { IProjectCard } from "../IProjectCard";
import { Tags } from "../Tags";
import { CardType } from "../CardType";
import { Player } from "../../Player";
import { Game } from "../../Game";
import { ResourceType } from "../../ResourceType";
import { CardName } from "../../CardName";
import { IResourceCard } from "../ICard";
import { CardMetadata } from "../CardMetadata";
import { CardRenderer } from "../render/CardRenderer";
import { CardRenderItemSize } from "../render/CardRenderItemSize";
import { CardRequirements } from "../CardRequirements";
import { CardRenderDynamicVictoryPoints } from "../render/CardRenderDynamicVictoryPoints";

export class HydrothermalVentArchaea implements IProjectCard, IResourceCard {
    public cost: number = 8;
    public tags: Array<Tags> = [Tags.MICROBE];
    public cardType: CardType = CardType.ACTIVE;
    public name: CardName = CardName.HYDROTHERMAL_VENT_ARCHAEA;
    public resourceType: ResourceType = ResourceType.MICROBE;
    public resourceCount: number = 0;

    public canPlay(player: Player, game: Game): boolean {
        return game.board.getOceansOnBoard() >= 3 - player.getRequirementsBonus(game);
    }

    public getVictoryPoints(): number {
        return Math.floor(this.resourceCount / 2);
    }

    public play() {
        return undefined;
    }
    public metadata: CardMetadata = {
        cardNumber: 'Q12',
        requirements: CardRequirements.builder((b) => b.oceans(3)),
        renderData: CardRenderer.builder((b) => {
          b.effectBox((eb) => {
            eb.temperature(1).startEffect.microbes(1);
            eb.description('Effect: When you increase Temperature 1 step, add a microbe to this card.');
          }).br;
          b.text('1 VP per 2 Microbes on this card', CardRenderItemSize.TINY, true);
        }),
        description: 'Requires 3 oceans.',
        victoryPoints: CardRenderDynamicVictoryPoints.microbes(1, 2),
      };
  }
