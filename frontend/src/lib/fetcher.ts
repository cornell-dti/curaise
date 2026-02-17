import { createClient } from "@/utils/supabase/client";
import { z } from "zod";

const supabase = createClient();

// fetch data from API with the current user's auth token
export const authFetcher =
  <T extends z.ZodTypeAny>(schema: T) =>
  async (url: string): Promise<z.infer<T>> => {
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
  async (url: string): Promise<z.infer<T>> => {
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

// Server component data fetching
type ServerFetchOptions<T extends z.ZodTypeAny> = {
  token?: string;
  schema?: T;
};

export async function serverFetch<T extends z.ZodTypeAny>(
  url: string,
  options?: ServerFetchOptions<T>,
): Promise<z.infer<T>> {
  const headers: Record<string, string> = {};
  if (options?.token) {
    headers["Authorization"] = "Bearer " + options.token;
  }

  const response = await fetch(process.env.NEXT_PUBLIC_API_URL! + url, {
    headers,
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }

  if (options?.schema) {
    const data = options.schema.safeParse(result.data);
    if (!data.success) {
      throw new Error("Could not parse data");
    }
    return data.data;
  }

  return result.data;
}

// Client component mutations (POST/PUT/DELETE)
type MutationFetchOptions = {
  method?: "POST" | "PUT" | "DELETE";
  token: string;
  body?: unknown;
};

export async function mutationFetch(
  url: string,
  options: MutationFetchOptions,
): Promise<{ message: string; data: unknown }> {
  const response = await fetch(process.env.NEXT_PUBLIC_API_URL! + url, {
    method: options.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + options.token,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }
  return result;
}
