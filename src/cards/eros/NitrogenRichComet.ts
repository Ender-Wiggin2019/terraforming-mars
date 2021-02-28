import { IProjectCard } from "../IProjectCard";
import { Tags } from "../Tags";
import { CardType } from "../CardType";
import { Player } from "../../Player";
import { Resources } from "../../Resources";
import { CardName } from "../../CardName";
import { Game } from "../../Game";
import { MAX_TEMPERATURE, REDS_RULING_POLICY_COST } from "../../constants";
import { PartyHooks } from "../../turmoil/parties/PartyHooks";
import { PartyName } from "../../turmoil/parties/PartyName";
import { CardMetadata } from "../CardMetadata";
import { CardRenderer } from "../render/CardRenderer";


export class NitrogenRichComet implements IProjectCard {
    public cost: number = 17;
    public tags: Array<Tags> = [Tags.SPACE];
    public name: CardName = CardName.NITROGENRICH_COMET;
    public cardType: CardType = CardType.EVENT;
    public canPlay(player: Player, game: Game): boolean {
        const temperatureStep = game.getTemperature() < MAX_TEMPERATURE ? 1 : 0;
        if (PartyHooks.shouldApplyPolicy(game, PartyName.REDS)) {
            return player.canAfford(player.getCardCost(game, this) + REDS_RULING_POLICY_COST * temperatureStep, game, false, true);
        }

        return true;
    }

    public play(player: Player, game: Game) {
        game.increaseTemperature(player, 1);
        player.setResource(Resources.PLANTS, 4)
        return undefined;
    }
    public metadata: CardMetadata = {
        cardNumber: 'Q17',
        renderData: CardRenderer.builder((b) => {
          b.temperature(1);
          b.plants(4);
        }),
        description: 'Increase Temperature 1 step. Gain 4 plants.',
      }
  }