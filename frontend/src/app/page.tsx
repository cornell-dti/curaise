import { SignInWithGoogleButton } from "../components/auth/SignInWithGoogleButton";
import Image from "next/image";
import loginLaptopView from "../../public/images/login-laptop-view.png";

export default function LoginPage() {
  return (
    <div className="relative flex items-center justify-center min-h-svh w-full bg-white overflow-hidden">
      {/* Light green half-circle - responsive positioning */}
      <div className="absolute top-0 right-0 w-1/2 h-full">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[120%] sm:h-[140%] md:h-[120%] aspect-[1/1] rounded-l-full bg-[#92AA83] opacity-80 sm:opacity-90 md:opacity-100"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 md:px-10 flex flex-col-reverse md:flex-row items-center justify-center md:justify-between relative z-10 gap-8 md:gap-10 py-6 md:py-0 my-auto">
        {/* Left side content - more responsive text sizes and spacing */}
        <div className="w-full md:w-1/2 lg:w-3/5 font-[nunito] flex items-center">
          <div className="max-w-xl mx-auto md:mx-0 w-full flex flex-col gap-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-[700] mb-0 text-black text-center md:text-left">
              Welcome to CURaise
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-black mb-0 font-[400] text-center md:text-left">
              Your one stop platform for fundraising, organization, discovery and impact.
            </p>
            <div className="flex justify-center md:justify-start">
              <SignInWithGoogleButton />
            </div>
          </div>
        </div>

        {/* Right side image - responsive sizing and hiding on very small screens */}
        <div className="w-full md:w-1/2 lg:w-2/5 flex justify-center items-center">
          <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-2xl">
            <Image 
              src={loginLaptopView}
              alt="CURaise Dashboard Preview" 
              priority
              className="drop-shadow-xl w-full h-auto"
              sizes="(max-width: 640px) 80vw, (max-width: 768px) 90vw, (max-width: 1200px) 50vw, 40vw"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
