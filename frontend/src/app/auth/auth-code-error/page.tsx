import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AuthCodeErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  const isNonCornell = reason === "non_cornell";

  const title = isNonCornell
    ? "Cornell email required"
    : "Sign-in error";

  const body = isNonCornell
    ? "CURaise is only available to users with a @cornell.edu Google account. Please sign in again using your Cornell email."
    : "We couldn't complete your sign-in. Please try again.";

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-white">
      <div className="w-full max-w-md space-y-6 text-center font-[dm_sans]">
        <h1 className="text-2xl sm:text-3xl font-[700] text-black">{title}</h1>
        <p className="text-base sm:text-lg text-black font-[400]">{body}</p>
        <div className="flex justify-center">
          <Link href="/">
            <Button
              variant="secondary"
              className="font-[dm_sans] font-[300] text-base sm:text-lg bg-[#33363F] text-white hover:bg-[#50535d] rounded-lg h-12 px-6"
            >
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
