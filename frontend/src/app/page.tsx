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

      <div className="container mx-auto px-4 sm:px-6 md:px-10 flex flex-col-reverse md:flex-row items-center justify-center relative z-10 gap-8 md:gap-12 py-8 md:py-12 h-full">
        {/* Left side content - vertically centered */}
        <div className="w-full md:w-2/5 lg:w-2/5 font-[nunito] flex items-center justify-center">
          <div className="max-w-lg mx-auto md:mx-0 w-full flex flex-col gap-6">
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

        {/* Right side image - enlarged further to take up more space */}
        <div className="w-full md:w-3/5 lg:w-3/5 flex justify-center items-center my-6 md:my-0">
          <div className="relative w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
            <Image 
              src={loginLaptopView}
              alt="CURaise Dashboard Preview" 
              priority
              className="drop-shadow-xl w-full h-auto"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1200px) 55vw, 45vw"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
