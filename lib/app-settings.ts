export const APP_SETTINGS_STORAGE_KEY = "next-16-starter-settings";

export const appearancePresetOptions = [
  "graphite",
  "ocean",
  "emerald",
  "amber",
  "mono",
] as const;

export type AppAppearancePreset = (typeof appearancePresetOptions)[number];

export type AppPresetDefinition = {
  label: string;
  description: string;
  themeColor: AppAppearancePreset;
  fontFamily: "inter" | "geist";
  fontSize: "sm" | "md" | "lg" | "xl";
  radius: "compact" | "default" | "soft" | "rounded";
  shadow: "flat" | "soft" | "lifted";
};

export type AppSettings = {
  preset: AppAppearancePreset;
};

export const appPresetDefinitions: Record<
  AppAppearancePreset,
  AppPresetDefinition
> = {
  graphite: {
    label: "Graphite",
    description: "Clean neutral surfaces with balanced spacing and quiet depth.",
    themeColor: "graphite",
    fontFamily: "inter",
    fontSize: "md",
    radius: "default",
    shadow: "soft",
  },
  ocean: {
    label: "Ocean",
    description: "Cool blue accents with softer corners and a slightly lifted shell.",
    themeColor: "ocean",
    fontFamily: "inter",
    fontSize: "md",
    radius: "soft",
    shadow: "lifted",
  },
  emerald: {
    label: "Emerald",
    description: "Fresh green highlights with calm rounded surfaces.",
    themeColor: "emerald",
    fontFamily: "inter",
    fontSize: "md",
    radius: "soft",
    shadow: "soft",
  },
  amber: {
    label: "Amber",
    description: "Warm editorial energy with crisp contrast and classic spacing.",
    themeColor: "amber",
    fontFamily: "inter",
    fontSize: "md",
    radius: "default",
    shadow: "soft",
  },
  mono: {
    label: "Mono",
    description: "Terminal-inspired monochrome with squared edges and flat surfaces.",
    themeColor: "mono",
    fontFamily: "geist",
    fontSize: "md",
    radius: "compact",
    shadow: "flat",
  },
};

export const defaultAppSettings: AppSettings = {
  preset: "graphite",
};

export function isAppearancePreset(
  value: string
): value is AppAppearancePreset {
  return appearancePresetOptions.includes(value as AppAppearancePreset);
}

export function getPresetDefinition(preset: AppAppearancePreset) {
  return appPresetDefinitions[preset];
}

type LegacyAppSettings = Partial<{
  fontFamily: string;
  fontSize: string;
  themeColor: string;
  radius: string;
  shadow: string;
  preset: string;
}>;

function inferLegacyPreset(value: LegacyAppSettings): AppAppearancePreset {
  if (value.themeColor === "mono") {
    return "mono";
  }

  if (value.themeColor && isAppearancePreset(value.themeColor)) {
    return value.themeColor;
  }

  return defaultAppSettings.preset;
}

export function sanitizeAppSettings(
  value: LegacyAppSettings | null | undefined
): AppSettings {
  if (value?.preset && isAppearancePreset(value.preset)) {
    return {
      preset: value.preset,
    };
  }

  return {
    preset: inferLegacyPreset(value ?? {}),
  };
}
