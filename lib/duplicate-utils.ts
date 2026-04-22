export type DuplicateCandidate = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

export type DuplicateGroup = {
  matchField: "email" | "phone" | "address";
  matchKey: string;
  items: DuplicateCandidate[];
};

function normalize(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function groupByField(items: DuplicateCandidate[], field: DuplicateGroup["matchField"]) {
  const map = new Map<string, DuplicateCandidate[]>();

  for (const item of items) {
    const key = normalize(item[field]);
    if (!key) {
      continue;
    }

    const group = map.get(key) ?? [];
    group.push(item);
    map.set(key, group);
  }

  return [...map.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([matchKey, group]) => ({
      matchField: field,
      matchKey,
      items: group,
    }));
}

export function findDuplicateGroups(items: DuplicateCandidate[]) {
  return [
    ...groupByField(items, "email"),
    ...groupByField(items, "phone"),
    ...groupByField(items, "address"),
  ];
}
