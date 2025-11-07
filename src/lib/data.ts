import { collection, doc, getDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { adminDb } from "./admin";
import type { AppUser, Candidate, Position, Vote } from "./types";
import "server-only";

const temporaryCandidates: Candidate[] = [
  { id: "c1", name: "Alice Johnson", positionId: "president", imageUrl: "/image.png" },
  { id: "c2", name: "Bob Williams", positionId: "president", imageUrl: "https://picsum.photos/seed/2/100/100" },
  { id: "c3", name: "Charlie Brown", positionId: "mess-secy", imageUrl: "https://picsum.photos/seed/3/100/100" },
  { id: "c4", name: "Diana Miller", positionId: "mess-secy", imageUrl: "https://picsum.photos/seed/4/100/100" },
  { id: "c5", name: "Ethan Davis", positionId: "maintenance-secy", imageUrl: "https://picsum.photos/seed/5/100/100" },
  { id: "c6", name: "Fiona Garcia", positionId: "maintenance-secy", imageUrl: "https://picsum.photos/seed/6/100/100" },
];

const temporaryPositions:  Omit<Position, 'candidates'>[] = [
    { id: "president", title: "President" },
    { id: "mess-secy", title: "Mess Secy" },
    { id: "maintenance-secy", title: "Maintenance Secy" },
];


export async function getUser(uid: string): Promise<AppUser | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        uid,
        email: userData.email,
        role: userData.role,
        hasVoted: userData.hasVoted || false,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function getPositionsWithCandidates(): Promise<Position[]> {
  try {
    const positions: Position[] = temporaryPositions.map(position => ({
      ...position,
      candidates: temporaryCandidates.filter(c => c.positionId === position.id),
    }));

    return positions;
  } catch (error) {
    console.error("Error fetching positions and candidates:", error);
    return [];
  }
}

export async function getAllCandidates(): Promise<Candidate[]> {
    try {
        return temporaryCandidates;
    } catch (error) {
        console.error("Error fetching candidates:", error);
        return [];
    }
}

export async function getVoteResults() {
    try {
        // Try Admin SDK first for server-side reads. If Admin SDK is not available
        // (e.g. missing credentials during local dev), fall back to client SDK.
        const convertDoc = (data: any) => {
          const vote: any = { ...data };
          if (data && data.createdAt && typeof data.createdAt.toDate === 'function') {
            try {
              vote.createdAt = data.createdAt.toDate().toISOString();
            } catch (e) {
              // ignore conversion errors
            }
          }
          return vote as Vote;
        };

        try {
            // Read the votes stored in the 'votees' collection (per current app conventions)
            const votesSnapshot = await adminDb.collection('votees').get();
          const votes = votesSnapshot.docs.map(d => convertDoc(d.data()));
          return votes;
        } catch (adminErr) {
          // Admin SDK unavailable (credentials) — fall back to client Firestore reads
          console.warn('Admin SDK read failed, falling back to client Firestore:', adminErr);
          try {
            const votesSnapshot = await getDocs(query(collection(db, 'votees')));
            const votes = votesSnapshot.docs.map(d => convertDoc(d.data()));
            return votes;
          } catch (clientErr) {
            console.error('Client Firestore read also failed:', clientErr);
            return [];
          }
        }
    } catch(error) {
        console.error("Error fetching votes:", error);
        return [];
    }
}

export async function getElectionState() {
  try {
    try {
      const docRef = adminDb.collection('settings').doc('election');
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        return { active: false };
      }
      const data: any = docSnap.data();
      const result: { active: boolean; startAt?: string | null; endAt?: string | null } = {
        active: !!data.active,
        startAt: data.startAt && typeof data.startAt.toDate === 'function' ? data.startAt.toDate().toISOString() : (data.startAt ?? null),
        endAt: data.endAt && typeof data.endAt.toDate === 'function' ? data.endAt.toDate().toISOString() : (data.endAt ?? null),
      };
      return result;
    } catch (adminErr) {
      // If admin SDK not available, fall back to client Firestore (likely not used server-side)
      console.warn('getElectionState: admin SDK read failed, returning default inactive state', adminErr);
      return { active: false };
    }
  } catch (error) {
    console.error('Error fetching election state:', error);
    return { active: false };
  }
}
