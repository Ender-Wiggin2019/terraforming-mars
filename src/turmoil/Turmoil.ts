import {PartyName} from '../common/turmoil/PartyName';
import {ALL_PARTIES, IParty} from './parties/IParty';
import {Player} from '../Player';
import {Game} from '../Game';
import {getGlobalEventByName, GlobalEventDealer} from './globalEvents/GlobalEventDealer';
import {IGlobalEvent} from './globalEvents/IGlobalEvent';
import {SerializedParty, SerializedTurmoil} from './SerializedTurmoil';
import {PLAYER_DELEGATES_COUNT} from '../common/constants';
import {PoliticalAgendas, PoliticalAgendasData} from './PoliticalAgendas';
import {AgendaStyle} from '../common/turmoil/Types';
import {CardName} from '../common/cards/CardName';
import {SimpleDeferredAction} from '../deferredActions/DeferredAction';
import {SerializedPlayerId} from '../SerializedPlayer';
import {OrOptions} from '../inputs/OrOptions';
import {SelectOption} from '../inputs/SelectOption';

export type NeutralPlayer = 'NEUTRAL';


const UNINITIALIZED_POLITICAL_AGENDAS_DATA: PoliticalAgendasData = {
  agendas: new Map(),
  agendaStyle: AgendaStyle.CHAIRMAN,
};
export class Turmoil {
  public chairman: undefined | Player | NeutralPlayer = undefined;
  public rulingParty: IParty;
  public dominantParty: IParty;
  public lobby: Set<string> = new Set<string>();
  public delegateReserve: Array<Player | NeutralPlayer> = [];
  public parties: Array<IParty> = ALL_PARTIES.map((cf) => new cf.Factory());
  public playersInfluenceBonus: Map<string, number> = new Map<string, number>();
  public readonly globalEventDealer: GlobalEventDealer;
  public distantGlobalEvent: IGlobalEvent | undefined;
  public comingGlobalEvent: IGlobalEvent | undefined;
  public currentGlobalEvent: IGlobalEvent | undefined;
  public politicalAgendasData: PoliticalAgendasData = UNINITIALIZED_POLITICAL_AGENDAS_DATA;

  private constructor(
    rulingPartyName: PartyName,
    chairman: Player | 'NEUTRAL',
    dominantPartyName: PartyName,
    globalEventDealer: GlobalEventDealer) {
    this.rulingParty = this.getPartyByName(rulingPartyName);
    this.chairman = chairman;
    this.dominantParty = this.getPartyByName(dominantPartyName);
    this.globalEventDealer = globalEventDealer;
  }

  public static newInstance(game: Game, agendaStyle: AgendaStyle = AgendaStyle.STANDARD): Turmoil {
    const dealer = GlobalEventDealer.newInstance(game);

    // The game begins with Greens in power and a Neutral chairman
    const turmoil = new Turmoil(PartyName.GREENS, 'NEUTRAL', PartyName.GREENS, dealer);

    game.log('A neutral delegate is the new chairman.');
    game.log('Greens are in power in the first generation.');

    // Init parties
    turmoil.parties = ALL_PARTIES.map((cf) => new cf.Factory());

    game.getPlayersInGenerationOrder().forEach((player) => {
      // Begin with one delegate in the lobby
      turmoil.lobby.add(player.id);
      // Begin with six delegates in the delegate reserve
      for (let i = 0; i < PLAYER_DELEGATES_COUNT - 1; i++) {
        turmoil.delegateReserve.push(player);
      }
    });

    // Begin with 13 neutral delegates in the reserve
    for (let i = 0; i < 13; i++) {
      turmoil.delegateReserve.push('NEUTRAL');
    }

    turmoil.politicalAgendasData = PoliticalAgendas.newInstance(agendaStyle, turmoil.parties);
    // Note: this call relies on an instance of Game that will not be fully formed.
    // TODO(kberg): split newInstance into create/set-up so this can be done once the whole thing is ready.
    turmoil.onAgendaSelected(game);
    turmoil.initGlobalEvent(game);
    return turmoil;
  }

  public initGlobalEvent(game: Game) {
    // Draw the first global event to setup the game
    this.comingGlobalEvent = this.globalEventDealer.draw();
    this.addNeutralDelegate(this.comingGlobalEvent?.revealedDelegate, game);
    this.distantGlobalEvent = this.globalEventDealer.draw();
    this.addNeutralDelegate(this.distantGlobalEvent?.revealedDelegate, game);
  }

  public getPartyByName(name: PartyName): IParty {
    const party = this.parties.find((party) => party.name === name);
    if (party === undefined) {
      throw new Error(`Cannot find party with name {${name}}`);
    }
    return party;
  }

  // Use to send a delegate to a specific party
  public sendDelegateToParty(
    player: Player | NeutralPlayer,
    partyName: PartyName,
    game: Game,
    source: 'lobby' | 'reserve' = 'lobby'): void {
    const party = this.getPartyByName(partyName);
    if (player !== 'NEUTRAL' && this.lobby.has(player.id) && source === 'lobby') {
      this.lobby.delete(player.id);
    } else {
      const index = this.delegateReserve.indexOf(player);
      if (index > -1) {
        this.delegateReserve.splice(index, 1);
      } else {
        if (player !== 'NEUTRAL') {
          console.log(`${player.id}/${game.id} tried to get a delegate from an empty reserve.`);
        }
        return;
      }
    }
    // 如果是西斯，所有放置的代表都是中立代表
    // if (player !== 'NEUTRAL' && player.isCorporation(CardName.SITH_ORGANIZATIONS)) {
    const sith = game.getPlayers().filter((p) => p.isCorporation(CardName.SITH_ORGANIZATIONS));
    // console.log('sith', sith);
    // console.log('player === \'NEUTRAL\' && sith[0] !== undefined', player === 'NEUTRAL' && sith[0] !== undefined);
    if (player === 'NEUTRAL' && sith.length !== 0) {
      party.sendDelegate(sith[0], game);
    } else {
      party.sendDelegate(player, game);
    }
    this.checkDominantParty();
  }

  // Use to remove a delegate from a specific party
  public removeDelegateFromParty(player: Player | NeutralPlayer, partyName: PartyName, game: Game): void {
    const party = this.getPartyByName(partyName);
    this.delegateReserve.push(player);
    party.removeDelegate(player, game);
    this.checkDominantParty();
  }

  // Use to replace a delegate from a specific party with another delegate with NO DOMINANCE CHANGE
  public replaceDelegateFromParty(
    outgoingPlayer: Player | NeutralPlayer,
    incomingPlayer: Player | NeutralPlayer,
    source: 'lobby' | 'reserve' = 'lobby',
    partyName: PartyName,
    game: Game): void {
    const party = this.getPartyByName(partyName);
    this.delegateReserve.push(outgoingPlayer);
    party.removeDelegate(outgoingPlayer, game);
    this.sendDelegateToParty(incomingPlayer, partyName, game, source);
  }

  // Check dominant party
  public checkDominantParty(): void {
    // If there is a dominant party
    const sortParties = [...this.parties].sort(
      (p1, p2) => p2.delegates.length - p1.delegates.length,
    );
    const max = sortParties[0].delegates.length;
    if (this.dominantParty.delegates.length !== max) {
      this.setNextPartyAsDominant(this.dominantParty);
    }
  }

  // Function to get next dominant party taking into account the clockwise order
  public setNextPartyAsDominant(currentDominantParty: IParty) {
    const sortParties = [...this.parties].sort(
      (p1, p2) => p2.delegates.length - p1.delegates.length,
    );
    const max = sortParties[0].delegates.length;

    const currentIndex = this.parties.indexOf(currentDominantParty);

    let partiesToCheck = [];

    // Manage if it's the first party or the last
    if (currentIndex === 0) {
      partiesToCheck = this.parties.slice(currentIndex + 1);
    } else if (currentIndex === this.parties.length - 1) {
      partiesToCheck = this.parties.slice(0, currentIndex);
    } else {
      const left = this.parties.slice(0, currentIndex);
      const right = this.parties.slice(currentIndex + 1);
      partiesToCheck = right.concat(left);
    }

    // Take the clockwise order
    const partiesOrdered = partiesToCheck.reverse();

    partiesOrdered.some((newParty) => {
      if (newParty.delegates.length === max) {
        this.dominantParty = newParty;
        return true;
      }
      return false;
    });
  }

  // Launch the turmoil phase
  public endGeneration(game: Game): void {
    // 1 - All player lose 1 TR
    game.getPlayers().forEach((player) => {
      player.decreaseTerraformRating();
    });

    // 2 - Global Event
    if (this.currentGlobalEvent !== undefined) {
      const currentGlobalEvent: IGlobalEvent = this.currentGlobalEvent;
      game.log('Resolving global event ${0}', (b) => b.globalEvent(currentGlobalEvent));
      currentGlobalEvent.resolve(game, this);
    }

    // 3 - New Government
    this.rulingParty = this.dominantParty;

    // 3.a - Ruling Policy change
    this.setRulingParty(game);

    // 3.b - New dominant party
    this.setNextPartyAsDominant(this.rulingParty);

    // 3.c - Fill the lobby
    this.lobby.forEach((playerId) => {
      this.delegateReserve.push(game.getPlayerById(playerId));
    });
    this.lobby = new Set<string>();

    game.getPlayersInGenerationOrder().forEach((player) => {
      if (this.hasDelegatesInReserve(player)) {
        const index = this.delegateReserve.indexOf(player);
        if (index > -1) {
          this.delegateReserve.splice(index, 1);
        }
        this.lobby.add(player.id);
      }
    });

    // 4 - Changing Time
    if (this.currentGlobalEvent) {
      this.globalEventDealer.discardedGlobalEvents.push(this.currentGlobalEvent);
    }
    // 4.a - Coming Event is now Current event. Add neutral delegate.
    this.currentGlobalEvent = this.comingGlobalEvent;
    this.addNeutralDelegate(this.currentGlobalEvent?.currentDelegate, game);
    // 4.b - Distant Event is now Coming Event
    this.comingGlobalEvent = this.distantGlobalEvent;
    // 4.c - Draw the new distant event and add neutral delegate
    this.distantGlobalEvent = this.globalEventDealer.draw();
    this.addNeutralDelegate(this.distantGlobalEvent?.revealedDelegate, game);
    game.log('Turmoil phase has been resolved');
  }

  private addNeutralDelegate(partyName: PartyName | undefined, game: Game) {
    if (partyName) {
      this.sendDelegateToParty('NEUTRAL', partyName, game);
      game.log('A neutral delegate was added to the ${0} party', (b) => b.partyName(partyName));
    }
  }

  // Ruling Party changes
  public setRulingParty(game: Game): void {
    // Cleanup previous party effects
    game.getPlayers().forEach((player) => player.hasTurmoilScienceTagBonus = false);

    // Change the chairman
    if (this.chairman) {
      this.delegateReserve.push(this.chairman);
    }

    this.chairman = this.rulingParty.partyLeader || 'NEUTRAL';

    if (this.rulingParty.partyLeader !== undefined) {
      const index = this.rulingParty.delegates.indexOf(this.rulingParty.partyLeader);
      // Remove the party leader from the delegates array
      this.rulingParty.delegates.splice(index, 1);
    }
    // Fill the delegate reserve
    this.delegateReserve = this.delegateReserve.concat(this.rulingParty.delegates);

    // Clean the party
    this.rulingParty.partyLeader = undefined;
    this.rulingParty.delegates = [];

    PoliticalAgendas.setNextAgenda(this, game);

    // Finally, award Chairman TR
    if (this.chairman !== 'NEUTRAL' && this.chairman !== undefined) {
      const player = this.chairman;
      // Tempest Consultancy Hook (gains an additional TR when they become chairman)
      const steps = player.corpName(CardName.TEMPEST_CONSULTANCY) ? 2 :1;

      // Raise TR but after resolving the new policy
      game.defer(new SimpleDeferredAction(player, () => {
        player.increaseTerraformRatingSteps(steps);
        game.log('${0} is the new chairman and gains ${1} TR', (b) => b.player(player).number(steps));
        return undefined;
      }));
    } else {
      game.log('A neutral delegate is the new chairman.');
    }
  }

  // Called either directly during generation change, or after asking chairperson player
  // to choose an agenda.
  public onAgendaSelected(game: Game): void {
    const rulingParty = this.rulingParty;

    // Resolve Ruling Bonus
    const bonusId = PoliticalAgendas.currentAgenda(this).bonusId;
    const bonus = rulingParty.bonuses.find((b) => b.id === bonusId);
    if (bonus === undefined) {
      throw new Error(`Bonus id ${bonusId} not found in party ${rulingParty.name}`);
    }

    if (this.chairman !== undefined && this.chairman !== 'NEUTRAL' && this.chairman.isCorporation(CardName.SITH_ORGANIZATIONS)) {
      const NonSithPlayers = game.getPlayers().filter((p) => !p.isCorporation(CardName.SITH_ORGANIZATIONS));
      const SithPlayer = this.chairman;
      SithPlayer.decreaseTerraformRatingSteps(1); // 其实是中立执政，无法享有TR
      const action: OrOptions = new OrOptions();
      action.title = 'Select effect from Sith ability';
      action.buttonLabel = 'Confirm';
      action.options.push(
        new SelectOption('Decrease all other players 1 TR', 'Decrease', () => {
          NonSithPlayers.forEach((p) => p.decreaseTerraformRatingSteps(1));
          game.log('${0} let everyone else lose 1 TR.', (b) => b.player(SithPlayer));
          game.log('The ruling bonus is: ${0}', (b) => b.string(bonus.description));
          bonus.grant(game.getPlayersInGenerationOrder());
          return undefined;
        }),
        new SelectOption('Ignore ruling bonus this generation', 'Ignore', () => {
          bonus.grant([SithPlayer]);
          game.log('${0} let everyone else ignore the ruling bonus', (b) => b.player(SithPlayer));
          game.log('The ruling bonus is: ${0} (only apply for ${1})', (b) => b.string(bonus.description).player(SithPlayer));
          return undefined;
        }),
      );
      game.defer(new SimpleDeferredAction(SithPlayer, () => action));
    } else {
      game.log('The ruling bonus is: ${0}', (b) => b.string(bonus.description));


      bonus.grant(game.getPlayersInGenerationOrder());
    }


    const policyId = PoliticalAgendas.currentAgenda(this).policyId;
    const policy = rulingParty.policies.find((p) => p.id === policyId);
    if (policy === undefined) {
      throw new Error(`Policy id ${policyId} not found in party ${rulingParty.name}`);
    }
    const description = typeof(policy.description) === 'string' ? policy.description : policy.description(undefined);
    game.log('The ruling policy is: ${0}', (b) => b.string(description));
    // Resolve Ruling Policy for Scientists P4
    if (policy.apply !== undefined) {
      policy.apply(game);
    }
  }

  public getPlayerInfluence(player: Player) {
    let influence: number = 0;
    if (this.chairman !== undefined && this.chairman === player) influence++;

    const dominantParty : IParty = this.dominantParty;
    const isPartyLeader = dominantParty.partyLeader === player;
    const delegateCount = dominantParty.delegates.filter((delegate) => delegate === player).length;

    if (isPartyLeader) {
      influence++;
      if (delegateCount > 1) influence++; // at least 1 non-leader delegate
    } else {
      if (delegateCount > 0) influence++;
    }

    if (this.playersInfluenceBonus.has(player.id)) {
      const bonus = this.playersInfluenceBonus.get(player.id);
      if (bonus) {
        influence+= bonus;
      }
    }
    if (player.isCorporation(CardName.INCITE_ENDER)) {
      this.parties.filter((x) => x !== this.dominantParty).forEach((x) => {
        if (x.partyLeader === player) {
          influence++;
        }
      });
    }
    return influence;
  }

  public addInfluenceBonus(player: Player, bonus:number = 1) {
    if (this.playersInfluenceBonus.has(player.id)) {
      let current = this.playersInfluenceBonus.get(player.id);
      if (current) {
        current += bonus;
        this.playersInfluenceBonus.set(player.id, current);
      }
    } else {
      this.playersInfluenceBonus.set(player.id, bonus);
    }
  }

  public canPlay(player: Player, partyName : PartyName): boolean {
    if (this.rulingParty.name === partyName) {
      return true;
    }

    const party = this.getPartyByName(partyName);
    return party.getDelegates(player) >= 2;
  }

  // List players present in the reserve
  public getPresentPlayersInReserve(): Array<Player | NeutralPlayer> {
    return Array.from(new Set(this.delegateReserve));
  }

  // Return number of delegates in reserve
  public getDelegatesInReserve(player: Player | NeutralPlayer): number {
    const delegates = this.delegateReserve.filter((p) => p === player).length;
    return delegates;
  }

  // Return number of delegates
  // TODO(kberg): Find a way to remove the default value for source.
  public getAvailableDelegateCount(player: Player | NeutralPlayer, source: 'lobby' | 'reserve' | 'both'): number {
    const delegatesInReserve = this.delegateReserve.filter((p) => p === player).length;
    const delegatesInLobby = (player !== 'NEUTRAL' && this.lobby.has(player.id)) ? 1: 0;

    switch (source) {
    case 'lobby':
      return delegatesInLobby;
    case 'reserve':
      return delegatesInReserve;
    case 'both':
      return delegatesInLobby + delegatesInReserve;
    }
  }

  // Check if player has delegates available
  public hasDelegatesInReserve(player: Player | NeutralPlayer): boolean {
    return this.getAvailableDelegateCount(player, 'reserve') > 0;
  }

  // Get Victory Points
  public getPlayerVictoryPoints(player: Player): number {
    let victory: number = 0;
    if (this.chairman !== undefined && this.chairman === player) victory++;
    this.parties.forEach(function(party) {
      if (party.partyLeader === player) {
        victory++;
      }
    });
    return victory;
  }

  public serialize(): SerializedTurmoil {
    const result: SerializedTurmoil = {
      chairman: this.chairman instanceof Player ? this.chairman.serializeId() : this.chairman,
      rulingParty: ({name: this.rulingParty.name} as SerializedParty),
      dominantParty: ({name: this.dominantParty.name} as SerializedParty),
      lobby: Array.from(this.lobby),
      delegateReserve: this.delegateReserve.map((delegete) => delegete instanceof Player ? delegete.serializeId() : delegete),
      parties: this.parties.map((p) => {
        return {
          name: p.name,
          delegates: p.delegates.map((delegete) => delegete instanceof Player ? delegete.serializeId() : delegete),
          partyLeader: p.partyLeader !== null && p.partyLeader instanceof Player ? p.partyLeader.serializeId() : p.partyLeader,
        };
      }),
      playersInfluenceBonus: Array.from(this.playersInfluenceBonus.entries()),
      globalEventDealer: this.globalEventDealer.serialize(),
      distantGlobalEvent: {'name': this.distantGlobalEvent?.name} as IGlobalEvent,
      comingGlobalEvent: {'name': this.comingGlobalEvent?.name} as IGlobalEvent,
      currentGlobalEvent: this.currentGlobalEvent !== undefined ? ({'name': this.currentGlobalEvent?.name} as IGlobalEvent) : undefined,
      politicalAgendasData: PoliticalAgendas.serialize(this.politicalAgendasData),
    };
    return result;
  }

  public static deserialize(d: SerializedTurmoil, game: Game): Turmoil {
    function partyName(object: any): PartyName {
      function instanceOfIParty(object: any): object is IParty {
        try {
          return 'name' in object;
        } catch (typeError) {
          return false;
        }
      }
      if (instanceOfIParty(object)) {
        return object.name;
      } else {
        return object;
      }
    }
    const dealer = GlobalEventDealer.deserialize(d.globalEventDealer);
    const turmoil = new Turmoil(partyName(d.rulingParty), 'NEUTRAL', partyName(d.dominantParty), dealer);
    // Rebuild chairman
    if (d.chairman) {
      if (d.chairman === 'NEUTRAL') {
        turmoil.chairman = 'NEUTRAL';
      } else {
        const chairman_id = d.chairman.id;
        turmoil.chairman = game.getAllPlayers().find((player) => player.id === chairman_id);
      }
    }

    turmoil.lobby = new Set(d.lobby);

    if (d.delegateReserve === undefined && d.delegate_reserve !==undefined) {
      d.delegateReserve = d.delegate_reserve;
    }
    turmoil.delegateReserve = d.delegateReserve.map((element: SerializedPlayerId | NeutralPlayer) => {
      if (element === 'NEUTRAL') {
        return 'NEUTRAL';
      } else {
        const player = game.getAllPlayers().find((player) => player.id === element.id);
        if (player) {
          return player;
        } else {
          throw new Error('Player not found when rebuilding delegate reserve');
        }
      }
    });

    // TODO(kberg): remove this test by 2021-02-01
    turmoil.politicalAgendasData = PoliticalAgendas.deserialize(d.politicalAgendasData || UNINITIALIZED_POLITICAL_AGENDAS_DATA );

    // Rebuild party leader
    d.parties.forEach((element: SerializedParty ) => {
      const party = turmoil.getPartyByName(element.name);
      if (element.partyLeader) {
        if (element.partyLeader === 'NEUTRAL') {
          party.partyLeader = 'NEUTRAL';
        } else {
          const partyLeaderId = element.partyLeader.id;
          party.partyLeader = game.getAllPlayers().find((player) => player.id === partyLeaderId);
        }
      }

      // Rebuild delegates
      party.delegates = [];
      element.delegates.forEach((element: SerializedPlayerId | NeutralPlayer) => {
        if (element === 'NEUTRAL') {
          party.delegates.push('NEUTRAL');
        } else {
          const player = game.getAllPlayers().find((player) => player.id === element.id);
          if (player) {
            party.delegates.push(player);
          }
        }
      });
      if (turmoil.dominantParty?.name === party?.name) {
        turmoil.dominantParty = party;
      }
    });
    turmoil.playersInfluenceBonus = new Map<string, number>(d.playersInfluenceBonus);
    if (d.distantGlobalEvent) {
      turmoil.distantGlobalEvent = getGlobalEventByName(d.distantGlobalEvent.name);
    }
    if (d.comingGlobalEvent) {
      turmoil.comingGlobalEvent = getGlobalEventByName(d.comingGlobalEvent.name);
    } else if ((d as any).commingGlobalEvent) {
      turmoil.comingGlobalEvent = getGlobalEventByName((d as any).commingGlobalEvent.name);
    }

    if (d.currentGlobalEvent) {
      turmoil.currentGlobalEvent = getGlobalEventByName(d.currentGlobalEvent.name);
    }

    return turmoil;
  }
}
