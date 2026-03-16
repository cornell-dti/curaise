"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";

interface LocalDateProps {
  date: Date | string;
  formatStr: string;
}

export function LocalDate({ date, formatStr }: LocalDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render empty on server, only format on client after mount
  // This avoids hydration mismatch between server (UTC) and client (local) timezones
  if (!mounted) {
    return null;
  }

  return <>{format(new Date(date), formatStr)}</>;
}
