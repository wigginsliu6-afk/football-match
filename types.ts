
export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  beijingTime: string; // Format: YYYY-MM-DD HH:mm
  timestamp: number;
}

export interface SearchResult {
  matches: Match[];
  sources: { title: string; uri: string }[];
  rawText: string;
}

export interface UserPreferences {
  teams: string[];
  startHour: number; // 0-23
  endHour: number;   // 0-23
}
