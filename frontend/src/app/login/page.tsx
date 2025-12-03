import { AutoGoogleLogin } from "@/components/auth/AutoGoogleLogin";
import { SignInWithGoogleButton } from "../../components/auth/SignInWithGoogleButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/buyer";

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm space-y-4 text-center">
        <AutoGoogleLogin next={next} />
        <div className="text-center text-xs text-muted-foreground">
          If you are not redirected automatically, you can sign in below:
        </div>
        <div className="flex justify-center">
          <SignInWithGoogleButton />
        </div>
      </div>
    </div>
  );
}
