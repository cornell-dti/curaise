type SavedItem = {
  id: string;
  name: string;
  description: string;
  price: { toString(): string } | number | string;
  imageUrl?: string | null;
  offsale: boolean;
  limit?: number | null;
  category: string;
};

function sameItem(a: SavedItem, b: SavedItem) {
  return (
    a.name === b.name &&
    a.description === b.description &&
    Number(a.price.toString()) === Number(b.price.toString()) &&
    (a.imageUrl ?? null) === (b.imageUrl ?? null) &&
    a.offsale === b.offsale &&
    (a.limit ?? null) === (b.limit ?? null) &&
    a.category === b.category
  );
}

// Compares the items loaded from the server with the items in the edit form
// and returns which saved items were removed or changed. Temp items (not yet
// created on the server) are ignored here; they go through the create flow.
export function diffSavedItems<T extends SavedItem>(
  original: T[],
  current: T[],
): { deleted: string[]; updated: T[] } {
  const currentById = new Map(
    current.filter((i) => !i.id.startsWith("temp-")).map((i) => [i.id, i]),
  );

  const deleted: string[] = [];
  const updated: T[] = [];
  for (const before of original) {
    const after = currentById.get(before.id);
    if (!after) deleted.push(before.id);
    else if (!sameItem(before, after)) updated.push(after);
  }
  return { deleted, updated };
}
