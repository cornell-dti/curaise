import { SignInWithGoogleButton } from "../components/auth/SignInWithGoogleButton";
import Image from "next/image";
import loginPhone from "../../public/images/login-phone.png";
import loginLineChart from "../../public/images/login-line-chart.png";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  // Check if the user is logged in
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If logged in, redirect to buyer page
  if (session) {
    redirect("/buyer/");
  }

  return (
    <div className="relative flex items-center justify-center min-h-svh w-full bg-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 md:px-10 flex flex-col-reverse md:flex-row items-center justify-center relative z-10 gap-8 md:gap-12 py-8 md:py-12 h-full">
        {/* Left side content - vertically centered */}
        <div className="w-full md:w-2/5 lg:w-2/5 font-[nunito] flex items-center justify-center">
          <div className="max-w-lg mx-auto md:mx-0 w-full flex flex-col gap-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-[700] mb-0 text-black text-center md:text-left">
              Welcome to CURaise
            </h1>
            <p className="px-5 md:px-0 text-base sm:text-xl md:text-2xl text-black mb-0 font-[400] text-center md:text-left">
              Your one stop platform for fundraising, organization, discovery,
              and impact.
            </p>
            <div className="flex justify-center md:justify-start">
              <SignInWithGoogleButton />
            </div>
          </div>
        </div>

        {/* Right side image - enlarged further to take up more space */}
        <div className="w-3/5 flex justify-center items-center my-6 md:my-0">
          <div className="grid grid-cols-2 max-w-[600px] sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
            <Image
              src={loginPhone}
              alt="CURaise Phone UI"
              priority
              className="w-full max-w-[300px] h-autor"
            />
            <div className="w-full max-w-[300px] aspect-square bg-[#265B34] rounded-bl-[50%]" />
            <div className="w-full max-w-[300px] aspect-square bg-[#C6DDC8] rounded-br-[50%] rounded-tr-[50%]" />
            <Image
              src={loginLineChart}
              alt="CURaise Line Chart UI"
              priority
              className="w-full max-w-[300px] h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
