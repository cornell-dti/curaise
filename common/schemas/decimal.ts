import { z } from "zod";
import Decimal from "decimal.js";

// Create a custom Zod schema for Decimal.js values
export const DecimalSchema = z.custom<Decimal>(
  (val) => {
    try {
      // Attempt to create a Decimal instance from the value
      return (
        val instanceof Decimal || new Decimal(val as any) instanceof Decimal
      );
    } catch {
      return false;
    }
  },
  {
    message: "Invalid decimal value",
  }
);

export const MoneySchema = DecimalSchema.refine(
  (val) => val.greaterThanOrEqualTo(new Decimal(0)) && val.decimalPlaces() <= 2,
  {
    message: "Amount must be positive or zero with at most 2 decimal places",
  }
);
