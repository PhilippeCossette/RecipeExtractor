export type SectionGroup<T> = { section: string | null; items: T[]; startIndex: number };

/**
 * Group consecutive items that share a section, so the section name is shown once as a heading
 * instead of on every step. `startIndex` keeps the step numbers running across groups.
 */
export function groupBySection<T extends { section?: string | null }>(items: T[]): SectionGroup<T>[] {
  const groups: SectionGroup<T>[] = [];
  items.forEach((item, index) => {
    const section = item.section ?? null;
    const last = groups.at(-1);
    if (last && last.section === section) last.items.push(item);
    else groups.push({ section, items: [item], startIndex: index });
  });
  return groups;
}
