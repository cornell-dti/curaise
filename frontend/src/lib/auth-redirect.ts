const DEFAULT_NEXT_PATH = "/";

export function sanitizeNextPath(
  nextPath: string | null | undefined,
  fallback = DEFAULT_NEXT_PATH,
) {
  if (!nextPath) {
    return fallback;
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallback;
  }

  if (nextPath.includes("\\")) {
    return fallback;
  }

  return nextPath;
}
