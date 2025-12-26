import {
  Layers,
  Cpu,
  Briefcase,
  Trophy,
  Film,
  Heart,
  FlaskConical,
  Landmark,
  Globe,
  Sparkles,
  MessageSquare,
  Scale,
  GraduationCap,
} from "lucide-react";

export const CATEGORIES = [
  { id: "all", name: "All", icon: Layers },
  { id: "technology", name: "Technology", icon: Cpu },
  { id: "business", name: "Business", icon: Briefcase },
  { id: "sports", name: "Sports", icon: Trophy },
  { id: "entertainment", name: "Entertainment", icon: Film },
  { id: "health", name: "Health", icon: Heart },
  { id: "science", name: "Science", icon: FlaskConical },
  { id: "politics", name: "Politics", icon: Landmark },
  { id: "world", name: "World", icon: Globe },
  { id: "lifestyle", name: "Lifestyle", icon: Sparkles },
  { id: "opinion", name: "Opinion", icon: MessageSquare },
  { id: "law", name: "Law", icon: Scale },
  { id: "education", name: "Education", icon: GraduationCap },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const getCategoryById = (id: string) =>
  CATEGORIES.find((c) => c.id === id.toLowerCase()) || CATEGORIES[0];

export const getCategoryByName = (name: string) =>
  CATEGORIES.find((c) => c.name.toLowerCase() === name.toLowerCase());
