export const REGIONS = ["서울", "경기", "인천", "기타"] as const;
export const JOB_TYPES = ["경비", "청소", "조리", "돌봄", "기타"] as const;

export type Region = (typeof REGIONS)[number];
export type JobType = (typeof JOB_TYPES)[number];
