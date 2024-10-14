import {CardName} from '../common/cards/CardName';
import {Color} from '../common/Color';
import {SerializedCard} from './SerializedCard';
import {SerializedTimer} from '../common/SerializedTimer';
import {PlayerId} from '../common/Types';
import {UnderworldPlayerData} from './underworld/UnderworldData';

export interface SerializedPlayerId {
    id: PlayerId;
}
export interface SerializedGameId {
    id: string;
}
interface DeprecatedFields {
    tradesThisTurn?: number; // TODO(kberg): Remove tradesThisTurn after 2023-06-01
}

export interface SerializedPlayer extends DeprecatedFields{
    actionsTakenThisGame: number;
    actionsTakenThisRound: number;
    actionsThisGeneration: Array<CardName>;
    beginner: boolean;
    canUseCorruptionAsMegacredits: boolean;
    canUseHeatAsMegaCredits: boolean;
    canUseTitaniumAsMegacredits: boolean;
    canUsePlantsAsMegacredits: boolean;
    cardCost: number;
    cardDiscount: number;
    cardsInHand: Array<SerializedCard>;
    colonyTradeDiscount: number;
    colonyTradeOffset: number;
    colonyVictoryPoints: number;
    color: Color;
    // corporationCard:ICorporationCard | undefined;
    corporations: Array<SerializedCard>;
    corpCard?: SerializedCard | undefined; // 已换成corporations
    corpCard2?: SerializedCard | undefined; // 已换成corporations
    corpInitialActionDone?: boolean, // 已换成pendingInitialActions
    corp2InitialActionDone?: boolean, // 已换成pendingInitialActions
    dealtCorporationCards: Array<SerializedCard>;
    dealtCeoCards: Array<CardName>;
    dealtPreludeCards: Array<SerializedCard>;
    dealtProjectCards: Array<SerializedCard>;
    draftedCards: Array<SerializedCard>;
    energy: number;
    energyProduction: number;
    fleetSize: number;
    handicap: number;
    hasIncreasedTerraformRatingThisGeneration: boolean;
    hasTurmoilScienceTagBonus: boolean;
    heat: number;
    heatProduction: number;
    heatProductionStepsIncreasedThisGeneration: number;
    id: PlayerId;
    lastCardPlayed?: CardName;
    ceoCardsInHand: Array<CardName>;
    megaCreditProduction: number;
    megaCredits: number;
    name: string;
    oceanBonus: number;
    pendingInitialActions: Array<CardName> | undefined;
    pickedCorporationCard: SerializedCard | undefined;
    pickedCorporationCard2?: SerializedCard | undefined;
    plantProduction: number;
    plants: number;
    plantsNeededForGreenery: number;
    playedCards: Array<SerializedCard>;
    politicalAgendasActionUsedCount: number;
    preludeCardsInHand: Array<SerializedCard>;
    removedFromPlayCards: Array<SerializedCard>;
    removingPlayers: Array<string>;
    scienceTagCount: number;
    steel: number;
    steelProduction: number;
    steelValue: number;
    terraformRating: number;
    timer: SerializedTimer;
    titanium: number;
    titaniumProduction: number;
    titaniumValue: number;
    totalDelegatesPlaced: number;
    tradesThisGeneration: number;
    turmoilPolicyActionUsed: boolean;
    underworldData: UnderworldPlayerData;
    victoryPointsByGeneration: Array<number>;
    heatForTemperature: number;
    undoing : boolean ;
    exited : boolean ;// 是否体退
    canExit : boolean ;// 能否体退： 行动阶段、当前行动玩家、没有未执行的拦截器

    _game:SerializedGameId;
    userId?:string;
}
