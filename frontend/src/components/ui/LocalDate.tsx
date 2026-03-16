"use client";

import { format } from "date-fns";

interface LocalDateProps {
  date: Date | string;
  formatStr: string;
}

export function LocalDate({ date, formatStr }: LocalDateProps) {
  return <>{format(new Date(date), formatStr)}</>;
}
