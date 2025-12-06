import { Children, PropsWithChildren } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MultiStepForm({
  labels,
  currentStep,
  children,
}: PropsWithChildren<{
  labels: Array<string>;
  currentStep: number;
}>) {
  const childrenArray = Children.toArray(children);

  return (
    <div className="space-y-8">
      {/* Form Progress Bar */}
      <div className="px-14 md:px-0">
        <div className="relative mb-12 md:mb-20">
          {/* Progress bar - mobile */}
          <div
            className="absolute top-4 h-0.5 -translate-y-1/2 z-0 md:hidden"
            style={{ left: '-24px', width: 'calc(100% + 48px)' }}
          >
            <div className="w-full h-full bg-gray-200"></div>
            <div
              className="absolute top-0 left-0 h-full bg-black transition-all duration-300"
              style={{
                width: `${(currentStep / (labels.length - 1)) * 100}%`,
              }}
            ></div>
          </div>

          {/* Progress bar - desktop */}
          <div
            className="absolute top-4 h-0.5 -translate-y-1/2 z-0 hidden md:block"
            style={{ left: '48px', width: 'calc(100% - 100px)' }}
          >
            <div className="w-full h-full bg-gray-200"></div>
            <div
              className="absolute top-0 left-0 h-full bg-black transition-all duration-300"
              style={{
                width: `${(currentStep / (labels.length - 1)) * 100}%`,
              }}
            ></div>
          </div>

          {/* Steps with labels container */}
          <div className="flex relative z-10">
            {labels.map((label, index) => {
              const isFirst = index === 0;
              const isLast = index === labels.length - 1;

              // Calculate position as percentage
              const position = (index / (labels.length - 1)) * 100;

              // Circles positioning
              // Mobile: negative margins to compensate for px-14 padding
              // Desktop: standard positioning
              let className = "absolute";
              let style = {};

              if (isFirst) {
                className += " -left-14 md:left-0";
              } else if (isLast) {
                className += " -right-14 md:right-auto md:left-full md:-translate-x-full";
              } else {
                style = { left: `${position}%`, transform: 'translateX(-50%)' };
              }

              return (
                <div
                  key={index}
                  className={className}
                  style={style}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full border-2",
                        currentStep > index
                          ? "bg-black border-black text-white"
                          : currentStep === index
                          ? "border-black bg-white"
                          : "border-gray-300 bg-white"
                      )}
                    >
                      {currentStep > index ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span className="mt-2 text-sm font-medium text-center whitespace-nowrap hidden md:block">
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6">
        {childrenArray.map((child, index) => {
          return (
            <div
              key={index}
              className={cn(
                "transition-opacity duration-300",
                currentStep === index ? "visible" : "hidden"
              )}
            >
              {child}
            </div>
          );
        })}
      </div>
    </div>
  );
}
