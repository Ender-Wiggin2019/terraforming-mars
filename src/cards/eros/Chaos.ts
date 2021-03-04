import {CorporationCard} from '../corporation/CorporationCard';
import {Player} from '../../Player';
import {CardName} from '../../CardName';
import {CardType} from '../CardType';
import {CardMetadata} from '../CardMetadata';
import {CardRenderer} from '../render/CardRenderer';
import {CardRenderItemSize} from '../render/CardRenderItemSize';
import { Game } from '../../Game';
import { SelectAmount } from '../../inputs/SelectAmount';
import { ITagCount } from '../../ITagCount';
import { AndOptions } from '../../inputs/AndOptions';
import { DeferredAction } from '../../deferredActions/DeferredAction';
import { Tags } from '../Tags';

export class Chaos implements CorporationCard{
    public name = CardName.CHAOS;
    public tags = [];
    public startingMegaCredits: number = 42;
    public cardType = CardType.CORPORATION;

    public play() {
      return undefined;
    }

    public onProductionPhase(player: Player, game: Game) {
      let bonus: number = 0;
      const playerTags : ITagCount[] = player.getAllTags();

      playerTags.forEach((tag) => {
        const tagData = playerTags.find((data) => data.tag === tag.tag && data.tag !== Tags.WILDCARD);
        let players = [...game.getPlayers()].sort(
            (p1, p2) => p2.getTagCount(tag.tag, false, false) - p1.getTagCount(tag.tag, false, false)
        );
        if (tagData === undefined) bonus += 0;
        else if (players[0].corporationCard!= undefined && players[0].corporationCard === this && players[0].getTagCount(tag.tag, false, false) > players[1].getTagCount(tag.tag, false, false) && tagData.count >= 1) {
            bonus += 1;
            console.log(tag.tag)
        }
        return undefined;
        
      });
      if (bonus > 0) {
        this.selectResources(player, game, bonus);
      }
      return undefined;
    }

    private selectResources(player: Player, game: Game, resourceCount: number) {
        let megacreditsAmount: number = 0;
        let steelAmount: number = 0;
        let titaniumAmount: number = 0;
        let plantsAmount: number = 0;
        let energyAmount: number = 0;
        let heatAmount: number = 0;
        const selectMegacredit = new SelectAmount('Megacredits', 'Select', (amount: number) => {
          megacreditsAmount = amount;
          return undefined;
        }, 0, resourceCount);
        const selectSteel = new SelectAmount('Steel', 'Select', (amount: number) => {
          steelAmount = amount;
          return undefined;
        }, 0, resourceCount);
        const selectTitanium = new SelectAmount('Titanium', 'Select', (amount: number) => {
          titaniumAmount = amount;
          return undefined;
        }, 0, resourceCount);
        const selectPlants = new SelectAmount('Plants', 'Select', (amount: number) => {
          plantsAmount = amount;
          return undefined;
        }, 0, resourceCount);
        const selectEnergy = new SelectAmount('Energy', 'Select', (amount: number) => {
          energyAmount = amount;
          return undefined;
        }, 0, resourceCount);
        const selectHeat = new SelectAmount('Heat', 'Select', (amount: number) => {
          heatAmount = amount;
          return undefined;
        }, 0, resourceCount);
        const selectResources = new AndOptions(
          () => {
            const selectedResources = megacreditsAmount +
                  steelAmount +
                  titaniumAmount +
                  plantsAmount +
                  energyAmount +
                  heatAmount;
            if ( selectedResources > resourceCount || selectedResources < resourceCount) {
              throw new Error('Need to select ' + resourceCount + ' resource(s)');
            }
            player.megaCredits += megacreditsAmount;
            player.steel += steelAmount;
            player.titanium += titaniumAmount;
            player.plants += plantsAmount;
            player.energy += energyAmount;
            player.heat += heatAmount;
            return undefined;
          }, selectMegacredit, selectSteel, selectTitanium, selectPlants, selectEnergy, selectHeat);
        selectResources.title = 'Chaos effect: select ' + resourceCount + ' resource(s)';
        game.defer(new DeferredAction(
          player,
          () => selectResources,
        ));
      }

    public metadata: CardMetadata = {
        cardNumber: 'Q21',
        renderData: CardRenderer.builder((b) => {
            b.br;
            b.megacredits(42);
            b.text('(You start with 42 MC.)', CardRenderItemSize.TINY, false, false);
            b.corpBox('effect', (ce) => {
                ce.effect(undefined,(eb) => {
                    ce.vSpace(CardRenderItemSize.LARGE);
                    eb.production((pb) => pb.wild(1)).startEffect.wild(1).played.asterix();
                });
                ce.vSpace();
                ce.effect('Effect: When perform an action, each of your highest production can provide a wild tag; When producing, each of your highest tag number can provide a standard resource.',(eb) => {
                    eb.diverseTag(1).startEffect.wild(1).asterix();
                });
            });
        }),
    }
}
