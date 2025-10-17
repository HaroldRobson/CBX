export interface Project {
  id: string;
  name: string;
  proponent: string;
  projectType: string;
  afolzuActivities: string;
  methodology: string;
  status: string;
  country: string;
  estimatedEmissions: string;
  region: string;
  registrationDate: string;
  creditingPeriodStart: string;
  creditingPeriodEnd: string;
  score: number;
}

export interface SearchIndex {
  projects: Record<string, {
    name: string;
    score: number;
    country: string;
    status: string;
  }>;
  total: number;
  lastUpdated: string;
} 