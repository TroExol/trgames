import _ from 'lodash';

import type { Room } from '@/games/cryptoz/entities/Rooms/Room';

import { VoraciousWebweaver } from '@/games/cryptoz/entities/Cards/customCards/VoraciousWebweaver';
import { ToxicBonechewer } from '@/games/cryptoz/entities/Cards/customCards/ToxicBonechewer';
import { TaintedWarrior } from '@/games/cryptoz/entities/Cards/customCards/TaintedWarrior';
import { StygianDemonWarlock } from '@/games/cryptoz/entities/Cards/customCards/StygianDemonWarlock';
import { SporesOfOblivion } from '@/games/cryptoz/entities/Cards/customCards/SporesOfOblivion';
import { SoulPunisher } from '@/games/cryptoz/entities/Cards/customCards/SoulPunisher';
import { SoulfireAltar } from '@/games/cryptoz/entities/Cards/customCards/SoulfireAltar';
import { SorceressOfAgony } from '@/games/cryptoz/entities/Cards/customCards/SorceressOfAgony';
import { SmolderingPlague } from '@/games/cryptoz/entities/Cards/customCards/SmolderingPlague';
import { SmolderingEnd } from '@/games/cryptoz/entities/Cards/customCards/SmolderingEnd';
import { SistersOfShadows } from '@/games/cryptoz/entities/Cards/customCards/SistersOfShadows';
import { SignOfOblivion } from '@/games/cryptoz/entities/Cards/customCards/SignOfOblivion';
import { RulerOfNothingness } from '@/games/cryptoz/entities/Cards/customCards/RulerOfNothingness';
import { RatMarauders } from '@/games/cryptoz/entities/Cards/customCards/RatMarauders';
import { ProfessorOfDoom } from '@/games/cryptoz/entities/Cards/customCards/ProfessorOfDoom';
import { OblivionChalice } from '@/games/cryptoz/entities/Cards/customCards/OblivionChalice';
import { Noctullos } from '@/games/cryptoz/entities/Cards/customCards/Noctullos';
import { NightmareCollector } from '@/games/cryptoz/entities/Cards/customCards/NightmareCollector';
import { MrShadowcat } from '@/games/cryptoz/entities/Cards/customCards/MrShadowcat';
import { KnightOfRot } from '@/games/cryptoz/entities/Cards/customCards/KnightOfRot';
import { HorrorMauler } from '@/games/cryptoz/entities/Cards/customCards/HorrorMauler';
import { FruitPredator } from '@/games/cryptoz/entities/Cards/customCards/FruitPredator';
import { FruitCaster } from '@/games/cryptoz/entities/Cards/customCards/FruitCaster';
import { FleshChimera } from '@/games/cryptoz/entities/Cards/customCards/FleshChimera';
import { DungeonOfWailingShadows } from '@/games/cryptoz/entities/Cards/customCards/DungeonOfWailingShadows';
import { DreadOneEyedWarrior } from '@/games/cryptoz/entities/Cards/customCards/DreadOneEyedWarrior';
import { DancingPhantoms } from '@/games/cryptoz/entities/Cards/customCards/DancingPhantoms';
import { CatacombsOfDarkness } from '@/games/cryptoz/entities/Cards/customCards/CatacombsOfDarkness';
import { CastleOfEnigmaticDesires } from '@/games/cryptoz/entities/Cards/customCards/CastleOfEnigmaticDesires';
import { BoneTyrant } from '@/games/cryptoz/entities/Cards/customCards/BoneTyrant';
import { BonePatriarch } from '@/games/cryptoz/entities/Cards/customCards/BonePatriarch';
import { ArtifactsOfFortune } from '@/games/cryptoz/entities/Cards/customCards/ArtifactsOfFortune';
import { AltarOfTheTwoFaced } from '@/games/cryptoz/entities/Cards/customCards/AltarOfTheTwoFaced';

import { WyrmGemOfPower } from './customCards/WyrmGemOfPower';
import { WizardsChildren } from './customCards/WizardsChildren';
import { WhisperingEdge } from './customCards/WhisperingEdge';
import { WaveOfFrenzy } from './customCards/WaveOfFrenzy';
import { VoidJester } from './customCards/VoidJester';
import { VileSatchel } from './customCards/VileSatchel';
import { TouchOfMist } from './customCards/TouchOfMist';
import { StenchCloud } from './customCards/StenchCloud';
import { SpectralGrasp } from './customCards/SpectralGrasp';
import { ShadowManipulator } from './customCards/ShadowManipulator';
import { RotzillaScourgeOfThePlains } from './customCards/RotzillaScourgeOfThePlains';
import { Rootshade } from './customCards/Rootshade';
import { RedHotBlacksmith } from './customCards/RedHotBlacksmith';
import { PrisonerOfDarkness } from './customCards/PrisonerOfDarkness';
import { PrinceOfDecay } from './customCards/PrinceOfDecay';
import { PoisonousComet } from './customCards/PoisonousComet';
import { PawOfFate } from './customCards/PawOfFate';
import { Oblivion } from './customCards/Oblivion';
import { NecroticWreath } from './customCards/NecroticWreath';
import { MistEater } from './customCards/MistEater';
import { MiriannaMoonEchoes } from './customCards/MiriannaMoonEchoes';
import { MightyFist } from './customCards/MightyFist';
import { LuckyTurn } from './customCards/LuckyTurn';
import { LuciferKingOfDebauchery } from './customCards/LuciferKingOfDebauchery';
import { IronVoice } from './customCards/IronVoice';
import { GrimCleaver } from './customCards/GrimCleaver';
import { GremlinHorde } from './customCards/GremlinHorde';
import { GreatSkeleton } from './customCards/GreatSkeleton';
import { GhostlyVengeance } from './customCards/GhostlyVengeance';
import { FortuneSpawn } from './customCards/FortuneSpawn';
import { ForgottenQueens } from './customCards/ForgottenQueens';
import { FlamingKeeperOfTheGlens } from './customCards/FlamingKeeperOfTheGlens';
import { FlameWraith } from './customCards/FlameWraith';
import { DuskGrizzlyd } from './customCards/DuskGrizzlyd';
import { Discharge } from './customCards/Discharge';
import { DecaySpawn } from './customCards/DecaySpawn';
import { DarknessShard } from './customCards/DarknessShard';
import { DarknessMadness } from './customCards/DarknessMadness';
import { CursedSeal } from './customCards/CursedSeal';
import { Cultism } from './customCards/Cultism';
import { CrushingJaws } from './customCards/CrushingJaws';
import { CorruptedBranch } from './customCards/CorruptedBranch';
import { CollectorOfSilentWaves } from './customCards/CollectorOfSilentWaves';
import { ChroniclerOfWhirls } from './customCards/ChroniclerOfWhirls';
import { ChaosZ } from './customCards/ChaosZ';
import { ChaosY } from './customCards/ChaosY';
import { ChaosX } from './customCards/ChaosX';
import { ChaosW } from './customCards/ChaosW';
import { ChaosV } from './customCards/ChaosV';
import { ChaosU } from './customCards/ChaosU';
import { ChaosT } from './customCards/ChaosT';
import { ChaosS } from './customCards/ChaosS';
import { ChaosR } from './customCards/ChaosR';
import { ChaosQ } from './customCards/ChaosQ';
import { ChaosP } from './customCards/ChaosP';
import { ChaosO } from './customCards/ChaosO';
import { ChaosN } from './customCards/ChaosN';
import { ChaosM } from './customCards/ChaosM';
import { ChaosL } from './customCards/ChaosL';
import { ChaosK } from './customCards/ChaosK';
import { ChaosJ } from './customCards/ChaosJ';
import { ChaosI } from './customCards/ChaosI';
import { ChaosH } from './customCards/ChaosH';
import { ChaosG } from './customCards/ChaosG';
import { ChaosF } from './customCards/ChaosF';
import { ChaosE } from './customCards/ChaosE';
import { ChaosD } from './customCards/ChaosD';
import { ChaosC } from './customCards/ChaosC';
import { ChaosB } from './customCards/ChaosB';
import { BottomlessVoid } from './customCards/BottomlessVoid';
import { BloodyRift } from './customCards/BloodyRift';
import { BlightedInfestation } from './customCards/BlightedInfestation';
import { BeastFury } from './customCards/BeastFury';
import { BaronRattinghamOfTenebria } from './customCards/BaronRattinghamOfTenebria';
import { BanishTheCorruption } from './customCards/BanishTheCorruption';
import { AstridisLightweaver } from './customCards/AstridisLightweaver';
import { ArtOfTheDead } from './customCards/ArtOfTheDead';
import { ArchitectOfIllusoryNets } from './customCards/ArchitectOfIllusoryNets';
import { AbyssalConsciousness } from './customCards/AbyssalConsciousness';
// Chaos cards
import { ChaosA } from './customCards/ChaosA';
import { CardGroup, ECardGroupType } from './CardGroup';

export const getInitialPlayerDeck = (room?: Room, nickname?: string): CardGroup<ECardGroupType.DECK> => {
  const cards = new CardGroup(ECardGroupType.DECK);
  _.times(6, () => {
    const darknessShard = new DarknessShard(room);
    darknessShard.changeOwner(nickname);
    cards.addCardToBottom(darknessShard);
  });
  _.times(3, () => {
    const oblivion = new Oblivion(room);
    oblivion.changeOwner(nickname);
    cards.addCardToBottom(oblivion);
  });
  const discharge = new Discharge(room);
  discharge.changeOwner(nickname);
  cards.addCardToBottom(discharge);
  cards.shuffle();
  return cards;
};

export const getInitialCardMasterDeck = (room?: Room): CardGroup<ECardGroupType.MASTER_DECK> => {
  const cards = new CardGroup(ECardGroupType.MASTER_DECK);

  // Creatures
  cards.addCardToBottom(new FruitPredator(room));
  cards.addCardToBottom(new HorrorMauler(room));
  cards.addCardToBottom(new Noctullos(room));
  _.times(2, () => cards.addCardToBottom(new KnightOfRot(room)));
  _.times(2, () => cards.addCardToBottom(new RatMarauders(room)));
  _.times(2, () => cards.addCardToBottom(new SistersOfShadows(room)));
  _.times(2, () => cards.addCardToBottom(new ToxicBonechewer(room)));
  _.times(2, () => cards.addCardToBottom(new SoulPunisher(room)));
  _.times(2, () => cards.addCardToBottom(new NightmareCollector(room)));
  _.times(2, () => cards.addCardToBottom(new ArtifactsOfFortune(room)));
  _.times(2, () => cards.addCardToBottom(new VoraciousWebweaver(room)));
  _.times(2, () => cards.addCardToBottom(new DancingPhantoms(room)));
  _.times(2, () => cards.addCardToBottom(new FleshChimera(room)));

  // Crypts
  cards.addCardToBottom(new SoulfireAltar(room));
  cards.addCardToBottom(new SporesOfOblivion(room));
  cards.addCardToBottom(new DungeonOfWailingShadows(room));
  cards.addCardToBottom(new CastleOfEnigmaticDesires(room));
  cards.addCardToBottom(new AltarOfTheTwoFaced(room));
  cards.addCardToBottom(new CatacombsOfDarkness(room));

  // Rituals
  _.times(2, () => cards.addCardToBottom(new SpectralGrasp(room)));
  _.times(2, () => cards.addCardToBottom(new BloodyRift(room)));
  _.times(2, () => cards.addCardToBottom(new BanishTheCorruption(room)));
  _.times(2, () => cards.addCardToBottom(new LuckyTurn(room)));
  _.times(2, () => cards.addCardToBottom(new MightyFist(room)));
  _.times(2, () => cards.addCardToBottom(new GhostlyVengeance(room)));
  _.times(2, () => cards.addCardToBottom(new BeastFury(room)));
  _.times(2, () => cards.addCardToBottom(new PoisonousComet(room)));
  _.times(2, () => cards.addCardToBottom(new WaveOfFrenzy(room)));
  _.times(2, () => cards.addCardToBottom(new RedHotBlacksmith(room)));
  cards.addCardToBottom(new ArtOfTheDead(room));
  cards.addCardToBottom(new WizardsChildren(room));
  cards.addCardToBottom(new Cultism(room));

  // Wickedness
  _.times(2, () => cards.addCardToBottom(new PawOfFate(room)));
  _.times(2, () => cards.addCardToBottom(new PrisonerOfDarkness(room)));
  _.times(2, () => cards.addCardToBottom(new MiriannaMoonEchoes(room)));
  _.times(2, () => cards.addCardToBottom(new ChroniclerOfWhirls(room)));
  _.times(2, () => cards.addCardToBottom(new PrinceOfDecay(room)));
  _.times(2, () => cards.addCardToBottom(new MistEater(room)));
  _.times(2, () => cards.addCardToBottom(new CollectorOfSilentWaves(room)));
  _.times(2, () => cards.addCardToBottom(new ArchitectOfIllusoryNets(room)));
  _.times(2, () => cards.addCardToBottom(new DuskGrizzlyd(room)));
  _.times(2, () => cards.addCardToBottom(new AbyssalConsciousness(room)));
  cards.addCardToBottom(new MrShadowcat(room));
  cards.addCardToBottom(new TouchOfMist(room));
  cards.addCardToBottom(new AstridisLightweaver(room));

  // Artifacts
  _.times(2, () => cards.addCardToBottom(new IronVoice(room)));
  _.times(2, () => cards.addCardToBottom(new ForgottenQueens(room)));
  _.times(2, () => cards.addCardToBottom(new BottomlessVoid(room)));
  _.times(2, () => cards.addCardToBottom(new GreatSkeleton(room)));
  _.times(2, () => cards.addCardToBottom(new CorruptedBranch(room)));
  _.times(2, () => cards.addCardToBottom(new BlightedInfestation(room)));
  _.times(2, () => cards.addCardToBottom(new WhisperingEdge(room)));
  _.times(2, () => cards.addCardToBottom(new GrimCleaver(room)));
  _.times(2, () => cards.addCardToBottom(new CrushingJaws(room)));
  _.times(2, () => cards.addCardToBottom(new WyrmGemOfPower(room)));
  cards.addCardToBottom(new OblivionChalice(room));
  cards.addCardToBottom(new VileSatchel(room));
  cards.addCardToBottom(new NecroticWreath(room));

  // Chaos
  cards.addCardToBottom(new ChaosA(room));
  cards.addCardToBottom(new ChaosB(room));
  cards.addCardToBottom(new ChaosC(room));
  cards.addCardToBottom(new ChaosD(room));
  cards.addCardToBottom(new ChaosE(room));
  cards.addCardToBottom(new ChaosF(room));
  cards.addCardToBottom(new ChaosG(room));
  cards.addCardToBottom(new ChaosH(room));
  cards.addCardToBottom(new ChaosI(room));
  cards.addCardToBottom(new ChaosJ(room));
  cards.addCardToBottom(new ChaosK(room));
  cards.addCardToBottom(new ChaosL(room));
  cards.addCardToBottom(new ChaosM(room));
  cards.addCardToBottom(new ChaosN(room));
  cards.addCardToBottom(new ChaosO(room));
  cards.addCardToBottom(new ChaosP(room));
  cards.addCardToBottom(new ChaosQ(room));
  cards.addCardToBottom(new ChaosR(room));
  cards.addCardToBottom(new ChaosS(room));
  cards.addCardToBottom(new ChaosT(room));
  cards.addCardToBottom(new ChaosU(room));
  cards.addCardToBottom(new ChaosV(room));
  cards.addCardToBottom(new ChaosW(room));
  cards.addCardToBottom(new ChaosX(room));
  cards.addCardToBottom(new ChaosY(room));
  cards.addCardToBottom(new ChaosZ(room));

  cards.shuffle();
  return cards;
};

export const getInitialCursedSeals = ({
  maxPlayers,
  room,
}: { maxPlayers?: number; room?: Room } = {}): CardGroup<ECardGroupType.ANY> => {
  const cards = new CardGroup(ECardGroupType.ANY);
  const countCards = 16 + ((_.max([maxPlayers ?? 0, 5])! - 5) * 3);
  _.times(countCards, () => cards.addCardToBottom(new CursedSeal(room)));
  return cards;
};

export const getInitialDarknessMadness = ({
  maxPlayers,
  room,
}: { maxPlayers?: number; room?: Room } = {}): CardGroup<ECardGroupType.ANY> => {
  const cards = new CardGroup(ECardGroupType.ANY);
  const countCards = 16 + ((_.max([maxPlayers ?? 0, 5])! - 5) * 3);
  _.times(countCards, () => cards.addCardToBottom(new DarknessMadness(room)));
  return cards;
};

export const getInitialHarbingers = ({
  maxPlayers,
  room,
}: { maxPlayers?: number; room?: Room } = {}): CardGroup<ECardGroupType.HARBINGERS> => {
  const cards = new CardGroup(ECardGroupType.HARBINGERS);

  const countCards = 1 + ((maxPlayers ?? 0) > 5 ? 1 : 0);

  _.times(countCards, () => cards.addCardToBottom(new TaintedWarrior(room)));
  _.times(countCards, () => cards.addCardToBottom(new StygianDemonWarlock(room)));
  _.times(countCards, () => cards.addCardToBottom(new SmolderingPlague(room)));
  _.times(countCards, () => cards.addCardToBottom(new SmolderingEnd(room)));
  _.times(countCards, () => cards.addCardToBottom(new SorceressOfAgony(room)));
  _.times(countCards, () => cards.addCardToBottom(new SignOfOblivion(room)));
  _.times(countCards, () => cards.addCardToBottom(new RulerOfNothingness(room)));
  _.times(countCards, () => cards.addCardToBottom(new ProfessorOfDoom(room)));
  _.times(countCards, () => cards.addCardToBottom(new FruitCaster(room)));
  _.times(countCards, () => cards.addCardToBottom(new BoneTyrant(room)));
  _.times(countCards, () => cards.addCardToBottom(new BonePatriarch(room)));
  cards.shuffle();
  _.times(countCards, () => cards.addCardToTop(new DreadOneEyedWarrior(room)));
  return cards;
};

export const getInitialCompanions = (room?: Room): CardGroup<ECardGroupType.ANY> => {
  const cards = new CardGroup(ECardGroupType.ANY);
  cards.addCardToBottom(new BaronRattinghamOfTenebria(room));
  cards.addCardToBottom(new DecaySpawn(room));
  cards.addCardToBottom(new FlameWraith(room));
  cards.addCardToBottom(new FlamingKeeperOfTheGlens(room));
  cards.addCardToBottom(new FortuneSpawn(room));
  cards.addCardToBottom(new GremlinHorde(room));
  cards.addCardToBottom(new LuciferKingOfDebauchery(room));
  cards.addCardToBottom(new Rootshade(room));
  cards.addCardToBottom(new RotzillaScourgeOfThePlains(room));
  cards.addCardToBottom(new ShadowManipulator(room));
  cards.addCardToBottom(new StenchCloud(room));
  cards.addCardToBottom(new VoidJester(room));
  cards.shuffle();
  return cards;
};
