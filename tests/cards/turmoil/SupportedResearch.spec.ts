import { expect } from "chai";
import { SupportedResearch } from "../../../src/cards/turmoil/SupportedResearch";
import { Player } from "../../../src/Player";
import { Color } from "../../../src/Color";
import { GameOptions, Game } from '../../../src/Game';
import { PartyName } from "../../../src/turmoil/parties/PartyName";
import { setCustomGameOptions } from "../../TestingUtils";

describe("SupportedResearch", function () {
    it("Should play", function () {
        const card = new SupportedResearch();
        const player = new Player("test", Color.BLUE, false);

        const gameOptions = setCustomGameOptions() as GameOptions;
        const game = new Game("foobar", [player,player], player, gameOptions);  
        expect(card.canPlay(player, game)).to.eq(false);
        
        let scientists = game.turmoil!.getPartyByName(PartyName.SCIENTISTS)!;    
        scientists.delegates.push(player, player);
        expect(card.canPlay(player, game)).to.eq(true);

        card.play(player, game);
        expect(player.cardsInHand.length).to.eq(2);
    });
});
