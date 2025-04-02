import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateOrganizationBody } from "common";
import { useForm } from "react-hook-form";
import { z } from "zod";

const BasicInformationSchema = CreateOrganizationBody.pick({
  name: true,
  description: true,
  websiteUrl: true,
  instagramUsername: true,
});

export function OrganizationBasicInfoForm({
  defaultValues,
  onSubmit,
}: {
  defaultValues: z.infer<typeof BasicInformationSchema>;
  onSubmit: (data: z.infer<typeof BasicInformationSchema>) => void;
}) {
  const form = useForm<z.infer<typeof BasicInformationSchema>>({
    resolver: zodResolver(BasicInformationSchema),
    defaultValues,
  });

  return (
    <Card>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => {
            onSubmit(data);
          })}
        >
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Fill in the basic information about your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.example.org" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagramUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram Username (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="example_ig_username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              onClick={form.handleSubmit((data) => {
                onSubmit(data);
              })}
            >
              Next
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
