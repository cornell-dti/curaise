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
  form,
  onSubmit,
  labels,
  children,
}: PropsWithChildren<{
  form: UseFormReturn;
  onSubmit: (formData: any) => void;
  labels: Array<string>;
}>) {
  const childrenArray = Children.toArray(children);

  const [step, updateState] = useState(0);

  const handleNext = () => {
    updateState((prev) => prev + 1);
  };

  const handleBack = () => {
    updateState((prev) => prev - 1);
  };

  return (
    <div className="">
      {/* Form Progress Bar */}
      <div className="relative flex justify-between">
        {/* Step Labels */}
        {labels.map((label, index) => (
          <div key={index} className="flex flex-col items-center relative z-10">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2",
                index < step
                  ? "bg-black border-black text-gray-300"
                  : index === step
                  ? "bg-white text-black border-black"
                  : "bg-white text-gray-300 border-gray-300"
              )}
            >
              {index < step ? (
                <Check className="h-5 w-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className="mt-2 text-sm font-medium text-center">
              {label}
            </span>
          </div>
        ))}

        {/* Progress bar */}
        <div className="absolute top-4 left-0 right-0 h-0.5 -translate-y-1/2 z-0 w-full">
          <div className="absolute inset-0 bg-gray-200"></div>
          <div
            className="absolute inset-y-0 left-0 bg-black transition-all duration-300"
            style={{
              width: `${(step / (labels.length - 1)) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      <div className="mt-12 flex justify-end gap-4">
        <Button variant="outline" onClick={handleBack} disabled={step === 0}>
          Previous Step
        </Button>
        <Button onClick={handleNext} disabled={step === labels.length - 1}>
          Next Step
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => onSubmit(data))}>
          {childrenArray.map((child, index) => {
            if (index === step) {
              return (
                <div key={index} className="mt-6">
                  {child}
                </div>
              );
            }
          })}
        </form>
      </Form>
    </div>
  );
}
