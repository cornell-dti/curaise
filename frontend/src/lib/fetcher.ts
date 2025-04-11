import { createClient } from "@/utils/supabase/client";
import { z } from "zod";

const supabase = createClient();

// fetch data from API with the current user's auth token
export const authFetcher =
  <T extends z.ZodTypeAny>(schema: T) =>
  async (url: String): Promise<z.infer<T>> => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
      throw new Error("Session invalid");
    }

    const response = await fetch(process.env.NEXT_PUBLIC_API_URL! + url, {
      headers: {
        Authorization: "Bearer " + session.access_token,
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }

    const data = schema.safeParse(result.data);
    if (!data.success) {
      throw new Error("Could not parse data");
    }
    return data.data;
  };

export const noAuthFetcher =
  <T extends z.ZodTypeAny>(schema: T) =>
  async (url: String): Promise<z.infer<T>> => {
    const response = await fetch(process.env.NEXT_PUBLIC_API_URL! + url);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }

    const data = schema.safeParse(result.data);
    if (!data.success) {
      throw new Error("Could not parse data");
    }
    return data.data;
  };
