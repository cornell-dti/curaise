import { UseFormReturn } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Children, PropsWithChildren, useState } from "react";
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
      <div className="relative mb-20">
        {/* Progress bar */}
        <div className="absolute top-4 left-0 right-0 h-0.5 -translate-y-1/2 z-0">
          <div className="absolute inset-0 bg-gray-200"></div>
          <div
            className="absolute inset-y-0 left-0 bg-black transition-all duration-300"
            style={{
              width: `${(currentStep / (labels.length - 1)) * 100}%`,
            }}
          ></div>
        </div>

        {/* Steps with labels */}
        <div className="flex relative z-10">
          {labels.map((label, index) => {
            // Calculate position as percentage
            const position = (index / (labels.length - 1)) * 100;

            return (
              <div
                key={index}
                className="absolute"
                style={{
                  left: `${position}%`,
                  transform: "translateX(-50%)",
                }}
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
                  <span className="mt-2 text-sm font-medium text-center whitespace-nowrap">
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
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
