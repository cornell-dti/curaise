import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateFundraiserBody, CreateFundraiserItemBody } from "common";
import { format } from "date-fns";
import { z } from "zod";

export function ReviewFundraiserForm({
  formData,
  items,
  onSubmit,
  onBack,
}: {
  formData: z.infer<typeof CreateFundraiserBody>;
  items: z.infer<typeof CreateFundraiserItemBody>[];
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Fundraiser</CardTitle>
        <CardDescription>
          Review the information about your fundraiser before creating it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Fundraiser Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p>{formData.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Goal Amount</p>
              <p>
                {formData.goalAmount
                  ? `${
                      typeof formData.goalAmount === "object" &&
                      "toFixed" in formData.goalAmount
                        ? formData.goalAmount.toFixed(2)
                        : parseFloat(String(formData.goalAmount)).toFixed(2)
                    }`
                  : "No goal set"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500">Description</p>
              <p className="whitespace-pre-wrap">{formData.description}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Pickup Location
              </p>
              <p>{formData.pickupLocation}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Timeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-500">Buying Period</p>
              <p>
                {format(formData.buyingStartsAt, "MMM d, yyyy h:mm a")} -{" "}
                {format(formData.buyingEndsAt, "MMM d, yyyy h:mm a")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pickup Period</p>
              <p>
                {format(formData.pickupStartsAt, "MMM d, yyyy h:mm a")} -{" "}
                {format(formData.pickupEndsAt, "MMM d, yyyy h:mm a")}
              </p>
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Items ({items.length})</h3>
            <div className="space-y-2 p-4 border rounded-lg">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-3 border rounded flex justify-between items-start"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <p className="font-medium">
                    $
                    {typeof item.price === "object" && "toFixed" in item.price
                      ? item.price.toFixed(2)
                      : parseFloat(String(item.price)).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Once created, you'll be able to add
            fundraiser images and send announcements to supporters.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" onClick={onSubmit}>
          Create Fundraiser
        </Button>
      </CardFooter>
    </Card>
  );
}
