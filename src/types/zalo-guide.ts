export type GuideSystemKey = "care" | "pro" | "ai" | "zcare";

export interface ZaloGuideItem {
  id: number;
  title: string;
  link: string;
  image: string;
  systems?: GuideSystemKey[];
}

export interface ZaloGuideFormPayload {
  id: number | null;
  title: string;
  link: string;
  image: string;
  systems: GuideSystemKey[];
}