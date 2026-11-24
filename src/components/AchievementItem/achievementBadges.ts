import ChessLegendBadge from '~/assets/badges-small/chess-legend.webp';
import GoldBadge from '~/assets/badges-small/gold.webp';
import GrammarBadge from '~/assets/badges-small/grammar.webp';
import DonorBadge from '~/assets/badges-small/donor.webp';
import MissionBadge from '~/assets/badges-small/mission.webp';
import MeetupBadge from '~/assets/badges-small/bridge-builder.webp'; // Bridge Builder (once Face to Face)
import MentorBadge from '~/assets/badges-small/mentor.webp';
import SageBadge from '~/assets/badges-small/sage.webp';
import FounderBadge from '~/assets/badges-small/founder.webp';
import SummonerBadge from '~/assets/badges-small/summoner.webp';
import TeenagerBadge from '~/assets/badges-small/teenager.webp';
import AdultBadge from '~/assets/badges-small/adult.webp';

// Single source of truth mapping an achievement type to its badge asset, so the
// achievement toast (and anything else) can show the real badge instead of a
// generic icon. These are the 256 px copies (badges-small/) for places that
// draw a badge small; the Big/* item components import the 1024 px originals.
const achievementBadges: Record<string, string> = {
  chess_legend: ChessLegendBadge,
  gold: GoldBadge,
  grammar: GrammarBadge,
  donor: DonorBadge,
  mission: MissionBadge,
  meetup: MeetupBadge,
  mentor: MentorBadge,
  sage: SageBadge,
  twinkle_founder: FounderBadge,
  summoner: SummonerBadge,
  teenager: TeenagerBadge,
  adult: AdultBadge
};

export function getAchievementBadge(type: string): string | undefined {
  return achievementBadges[type];
}

export default achievementBadges;
