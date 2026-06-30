import ChessLegendBadge from '~/assets/chess-legend.png';
import GoldBadge from '~/assets/gold.png';
import GrammarBadge from '~/assets/grammar.png';
import DonorBadge from '~/assets/donor.png';
import MissionBadge from '~/assets/mission.png';
import MeetupBadge from '~/assets/meetup.png';
import MentorBadge from '~/assets/mentor.png';
import SageBadge from '~/assets/sage.png';
import FounderBadge from '~/assets/founder.png';
import SummonerBadge from '~/assets/summoner.png';
import TeenagerBadge from '~/assets/teenager.png';
import AdultBadge from '~/assets/adult.png';

// Single source of truth mapping an achievement type to its badge asset, so the
// achievement toast (and anything else) can show the real badge instead of a
// generic icon. The Big/* item components import these same assets directly.
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
