"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Vote } from '@/lib/types';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';

export function useVotes(initialVotes: Vote[] = []) {
  const [votes, setVotes] = useState<Vote[]>(initialVotes);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
  const votesQuery = query(collection(db, 'votees'));

    const unsubscribe = onSnapshot(
      votesQuery,
      (snapshot) => {
        const newVotes: Vote[] = [];
        snapshot.forEach((doc) => {
          newVotes.push(doc.data() as Vote);
        });
        setVotes(newVotes);
        setLoading(false);
      },
      (err) => {
        // Create and emit a detailed, contextual error for the listener to catch.
    const permissionError = new FirestorePermissionError({
      path: '/votees',
      operation: 'list',
    });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { votes, loading };
}
