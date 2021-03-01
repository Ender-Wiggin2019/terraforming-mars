import {Game} from '../../../src/Game';
import {Player} from '../../../src/Player';
import {setCustomGameOptions, TestPlayers} from '../../TestingUtils';
import {LunaPoliticalInstitute} from '../../../src/cards/moon/LunaPoliticalInstitute';
import {expect} from 'chai';
import {SelectPartyToSendDelegate} from '../../../src/inputs/SelectPartyToSendDelegate';
import {PartyName} from '../../../src/turmoil/parties/PartyName';
import {Turmoil} from '../../../src/turmoil/Turmoil';

const MOON_OPTIONS = setCustomGameOptions({moonExpansion: true});

describe('LunaPoliticalInstitute', () => {
  let player: Player;
  let game: Game;
  let card: LunaPoliticalInstitute;
  let turmoil: Turmoil;

  beforeEach(() => {
    player = TestPlayers.BLUE.newPlayer();
    game = Game.newInstance('id', [player], player, MOON_OPTIONS);
    card = new LunaPoliticalInstitute();
    turmoil = game.turmoil!;
  });

  it('can play', () => {
    player.cardsInHand = [card];
    player.megaCredits = card.cost;

    // TODO(kberg): Add test when M70 is merged.
    expect(player.getPlayableCards()).does.not.include(card);
  });

  it('can act', () => {
    turmoil.delegateReserve = [player];
    expect(card.canAct(player)).is.true;

    turmoil.delegateReserve = ['NEUTRAL'];
    expect(card.canAct(player)).is.false;
  });

  it('action', () => {
    const marsFirst = turmoil.getPartyByName(PartyName.MARS)!;

    card.action(player);
    expect(game.deferredActions).has.lengthOf(1);

    expect(marsFirst.delegates.filter((d) => d === player)).has.lengthOf(0);

    const selectParty = game.deferredActions.peek()!.execute() as SelectPartyToSendDelegate;
    selectParty.cb(PartyName.MARS);

    expect(marsFirst.delegates.filter((d) => d === player)).has.lengthOf(1);
  });
});

