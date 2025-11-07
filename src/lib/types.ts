export type UserRole = "admin" | "user";

export interface AppUser {
  uid: string;
  email: string | null;
  role: UserRole;
  hasVoted: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  positionId: string;
  imageUrl: string;
}

export interface Position {
  id: string;
  title: string;
  candidates: Candidate[];
}

export interface Vote {
  userId: string;
  positionId: string;
  preferences: string[]; // Ordered list of candidate IDs
}

export interface ElectionState {
  active: boolean;
  startAt?: string | null;
  endAt?: string | null;
}
