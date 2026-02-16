import type { TemplateCustomization } from "../../../milkly-backend/src/types";

export const TONES = [
  { id: "professional", name: "Professional", description: "Authoritative and polished." },
  { id: "casual", name: "Casual", description: "Relaxed and conversational." },
  { id: "playful", name: "Playful", description: "Fun and energetic with humor." },
  { id: "formal", name: "Formal", description: "Traditional and respectful." },
  { id: "friendly", name: "Friendly", description: "Warm and approachable." },
] as const;

export const NEWSLETTER_TYPES = [
  { id: "tech", name: "Tech", description: "Developer news, AI tools, stacks." },
  { id: "digest", name: "Digest", description: "News roundups, curated links." },
  { id: "brand", name: "Brand", description: "Company updates, product news." },
  { id: "b2b", name: "B2B", description: "Industry insights, whitepapers." },
  { id: "personal", name: "Personal", description: "Blog-style, creator content." },
  { id: "educational", name: "Educational", description: "Tutorials, lessons, tips." },
];

export const DEFAULT_CUSTOMIZATION: TemplateCustomization = {
  primaryColor: "#4A3728",
  accentColor: "#D4A574",
  includeFooterCTA: true,
  tone: "professional",
  newsletterType: "digest",
};
