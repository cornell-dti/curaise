"use client";

import { useEffect } from "react";

export function AutoGoogleLoginAutoSubmit() {
  useEffect(() => {
    const form = document.getElementById(
      "auto-google-login-form",
    ) as HTMLFormElement | null;
    if (form) {
      form.requestSubmit();
    }
  }, []);

  return null;
}


