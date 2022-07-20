import * as constants from './common/constants';
import {PlayerId} from './common/Types';
import {DEFAULT_FLOATERS_VALUE, DEFAULT_MICROBES_VALUE, MAX_FLEET_SIZE, MILESTONE_COST, REDS_RULING_POLICY_COST} from './common/constants';
import {Aridor} from './cards/colonies/Aridor';
import {Aurorai} from './cards/pathfinders/Aurorai';
import {Board} from './boards/Board';
import {CardFinder} from './CardFinder';
import {CardName} from './common/cards/CardName';
import {CardType} from './common/cards/CardType';
import {ColonyName} from './common/colonies/ColonyName';
import {Color} from './common/Color';
import {ICorporationCard} from './cards/corporation/ICorporationCard';
import {Game} from './Game';
import {HowToPay} from './common/inputs/HowToPay';
import {IAward} from './awards/IAward';
import {ICard, IResourceCard, isIActionCard, TRSource, IActionCard} from './cards/ICard';
import {IMilestone} from './milestones/IMilestone';
import {IProjectCard} from './cards/IProjectCard';
import {ITagCount} from './common/cards/ITagCount';
import {LogMessageDataType} from './common/logs/LogMessageDataType';
import {OrOptions} from './inputs/OrOptions';
import {PartyHooks} from './turmoil/parties/PartyHooks';
import {PartyName} from './common/turmoil/PartyName';
import {PharmacyUnion} from './cards/promo/PharmacyUnion';
import {Phase} from './common/Phase';
import {PlayerInput} from './PlayerInput';
import {Resources} from './common/Resources';
import {CardResource} from './common/CardResource';
import {SelectCard} from './inputs/SelectCard';
import {SellPatentsStandardProject} from './cards/base/standardProjects/SellPatentsStandardProject';
import {SendDelegateToArea} from './deferredActions/SendDelegateToArea';
import {Priority, SimpleDeferredAction} from './deferredActions/DeferredAction';
import {SelectHowToPayDeferred} from './deferredActions/SelectHowToPayDeferred';
import {SelectHowToPayForProjectCard} from './inputs/SelectHowToPayForProjectCard';
import {SelectOption} from './inputs/SelectOption';
import {SelectSpace} from './inputs/SelectSpace';
import {RobotCard, SelfReplicatingRobots} from './cards/promo/SelfReplicatingRobots';
import {SerializedCard} from './SerializedCard';
import {SerializedPlayer} from './SerializedPlayer';
import {SpaceType} from './common/boards/SpaceType';
import {StormCraftIncorporated} from './cards/colonies/StormCraftIncorporated';
import {Tags} from './common/cards/Tags';
import {VictoryPointsBreakdown} from './VictoryPointsBreakdown';
import {IVictoryPointsBreakdown} from './common/game/IVictoryPointsBreakdown';
import {Timer} from './common/Timer';
import {TurmoilHandler} from './turmoil/TurmoilHandler';
import {GameCards} from './GameCards';
import {DrawCards} from './deferredActions/DrawCards';
import {Units} from './common/Units';
import {MoonExpansion} from './moon/MoonExpansion';
import {StandardProjectCard} from './cards/StandardProjectCard';
import {ConvertPlants} from './cards/base/standardActions/ConvertPlants';
import {ConvertHeat} from './cards/base/standardActions/ConvertHeat';
import {Manutech} from './cards/venusNext/Manutech';
import {LunaProjectOffice} from './cards/moon/LunaProjectOffice';
import {GlobalParameter} from './common/GlobalParameter';
import {GlobalEventName} from './common/turmoil/globalEvents/GlobalEventName';
import {LogHelper} from './LogHelper';
import {UndoActionOption} from './inputs/UndoActionOption';
import {LawSuit} from './cards/promo/LawSuit';
import {CrashSiteCleanup} from './cards/promo/CrashSiteCleanup';
import {Turmoil} from './turmoil/Turmoil';
import {PathfindersExpansion} from './pathfinders/PathfindersExpansion';
import {deserializeProjectCard, serializeProjectCard} from './cards/CardSerialization';
import {ColoniesHandler} from './colonies/ColoniesHandler';
import {SerializedGame} from './SerializedGame';
import {MonsInsurance} from './cards/promo/MonsInsurance';
import {InputResponse} from './common/inputs/InputResponse';

export class Player {
  public readonly id: PlayerId;
  protected waitingFor?: PlayerInput;
  protected waitingForCb?: () => void;
  public game: Game;

  // Corporate identity
  public corporationCard?: ICorporationCard;
  // Used only during set-up
  public pickedCorporationCard?: ICorporationCard;

  // Terraforming Rating
  private terraformRating: number = 20;
  public hasIncreasedTerraformRatingThisGeneration: boolean = false;
  public terraformRatingAtGenerationStart: number = 20;

  // Resources
  public megaCredits: number = 0;
  protected megaCreditProduction: number = 0;
  public steel: number = 0;
  protected steelProduction: number = 0;
  public titanium: number = 0;
  protected titaniumProduction: number = 0;
  public plants: number = 0;
  protected plantProduction: number = 0;
  public energy: number = 0;
  protected energyProduction: number = 0;
  public heat: number = 0;
  protected heatProduction: number = 0;

  // Resource values
  private titaniumValue: number = 3;
  private steelValue: number = 2;
  // Helion
  public canUseHeatAsMegaCredits: boolean = false;

  // This generation / this round
  public actionsTakenThisRound: number = 0;
  private actionsThisGeneration: Set<CardName> = new Set();
  public lastCardPlayed: CardName | undefined;
  private corporationInitialActionDone: boolean = false;

  // Cards
  public dealtCorporationCards: Array<ICorporationCard> = [];
  public dealtProjectCards: Array<IProjectCard> = [];
  public dealtPreludeCards: Array<IProjectCard> = [];
  public cardsInHand: Array<IProjectCard> = [];
  public preludeCardsInHand: Array<IProjectCard> = [];
  public playedCards: Array<IProjectCard> = [];
  public draftedCards: Array<IProjectCard> = [];
  public cardCost: number = constants.CARD_COST;
  public needsToDraft?: boolean;

  public timer: Timer = Timer.newInstance();

  // Colonies
  private fleetSize: number = 1;
  public tradesThisGeneration: number = 0;
  public colonyTradeOffset: number = 0;
  public colonyTradeDiscount: number = 0;
  public colonyVictoryPoints: number = 0;
  public cardDiscount: number = 0; // Iapetus Colony

  // Turmoil
  public turmoilPolicyActionUsed: boolean = false;
  public politicalAgendasActionUsedCount: number = 0;

  public oceanBonus: number = constants.OCEAN_BONUS;

  // Custom cards
  // Leavitt Station.
  public scienceTagCount: number = 0;
  // PoliticalAgendas Scientists P41
  public hasTurmoilScienceTagBonus: boolean = false;
  // Ecoline
  public plantsNeededForGreenery: number = 8;
  // Lawsuit
  public removingPlayers: Array<PlayerId> = [];
  // For Playwrights corp.
  // removedFromPlayCards is a bit of a misname: it's a temporary storage for
  // cards that provide 'next card' discounts. This will clear between turns.
  public removedFromPlayCards: Array<IProjectCard> = [];

  // Stats
  public actionsTakenThisGame: number = 0;
  public victoryPointsByGeneration: Array<number> = [];
  public totalDelegatesPlaced: number = 0;

  constructor(
    public name: string,
    public color: Color,
    public beginner: boolean,
    public handicap: number = 0,
    id: PlayerId) {
    this.id = id;
    // This seems pretty bad. The game will be set before the Player is actually
    // used, and if that doesn't happen, well, it's a worthy error.
    // The alterantive, to make game type Game | undefined, will cause compilation
    // issues throughout the app.
    // Ideally the right thing is to invert how players and games get created.
    // But one thing at a time.
    this.game = undefined as unknown as Game;
  }

  public static initialize(
    name: string,
    color: Color,
    beginner: boolean,
    handicap: number = 0,
    id: PlayerId): Player {
    const player = new Player(name, color, beginner, handicap, id);
    return player;
  }

  public tearDown() {
    this.game = undefined as unknown as Game;
  }

  public isCorporation(corporationName: CardName): boolean {
    return this.corporationCard?.name === corporationName;
  }

  public getTitaniumValue(): number {
    if (PartyHooks.shouldApplyPolicy(this, PartyName.UNITY)) return this.titaniumValue + 1;
    return this.titaniumValue;
  }

  public increaseTitaniumValue(): void {
    this.titaniumValue++;
  }

  public decreaseTitaniumValue(): void {
    if (this.titaniumValue > constants.DEFAULT_TITANIUM_VALUE) {
      this.titaniumValue--;
    }
  }

  public getSelfReplicatingRobotsTargetCards(): Array<RobotCard> {
    return (this.playedCards.find((card) => card instanceof SelfReplicatingRobots) as (SelfReplicatingRobots | undefined))?.targetCards ?? [];
  }

  public getSteelValue(): number {
    if (PartyHooks.shouldApplyPolicy(this, PartyName.MARS, 'mfp03')) return this.steelValue + 1;
    return this.steelValue;
  }

  public increaseSteelValue(): void {
    this.steelValue++;
  }

  public decreaseSteelValue(): void {
    if (this.steelValue > constants.DEFAULT_STEEL_VALUE) {
      this.steelValue--;
    }
  }

  public getTerraformRating(): number {
    return this.terraformRating;
  }

  public decreaseTerraformRating(opts: {log?: boolean} = {}) {
    this.decreaseTerraformRatingSteps(1, opts);
  }

  public increaseTerraformRating(opts: {log?: boolean} = {}) {
    this.increaseTerraformRatingSteps(1, opts);
  }

  public increaseTerraformRatingSteps(steps: number, opts: {log?: boolean} = {}) {
    const raiseRating = () => {
      this.terraformRating += steps;

      this.hasIncreasedTerraformRatingThisGeneration = true;
      if (opts.log === true) {
        this.game.log('${0} gained ${1} TR', (b) => b.player(this).number(steps));
      }
      // Aurori hook
      if (this.isCorporation(CardName.AURORAI)) {
        (this.corporationCard as Aurorai).onIncreaseTerraformRating(this, steps);
      }
    };

    if (PartyHooks.shouldApplyPolicy(this, PartyName.REDS)) {
      if (!this.canAfford(REDS_RULING_POLICY_COST * steps)) {
        // Cannot pay Reds, will not increase TR
        return;
      }
      const deferred = new SelectHowToPayDeferred(
        this,
        REDS_RULING_POLICY_COST * steps,
        {
          title: 'Select how to pay for TR increase',
          afterPay: raiseRating,
        });
      this.game.defer(deferred, Priority.COST);
    } else {
      raiseRating();
    }
  }

  public decreaseTerraformRatingSteps(steps: number, opts: {log?: boolean} = {}) {
    this.terraformRating -= steps;
    if (opts.log === true) {
      this.game.log('${0} lost ${1} TR', (b) => b.player(this).number(steps));
    }
  }

  public setTerraformRating(value: number) {
    return this.terraformRating = value;
  }

  public getProduction(resource: Resources): number {
    if (resource === Resources.MEGACREDITS) return this.megaCreditProduction;
    if (resource === Resources.STEEL) return this.steelProduction;
    if (resource === Resources.TITANIUM) return this.titaniumProduction;
    if (resource === Resources.PLANTS) return this.plantProduction;
    if (resource === Resources.ENERGY) return this.energyProduction;
    if (resource === Resources.HEAT) return this.heatProduction;
    throw new Error('Resource ' + resource + ' not found');
  }

  public getResource(resource: Resources): number {
    if (resource === Resources.MEGACREDITS) return this.megaCredits;
    if (resource === Resources.STEEL) return this.steel;
    if (resource === Resources.TITANIUM) return this.titanium;
    if (resource === Resources.PLANTS) return this.plants;
    if (resource === Resources.ENERGY) return this.energy;
    if (resource === Resources.HEAT) return this.heat;
    throw new Error('Resource ' + resource + ' not found');
  }

  private logUnitDelta(
    resource: Resources,
    amount: number,
    unitType: 'production' | 'amount',
    from: Player | GlobalEventName | undefined,
    stealing = false,
  ) {
    if (amount === 0) {
      // Logging zero units doesn't seem to happen
      return;
    }

    const modifier = amount > 0 ? 'increased' : 'decreased';
    const absAmount = Math.abs(amount);
    // TODO(kberg): remove the ${2} for increased and decreased, I bet it's not used.
    let message = '${0}\'s ${1} ' + unitType + ' ${2} by ${3}';

    if (from !== undefined) {
      if (stealing === true) {
        message = message + ' stolen';
      }
      message = message + ' by ${4}';
    }

    this.game.log(message, (b) => {
      b.player(this)
        .string(resource)
        .string(modifier)
        .number(absAmount);
      if (from instanceof Player) {
        b.player(from);
      } else if (from !== undefined) {
        b.globalEventName(from);
      }
    });
  }

  public deductResource(
    resource: Resources,
    amount: number,
    options? : {
      log?: boolean,
      from? : Player | GlobalEventName,
      stealing?: boolean
    }) {
    this.addResource(resource, -amount, options);
  }

  public addResource(
    resource: Resources,
    amount: number,
    options? : {
      log?: boolean,
      from? : Player | GlobalEventName,
      stealing?: boolean
    }) {
    // When amount is negative, sometimes the amount being asked to be removed is more than the player has.
    // delta represents an adjusted amount which basically declares that a player cannot lose more resources
    // then they have.
    const playerAmount = this.getResource(resource);
    const delta = (amount >= 0) ? amount : Math.max(amount, -playerAmount);

    // Lots of calls to addResource used to deduct resources are done by cards and/or players stealing some
    // fixed amount which, if the current player doesn't have it. it just removes as much as possible.
    // (eg. Sabotage.) That's what the delta above, is for.
    //
    // But if the intent is to remove the amount requested (spending 8 plants to place a greenery) then there
    // better be 8 units. The code outside this call is responsible in those cases for making sure the player
    // has enough resource units to pay for an action.
    //
    // In those cases, if the player calls this, but the logic is wrong, the player could wind up with a
    // negative amount of units. This will break other actions in the game. So instead, this method deducts as
    // much as possible, and lots that there was a game error.
    //
    // The shortcut for knowing if this is the case is when `options.from` is undefined.
    if (delta !== amount && options?.from === undefined) {
      this.game.logIllegalState(
        `Adjusting ${amount} ${resource} when player has ${playerAmount}`,
        {player: {color: this.color, id: this.id, name: this.name}, resource, amount});
    }

    if (resource === Resources.MEGACREDITS) this.megaCredits += delta;
    else if (resource === Resources.STEEL) this.steel += delta;
    else if (resource === Resources.TITANIUM) this.titanium += delta;
    else if (resource === Resources.PLANTS) this.plants += delta;
    else if (resource === Resources.ENERGY) this.energy += delta;
    else if (resource === Resources.HEAT) this.heat += delta;
    else {
      throw new Error(`tried to add unsupported resource ${resource}`);
    }

    if (options?.log === true) {
      this.logUnitDelta(resource, delta, 'amount', options.from, options.stealing);
    }

    if (options?.from instanceof Player) {
      LawSuit.resourceHook(this, resource, delta, options.from);
      CrashSiteCleanup.resourceHook(this, resource, delta, options.from);
    }

    // Mons Insurance hook
    if (options?.from !== undefined && delta < 0 && (options.from instanceof Player && options.from.id !== this.id)) {
      MonsInsurance.resolveInsurance(this);
    }
  }

  public addProduction(
    resource: Resources,
    amount : number,
    options? : { log: boolean, from? : Player | GlobalEventName, stealing?: boolean},
  ) {
    const adj = resource === Resources.MEGACREDITS ? -5 : 0;
    const delta = (amount >= 0) ? amount : Math.max(amount, -(this.getProduction(resource) - adj));

    if (resource === Resources.MEGACREDITS) this.megaCreditProduction += delta;
    else if (resource === Resources.STEEL) this.steelProduction += delta;
    else if (resource === Resources.TITANIUM) this.titaniumProduction += delta;
    else if (resource === Resources.PLANTS) this.plantProduction += delta;
    else if (resource === Resources.ENERGY) this.energyProduction += delta;
    else if (resource === Resources.HEAT) this.heatProduction += delta;
    else {
      throw new Error(`tried to add unsupported production ${resource}`);
    }

    if (options?.log === true) {
      this.logUnitDelta(resource, amount, 'production', options.from, options.stealing);
    }

    if (options?.from instanceof Player) {
      LawSuit.resourceHook(this, resource, delta, options.from);
    }

    // Mons Insurance hook
    if (options?.from !== undefined && delta < 0 && (options.from instanceof Player && options.from.id !== this.id)) {
      MonsInsurance.resolveInsurance(this);
    }

    // Manutech hook
    if (this.isCorporation(CardName.MANUTECH)) {
      Manutech.onProductionGain(this, resource, amount);
    }
  }

  // Returns true when the player has the supplied units in its inventory.
  public hasUnits(units: Units): boolean {
    return this.megaCredits - units.megacredits >= 0 &&
      this.steel - units.steel >= 0 &&
      this.titanium - units.titanium >= 0 &&
      this.plants - units.plants >= 0 &&
      this.energy - units.energy >= 0 &&
      // Stormcraft Incorporated can supply heat, so use `availableHeat`
      this.availableHeat() - units.heat >= 0;
  }

  public addUnits(units: Partial<Units>, options? : {
    log?: boolean,
    from? : Player | GlobalEventName,
  }) {
    this.addResource(Resources.MEGACREDITS, units.megacredits || 0, options);
    this.addResource(Resources.STEEL, units.steel || 0, options);
    this.addResource(Resources.TITANIUM, units.titanium || 0, options);
    this.addResource(Resources.PLANTS, units.plants || 0, options);
    this.addResource(Resources.ENERGY, units.energy || 0, options);
    this.addResource(Resources.HEAT, units.heat || 0, options);
  }

  public deductUnits(units: Units) {
    this.deductResource(Resources.MEGACREDITS, units.megacredits);
    this.deductResource(Resources.STEEL, units.steel);
    this.deductResource(Resources.TITANIUM, units.titanium);
    this.deductResource(Resources.PLANTS, units.plants);
    this.deductResource(Resources.ENERGY, units.energy);
    this.deductResource(Resources.HEAT, units.heat);
  }

  public canAdjustProduction(units: Units): boolean {
    return this.getProduction(Resources.MEGACREDITS) + units.megacredits >= -5 &&
      this.getProduction(Resources.STEEL) + units.steel >= 0 &&
      this.getProduction(Resources.TITANIUM) + units.titanium >= 0 &&
      this.getProduction(Resources.PLANTS) + units.plants >= 0 &&
      this.getProduction(Resources.ENERGY) + units.energy >= 0 &&
      this.getProduction(Resources.HEAT) + units.heat >= 0;
  }

  public adjustProduction(units: Units, options?: {log: boolean, from?: Player}) {
    if (units.megacredits !== undefined) {
      this.addProduction(Resources.MEGACREDITS, units.megacredits, options);
    }

    if (units.steel !== undefined) {
      this.addProduction(Resources.STEEL, units.steel, options);
    }

    if (units.titanium !== undefined) {
      this.addProduction(Resources.TITANIUM, units.titanium, options);
    }

    if (units.plants !== undefined) {
      this.addProduction(Resources.PLANTS, units.plants, options);
    }

    if (units.energy !== undefined) {
      this.addProduction(Resources.ENERGY, units.energy, options);
    }

    if (units.heat !== undefined) {
      this.addProduction(Resources.HEAT, units.heat, options);
    }
  }

  public getActionsThisGeneration(): Set<CardName> {
    return this.actionsThisGeneration;
  }

  public addActionThisGeneration(cardName: CardName): void {
    this.actionsThisGeneration.add(cardName);
    return;
  }

  public getVictoryPoints(): IVictoryPointsBreakdown {
    const victoryPointsBreakdown = new VictoryPointsBreakdown();

    // Victory points from corporations
    if (this.corporationCard !== undefined && this.corporationCard.victoryPoints !== undefined) {
      victoryPointsBreakdown.setVictoryPoints('victoryPoints', this.corporationCard.getVictoryPoints(this), this.corporationCard.name);
    }

    // Victory points from cards
    for (const playedCard of this.playedCards) {
      if (playedCard.victoryPoints !== undefined) {
        victoryPointsBreakdown.setVictoryPoints('victoryPoints', playedCard.getVictoryPoints(this), playedCard.name);
      }
    }

    // Victory points from TR
    victoryPointsBreakdown.setVictoryPoints('terraformRating', this.terraformRating);

    // Victory points from awards
    this.giveAwards(victoryPointsBreakdown);

    // Victory points from milestones
    for (const milestone of this.game.claimedMilestones) {
      if (milestone.player !== undefined && milestone.player.id === this.id) {
        victoryPointsBreakdown.setVictoryPoints('milestones', 5, 'Claimed '+milestone.milestone.name+' milestone');
      }
    }

    // Victory points from board
    this.game.board.spaces.forEach((space) => {
      // Victory points for greenery tiles
      if (Board.isGreenerySpace(space) && Board.spaceOwnedBy(space, this)) {
        victoryPointsBreakdown.setVictoryPoints('greenery', 1);
      }

      // Victory points for greenery tiles adjacent to cities
      if (Board.isCitySpace(space) && Board.spaceOwnedBy(space, this)) {
        const adjacent = this.game.board.getAdjacentSpaces(space);
        for (const adj of adjacent) {
          if (Board.isGreenerySpace(adj)) {
            victoryPointsBreakdown.setVictoryPoints('city', 1);
          }
        }
      }
    });

    // Turmoil Victory Points
    const includeTurmoilVP : boolean = this.game.gameIsOver() || this.game.phase === Phase.END;

    Turmoil.ifTurmoil(this.game, (turmoil) => {
      if (includeTurmoilVP) {
        victoryPointsBreakdown.setVictoryPoints('victoryPoints', turmoil.getPlayerVictoryPoints(this), 'Turmoil Points');
      }
    });

    // Titania Colony VP
    if (this.colonyVictoryPoints > 0) {
      victoryPointsBreakdown.setVictoryPoints('victoryPoints', this.colonyVictoryPoints, 'Colony VP');
    }

    MoonExpansion.calculateVictoryPoints(this, victoryPointsBreakdown);
    PathfindersExpansion.calculateVictoryPoints(this, victoryPointsBreakdown);

    // Escape velocity VP penalty
    if (this.game.gameOptions.escapeVelocityMode) {
      const threshold = this.game.gameOptions.escapeVelocityThreshold;
      const period = this.game.gameOptions.escapeVelocityPeriod;
      const penaltyPerMin = this.game.gameOptions.escapeVelocityPenalty ?? 1;
      const elapsedTimeInMinutes = this.timer.getElapsedTimeInMinutes();
      if (threshold !== undefined && period !== undefined && elapsedTimeInMinutes > threshold) {
        const overTimeInMinutes = Math.max(elapsedTimeInMinutes - threshold - (this.actionsTakenThisGame * (constants.BONUS_SECONDS_PER_ACTION / 60)), 0);
        // Don't lose more VP than what is available
        victoryPointsBreakdown.updateTotal();

        const totalBeforeEscapeVelocity = victoryPointsBreakdown.points.total;
        const penaltyTotal = Math.min(penaltyPerMin * Math.floor(overTimeInMinutes / period), totalBeforeEscapeVelocity);
        victoryPointsBreakdown.setVictoryPoints('escapeVelocity', -penaltyTotal, 'Escape Velocity Penalty');
      }
    }

    victoryPointsBreakdown.updateTotal();
    return victoryPointsBreakdown.points;
  }

  public cardIsInEffect(cardName: CardName): boolean {
    return this.playedCards.some(
      (playedCard) => playedCard.name === cardName);
  }

  public hasProtectedHabitats(): boolean {
    return this.cardIsInEffect(CardName.PROTECTED_HABITATS);
  }

  public plantsAreProtected(): boolean {
    return this.hasProtectedHabitats() || this.cardIsInEffect(CardName.ASTEROID_DEFLECTION_SYSTEM);
  }

  public alloysAreProtected(): boolean {
    return this.cardIsInEffect(CardName.LUNAR_SECURITY_STATIONS);
  }

  public canReduceAnyProduction(resource: Resources, minQuantity: number = 1): boolean {
    // in soloMode you don't have to decrease resources
    const game = this.game;
    if (game.isSoloMode()) return true;
    return game.getPlayers().some((p) => p.canHaveProductionReduced(resource, minQuantity, this));
  }

  public canHaveProductionReduced(resource: Resources, minQuantity: number, attacker: Player) {
    if (resource === Resources.MEGACREDITS) {
      if ((this.getProduction(resource) + 5) < minQuantity) return false;
    } else {
      if (this.getProduction(resource) < minQuantity) return false;
    }

    if (resource === Resources.STEEL || resource === Resources.TITANIUM) {
      if (this.alloysAreProtected()) return false;
    }

    // The pathfindersExpansion test is just an optimization for non-Pathfinders games.
    if (this.game.gameOptions.pathfindersExpansion && this.productionIsProtected(attacker)) return false;
    return true;
  }

  public productionIsProtected(attacker: Player): boolean {
    return attacker !== this && this.cardIsInEffect(CardName.PRIVATE_SECURITY);
  }

  // Return the number of cards in the player's hand without tags.
  // Wild tags are ignored in this computation. (why?)
  public getNoTagsCount() {
    let noTagsCount: number = 0;

    if (this.corporationCard !== undefined && this.corporationCard.tags.every((tag) => tag === Tags.WILD)) {
      noTagsCount++;
    }

    noTagsCount += this.playedCards.filter((card) => card.cardType !== CardType.EVENT && card.tags.every((tag) => tag === Tags.WILD)).length;

    return noTagsCount;
  }

  public getColoniesCount() {
    if (!this.game.gameOptions.coloniesExtension) return 0;

    let coloniesCount: number = 0;

    this.game.colonies.forEach((colony) => {
      coloniesCount += colony.colonies.filter((owner) => owner === this.id).length;
    });

    return coloniesCount;
  }

  /*
   * When playing Pharmacy Union, if the card is discarded, then it sits in the event pile.
   * That's why it's included below. The FAQ describes how this applies to things like the
   * Legend Milestone, Media Archives, and NOT Media Group.
   */
  public getPlayedEventsCount(): number {
    let count = this.playedCards.filter((card) => card.cardType === CardType.EVENT).length;
    if (this.isCorporation(CardName.PHARMACY_UNION) && this.corporationCard?.isDisabled) count++;

    return count;
  }

  public getRequirementsBonus(parameter: GlobalParameter): number {
    let requirementsBonus: number = 0;
    if (
      this.corporationCard !== undefined &&
          this.corporationCard.getRequirementBonus !== undefined) {
      requirementsBonus += this.corporationCard.getRequirementBonus(this, parameter);
    }
    for (const playedCard of this.playedCards) {
      if (playedCard.getRequirementBonus !== undefined &&
          playedCard.getRequirementBonus(this, parameter)) {
        requirementsBonus += playedCard.getRequirementBonus(this, parameter);
      }
    }

    // PoliticalAgendas Scientists P2 hook
    if (PartyHooks.shouldApplyPolicy(this, PartyName.SCIENTISTS, 'sp02')) {
      requirementsBonus += 2;
    }

    return requirementsBonus;
  }

  public removeResourceFrom(card: ICard, count: number = 1, options?: {removingPlayer? : Player, log?: boolean}): void {
    const removingPlayer = options?.removingPlayer;
    if (card.resourceCount) {
      const amountRemoved = Math.min(card.resourceCount, count);
      if (amountRemoved === 0) return;
      card.resourceCount -= amountRemoved;

      if (removingPlayer !== undefined && removingPlayer !== this) MonsInsurance.resolveInsurance(this);

      if (options?.log ?? true === true) {
        this.game.log('${0} removed ${1} resource(s) from ${2}\'s ${3}', (b) =>
          b.player(options?.removingPlayer ?? this)
            .number(amountRemoved)
            .player(this)
            .card(card));
      }

      // Lawsuit hook
      if (removingPlayer !== undefined && removingPlayer !== this && this.removingPlayers.includes(removingPlayer.id) === false) {
        this.removingPlayers.push(removingPlayer.id);
      }
    }
  }

  public addResourceTo(card: ICard, options: number | {qty?: number, log?: boolean, logZero?: boolean} = 1): void {
    const count = typeof(options) === 'number' ? options : (options.qty ?? 1);

    if (card.resourceCount !== undefined) {
      card.resourceCount += count;
    }

    if (typeof(options) !== 'number' && options.log === true) {
      if (options.logZero === true || count !== 0) {
        LogHelper.logAddResource(this, card, count);
      }
    }

    for (const playedCard of this.playedCards) {
      playedCard.onResourceAdded?.(this, card, count);
    }
    this.corporationCard?.onResourceAdded?.(this, card, count);
  }

  public getCardsWithResources(resource?: CardResource): Array<ICard & IResourceCard> {
    let result: Array<ICard & IResourceCard> = this.playedCards.filter((card) => card.resourceType !== undefined && card.resourceCount && card.resourceCount > 0);
    if (this.corporationCard !== undefined &&
          this.corporationCard.resourceType !== undefined &&
          this.corporationCard.resourceCount !== undefined &&
          this.corporationCard.resourceCount > 0) {
      result.push(this.corporationCard);
    }

    if (resource !== undefined) {
      result = result.filter((card) => card.resourceType === resource);
    }

    return result;
  }

  public getResourceCards(resource?: CardResource): Array<ICard> {
    let result: Array<ICard> = this.playedCards.filter((card) => card.resourceType !== undefined);

    if (this.corporationCard !== undefined && this.corporationCard.resourceType !== undefined) {
      result.push(this.corporationCard);
    }

    if (resource !== undefined) {
      result = result.filter((card) => card.resourceType === resource);
    }

    return result;
  }

  public getResourceCount(resource: CardResource): number {
    let count: number = 0;
    this.getCardsWithResources(resource).forEach((card) => {
      count += card.resourceCount;
    });
    return count;
  }

  public getCardsByCardType(cardType: CardType) {
    return this.playedCards.filter((card) => card.cardType === cardType);
  }

  public getAllTags(): Array<ITagCount> {
    return [
      {tag: Tags.BUILDING, count: this.getTagCount(Tags.BUILDING, 'raw')},
      {tag: Tags.CITY, count: this.getTagCount(Tags.CITY, 'raw')},
      {tag: Tags.EARTH, count: this.getTagCount(Tags.EARTH, 'raw')},
      {tag: Tags.ENERGY, count: this.getTagCount(Tags.ENERGY, 'raw')},
      {tag: Tags.JOVIAN, count: this.getTagCount(Tags.JOVIAN, 'raw')},
      {tag: Tags.MARS, count: this.getTagCount(Tags.MARS, 'raw')},
      {tag: Tags.MICROBE, count: this.getTagCount(Tags.MICROBE, 'raw')},
      {tag: Tags.MOON, count: this.getTagCount(Tags.MOON, 'raw')},
      {tag: Tags.PLANT, count: this.getTagCount(Tags.PLANT, 'raw')},
      {tag: Tags.SCIENCE, count: this.getTagCount(Tags.SCIENCE, 'raw')},
      {tag: Tags.SPACE, count: this.getTagCount(Tags.SPACE, 'raw')},
      {tag: Tags.VENUS, count: this.getTagCount(Tags.VENUS, 'raw')},
      {tag: Tags.WILD, count: this.getTagCount(Tags.WILD, 'raw')},
      {tag: Tags.ANIMAL, count: this.getTagCount(Tags.ANIMAL, 'raw')},
      {tag: Tags.EVENT, count: this.getPlayedEventsCount()},
    ].filter((tag) => tag.count > 0);
  }

  /*
   * Get the number of tags a player has, depending on certain conditions.
   *
   * 'raw': count face-up tags literally, including Leavitt Station.
   * 'default': Same as raw, but include the wild tags.
   * 'milestone': Same as raw with special conditions for milestones (Chimera)
   * 'award': Same as raw with special conditions for awards (Chimera)
   * 'vps': Same as raw, but include event tags.
   * 'raw-pf': Same as raw, but includes Mars Tags when tag is Science  (Habitat Marte)
   */
  public getTagCount(tag: Tags, mode: 'default' | 'raw' | 'milestone' | 'award' | 'vps' | 'raw-pf' = 'default') {
    const includeEvents = this.isCorporation(CardName.ODYSSEY);
    const includeTagSubstitutions = (mode === 'default' || mode === 'milestone');

    let tagCount = this.getRawTagCount(tag, includeEvents);

    // Leavitt Station hook
    if (tag === Tags.SCIENCE && this.scienceTagCount > 0) {
      tagCount += this.scienceTagCount;
    }


    if (includeTagSubstitutions) {
      // Earth Embassy hook
      if (tag === Tags.EARTH && this.cardIsInEffect(CardName.EARTH_EMBASSY)) {
        tagCount += this.getRawTagCount(Tags.MOON, includeEvents);
      }

      if (tag !== Tags.WILD) {
        tagCount += this.getRawTagCount(Tags.WILD, includeEvents);
      }
    }

    // Habitat Marte hook
    if (mode !== 'raw') {
      if (tag === Tags.SCIENCE && this.isCorporation(CardName.HABITAT_MARTE)) {
        tagCount += this.getRawTagCount(Tags.MARS, includeEvents);
      }
    }

    // Chimera hook
    if (this.isCorporation(CardName.CHIMERA)) {
      // Milestones don't count wild tags, so in this case one will be added.
      if (mode === 'award') {
        tagCount++;
      }
      // Milestones count wild tags, so in this case one will be deducted.
      if (mode === 'milestone') {
        tagCount--;
      }
    }
    return tagCount;
  }

  public cardHasTag(card: ICard, target: Tags): boolean {
    for (const tag of card.tags) {
      if (tag === target) return true;
      if (tag === Tags.MARS &&
        target === Tags.SCIENCE &&
        this.isCorporation(CardName.HABITAT_MARTE)) {
        return true;
      }
    }
    return false;
  }
  public cardTagCount(card: ICard, target: Tags): number {
    let count = 0;
    for (const tag of card.tags) {
      if (tag === target) count++;
      if (tag === Tags.MARS && target === Tags.SCIENCE &&
        this.isCorporation(CardName.HABITAT_MARTE)) {
        count++;
      }
    }
    return count;
  }

  // Counts the tags in the player's play area only.
  public getRawTagCount(tag: Tags, includeEventsTags: boolean) {
    let tagCount = 0;

    this.playedCards.forEach((card: IProjectCard) => {
      if ( ! includeEventsTags && card.cardType === CardType.EVENT) return;
      tagCount += card.tags.filter((cardTag) => cardTag === tag).length;
    });

    if (this.corporationCard !== undefined && !this.corporationCard.isDisabled) {
      tagCount += this.corporationCard.tags.filter(
        (cardTag) => cardTag === tag,
      ).length;
    }
    return tagCount;
  }

  // Return the total number of tags assocaited with these types.
  // Tag substitutions are included
  public getMultipleTagCount(tags: Array<Tags>, mode: 'default' | 'milestones' = 'default'): number {
    let tagCount = 0;
    tags.forEach((tag) => {
      tagCount += this.getRawTagCount(tag, false);
    });

    // This is repeated behavior from getTagCount, sigh, OK.
    if (tags.includes(Tags.EARTH) && !tags.includes(Tags.MOON) && this.cardIsInEffect(CardName.EARTH_EMBASSY)) {
      tagCount += this.getRawTagCount(Tags.MOON, false);
    }

    tagCount += this.getRawTagCount(Tags.WILD, false);

    // Chimera has 2 wild tags but should only count as one for milestones.
    if (this.isCorporation(CardName.CHIMERA) && mode === 'milestones') tagCount--;

    return tagCount;
  }

  // Counts the number of distinct tags
  public getDistinctTagCount(mode: 'default' | 'milestone' | 'globalEvent', extraTag?: Tags): number {
    let wildTagCount: number = 0;
    const uniqueTags = new Set<Tags>();
    const addTag = (tag: Tags) => {
      if (tag === Tags.WILD) {
        wildTagCount++;
      } else {
        uniqueTags.add(tag);
      }
    };
    if (extraTag !== undefined) {
      uniqueTags.add(extraTag);
    }
    if (this.corporationCard !== undefined && !this.corporationCard.isDisabled) {
      this.corporationCard.tags.forEach(addTag);
    }
    for (const card of this.playedCards) {
      if (card.cardType !== CardType.EVENT) {
        card.tags.forEach(addTag);
      }
    }
    // Leavitt Station hook
    if (this.scienceTagCount > 0) uniqueTags.add(Tags.SCIENCE);

    if (mode === 'globalEvent') return uniqueTags.size;

    if (mode === 'milestone' && this.isCorporation(CardName.CHIMERA)) wildTagCount--;

    // TODO(kberg): it might be more correct to count all the tags
    // in a game regardless of expansion? But if that happens it needs
    // to be done once, during set-up so that this operation doesn't
    // always go through every tag every time.
    let maxTagCount = 10;
    if (this.game.gameOptions.venusNextExtension) maxTagCount++;
    if (this.game.gameOptions.moonExpansion) maxTagCount++;
    if (this.game.gameOptions.pathfindersExpansion) maxTagCount++;
    return Math.min(uniqueTags.size + wildTagCount, maxTagCount);
  }

  // Return true if this player has all the tags in `tags` showing.
  public checkMultipleTagPresence(tags: Array<Tags>): boolean {
    let distinctCount = 0;
    tags.forEach((tag) => {
      if (this.getTagCount(tag, 'raw') > 0) {
        distinctCount++;
      } else if (tag === Tags.SCIENCE && this.hasTurmoilScienceTagBonus) {
        distinctCount++;
      }
    });
    if (distinctCount + this.getTagCount(Tags.WILD) >= tags.length) {
      return true;
    }
    return false;
  }

  public deferInputCb(result: PlayerInput | undefined): void {
    this.defer(result, Priority.DEFAULT);
  }

  public checkInputLength(input: InputResponse, length: number, firstOptionLength?: number) {
    if (input.length !== length) {
      throw new Error('Incorrect options provided');
    }
    if (firstOptionLength !== undefined && input[0].length !== firstOptionLength) {
      throw new Error('Incorrect options provided (nested)');
    }
  }

  public parseHowToPayJSON(json: string): HowToPay {
    const defaults: HowToPay = {
      steel: 0,
      heat: 0,
      titanium: 0,
      megaCredits: 0,
      microbes: 0,
      floaters: 0,
      science: 0,
      seeds: 0,
      data: 0,
    };
    try {
      const howToPay: HowToPay = JSON.parse(json);
      if (Object.keys(howToPay).every((key) => key in defaults) === false) {
        throw new Error('Input contains unauthorized keys');
      }
      return howToPay;
    } catch (err) {
      throw new Error('Unable to parse HowToPay input ' + err);
    }
  }

  public runInput(input: InputResponse, pi: PlayerInput): void {
    this.deferInputCb(pi.process(input, this));
  }

  public getPlayableActionCards(): Array<ICard & IActionCard> {
    const result: Array<ICard & IActionCard> = [];
    if (isIActionCard(this.corporationCard) &&
          !this.actionsThisGeneration.has(this.corporationCard.name) &&
          isIActionCard(this.corporationCard) &&
          this.corporationCard.canAct(this)) {
      result.push(this.corporationCard);
    }
    for (const playedCard of this.playedCards) {
      if (
        isIActionCard(playedCard) &&
              !this.actionsThisGeneration.has(playedCard.name) &&
              playedCard.canAct(this)) {
        result.push(playedCard);
      }
    }

    return result;
  }

  public runProductionPhase(): void {
    this.actionsThisGeneration.clear();
    this.removingPlayers = [];

    this.turmoilPolicyActionUsed = false;
    this.politicalAgendasActionUsedCount = 0;
    this.megaCredits += this.megaCreditProduction + this.terraformRating;
    this.heat += this.energy;
    this.heat += this.heatProduction;
    this.energy = this.energyProduction;
    this.titanium += this.titaniumProduction;
    this.steel += this.steelProduction;
    this.plants += this.plantProduction;

    if (this.corporationCard !== undefined && this.corporationCard.onProductionPhase !== undefined) {
      this.corporationCard.onProductionPhase(this);
    }
  }

  public returnTradeFleets(): void {
    // Syndicate Pirate Raids hook. If it is in effect, then only the syndicate pirate raider will
    // retrieve their fleets.
    // See Colony.ts for the other half of this effect, and Game.ts which disables it.
    if (this.game.syndicatePirateRaider === undefined) {
      this.tradesThisGeneration = 0;
    } else if (this.game.syndicatePirateRaider === this.id) {
      this.tradesThisGeneration = 0;
    }
  }
  private doneWorldGovernmentTerraforming(): void {
    this.game.deferredActions.runAll(() => this.game.doneWorldGovernmentTerraforming());
  }

  public worldGovernmentTerraforming(): void {
    const action: OrOptions = new OrOptions();
    action.title = 'Select action for World Government Terraforming';
    action.buttonLabel = 'Confirm';
    const game = this.game;
    if (game.getTemperature() < constants.MAX_TEMPERATURE) {
      action.options.push(
        new SelectOption('Increase temperature', 'Increase', () => {
          game.increaseTemperature(this, 1);
          game.log('${0} acted as World Government and increased temperature', (b) => b.player(this));
          return undefined;
        }),
      );
    }
    if (game.getOxygenLevel() < constants.MAX_OXYGEN_LEVEL) {
      action.options.push(
        new SelectOption('Increase oxygen', 'Increase', () => {
          game.increaseOxygenLevel(this, 1);
          game.log('${0} acted as World Government and increased oxygen level', (b) => b.player(this));
          return undefined;
        }),
      );
    }
    if (game.canAddOcean()) {
      action.options.push(
        new SelectSpace(
          'Add an ocean',
          game.board.getAvailableSpacesForOcean(this), (space) => {
            game.addOceanTile(this, space.id, SpaceType.OCEAN);
            game.log('${0} acted as World Government and placed an ocean', (b) => b.player(this));
            return undefined;
          },
        ),
      );
    }
    if (game.getVenusScaleLevel() < constants.MAX_VENUS_SCALE && game.gameOptions.venusNextExtension) {
      action.options.push(
        new SelectOption('Increase Venus scale', 'Increase', () => {
          game.increaseVenusScaleLevel(this, 1);
          game.log('${0} acted as World Government and increased Venus scale', (b) => b.player(this));
          return undefined;
        }),
      );
    }

    MoonExpansion.ifMoon(game, (moonData) => {
      if (moonData.colonyRate < constants.MAXIMUM_COLONY_RATE) {
        action.options.push(
          new SelectOption('Increase the Moon colony rate', 'Increase', () => {
            MoonExpansion.raiseColonyRate(this, 1);
            return undefined;
          }),
        );
      }

      if (moonData.miningRate < constants.MAXIMUM_MINING_RATE) {
        action.options.push(
          new SelectOption('Increase the Moon mining rate', 'Increase', () => {
            MoonExpansion.raiseMiningRate(this, 1);
            return undefined;
          }),
        );
      }

      if (moonData.logisticRate < constants.MAXIMUM_LOGISTICS_RATE) {
        action.options.push(
          new SelectOption('Increase the Moon logistics rate', 'Increase', () => {
            MoonExpansion.raiseLogisticRate(this, 1);
            return undefined;
          }),
        );
      }
    });

    this.setWaitingFor(action, () => {
      this.doneWorldGovernmentTerraforming();
    });
  }

  public dealCards(quantity: number, cards: Array<IProjectCard>): void {
    for (let i = 0; i < quantity; i++) {
      cards.push(this.game.dealer.dealCard(this.game, true));
    }
  }

  /*
   * @param initialDraft when true, this is part of the first generation draft.
   * @param playerName  The player _this_ player passes remaining cards to.
   * @param passedCards The cards received from the draw, or from the prior player. If empty, it's the first
   *   step in the draft, and cards have to be dealt.
   */
  public runDraftPhase(initialDraft: boolean, playerName: string, passedCards?: Array<IProjectCard>): void {
    let cardsToKeep = 1;

    let cards: Array<IProjectCard> = [];
    if (passedCards === undefined) {
      if (!initialDraft) {
        let cardsToDraw = 4;
        if (LunaProjectOffice.isActive(this)) {
          cardsToDraw = 5;
          cardsToKeep = 2;
        }

        this.dealCards(cardsToDraw, cards);
      } else {
        this.dealCards(5, cards);
      }
    } else {
      cards = passedCards;
    }

    const message = cardsToKeep === 1 ?
      'Select a card to keep and pass the rest to ${0}' :
      'Select two cards to keep and pass the rest to ${0}';

    this.setWaitingFor(
      new SelectCard({
        message: message,
        data: [{
          type: LogMessageDataType.RAW_STRING,
          value: playerName,
        }],
      },
      'Keep',
      cards,
      (foundCards: Array<IProjectCard>) => {
        foundCards.forEach((card) => {
          this.draftedCards.push(card);
          cards = cards.filter((c) => c !== card);
        });
        this.game.playerIsFinishedWithDraftingPhase(initialDraft, this, cards);
        return undefined;
      }, {min: cardsToKeep, max: cardsToKeep, played: false}),
    );
  }

  /**
   * @return {number} the number of avaialble megacredits. Which is just a shorthand for megacredits,
   * plus any units of heat available thanks to Helion.
   */
  public spendableMegacredits(): number {
    return (this.canUseHeatAsMegaCredits) ? (this.heat + this.megaCredits) : this.megaCredits;
  }

  public runResearchPhase(draftVariant: boolean): void {
    let dealtCards: Array<IProjectCard> = [];
    if (!draftVariant) {
      this.dealCards(LunaProjectOffice.isActive(this) ? 5 : 4, dealtCards);
    } else {
      dealtCards = this.draftedCards;
      this.draftedCards = [];
    }

    const action = DrawCards.choose(this, dealtCards, {paying: true});
    this.setWaitingFor(action, () => this.game.playerIsFinishedWithResearchPhase(this));
  }

  public getCardCost(card: IProjectCard): number {
    let cost: number = card.cost;
    cost -= this.cardDiscount;

    this.playedCards.forEach((playedCard) => {
      if (playedCard.getCardDiscount !== undefined) {
        cost -= playedCard.getCardDiscount(this, card);
      }
    });

    // Check corporation too
    if (this.corporationCard !== undefined && this.corporationCard.getCardDiscount !== undefined) {
      cost -= this.corporationCard.getCardDiscount(this, card);
    }

    // Playwrights hook
    this.removedFromPlayCards.forEach((removedFromPlayCard) => {
      if (removedFromPlayCard.getCardDiscount !== undefined) {
        cost -= removedFromPlayCard.getCardDiscount(this, card);
      }
    });

    // PoliticalAgendas Unity P4 hook
    if (card.tags.includes(Tags.SPACE) && PartyHooks.shouldApplyPolicy(this, PartyName.UNITY, 'up04')) {
      cost -= 2;
    }

    return Math.max(cost, 0);
  }

  private canUseSteel(card: ICard): boolean {
    return this.lastCardPlayed === CardName.LAST_RESORT_INGENUITY || card.tags.includes(Tags.BUILDING);
  }

  private canUseTitanium(card: ICard): boolean {
    return this.lastCardPlayed === CardName.LAST_RESORT_INGENUITY || card.tags.includes(Tags.SPACE);
  }

  private canUseMicrobes(card: ICard): boolean {
    return card.tags.includes(Tags.PLANT);
  }

  private canUseFloaters(card: ICard): boolean {
    return card.tags.includes(Tags.VENUS);
  }

  private canUseScience(card: ICard): boolean {
    return card.tags.includes(Tags.MOON);
  }

  private canUseSeeds(card: ICard): boolean {
    return card.tags.includes(Tags.PLANT) || card.name === CardName.GREENERY_STANDARD_PROJECT;
  }

  private canUseData(card: ICard): boolean {
    return card.cardType === CardType.STANDARD_PROJECT;
  }

  private playPreludeCard(): PlayerInput {
    return new SelectCard(
      'Select prelude card to play',
      'Play',
      this.getPlayablePreludeCards(),
      (foundCards: Array<IProjectCard>) => {
        return this.playCard(foundCards[0]);
      },
    );
  }

  public checkHowToPayAndPlayCard(selectedCard: IProjectCard, howToPay: HowToPay) {
    const cardCost: number = this.getCardCost(selectedCard);
    let totalToPay: number = 0;

    const canUseSteel = this.canUseSteel(selectedCard);
    const canUseTitanium = this.canUseTitanium(selectedCard);

    if (canUseSteel && howToPay.steel > 0) {
      if (howToPay.steel > this.steel) {
        throw new Error('Do not have enough steel');
      }
      totalToPay += howToPay.steel * this.getSteelValue();
    }

    if (canUseTitanium && howToPay.titanium > 0) {
      if (howToPay.titanium > this.titanium) {
        throw new Error('Do not have enough titanium');
      }
      totalToPay += howToPay.titanium * this.getTitaniumValue();
    }

    if (this.canUseHeatAsMegaCredits && howToPay.heat !== undefined) {
      totalToPay += howToPay.heat;
    }

    if (howToPay.microbes !== undefined) {
      totalToPay += howToPay.microbes * DEFAULT_MICROBES_VALUE;
    }

    if (howToPay.floaters !== undefined && howToPay.floaters > 0) {
      if (selectedCard.name === CardName.STRATOSPHERIC_BIRDS && howToPay.floaters === this.getFloatersCanSpend()) {
        const cardsWithFloater = this.getCardsWithResources(CardResource.FLOATER);
        if (cardsWithFloater.length === 1) {
          throw new Error('Cannot spend all floaters to play Stratospheric Birds');
        }
      }
      totalToPay += howToPay.floaters * DEFAULT_FLOATERS_VALUE;
    }

    if (howToPay.science ?? 0 > 0) {
      totalToPay += howToPay.science;
    }

    if (howToPay.seeds ?? 0 > 0) {
      totalToPay += howToPay.seeds * constants.SEED_VALUE;
    }

    if (howToPay.megaCredits > this.megaCredits) {
      throw new Error('Do not have enough M€');
    }

    if (howToPay.science !== undefined) {
      totalToPay += howToPay.science;
    }

    totalToPay += howToPay.megaCredits;

    if (totalToPay < cardCost) {
      throw new Error('Did not spend enough to pay for card');
    }
    return this.playCard(selectedCard, howToPay);
  }

  public playProjectCard(): PlayerInput {
    return new SelectHowToPayForProjectCard(
      this,
      this.getPlayableCards(),
      (selectedCard, howToPay) => this.checkHowToPayAndPlayCard(selectedCard, howToPay),
    );
  }

  public getMicrobesCanSpend(): number {
    const psychrophiles = this.playedCards.find((card) => card.name === CardName.PSYCHROPHILES);
    return psychrophiles?.resourceCount ?? 0;
  }

  public getFloatersCanSpend(): number {
    const dirigibles = this.playedCards.find((card) => card.name === CardName.DIRIGIBLES);
    return dirigibles?.resourceCount ?? 0;
  }

  public getSpendableScienceResources(): number {
    const lunaArchives = this.playedCards.find((card) => card.name === CardName.LUNA_ARCHIVES);
    return lunaArchives?.resourceCount ?? 0;
  }

  public getSpendableSeedResources(): number {
    if (this.isCorporation(CardName.SOYLENT_SEEDLING_SYSTEMS)) {
      return this.corporationCard?.resourceCount ?? 0;
    }
    return 0;
  }

  public getSpendableData(): number {
    if (this.isCorporation(CardName.AURORAI)) {
      return this.corporationCard?.resourceCount ?? 0;
    }
    return 0;
  }

  public playCard(selectedCard: IProjectCard, howToPay?: HowToPay, addToPlayedCards: boolean = true): undefined {
    // Pay for card
    if (howToPay !== undefined) {
      this.deductResource(Resources.STEEL, howToPay.steel);
      this.deductResource(Resources.TITANIUM, howToPay.titanium);
      this.deductResource(Resources.MEGACREDITS, howToPay.megaCredits);
      this.deductResource(Resources.HEAT, howToPay.heat);

      for (const playedCard of this.playedCards) {
        if (playedCard.name === CardName.PSYCHROPHILES) {
          this.removeResourceFrom(playedCard, howToPay.microbes);
        }

        if (playedCard.name === CardName.DIRIGIBLES) {
          this.removeResourceFrom(playedCard, howToPay.floaters);
        }

        if (playedCard.name === CardName.LUNA_ARCHIVES) {
          this.removeResourceFrom(playedCard, howToPay.science);
        }

        if (this.corporationCard?.name === CardName.SOYLENT_SEEDLING_SYSTEMS) {
          this.removeResourceFrom(this.corporationCard, howToPay.seeds);
        }

        if (this.corporationCard?.name === CardName.AURORAI) {
          this.removeResourceFrom(this.corporationCard, howToPay.data);
        }
      }
    }

    // Activate some colonies
    if (this.game.gameOptions.coloniesExtension && selectedCard.resourceType !== undefined) {
      this.game.colonies.forEach((colony) => {
        if (colony.metadata.resourceType !== undefined && colony.metadata.resourceType === selectedCard.resourceType) {
          colony.isActive = true;
        }
      });

      // Check for Venus colony
      if (selectedCard.tags.includes(Tags.VENUS)) {
        const venusColony = this.game.colonies.find((colony) => colony.name === ColonyName.VENUS);
        if (venusColony) venusColony.isActive = true;
      }
    }

    if (selectedCard.cardType !== CardType.PROXY) {
      this.lastCardPlayed = selectedCard.name;
      this.game.log('${0} played ${1}', (b) => b.player(this).card(selectedCard));
    }

    // Play the card
    const action = selectedCard.play(this);
    this.defer(action, Priority.DEFAULT);

    // Remove card from hand
    const projectCardIndex = this.cardsInHand.findIndex((card) => card.name === selectedCard.name);
    const preludeCardIndex = this.preludeCardsInHand.findIndex((card) => card.name === selectedCard.name);
    if (projectCardIndex !== -1) {
      this.cardsInHand.splice(projectCardIndex, 1);
    } else if (preludeCardIndex !== -1) {
      this.preludeCardsInHand.splice(preludeCardIndex, 1);
    }

    // Remove card from Self Replicating Robots
    const card = this.playedCards.find((card) => card.name === CardName.SELF_REPLICATING_ROBOTS);
    if (card instanceof SelfReplicatingRobots) {
      for (const targetCard of card.targetCards) {
        if (targetCard.card.name === selectedCard.name) {
          const index = card.targetCards.indexOf(targetCard);
          card.targetCards.splice(index, 1);
        }
      }
    }

    if (addToPlayedCards && selectedCard.name !== CardName.LAW_SUIT) {
      this.playedCards.push(selectedCard);
    }

    // See DeclareCloneTag for why.
    if (!selectedCard.tags.includes(Tags.CLONE)) {
      this.onCardPlayed(selectedCard);
    }

    return undefined;
  }

  public onCardPlayed(card: IProjectCard) {
    if (card.cardType === CardType.PROXY) {
      return;
    }
    for (const playedCard of this.playedCards) {
      if (playedCard.onCardPlayed !== undefined) {
        const actionFromPlayedCard: OrOptions | void = playedCard.onCardPlayed(this, card);
        if (actionFromPlayedCard !== undefined) {
          this.game.defer(new SimpleDeferredAction(
            this,
            () => actionFromPlayedCard,
          ));
        }
      }
    }

    TurmoilHandler.applyOnCardPlayedEffect(this, card);

    for (const somePlayer of this.game.getPlayersInGenerationOrder()) {
      if (somePlayer.corporationCard !== undefined && somePlayer.corporationCard.onCardPlayed !== undefined) {
        const actionFromPlayedCard: OrOptions | void = somePlayer.corporationCard.onCardPlayed(this, card);
        if (actionFromPlayedCard !== undefined) {
          this.game.defer(new SimpleDeferredAction(
            this,
            () => actionFromPlayedCard,
          ));
        }
      }
    }

    PathfindersExpansion.onCardPlayed(this, card);
  }

  private playActionCard(): PlayerInput {
    return new SelectCard<ICard & IActionCard>(
      'Perform an action from a played card',
      'Take action',
      this.getPlayableActionCards(),
      (foundCards) => {
        const foundCard = foundCards[0];
        this.game.log('${0} used ${1} action', (b) => b.player(this).card(foundCard));
        const action = foundCard.action(this);
        if (action !== undefined) {
          this.game.defer(new SimpleDeferredAction(
            this,
            () => action,
          ));
        }
        this.actionsThisGeneration.add(foundCard.name);
        return undefined;
      }, {selectBlueCardAction: true},
    );
  }

  public drawCard(count?: number, options?: DrawCards.DrawOptions): undefined {
    return DrawCards.keepAll(this, count, options).execute();
  }

  public drawCardKeepSome(count: number, options: DrawCards.AllOptions): SelectCard<IProjectCard> {
    return DrawCards.keepSome(this, count, options).execute();
  }

  public discardPlayedCard(card: IProjectCard) {
    const cardIndex = this.playedCards.findIndex((c) => c.name === card.name);
    if (cardIndex === -1) {
      console.error(`Error: card ${card.name} not in ${this.id}'s hand`);
      return;
    }
    this.playedCards.splice(cardIndex, 1);
    this.game.dealer.discard(card);
    card.onDiscard?.(this);
    this.game.log('${0} discarded ${1}', (b) => b.player(this).card(card));
  }

  public availableHeat(): number {
    const floaters = this.isCorporation(CardName.STORMCRAFT_INCORPORATED) ? (this.corporationCard?.resourceCount ?? 0) : 0;
    return this.heat + (floaters * 2);
  }

  public spendHeat(amount: number, cb: () => (undefined | PlayerInput) = () => undefined) : PlayerInput | undefined {
    if (this.isCorporation(CardName.STORMCRAFT_INCORPORATED) && (this.corporationCard?.resourceCount ?? 0) > 0) {
      return (<StormCraftIncorporated> this.corporationCard).spendHeat(this, amount, cb);
    }
    this.deductResource(Resources.HEAT, amount);
    return cb();
  }

  private claimMilestone(milestone: IMilestone): SelectOption {
    return new SelectOption(milestone.name, 'Claim - ' + '('+ milestone.name + ')', () => {
      this.game.claimedMilestones.push({
        player: this,
        milestone: milestone,
      });
      this.game.defer(new SelectHowToPayDeferred(this, MILESTONE_COST, {title: 'Select how to pay for milestone'}));
      this.game.log('${0} claimed ${1} milestone', (b) => b.player(this).milestone(milestone));
      return undefined;
    });
  }

  private fundAward(award: IAward): PlayerInput {
    return new SelectOption(award.name, 'Fund - ' + '(' + award.name + ')', () => {
      this.game.defer(new SelectHowToPayDeferred(this, this.game.getAwardFundingCost(), {title: 'Select how to pay for award'}));
      this.game.fundAward(this, award);
      return undefined;
    });
  }

  private giveAwards(vpb: VictoryPointsBreakdown): void {
    this.game.fundedAwards.forEach((fundedAward) => {
      // Awards are disabled for 1 player games
      if (this.game.isSoloMode()) return;

      const players: Array<Player> = this.game.getPlayers().slice();
      players.sort(
        (p1, p2) => fundedAward.award.getScore(p2) - fundedAward.award.getScore(p1),
      );

      // We have one rank 1 player
      if (fundedAward.award.getScore(players[0]) > fundedAward.award.getScore(players[1])) {
        if (players[0].id === this.id) vpb.setVictoryPoints('awards', 5, '1st place for '+fundedAward.award.name+' award (funded by '+fundedAward.player.name+')');
        players.shift();

        if (players.length > 1) {
          // We have one rank 2 player
          if (fundedAward.award.getScore(players[0]) > fundedAward.award.getScore(players[1])) {
            if (players[0].id === this.id) vpb.setVictoryPoints('awards', 2, '2nd place for '+fundedAward.award.name+' award (funded by '+fundedAward.player.name+')');

          // We have at least two rank 2 players
          } else {
            const score = fundedAward.award.getScore(players[0]);
            while (players.length > 0 && fundedAward.award.getScore(players[0]) === score) {
              if (players[0].id === this.id) vpb.setVictoryPoints('awards', 2, '2nd place for '+fundedAward.award.name+' award (funded by '+fundedAward.player.name+')');
              players.shift();
            }
          }
        }

      // We have at least two rank 1 players
      } else {
        const score = fundedAward.award.getScore(players[0]);
        while (players.length > 0 && fundedAward.award.getScore(players[0]) === score) {
          if (players[0].id === this.id) vpb.setVictoryPoints('awards', 5, '1st place for '+fundedAward.award.name+' award (funded by '+fundedAward.player.name+')');
          players.shift();
        }
      }
    });
  }

  private endTurnOption(): PlayerInput {
    return new SelectOption('End Turn', 'End', () => {
      this.actionsTakenThisRound = 1; // Why is this statement necessary?
      this.game.log('${0} ended turn', (b) => b.player(this));
      return undefined;
    });
  }

  // Exposed for tests
  public pass(): void {
    this.game.playerHasPassed(this);
    this.lastCardPlayed = undefined;
  }

  private passOption(): PlayerInput {
    return new SelectOption('Pass for this generation', 'Pass', () => {
      this.pass();
      this.game.log('${0} passed', (b) => b.player(this));
      return undefined;
    });
  }

  public takeActionForFinalGreenery(): void {
    // Resolve any deferredAction before placing the next greenery
    // Otherwise if two tiles are placed next to Philares, only the last benefit is triggered
    // if Philares does not accept the first bonus before the second tile is down
    if (this.game.deferredActions.length > 0) {
      this.resolveFinalGreeneryDeferredActions();
      return;
    }

    if (this.game.canPlaceGreenery(this)) {
      const action: OrOptions = new OrOptions();
      action.title = 'Place any final greenery from plants';
      action.buttonLabel = 'Confirm';
      action.options.push(
        new SelectSpace(
          'Select space for greenery',
          this.game.board.getAvailableSpacesForGreenery(this), (space) => {
            // Do not raise oxygen or award TR for final greenery placements
            this.game.addGreenery(this, space.id, SpaceType.LAND, false);
            this.deductResource(Resources.PLANTS, this.plantsNeededForGreenery);

            this.takeActionForFinalGreenery();

            // Resolve Philares deferred actions
            if (this.game.deferredActions.length > 0) this.resolveFinalGreeneryDeferredActions();

            return undefined;
          },
        ),
      );
      action.options.push(
        new SelectOption('Don\'t place a greenery', 'Confirm', () => {
          this.game.playerIsDoneWithGame(this);
          return undefined;
        }),
      );
      this.setWaitingFor(action);
      return;
    }

    if (this.game.deferredActions.length > 0) {
      this.resolveFinalGreeneryDeferredActions();
    } else {
      this.game.playerIsDoneWithGame(this);
    }
  }

  private resolveFinalGreeneryDeferredActions() {
    this.game.deferredActions.runAll(() => this.takeActionForFinalGreenery());
  }

  private getPlayablePreludeCards(): Array<IProjectCard> {
    return this.preludeCardsInHand.filter((card) => card.canPlay === undefined || card.canPlay(this));
  }

  public getPlayableCards(): Array<IProjectCard> {
    const candidateCards: Array<IProjectCard> = [...this.cardsInHand];
    // Self Replicating robots check
    const card = this.playedCards.find((card) => card.name === CardName.SELF_REPLICATING_ROBOTS);
    if (card instanceof SelfReplicatingRobots) {
      for (const targetCard of card.targetCards) {
        candidateCards.push(targetCard.card);
      }
    }

    return candidateCards.filter((card) => this.canPlay(card));
  }

  public canPlay(card: IProjectCard): boolean {
    const baseCost = this.getCardCost(card);

    const canAfford = this.canAfford(
      baseCost,
      {
        steel: this.canUseSteel(card),
        titanium: this.canUseTitanium(card),
        floaters: this.canUseFloaters(card),
        microbes: this.canUseMicrobes(card),
        science: this.canUseScience(card),
        seeds: this.canUseSeeds(card),
        data: this.canUseData(card),
        reserveUnits: MoonExpansion.adjustedReserveCosts(this, card),
        tr: card.tr,
      });

    if (!canAfford) {
      return false;
    }

    return this.canPlayIgnoringCost(card);
  }

  // Verify if requirements for the card can be met, ignoring the project cost.
  // Only made public for tests.
  public canPlayIgnoringCost(card: IProjectCard): boolean {
    if (card.requirements !== undefined && !card.requirements.satisfies(this)) {
      return false;
    }
    return card.canPlay(this);
  }

  // Checks if the player can afford to pay `cost` mc (possibly replaceable with steel, titanium etc.)
  // and additionally pay the reserveUnits (no replaces here)
  public canAfford(cost: number, options?: {
    steel?: boolean,
    titanium?: boolean,
    floaters?: boolean,
    microbes?: boolean,
    science?: boolean,
    seeds?: boolean,
    data?: boolean,
    reserveUnits?: Units,
    tr?: TRSource,
  }) {
    const reserveUnits = options?.reserveUnits ?? Units.EMPTY;
    if (!this.hasUnits(reserveUnits)) {
      return false;
    }

    const redsCost = TurmoilHandler.computeTerraformRatingBump(this, options?.tr) * REDS_RULING_POLICY_COST;

    let availableMegacredits = this.megaCredits;
    if (this.canUseHeatAsMegaCredits) {
      availableMegacredits += this.heat;
      availableMegacredits -= reserveUnits.heat;
    }
    availableMegacredits -= reserveUnits.megacredits;
    availableMegacredits -= redsCost;

    if (availableMegacredits < 0) {
      return false;
    }

    if (options?.steel) availableMegacredits += (this.steel - reserveUnits.steel) * this.getSteelValue();
    if (options?.titanium) availableMegacredits += (this.titanium - reserveUnits.titanium) * this.getTitaniumValue();
    if (options?.floaters) availableMegacredits += this.getFloatersCanSpend() * 3;
    if (options?.microbes) availableMegacredits += this.getMicrobesCanSpend() * 2;
    if (options?.science) availableMegacredits += this.getSpendableScienceResources();
    if (options?.seeds) availableMegacredits += this.getSpendableSeedResources() * constants.SEED_VALUE;
    if (options?.data) availableMegacredits += this.getSpendableData() * constants.DATA_VALUE;
    return cost <= availableMegacredits;
  }

  private getStandardProjects(): Array<StandardProjectCard> {
    const gameOptions = this.game.gameOptions;
    return new GameCards(gameOptions)
      .getStandardProjects()
      .filter((card) => {
        switch (card.name) {
        // sell patents is not displayed as a card
        case CardName.SELL_PATENTS_STANDARD_PROJECT:
          return false;
        // For buffer gas, show ONLY IF in solo AND 63TR mode
        case CardName.BUFFER_GAS_STANDARD_PROJECT:
          return this.game.isSoloMode() && gameOptions.soloTR;
        case CardName.AIR_SCRAPPING_STANDARD_PROJECT:
          return gameOptions.altVenusBoard === false;
        case CardName.AIR_SCRAPPING_STANDARD_PROJECT_VARIANT:
          return gameOptions.altVenusBoard === true;
        case CardName.MOON_COLONY_STANDARD_PROJECT_V2:
        case CardName.MOON_MINE_STANDARD_PROJECT_V2:
        case CardName.MOON_ROAD_STANDARD_PROJECT_V2:
          return gameOptions.moonStandardProjectVariant === true;
        default:
          return true;
        }
      })
      .sort((a, b) => a.cost - b.cost);
  }

  // Subclassed by TestPlayer for testing.
  protected getStandardProjectOption(): SelectCard<StandardProjectCard> {
    const standardProjects: Array<StandardProjectCard> = this.getStandardProjects();

    return new SelectCard(
      'Standard projects',
      'Confirm',
      standardProjects,
      (card) => card[0].action(this),
      {enabled: standardProjects.map((card) => card.canAct(this))},
    );
  }

  /**
   * Set up a player taking their next action.
   *
   * This method indicates the avalilable actions by setting the `waitingFor` attribute of this player.
   *
   * @param {boolean} saveBeforeTakingAction when true, the game state is saved. Default is `true`. This
   * should only be false in testing and when this method is called during game deserialization. In other
   * words, don't set this value unless you know what you're doing.
   */
  // @ts-ignore saveBeforeTakingAction is unused at the moment.
  public takeAction(saveBeforeTakingAction: boolean = true): void {
    const game = this.game;

    if (game.deferredActions.length > 0) {
      game.deferredActions.runAll(() => this.takeAction());
      return;
    }

    const allOtherPlayersHavePassed = this.allOtherPlayersHavePassed();

    if (this.actionsTakenThisRound === 0 || game.gameOptions.undoOption) game.save();
    // if (saveBeforeTakingAction) game.save();

    // Prelude cards have to be played first
    if (this.preludeCardsInHand.length > 0) {
      game.phase = Phase.PRELUDES;

      // If no playable prelude card in hand, end player turn
      if (this.getPlayablePreludeCards().length === 0) {
        this.preludeCardsInHand = [];
        game.playerIsFinishedTakingActions();
        return;
      }

      this.setWaitingFor(this.playPreludeCard(), () => {
        if (this.preludeCardsInHand.length === 1) {
          this.takeAction();
        } else {
          game.playerIsFinishedTakingActions();
        }
      });
      return;
    } else {
      game.phase = Phase.ACTION;
    }

    if (game.hasPassedThisActionPhase(this) || (allOtherPlayersHavePassed === false && this.actionsTakenThisRound >= 2)) {
      this.actionsTakenThisRound = 0;
      game.playerIsFinishedTakingActions();
      return;
    }

    const corporationCard = this.corporationCard;

    // Terraforming Mars FAQ says:
    //   If for any reason you are not able to perform your mandatory first action (e.g. if
    //   all 3 Awards are claimed before starting your turn as Vitor), you can skip this and
    //   proceed with other actions instead.
    // This code just uses "must skip" instead of "can skip".
    if (this.isCorporation(CardName.VITOR) && this.game.allAwardsFunded()) {
      this.corporationInitialActionDone = true;
    }

    if (corporationCard !== undefined &&
          corporationCard.initialAction !== undefined &&
          corporationCard.initialActionText !== undefined &&
          this.corporationInitialActionDone === false
    ) {
      const initialActionOption = new SelectOption(
        {
          message: 'Take first action of ${0} corporation',
          data: [{
            type: LogMessageDataType.RAW_STRING,
            value: corporationCard.name,
          }],
        },
        corporationCard.initialActionText, () => {
          game.defer(new SimpleDeferredAction(this, () => {
            if (corporationCard.initialAction) {
              return corporationCard.initialAction(this);
            } else {
              return undefined;
            }
          }));
          this.corporationInitialActionDone = true;
          return undefined;
        },
      );
      const initialActionOrPass = new OrOptions(
        initialActionOption,
        this.passOption(),
      );
      this.setWaitingFor(initialActionOrPass, () => {
        this.incrementActionsTaken();
        this.takeAction();
      });
      return;
    }

    this.setWaitingFor(this.getActions(), () => {
      this.incrementActionsTaken();
      this.takeAction();
    });
  }

  private incrementActionsTaken(): void {
    this.actionsTakenThisRound++;
    this.actionsTakenThisGame++;
  }

  // Return possible mid-game actions like play a card and fund an award, but no play prelude card.
  public getActions() {
    const action: OrOptions = new OrOptions();
    action.title = this.actionsTakenThisRound === 0 ?
      'Take your first action' : 'Take your next action';
    action.buttonLabel = 'Take action';

    if (this.canAfford(MILESTONE_COST) && !this.game.allMilestonesClaimed()) {
      const remainingMilestones = new OrOptions();
      remainingMilestones.title = 'Claim a milestone';
      remainingMilestones.options = this.game.milestones
        .filter(
          (milestone: IMilestone) =>
            !this.game.milestoneClaimed(milestone) &&
            milestone.canClaim(this))
        .map(
          (milestone: IMilestone) =>
            this.claimMilestone(milestone));
      if (remainingMilestones.options.length >= 1) action.options.push(remainingMilestones);
    }

    // Convert Plants
    const convertPlants = new ConvertPlants();
    if (convertPlants.canAct(this)) {
      action.options.push(convertPlants.action(this));
    }

    // Convert Heat
    const convertHeat = new ConvertHeat();
    if (convertHeat.canAct(this)) {
      action.options.push(new SelectOption(`Convert ${constants.HEAT_FOR_TEMPERATURE} heat into temperature`, 'Convert heat', () => {
        return convertHeat.action(this);
      }));
    }

    TurmoilHandler.addPlayerAction(this, action.options);

    if (this.getPlayableActionCards().length > 0) {
      action.options.push(
        this.playActionCard(),
      );
    }

    if (this.getPlayableCards().length > 0) {
      action.options.push(
        this.playProjectCard(),
      );
    }

    const coloniesTradeAction = ColoniesHandler.coloniesTradeAction(this);
    if (coloniesTradeAction !== undefined) {
      action.options.push(coloniesTradeAction);
    }

    // If you can pay to add a delegate to a party.
    Turmoil.ifTurmoil(this.game, (turmoil) => {
      let sendDelegate;
      if (turmoil.lobby.has(this.id)) {
        sendDelegate = new SendDelegateToArea(this, 'Send a delegate in an area (from lobby)');
      } else if (this.isCorporation(CardName.INCITE) && this.canAfford(3) && turmoil.hasDelegatesInReserve(this.id)) {
        sendDelegate = new SendDelegateToArea(this, 'Send a delegate in an area (3 M€)', {cost: 3});
      } else if (this.canAfford(5) && turmoil.hasDelegatesInReserve(this.id)) {
        sendDelegate = new SendDelegateToArea(this, 'Send a delegate in an area (5 M€)', {cost: 5});
      }
      if (sendDelegate) {
        const input = sendDelegate.execute();
        if (input !== undefined) {
          action.options.push(input);
        }
      }
    });

    if (this.game.getPlayers().length > 1 &&
      this.actionsTakenThisRound > 0 &&
      !this.game.gameOptions.fastModeOption &&
      this.allOtherPlayersHavePassed() === false) {
      action.options.push(
        this.endTurnOption(),
      );
    }

    const fundingCost = this.game.getAwardFundingCost();
    if (this.canAfford(fundingCost) && !this.game.allAwardsFunded()) {
      const remainingAwards = new OrOptions();
      remainingAwards.title = {
        data: [{
          type: LogMessageDataType.RAW_STRING,
          value: String(fundingCost),
        }],
        message: 'Fund an award (${0} M€)',
      };
      remainingAwards.buttonLabel = 'Confirm';
      remainingAwards.options = this.game.awards
        .filter((award: IAward) => this.game.hasBeenFunded(award) === false)
        .map((award: IAward) => this.fundAward(award));
      action.options.push(remainingAwards);
    }

    action.options.push(this.getStandardProjectOption());

    action.options.push(this.passOption());

    // Sell patents
    const sellPatents = new SellPatentsStandardProject();
    if (sellPatents.canAct(this)) {
      action.options.push(sellPatents.action(this));
    }

    // Propose undo action only if you have done one action this turn
    if (this.actionsTakenThisRound > 0 && this.game.gameOptions.undoOption) {
      action.options.push(new UndoActionOption());
    }

    return action;
  }

  private allOtherPlayersHavePassed(): boolean {
    const game = this.game;
    if (game.isSoloMode()) return true;
    const players = game.getPlayers();
    const passedPlayers = game.getPassedPlayers();
    return passedPlayers.length === players.length - 1 && passedPlayers.includes(this.color) === false;
  }

  public process(input: InputResponse): void {
    if (this.waitingFor === undefined || this.waitingForCb === undefined) {
      throw new Error('Not waiting for anything');
    }
    const waitingFor = this.waitingFor;
    const waitingForCb = this.waitingForCb;
    this.waitingFor = undefined;
    this.waitingForCb = undefined;
    try {
      this.timer.stop();
      this.runInput(input, waitingFor);
      waitingForCb();
    } catch (err) {
      this.setWaitingFor(waitingFor, waitingForCb);
      throw err;
    }
  }

  public getWaitingFor(): PlayerInput | undefined {
    return this.waitingFor;
  }
  public setWaitingFor(input: PlayerInput, cb: () => void = () => {}): void {
    this.timer.start();
    this.waitingFor = input;
    this.waitingForCb = cb;
  }

  public serialize(): SerializedPlayer {
    const result: SerializedPlayer = {
      id: this.id,
      corporationCard: this.corporationCard === undefined ? undefined : {
        name: this.corporationCard.name,
        resourceCount: this.corporationCard.resourceCount,
        allTags: this.corporationCard instanceof Aridor ? Array.from(this.corporationCard.allTags) : [],
        isDisabled: this.corporationCard instanceof PharmacyUnion && this.corporationCard.isDisabled,
      },
      // Used only during set-up
      pickedCorporationCard: this.pickedCorporationCard?.name,
      // Terraforming Rating
      terraformRating: this.terraformRating,
      hasIncreasedTerraformRatingThisGeneration: this.hasIncreasedTerraformRatingThisGeneration,
      terraformRatingAtGenerationStart: this.terraformRatingAtGenerationStart,
      // Resources
      megaCredits: this.megaCredits,
      megaCreditProduction: this.megaCreditProduction,
      steel: this.steel,
      steelProduction: this.steelProduction,
      titanium: this.titanium,
      titaniumProduction: this.titaniumProduction,
      plants: this.plants,
      plantProduction: this.plantProduction,
      energy: this.energy,
      energyProduction: this.energyProduction,
      heat: this.heat,
      heatProduction: this.heatProduction,
      // Resource values
      titaniumValue: this.titaniumValue,
      steelValue: this.steelValue,
      // Helion
      canUseHeatAsMegaCredits: this.canUseHeatAsMegaCredits,
      // This generation / this round
      actionsTakenThisRound: this.actionsTakenThisRound,
      actionsThisGeneration: Array.from(this.actionsThisGeneration),
      corporationInitialActionDone: this.corporationInitialActionDone,
      // Cards
      dealtCorporationCards: this.dealtCorporationCards.map((c) => c.name),
      dealtProjectCards: this.dealtProjectCards.map((c) => c.name),
      dealtPreludeCards: this.dealtPreludeCards.map((c) => c.name),
      cardsInHand: this.cardsInHand.map((c) => c.name),
      preludeCardsInHand: this.preludeCardsInHand.map((c) => c.name),
      playedCards: this.playedCards.map(serializeProjectCard),
      draftedCards: this.draftedCards.map((c) => c.name),
      cardCost: this.cardCost,
      needsToDraft: this.needsToDraft,
      cardDiscount: this.cardDiscount,
      // Colonies
      fleetSize: this.fleetSize,
      tradesThisTurn: this.tradesThisGeneration,
      colonyTradeOffset: this.colonyTradeOffset,
      colonyTradeDiscount: this.colonyTradeDiscount,
      colonyVictoryPoints: this.colonyVictoryPoints,
      // Turmoil
      turmoilPolicyActionUsed: this.turmoilPolicyActionUsed,
      politicalAgendasActionUsedCount: this.politicalAgendasActionUsedCount,
      hasTurmoilScienceTagBonus: this.hasTurmoilScienceTagBonus,
      oceanBonus: this.oceanBonus,
      // Custom cards
      // Leavitt Station.
      scienceTagCount: this.scienceTagCount,
      // Ecoline
      plantsNeededForGreenery: this.plantsNeededForGreenery,
      // Lawsuit
      removingPlayers: this.removingPlayers,
      // Playwrights
      removedFromPlayCards: this.removedFromPlayCards.map((c) => c.name),
      name: this.name,
      color: this.color,
      beginner: this.beginner,
      handicap: this.handicap,
      timer: this.timer.serialize(),
      // Stats
      actionsTakenThisGame: this.actionsTakenThisGame,
      victoryPointsByGeneration: this.victoryPointsByGeneration,
      totalDelegatesPlaced: this.totalDelegatesPlaced,
    };

    if (this.lastCardPlayed !== undefined) {
      result.lastCardPlayed = this.lastCardPlayed;
    }
    return result;
  }

  public static deserialize(d: SerializedPlayer, game: SerializedGame): Player {
    const player = new Player(d.name, d.color, d.beginner, Number(d.handicap), d.id);
    const cardFinder = new CardFinder();

    player.actionsTakenThisGame = d.actionsTakenThisGame;
    player.actionsTakenThisRound = d.actionsTakenThisRound;
    player.canUseHeatAsMegaCredits = d.canUseHeatAsMegaCredits;
    player.cardCost = d.cardCost;
    player.cardDiscount = d.cardDiscount;
    player.colonyTradeDiscount = d.colonyTradeDiscount;
    player.colonyTradeOffset = d.colonyTradeOffset;
    player.colonyVictoryPoints = d.colonyVictoryPoints;
    player.corporationInitialActionDone = d.corporationInitialActionDone;
    player.victoryPointsByGeneration = d.victoryPointsByGeneration;
    // TODO(kberg): delete this conditional by 2022-06-01
    if (!player.victoryPointsByGeneration) {
      player.victoryPointsByGeneration = new Array(game.generation).fill(0);
    }
    player.energy = d.energy;
    player.energyProduction = d.energyProduction;
    player.fleetSize = d.fleetSize;
    player.hasIncreasedTerraformRatingThisGeneration = d.hasIncreasedTerraformRatingThisGeneration;
    player.hasTurmoilScienceTagBonus = d.hasTurmoilScienceTagBonus;
    player.heat = d.heat;
    player.heatProduction = d.heatProduction;
    player.megaCreditProduction = d.megaCreditProduction;
    player.megaCredits = d.megaCredits;
    player.needsToDraft = d.needsToDraft;
    player.oceanBonus = d.oceanBonus;
    player.plantProduction = d.plantProduction;
    player.plants = d.plants;
    player.plantsNeededForGreenery = d.plantsNeededForGreenery;
    player.removingPlayers = d.removingPlayers;
    player.scienceTagCount = d.scienceTagCount;
    player.steel = d.steel;
    player.steelProduction = d.steelProduction;
    player.steelValue = d.steelValue;
    player.terraformRating = d.terraformRating;
    player.terraformRatingAtGenerationStart = d.terraformRatingAtGenerationStart;
    player.titanium = d.titanium;
    player.titaniumProduction = d.titaniumProduction;
    player.titaniumValue = d.titaniumValue;
    player.totalDelegatesPlaced = d.totalDelegatesPlaced;
    player.tradesThisGeneration = d.tradesThisTurn;
    player.turmoilPolicyActionUsed = d.turmoilPolicyActionUsed;
    player.politicalAgendasActionUsedCount = d.politicalAgendasActionUsedCount;

    player.lastCardPlayed = d.lastCardPlayed;

    // Rebuild removed from play cards (Playwrights)
    player.removedFromPlayCards = cardFinder.cardsFromJSON(d.removedFromPlayCards);

    player.actionsThisGeneration = new Set<CardName>(d.actionsThisGeneration);

    if (d.pickedCorporationCard !== undefined) {
      player.pickedCorporationCard = cardFinder.getCorporationCardByName(d.pickedCorporationCard);
    }

    // Rebuild corporation card
    if (d.corporationCard !== undefined) {
      player.corporationCard = cardFinder.getCorporationCardByName(d.corporationCard.name);
      if (player.corporationCard !== undefined) {
        if (d.corporationCard.resourceCount !== undefined) {
          player.corporationCard.resourceCount = d.corporationCard.resourceCount;
        }
      }
      if (player.corporationCard instanceof Aridor) {
        if (d.corporationCard.allTags !== undefined) {
          player.corporationCard.allTags = new Set(d.corporationCard.allTags);
        } else {
          console.warn('did not find allTags for ARIDOR');
        }
      }
      if (player.corporationCard instanceof PharmacyUnion) {
        player.corporationCard.isDisabled = Boolean(d.corporationCard.isDisabled);
      }
    } else {
      player.corporationCard = undefined;
    }

    player.dealtCorporationCards = cardFinder.corporationCardsFromJSON(d.dealtCorporationCards);
    player.dealtPreludeCards = cardFinder.cardsFromJSON(d.dealtPreludeCards);
    player.dealtProjectCards = cardFinder.cardsFromJSON(d.dealtProjectCards);
    player.cardsInHand = cardFinder.cardsFromJSON(d.cardsInHand);
    player.preludeCardsInHand = cardFinder.cardsFromJSON(d.preludeCardsInHand);
    player.playedCards = d.playedCards.map((element: SerializedCard) => deserializeProjectCard(element, cardFinder));
    player.draftedCards = cardFinder.cardsFromJSON(d.draftedCards);

    player.timer = Timer.deserialize(d.timer);

    return player;
  }

  public getFleetSize(): number {
    return this.fleetSize;
  }

  public increaseFleetSize(): void {
    if (this.fleetSize < MAX_FLEET_SIZE) this.fleetSize++;
  }

  public decreaseFleetSize(): void {
    if (this.fleetSize > 0) this.fleetSize--;
  }

  public hasAvailableColonyTileToBuildOn(allowDuplicate: boolean = false): boolean {
    if (this.game.gameOptions.coloniesExtension === false) return false;

    const availableColonyTiles = this.game.colonies.filter((colony) => colony.isActive);
    let unavailableColonies: number = 0;

    availableColonyTiles.forEach((colony) => {
      if (colony.colonies.length === constants.MAX_COLONIES_PER_TILE) {
        unavailableColonies++;
      } else if (!allowDuplicate && colony.colonies.includes(this.id)) {
        unavailableColonies++;
      }
    });

    return unavailableColonies < availableColonyTiles.length;
  }

  /* Shorthand for deferring things */
  public defer(input: PlayerInput | undefined, priority: Priority = Priority.DEFAULT): void {
    if (input === undefined) return;
    const action = new SimpleDeferredAction(this, () => input, priority);
    this.game.defer(action);
  }
}
