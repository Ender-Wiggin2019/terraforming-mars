import {CardName} from '../../../common/cards/CardName';
import {ModuleManifest} from '../ModuleManifest';
import {GlobalEventName} from '../../../common/turmoil/globalEvents/GlobalEventName';

import {AerospaceMission} from './AerospaceMission';
import {AgricolaInc} from './AgricolaInc';
import {ByElection} from './ByElection';
import {CuriosityII} from './CuriosityII';
import {ExecutiveOrder} from './ExecutiveOrder';
import {Incite} from './Incite';
import {JunkVentures} from './JunkVentures';
import {LeadershipSummit} from './LeadershipSummit';
import {Midas} from './Midas';
import {Playwrights} from './Playwrights';
import {PoliticalUprising} from './PoliticalUprising';
import {ProjectWorkshop} from './ProjectWorkshop';
import {SpecialDesignProxy} from './SpecialDesignProxy';
import {TradeAdvance} from './TradeAdvance';
import {ColonialOne} from './ColonialOne';
import {Hotsprings} from './Hotsprings';
import {Aristarchus} from './Aristarchus';
import {LabourUnion} from './LabourUnion';
import {UnitedNationsMissionOne} from './UnitedNationsMissionOne';
import {AccumulatedKnowledge} from './AccumulatedKnowledge';
import {NitrateReducers} from './NitrateReducers';
// import {VitalColony} from './VitalColony';
import {ResearchGrant} from './ResearchGrant';
// import {VenusFirst} from './VenusFirst';
import {ValuableGases} from './ValuableGases';
import {WeylandYutani} from './WeylandYutani';
import {ShinraTech} from './ShinraTech';
import {Tyrell} from './Tyrell';
import {MiningCorp} from './MiningCorp';
import {ScolexIndustries} from './ScolexIndustries';
import {Protogen} from './Protogen';
import {IntegratedMicroorganisms} from './IntegratedMicroorganisms';
import {BuyNLarge} from './BuyNLarge';
import {Rda} from './Rda';
import {ArkNova} from './ArkNova';
import {Thermopoli} from './Thermopoli';
import {EliteTech} from './EliteTech';
import {SolarPlant} from './SolarPlant';
import {PoliticalReform} from './PoliticalReform';

export const COMMUNITY_CARD_MANIFEST = new ModuleManifest({
  module: 'community',
  corporationCards: {
    [CardName.AGRICOLA_INC]: {Factory: AgricolaInc},
    [CardName.PROJECT_WORKSHOP]: {Factory: ProjectWorkshop},
    [CardName.INCITE]: {Factory: Incite, compatibility: 'turmoil'},
    [CardName.PLAYWRIGHTS]: {Factory: Playwrights},
    [CardName.CURIOSITY_II]: {Factory: CuriosityII},
    [CardName.MIDAS]: {Factory: Midas},
    [CardName.COLONIAL_ONE]: {Factory: ColonialOne, compatibility: 'colonies'},
    [CardName.HOTSPRINGS]: {Factory: Hotsprings},
    [CardName.JUNK_VENTURES]: {Factory: JunkVentures},
    [CardName.ARISTARCHUS]: {Factory: Aristarchus},
    [CardName.LABOUR_UNION]: {Factory: LabourUnion},
    [CardName.UNITED_NATIONS_MISSION_ONE]: {Factory: UnitedNationsMissionOne},
    [CardName.WEYLAND_YUTANI]: {Factory: WeylandYutani}, // XB1
    [CardName.SHINRA_TECH]: {Factory: ShinraTech}, // XB2
    [CardName.TYRELL]: {Factory: Tyrell}, // XB3
    [CardName.MINING_CORP]: {Factory: MiningCorp}, // XB4
    [CardName.SCOLEX_INDUSTRIES]: {Factory: ScolexIndustries}, // XB5
    [CardName.PROTOGEN]: {Factory: Protogen}, // XB6
    [CardName.INTEGRATED_MICROORGANISMS]: {Factory: IntegratedMicroorganisms}, // XB7
    [CardName.BUY_N_LARGE]: {Factory: BuyNLarge}, // XB8
    [CardName.RDA]: {Factory: Rda}, // XB9
    [CardName.ARK_NOVA]: {Factory: ArkNova}, // XB10
    // [ CardName.CITY_GREENHOUSE]:{Factory: CityGreenhouse}, // 雪宝这公司没人玩，注释了
    [CardName.THERMOPOLI]: {Factory: Thermopoli}, // XB12
    [CardName.ELITETECH]: {Factory: EliteTech}, // XB13
    [CardName.SOLARPLANT]: {Factory: SolarPlant}, // XB14
    [CardName.POLITICALREFORM]: {Factory: PoliticalReform}, // XB15
  },
  preludeCards: {
    // 粉丝扩的部分前序跟pf扩重合 先注释
    // {
    //   cardName: CardName.VITAL_COLONY,
    //   Factory: VitalColony,
    //   compatibility: 'colonies',
    // },
    [CardName.RESEARCH_GRANT]: {Factory: ResearchGrant},
    [CardName.VALUABLE_GASES]: {Factory: ValuableGases, compatibility: 'venus'},
    [CardName.AEROSPACE_MISSION]: {Factory: AerospaceMission, compatibility: 'colonies'},
    [CardName.TRADE_ADVANCE]: {Factory: TradeAdvance, compatibility: 'colonies'},
    [CardName.POLITICAL_UPRISING]: {Factory: PoliticalUprising, compatibility: 'turmoil'},
    [CardName.BY_ELECTION]: {Factory: ByElection, compatibility: 'turmoil'},
    [CardName.EXECUTIVE_ORDER]: {Factory: ExecutiveOrder, compatibility: 'turmoil'},
    [CardName.ACCUMULATED_KNOWLEDGE]: {Factory: AccumulatedKnowledge},
    [CardName.NITRATE_REDUCERS]: {Factory: NitrateReducers, compatibility: 'venus'},
  },
  projectCards: {
    [CardName.SPECIAL_DESIGN_PROXY]: {Factory: SpecialDesignProxy, instantiate: false},
  },
  globalEvents: {
    [GlobalEventName.LEADERSHIP_SUMMIT]: {Factory: LeadershipSummit},
  },
});
