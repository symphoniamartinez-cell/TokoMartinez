import { Coffee, CupSoda, Droplets, GlassWater, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CategoryKey =
  | "air_galon"
  | "air_mineral"
  | "minuman_manis"
  | "kopi_teh"
  | "lainnya";

type CategoryMeta = {
  label: string;
  short: string;
  icon: LucideIcon;
  /** Tailwind classes untuk chip ikon pada kartu produk. */
  chip: string;
};

export const CATEGORIES: Record<CategoryKey, CategoryMeta> = {
  air_galon: {
    label: "Air Galon",
    short: "Galon",
    icon: Droplets,
    chip: "bg-[#e8f1f6] text-[#3f7a99]",
  },
  air_mineral: {
    label: "Air Mineral",
    short: "Mineral",
    icon: GlassWater,
    chip: "bg-[#eaf3f1] text-[#41867c]",
  },
  minuman_manis: {
    label: "Minuman Manis",
    short: "Manis",
    icon: CupSoda,
    chip: "bg-coral-soft text-coral-dark",
  },
  kopi_teh: {
    label: "Kopi & Teh",
    short: "Kopi/Teh",
    icon: Coffee,
    chip: "bg-gold-soft text-gold-dark",
  },
  lainnya: {
    label: "Lainnya",
    short: "Lainnya",
    icon: Package,
    chip: "bg-cream-deep text-ink-soft",
  },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

export function categoryOf(key: string | null | undefined): CategoryMeta {
  return CATEGORIES[(key ?? "lainnya") as CategoryKey] ?? CATEGORIES.lainnya;
}

export const ROLE_LABELS: Record<string, string> = {
  customer: "Warga",
  staff: "Petugas",
  admin: "Admin",
  superadmin: "Super Admin",
};
