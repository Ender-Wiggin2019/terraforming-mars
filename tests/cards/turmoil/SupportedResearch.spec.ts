import {expect} from 'chai';
import {SupportedResearch} from '../../../src/cards/turmoil/SupportedResearch';
import {Game} from '../../../src/Game';
import {PartyName} from '../../../src/turmoil/parties/PartyName';
import {setCustomGameOptions, TestPlayers} from '../../TestingUtils';

describe('SupportedResearch', function() {
  it('Should play', function() {
    const card = new SupportedResearch();
    const player = TestPlayers.BLUE.newPlayer();
    const redPlayer = TestPlayers.RED.newPlayer();
    const gameOptions = setCustomGameOptions();
    const game = Game.newInstance('foobar', [player, redPlayer], player, gameOptions);
    expect(card.canPlay(player)).is.not.true;

    const scientists = game.turmoil!.getPartyByName(PartyName.SCIENTISTS)!;
    scientists.delegates.push(player, player);
    expect(card.canPlay(player)).is.true;

    card.play(player);
    expect(player.cardsInHand).has.lengthOf(2);
  });
});
