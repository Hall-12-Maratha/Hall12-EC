
"use server";

import { z } from "zod";
import { db } from "./firebase";
import { collection, doc } from "firebase/firestore";
import { adminDb } from "./admin";
import admin from 'firebase-admin';
import { revalidatePath } from "next/cache";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function loginUser(prevState: any, formData: FormData) {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      error: "Invalid email or password.",
    };
  }

  // NOTE: This is a workaround to use Firebase Client SDK in Server Actions.
  // In a real-world app, you'd use a session-based mechanism with cookies
  // and the Firebase Admin SDK.
  return {
    ...validatedFields.data
  };
}

const signupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
});

export async function createUser(prevState: any, formData: FormData) {
    const validatedFields = signupSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.errors.map(e => e.message).join(", "),
        };
    }
    
    // This is a workaround. See loginUser function for more details.
    return {
      ...validatedFields.data
    }
}


const voteSubmissionSchema = z.object({
  votes: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "Invalid vote format." }),
  userId: z.string().min(1, { message: "User must be authenticated." }),
});


export async function submitVotes(prevState: any, formData: FormData) {
    const validatedFields = voteSubmissionSchema.safeParse(
        Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
        return { 
            success: false, 
            message: validatedFields.error.errors.map((e) => e.message).join(", ") 
        };
    }

    const { votes: votesString, userId } = validatedFields.data;
    
    let votes: Record<string, string[]>;
    try {
        votes = JSON.parse(votesString);
        if (Object.keys(votes).length === 0) {
            return { success: false, message: "No votes to submit." };
        }
    } catch (e) {
        return { success: false, message: "Invalid vote format." };
    }
    
  try {
    // Check election state before accepting votes
    try {
      const electionRef = adminDb.collection('settings').doc('election');
      const electionSnap = await electionRef.get();
      if (electionSnap.exists) {
        const data: any = electionSnap.data();
        if (!data.active) {
          return { success: false, message: 'Voting is not active at this time.' };
        }
      } else {
        // If no election doc exists, treat as inactive
        return { success: false, message: 'Voting is not active at this time.' };
      }
    } catch (e) {
      console.warn('Could not verify election state, proceeding with submission (admin SDK read failed):', e);
    }

    // Use Admin SDK for server-side writes so security rules don't block server actions.
    const batch = adminDb.batch();

    // 1. Create a vote document for each position in the 'votees' collection
    for (const positionId in votes) {
      const voteData = {
        userId,
        positionId,
        preferences: votes[positionId],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      } as any;
      const newVoteRef = adminDb.collection("votees").doc();
      batch.set(newVoteRef, voteData);
    }

    // 2. Mark the user as having voted
    const userRef = adminDb.collection('users').doc(userId);
    batch.update(userRef, { hasVoted: true });

    // 3. Save user's email into 'voteduser' collection (document id = userId)
    try {
      const userDoc = await userRef.get();
      const userEmail = userDoc.exists ? (userDoc.data() as any).email ?? null : null;
      const votedUserRef = adminDb.collection('voteduser').doc(userId);
      batch.set(votedUserRef, { email: userEmail, votedAt: admin.firestore.FieldValue.serverTimestamp() });
    } catch (e) {
      // If fetching user doc fails, continue without email but still commit votes.
      console.warn("Could not read user document to save email to voteduser:", e);
    }

    await batch.commit();

    revalidatePath("/admin/dashboard");
    revalidatePath("/user/dashboard");
    return { success: true, message: "Your vote has been submitted successfully!" };

  } catch (error: any) {
    console.error("Vote submission failed:", error);
    return { success: false, message: error.message || "An error occurred while submitting your vote. You may not have permission." };
  }
}


const electionActionSchema = z.object({
  action: z.enum(["start", "stop"]),
});

export async function setElectionState(prevState: any, formData: FormData) {
  const validated = electionActionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validated.success) {
    return { success: false, message: "Invalid action." };
  }

  const { action } = validated.data;

  try {
    const electionRef = adminDb.collection('settings').doc('election');
    if (action === 'start') {
      await electionRef.set({ active: true, startAt: admin.firestore.FieldValue.serverTimestamp(), endAt: null }, { merge: true });
    } else {
      await electionRef.set({ active: false, endAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }

    // Revalidate pages that depend on election state
    revalidatePath("/admin/dashboard");
    revalidatePath("/user/dashboard");

    return { success: true, message: `Election ${action === 'start' ? 'started' : 'stopped'}.` };
  } catch (error: any) {
    console.error('setElectionState failed:', error);
    return { success: false, message: error?.message ?? 'Failed to update election state.' };
  }
}

