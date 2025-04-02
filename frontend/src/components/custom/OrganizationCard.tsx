import { cn } from "@/lib/utils";
import { BasicOrganizationSchema } from "common";
import { ChevronRight, PauseCircle, Plus } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const OrganizationCard = ({
  organization,
}: {
  organization: z.infer<typeof BasicOrganizationSchema>;
}) => {
  return (
    <Link href={`/seller/org/${organization.id}`}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base">{organization.name}</CardTitle>
            <ChevronRight className="text-gray-400" size={20} />
          </div>
        </CardHeader>
        <CardFooter className="pt-4">
          <div
            className={cn(
              organization.authorized && "invisible",
              "mt-1 flex items-center text-sm text-gray-500 gap-2"
            )}
          >
            <PauseCircle size={16} />
            <span>Project hasn't been approved yet</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export const CreateOrganizationCard = () => {
  return (
    <Link href={`/seller/org/create`}>
      <Card className="border-dashed cursor-pointer hover:bg-gray-50 transition-colors duration-300">
        <CardContent className="flex items-center justify-center py-8 h-full min-h-32">
          <p className="flex items-center text-gray-500 font-medium">
            <Plus className="mr-1" size={20} />
            Create Organization
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};
