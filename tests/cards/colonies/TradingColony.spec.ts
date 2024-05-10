import {expect} from 'chai';
import {TradingColony} from '../../../src/server/cards/colonies/TradingColony';
import {Callisto} from '../../../src/server/colonies/Callisto';
import {Ceres} from '../../../src/server/colonies/Ceres';
import {Miranda} from '../../../src/server/colonies/Miranda';
import {Game} from '../../../src/server/Game';
import {SelectColony} from '../../../src/server/inputs/SelectColony';
import {cast} from '../../TestingUtils';
import {TestPlayer} from '../../TestPlayer';

describe('TradingColony', function() {
  let card: TradingColony;
  let player: TestPlayer;
  let player2: TestPlayer;
  let game: Game;

  beforeEach(function() {
    card = new TradingColony();
    player = TestPlayer.BLUE.newPlayer();
    player2 = TestPlayer.RED.newPlayer();
    game = Game.newInstance('gameid', [player, player2], player, {coloniesExtension: true});
    game.colonies = [new Callisto(), new Ceres(), new Miranda()];
  });

  it('Should play', function() {
    card.play(player);
    expect(game.deferredActions).has.length(1);

    const selectColony = cast(game.deferredActions.pop()!.execute(), SelectColony);
    selectColony.cb(selectColony.colonies[0]);
    expect(player.production.energy).to.eq(1);
    expect(player.colonies.tradeOffset).to.eq(1);
  });

  it('Can play if there are available colony tiles to build on', function() {
    game.colonies[0].colonies.push(player);
    expect(card.canPlay(player)).is.true;
  });

  it('Cannot play if there are no available colony tiles to build on', function() {
    game.colonies[0].colonies.push(player);
    game.colonies[1].colonies.push(player);
    expect(card.canPlay(player)).is.false;
  });
});
