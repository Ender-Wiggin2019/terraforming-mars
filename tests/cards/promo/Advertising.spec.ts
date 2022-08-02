import {expect} from 'chai';
import {EarthCatapult} from '../../../src/cards/base/EarthCatapult';
import {Advertising} from '../../../src/cards/promo/Advertising';
import {Game} from '../../../src/Game';
import {Resources} from '../../../src/common/Resources';
import {TestPlayer} from '../../TestPlayer';

describe('Advertising', function() {
  it('Should play', function() {
    const advertising = new Advertising();
    const player = TestPlayer.BLUE.newPlayer();
    Game.newInstance('gameid', [player], player);

    player.playedCards.push(advertising);
    advertising.play();
    expect(player.getProduction(Resources.MEGACREDITS)).to.eq(0);

    const card = new EarthCatapult();
    card.play();
    advertising.onCardPlayed(player, card);
    expect(player.getProduction(Resources.MEGACREDITS)).to.eq(1);
  });
});
