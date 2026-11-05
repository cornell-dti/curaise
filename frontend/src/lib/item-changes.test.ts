import { describe, expect, it } from "vitest";
import { diffSavedItems } from "./item-changes";

const item = (id: string, overrides = {}) => ({
  id,
  name: `Item ${id}`,
  description: "desc",
  price: "5.00",
  imageUrl: null as string | null,
  offsale: false,
  limit: null as number | null,
  category: "FOOD",
  ...overrides,
});

describe("diffSavedItems", () => {
  it("returns nothing when items are unchanged", () => {
    const items = [item("a"), item("b")];
    expect(diffSavedItems(items, items.map((i) => ({ ...i })))).toEqual({
      deleted: [],
      updated: [],
    });
  });

  it("detects removed saved items", () => {
    expect(diffSavedItems([item("a"), item("b")], [item("a")]).deleted).toEqual([
      "b",
    ]);
  });

  it("detects edited saved items", () => {
    const { updated } = diffSavedItems(
      [item("a"), item("b")],
      [item("a", { name: "Tiramisu" }), item("b")],
    );
    expect(updated.map((i) => [i.id, i.name])).toEqual([["a", "Tiramisu"]]);
  });

  it("treats equal prices in different formats as unchanged", () => {
    const { updated } = diffSavedItems(
      [item("a", { price: "5.00" })],
      [item("a", { price: 5 })],
    );
    expect(updated).toEqual([]);
  });

  it("treats undefined and null image/limit as unchanged", () => {
    const { updated } = diffSavedItems(
      [item("a")],
      [item("a", { imageUrl: undefined, limit: undefined })],
    );
    expect(updated).toEqual([]);
  });

  it("ignores temp items", () => {
    expect(
      diffSavedItems([item("a")], [item("a"), item("temp-123")]),
    ).toEqual({ deleted: [], updated: [] });
  });
});
