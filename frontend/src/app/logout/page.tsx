import { SignOutButton } from "@/components/auth/SignOutButton";

export default function LogoutPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignOutButton />
      </div>
    </div>
  );
}
