import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  CalendarIcon,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Search,
  ShoppingBag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicOrderSchema, UserSchema } from "common";

export default async function BuyerHome() {
  await connection(); // ensures server component is dynamically rendered at runtime, not statically rendered at build time

  const supabase = await createClient();

  // protect page (must use supabase.auth.getUser() according to docs)
  const {
    data: { user },
    error: error1,
  } = await supabase.auth.getUser();
  if (error1 || !user) {
    redirect("/login");
  }

  // get auth jwt token
  const {
    data: { session },
    error: error2,
  } = await supabase.auth.getSession();
  if (error2 || !session?.access_token) {
    throw new Error("Session invalid");
  }

  // get orders
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + `/user/${user.id}/orders`,
    {
      headers: {
        Authorization: "Bearer " + session?.access_token,
      },
    }
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }

  // parse order data
  const data = BasicOrderSchema.array().safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse order data");
  }
  const orders = data.data;

  return (
    <div className="">
      <p>Buyer home</p>
    </div>
  );
}
