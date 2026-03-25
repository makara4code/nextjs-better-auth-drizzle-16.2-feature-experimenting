"use client";

import * as React from "react";

import {
  APP_SETTINGS_STORAGE_KEY,
  defaultAppSettings,
  getPresetDefinition,
  sanitizeAppSettings,
  type AppAppearancePreset,
  type AppSettings,
} from "@/lib/app-settings";

type AppSettingsContextValue = {
  isLoaded: boolean;
  settings: AppSettings;
  setPreset: (value: AppAppearancePreset) => void;
  resetSettings: () => void;
};

const AppSettingsContext = React.createContext<AppSettingsContextValue | null>(
  null
);

function applyAppSettings(settings: AppSettings) {
  const root = document.documentElement;
  const preset = getPresetDefinition(settings.preset);

  root.dataset.fontFamily = preset.fontFamily;
  root.dataset.fontSize = preset.fontSize;
  root.dataset.themeColor = preset.themeColor;
  root.dataset.radius = preset.radius;
  root.dataset.shadow = preset.shadow;
}

function readStoredSettings() {
  try {
    const raw = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);

    if (!raw) {
      return defaultAppSettings;
    }

    return sanitizeAppSettings(JSON.parse(raw));
  } catch {
    return defaultAppSettings;
  }
}

export function AppSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = React.useState(defaultAppSettings);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    const resolvedSettings = readStoredSettings();

    applyAppSettings(resolvedSettings);
    setSettings(resolvedSettings);
    setIsLoaded(true);
  }, []);

  React.useEffect(() => {
    if (!isLoaded) {
      return;
    }

    applyAppSettings(settings);
    window.localStorage.setItem(
      APP_SETTINGS_STORAGE_KEY,
      JSON.stringify(settings)
    );
  }, [isLoaded, settings]);

  const value = {
    isLoaded,
    settings,
    setPreset: (preset: AppAppearancePreset) => setSettings({ preset }),
    resetSettings: () => setSettings(defaultAppSettings),
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = React.useContext(AppSettingsContext);

  if (!context) {
    throw new Error("useAppSettings must be used within AppSettingsProvider.");
  }

  return context;
}
