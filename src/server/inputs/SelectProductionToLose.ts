import {Message} from '../../common/logs/Message';
import {BasePlayerInput, PlayerInput} from '../PlayerInput';
import {PlayerInputType} from '../../common/input/PlayerInputType';
import {Player} from '../Player';
import {Units} from '../../common/Units';
import {InputResponse, isSelectProductionToLoseResponse} from '../../common/inputs/InputResponse';
import {sum} from '../../common/utils/utils';

export class SelectProductionToLose extends BasePlayerInput {
  constructor(
    title: string | Message,
    public unitsToLose: number,
    public player: Player,
    public cb: (units: Units) => PlayerInput | undefined,
    buttonLabel: string = 'Save',
  ) {
    super(PlayerInputType.SELECT_PRODUCTION_TO_LOSE, title);
    this.buttonLabel = buttonLabel;
  }

  // TODO(kberg): Coul dmerge this with SelectResources, though it
  // would take some work.
  public process(input: InputResponse, player: Player) {
    if (!isSelectProductionToLoseResponse(input)) {
      throw new Error('Not a valid SelectProductionToLoseResponse');
    }
    if (!Units.isUnits(input.units)) {
      throw new Error('not a units object');
    }
    const array = Object.values(input.units);
    if (array.some((count) => count < 0)) {
      throw new Error('All units must be positive');
    }
    if (!player.production.canAdjust(Units.negative(input.units))) {
      throw new Error('You do not have those units');
    }
    if (sum(array) !== this.unitsToLose) {
      throw new Error(`Select ${this.unitsToLose} steps of production.`);
    }
    this.cb(input.units);
    return undefined;
  }
}
