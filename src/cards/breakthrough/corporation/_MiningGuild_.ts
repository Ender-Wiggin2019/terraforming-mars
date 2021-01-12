import {Tags} from '../../Tags';
import {Player} from '../../../Player';
import {CorporationCard} from '../../corporation/CorporationCard';
import {ISpace} from '../../../boards/ISpace';
import {SpaceBonus} from '../../../SpaceBonus';
import {Resources} from '../../../Resources';
import {CardName} from '../../../CardName';
import {CardType} from '../../CardType';
import {CardMetadata} from '../../CardMetadata';
import {CardRenderer} from '../../render/CardRenderer';
import { CardRenderItemSize } from '../../render/CardRenderItemSize';

export class _MiningGuild_ implements CorporationCard {
    public name: CardName = CardName._MINING_GUILD_;
    public tags: Array<Tags> = [Tags.BUILDING, Tags.BUILDING];
    public startingMegaCredits: number = 30;
    public cardType: CardType = CardType.CORPORATION;

    public onTilePlaced(player: Player, space: ISpace) {
      if (
        player.isCorporation(this.name) &&
            space.player === player &&
            (space.bonus.indexOf(SpaceBonus.STEEL) !== -1 || space.bonus.indexOf(SpaceBonus.TITANIUM) !== -1)) {
        player.addProduction(Resources.STEEL);
      }
    }
    public play(player: Player) {
      player.steel = 5;
      player.addProduction(Resources.STEEL);
      return undefined;
    }
    public metadata: CardMetadata = {
      cardNumber: 'B02',
      // description: 'You start with 30 MC, 5 steel and 1 steel production.',
      renderData: CardRenderer.builder((b) => {
        b.megacredits(30).steel(5).digit.nbsp.productionBox((pb) => pb.steel(1));
        b.text('(You start with 30 MC, 5 steel and 1 steel production.)', CardRenderItemSize.TINY, false, false);
        b.corpBox('effect', (ce) => {
          ce.effectBox((eb) => {
            ce.vSpace(CardRenderItemSize.LARGE);
            eb.steel(1).slash().titanium(1).startEffect.productionBox((pb) => pb.steel(1));
            eb.description(undefined);
          });
          ce.effectBox((eb) => {
            eb.steel(4).digit.startAction.trade().city(CardRenderItemSize.SMALL).steel(1).brackets;
            eb.description('Effect: Each time you get steel/titanium as placement bonus, increase 1 steel prod.You can use 4 steel to trade or pay for city standard project.)');
          });
        });
      }),
    }
}

// public metadata: CardMetadata = {
//   cardNumber: 'R39',
//   renderData: CardRenderer.builder((b) => {
//     b.megacredits(54).cards(1).secondaryTag(Tags.SCIENCE);
//     // blank space after MC is on purpose
//     b.text('(You start with 54 MC . When this corporation is revealed, draw a Science card.)', CardRenderItemSize.TINY, false, false);
//     b.corpBox('effect', (ce) => {
//       ce.vSpace(CardRenderItemSize.LARGE);
//       ce.effectBox((eb) => {
//         eb.microbes(1).any.played.startEffect.disease().megacredits(-4);
//         eb.description(undefined);
//       });
//       ce.vSpace();
//       ce.effectBox((eb) => {
//         eb.science(1).played.startEffect.minus().disease();
//         eb.tr(1, CardRenderItemSize.SMALL).slash().tr(3, CardRenderItemSize.SMALL).digit;
//         eb.description('Effect: When ANY microbe tag is played, add a disease here and lose 4 MC. When you play a science tag, remove a disease here and gain 1 TR OR if there are no diseases here, you may turn this card face down to gain 3 TR');
//       });
//     });
//   }),