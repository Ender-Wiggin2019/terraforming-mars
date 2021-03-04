import {ICard} from '../ICard';
import {Player} from '../../Player';
import {PlayerInput} from '../../PlayerInput';
import {OrOptions} from '../../inputs/OrOptions';
import { Game } from '../../Game';
import { ResourceType } from '../../ResourceType';

export interface CorporationCard extends ICard {
    initialActionText?: string;
    initialAction?: (player: Player) => PlayerInput | undefined;
    startingMegaCredits: number;
    cardCost?: number;
    onCorpCardPlayed?: (
        player: Player,
        card: CorporationCard
    ) => OrOptions | void;
    resourceType?: ResourceType;
    onProductionPhase?: (player: Player, game: Game) => undefined;
    isDisabled?: boolean;
}
