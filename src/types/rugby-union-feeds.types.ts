export type RUFeedsCompetiton = 'PREM Rugby Cup' | 'Gallagher PREM' | 'Investec Champions Cup';
export type RUFeedsStatus = 'result' | 'fixture';
export type RUFeedsTeamForm = Partial<{
  matchId: number;
  date: string;
  result: string;
  home: boolean;
}>
export type RUFeedsTeam = Partial<{
  id: number;
  name: string;
  shortName: string;
  score: number;
  halfTimeScore: number;
  imageUrl: string;
  form: RUFeedsTeamForm[];
}>;

export type RUFeedsMatch = Partial<{
  id: number;
  provider: string;
  compId: number;
  compName: RUFeedsCompetiton;
  competitionImageUrl: string;
  date: string;
  title: string;
  tbc: number;
  leg: unknown;
  round: number;
  roundTypeId: number;
  season: number;
  status: RUFeedsStatus;
  matchWinner: number;
  minute: number;
  second: number;
  attendance: number;
  venue: Partial<{
    id: number;
    name: string;
  }>;
  broadcasters: string[];
  homeTeam: RUFeedsTeam;
  awayTeam: RUFeedsTeam;
}>;
