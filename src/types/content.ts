// FAQs
export interface FAQ {
  id: number;
  question: string;
  answer: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}
