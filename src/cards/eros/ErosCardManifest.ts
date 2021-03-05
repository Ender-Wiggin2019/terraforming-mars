import { CardName } from "../../CardName";
import { GameModule } from "../../GameModule";
import { CardManifest } from "../CardManifest";
import { IdoFront } from "./IdoFront";
import { SisterPlanetSponsors } from "./SisterPlanetSponsors";
import { SolarCosmicRays } from "./SolarCosmicRays";
import { UrgentTerraformingCommand } from "./UrgentTerraformingCommand";
import { InterplanetaryAlliance } from "./InterplanetaryAlliance";
import { NitrogenRichComet } from "./NitrogenRichComet";
// import { CosmosLibrary } from "./CosmosLibrary";
// import { EarthCivilCourt } from "./EarthCivilCourt";
// import { MolecularDetachmentDevice } from "./MolecularDetachmentDevice";
// import { NanoBots } from "./Nanobot";
// import { UnmannedAerialVehicle } from "./UnmannedAerialVehicle";
// import { CuttingEdgeLab } from "./CuttingEdgeLab";
// import { WasteIncinerator } from "./WasteIncinerator";
import { RespirationEnhance } from "./RespirationEnhance";
import { HydrothermalVentArchaea } from "./HydrothermalVentArchaea";
import { ElectricSheep } from "./ElectricSheep";
import { Ansible } from "./Ansible";
import { MarsHotSpring } from "./MarsHotSpring";
import { CloneTechnology } from "./CloneTechnology";
import { LargeEcologicalReserve } from "./LargeEcologicalReserve";
import { EnergySupply } from "./EnergySupply";
import { Chaos } from "./Chaos";
import { Cow } from "./Cow";
import { StarcorePlunder } from "./StarcorePlunder";
import { JovianExpedition } from "./JovianExpedition";


export const EROS_CARD_MANIFEST = new CardManifest({
    module: GameModule.Eros,
    projectCards: [
        // { cardName: CardName.COSMOS_LIBRARY, Factory: CosmosLibrary },
        // { cardName: CardName.EARTH_CIVIL_COURT, Factory: EarthCivilCourt },
        // { cardName: CardName.NANO_BOTS, Factory: NanoBots },
        // { cardName: CardName.MOLECULAR_DETATACHMENT_DEVICE, Factory: MolecularDetachmentDevice },
        // { cardName: CardName.WASTE_INCINERATOR, Factory: WasteIncinerator },
        // { cardName: CardName.CUTTING_EDGE_LAB, Factory: CuttingEdgeLab },
        { cardName: CardName.SISTER_PLANET_SPONSORS, Factory: SisterPlanetSponsors },
        { cardName: CardName.SOLAR_COSMIC_RAYS, Factory: SolarCosmicRays },
        { cardName: CardName.URGENT_TERRAFORMING_COMMAND, Factory: UrgentTerraformingCommand },
        { cardName: CardName.INTERPLANETARY_ALLIANCE, Factory: InterplanetaryAlliance },
        { cardName: CardName.NITROGENRICH_COMET, Factory: NitrogenRichComet },
        { cardName: CardName.RESPIRATION_ENHANCE , Factory: RespirationEnhance },
        { cardName: CardName.HYDROTHERMAL_VENT_ARCHAEA , Factory: HydrothermalVentArchaea },
        { cardName: CardName.ELECTRIC_SHEEP , Factory: ElectricSheep },
        { cardName: CardName.ANSIBLE , Factory: Ansible },
        { cardName: CardName.MARS_HOT_SPRING , Factory: MarsHotSpring },
        { cardName: CardName.LARGE_ECOLOGICAL_RESERVE , Factory: LargeEcologicalReserve },
        { cardName: CardName.CLONE_TECHNOLOGY , Factory: CloneTechnology },
        { cardName: CardName.ENERGY_SUPPLY , Factory: EnergySupply },
        { cardName: CardName.COW , Factory: Cow },
        { cardName: CardName.STARCORE_PLUNDER , Factory: StarcorePlunder },
        { cardName: CardName.JOVIAN_EXPEDITION , Factory: JovianExpedition },
        
    ],
    corporationCards: [
        { cardName: CardName.IDO_FRONT, Factory: IdoFront },
        { cardName: CardName.CHAOS, Factory: Chaos },
    ],
    preludeCards: [
    ],

});
