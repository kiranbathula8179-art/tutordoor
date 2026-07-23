import {
  Atom,
  BarChart3,
  BookOpen,
  Briefcase,
  Calculator,
  Code2,
  Dna,
  FlaskConical,
  Globe2,
  GraduationCap,
  Landmark,
  Languages,
  type LucideIcon,
  Music2,
  Palette,
  TrendingUp,
} from "lucide-react";

/**
 * SubjectCategory.icon exists in the backend schema but seed_demo.py never
 * sets it, so it's blank in practice — not a usable data source. This is a
 * presentation-only keyword lookup (not a fabricated fact), matched against
 * the real subject name already returned by getSubjects(). First match wins;
 * unmatched subjects fall back to a generic cap.
 */
const SUBJECT_ICON_RULES: Array<{ keywords: string[]; icon: LucideIcon }> = [
  { keywords: ["math", "algebra", "calculus", "geometry", "arithmetic"], icon: Calculator },
  { keywords: ["physics"], icon: Atom },
  { keywords: ["chemistry"], icon: FlaskConical },
  { keywords: ["biology", "botany", "zoology"], icon: Dna },
  { keywords: ["english", "literature", "writing", "grammar"], icon: BookOpen },
  { keywords: ["computer", "programming", "coding", "python", "java", "web development"], icon: Code2 },
  { keywords: ["history"], icon: Landmark },
  { keywords: ["geography"], icon: Globe2 },
  { keywords: ["art", "design", "drawing", "painting"], icon: Palette },
  { keywords: ["music", "guitar", "piano", "violin", "vocal", "singing"], icon: Music2 },
  { keywords: ["economics", "finance", "accounting"], icon: TrendingUp },
  { keywords: ["business", "management", "marketing"], icon: Briefcase },
  { keywords: ["statistics", "data science", "analytics"], icon: BarChart3 },
  { keywords: ["french", "spanish", "german", "hindi", "language"], icon: Languages },
];

export function iconForSubject(subjectName: string): LucideIcon {
  const lower = subjectName.toLowerCase();
  const match = SUBJECT_ICON_RULES.find((rule) => rule.keywords.some((keyword) => lower.includes(keyword)));
  return match?.icon ?? GraduationCap;
}
