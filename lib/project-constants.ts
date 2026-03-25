export const projectStatusOptions = ["planning", "active", "archived"] as const;

export type ProjectStatus = (typeof projectStatusOptions)[number];
