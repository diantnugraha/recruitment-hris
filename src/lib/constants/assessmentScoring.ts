export const HR_SCORING_CRITERIA = [
  { key: "relevanceOfExperience", label: "Relevance of Experience" },
  { key: "trainingUndertaken", label: "Training Undertaken" },
  { key: "technicalSkills", label: "Technical Skills" },
  { key: "nonTechnicalSkills", label: "Non-Technical Skills" },
  { key: "communicationSkills", label: "Communication Skills" },
  { key: "emotionalMaturity", label: "Emotional Maturity" },
  { key: "understandingOfPosition", label: "Understanding of the Applied Position" },
  { key: "teamworkAbility", label: "Ability to Work Collaboratively in a Team" },
] as const;

export const SCORE_OPTIONS = [
  { value: 1, label: "Very Poor" },
  { value: 2, label: "Poor" },
  { value: 3, label: "Fair" },
  { value: 4, label: "Good" },
  { value: 5, label: "Excellent" },
] as const;

export type HRScoringKey = typeof HR_SCORING_CRITERIA[number]["key"];
export type HRConclusion = "proceed" | "recommended" | "rejected" | null;

export const CONCLUSION_OPTIONS = [
  { value: "proceed", label: "Proceed" },
  { value: "recommended", label: "Recommended" },
  { value: "rejected", label: "Rejected" },
] as const;

// Map camelCase scoring keys to snake_case API keys
export const SCORING_KEY_MAP: Record<HRScoringKey, string> = {
  relevanceOfExperience: "relevance_of_experience",
  trainingUndertaken: "training_undertaken",
  technicalSkills: "technical_skills",
  nonTechnicalSkills: "non_technical_skills",
  communicationSkills: "communication_skills",
  emotionalMaturity: "emotional_maturity",
  understandingOfPosition: "understanding_of_position",
  teamworkAbility: "teamwork_ability",
};
