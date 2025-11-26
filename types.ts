export enum Complexity {
  LOW = 'Baja',
  MEDIUM = 'Media',
  HIGH = 'Alta'
}

export type FixedRole = 
  | 'Product Owner'
  | 'Back-end Developer'
  | 'Front-end Developer'
  | 'QA Engineer'
  | 'UI/UX Designer';

export const FIXED_ROLES: FixedRole[] = [
  'Product Owner',
  'Back-end Developer',
  'Front-end Developer',
  'QA Engineer',
  'UI/UX Designer'
];

export interface PhaseTask {
  name: string;
  hours: number;
  cost: number;
  assignedRole: string;
  hourlyRate: number;
}

export interface PhaseEstimate {
  name: string;
  description: string;
  estimatedHours: number;
  estimatedCost: number;
  complexity: Complexity;
  assignedRole: string;
  tasks: PhaseTask[];
}

export interface Risk {
  risk: string;
  mitigation: string;
  impact: 'Alto' | 'Medio' | 'Bajo';
}

export interface RoleRate {
  role: string;
  rate: number;
  currency: string;
}

export interface CostBreakdownItem {
  role: string;
  totalHours: number;
  hourlyRate: number;
  subtotalCost: number;
  currency: string;
}

export interface RoadmapItem {
  phaseName: string;
  startWeek: number;
  endWeek: number;
  milestone: string;
}

export interface EstimationResult {
  projectName: string;
  requesterName: string;
  requestDate: string;
  executiveSummary: string;
  totalEstimatedCost: {
    min: number;
    max: number;
    currency: string;
  };
  totalEstimatedDurationWeeks: {
    min: number;
    max: number;
  };
  totalEstimatedHours: {
    min: number;
    max: number;
  };
  hourlyRates: RoleRate[];
  costBreakdown: CostBreakdownItem[];
  roadmap: RoadmapItem[];
  recommendedTechStack: string[];
  phases: PhaseEstimate[];
  risks: Risk[];
  teamComposition: string[];
}

export type AppState = 'input' | 'analyzing' | 'result' | 'error';

export interface ProjectMetadata {
  projectName: string;
  requesterName: string;
  date: string;
  userRates: Record<FixedRole, number>;
}