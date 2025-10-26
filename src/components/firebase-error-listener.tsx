"use client";

import { useEffect } from "react";
import { errorEmitter } from "@/lib/error-emitter";
import type { FirestorePermissionError } from "@/lib/errors";

// This component is a hack to get around the fact that you can't easily
// throw an error from an async event handler and have it caught by the
// Next.js error overlay.
//
// It listens for a custom event and then throws the error from inside a
// React component, which the error overlay can then catch.

export function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // We throw the error here so that the Next.js development error overlay
      // can catch it and display it to the user.
      throw error;
    };

    errorEmitter.on("permission-error", handlePermissionError);

    return () => {
      errorEmitter.off("permission-error", handlePermissionError);
    };
  }, []);

  return null;
}
