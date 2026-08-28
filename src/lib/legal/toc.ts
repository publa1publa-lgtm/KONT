import type { LegalDocKind } from "./catalog";
import type { LegalSection } from "./content";

export const LEGAL_TOC_GROUPS = {
  terms: [
    { id: "using", sectionIds: ["agreement", "eligibility", "service", "your-content"] },
    { id: "rules", sectionIds: ["integrations", "acceptable-use", "ip"] },
    { id: "legal", sectionIds: ["disclaimers", "termination", "changes", "contact"] },
  ],
  privacy: [
    { id: "about", sectionIds: ["intro", "scope"] },
    { id: "data", sectionIds: ["collect", "use", "connected", "sharing"] },
    { id: "control", sectionIds: ["retention", "deletion", "rights"] },
    { id: "other", sectionIds: ["children", "cookies", "international", "changes", "contact"] },
  ],
} as const;

export type LegalTocGroupId<D extends LegalDocKind> = (typeof LEGAL_TOC_GROUPS)[D][number]["id"];

export function groupLegalSections(doc: LegalDocKind, sections: LegalSection[]) {
  const byId = new Map(sections.map((section) => [section.id, section]));
  const used = new Set<string>();

  const groups: { id: string; sections: LegalSection[] }[] = LEGAL_TOC_GROUPS[doc].map((group) => {
    const items = group.sectionIds
      .map((id) => byId.get(id))
      .filter((section): section is LegalSection => Boolean(section));
    items.forEach((section) => used.add(section.id));
    return { id: group.id, sections: items };
  });

  const rest = sections.filter((section) => !used.has(section.id));
  if (rest.length) {
    groups.push({ id: "other" as const, sections: rest });
  }

  return groups.filter((group) => group.sections.length > 0);
}
