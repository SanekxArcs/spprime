
export enum Role {
  Frontend = 'Front-End',
  Backend = 'Back-End',
  QA = 'QA',
  PM = 'PM',
}

export const VOTING_ROLES = [Role.Frontend, Role.Backend, Role.QA];

export interface Card {
  value: number;
  display: string;
}

export interface Participant {
  id: string;
  name: string;
  role: Role;
  vote: number | null;
}

export enum RoomState {
  Voting = 'voting',
  Revealed = 'revealed',
}

export interface Multipliers {
  [Role.Frontend]: number;
  [Role.Backend]: number;
  [Role.QA]: number;
}

export interface Room {
  id: string;
  name: string;
  password?: string;
  state: RoomState;
  participants: Participant[];
  cards: Card[];
  multipliers: Multipliers;
}

export interface Averages {
    [key: string]: number | string;
    teamAverage: number | string;
}
