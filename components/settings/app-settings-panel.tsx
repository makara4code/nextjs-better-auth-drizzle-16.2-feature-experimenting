"use client";

import * as React from "react";
import {
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  RotateCcwIcon,
  SparklesIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

import { useAppSettings } from "@/components/app-settings-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  appearancePresetOptions,
  getPresetDefinition,
} from "@/lib/app-settings";
import { cn } from "@/lib/utils";

const themeModeOptions = [
  {
    value: "light",
    label: "Light",
    description: "Always use the bright theme.",
    icon: SunIcon,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always use the dark theme.",
    icon: MoonIcon,
  },
  {
    value: "system",
    label: "System",
    description: "Follow the device appearance.",
    icon: MonitorIcon,
  },
] as const;

const presetSwatches: Record<(typeof appearancePresetOptions)[number], string> = {
  graphite: "bg-zinc-900 dark:bg-zinc-100",
  ocean: "bg-sky-500 dark:bg-sky-300",
  emerald: "bg-emerald-500 dark:bg-emerald-300",
  amber: "bg-amber-500 dark:bg-amber-300",
  mono: "bg-zinc-500 dark:bg-zinc-300",
};

function OptionButton({
  isActive,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  isActive?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full flex-col items-start gap-2 rounded-xl border px-4 py-3 text-left transition-colors",
        "hover:border-primary/50 hover:bg-muted/60",
        isActive
          ? "border-primary bg-primary/5 shadow-xs"
          : "border-border bg-card",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function formatRadiusLabel(radius: string) {
  switch (radius) {
    case "compact":
      return "compact";
    case "default":
      return "default";
    case "soft":
      return "soft";
    case "rounded":
      return "rounded";
    default:
      return radius;
  }
}

function formatShadowLabel(shadow: string) {
  switch (shadow) {
    case "flat":
      return "flat";
    case "soft":
      return "soft";
    case "lifted":
      return "lifted";
    default:
      return shadow;
  }
}

function formatFontLabel(fontFamily: string) {
  switch (fontFamily) {
    case "geist":
      return "Geist";
    case "inter":
      return "Inter";
    default:
      return fontFamily;
  }
}

function formatFontSizeLabel(fontSize: string) {
  switch (fontSize) {
    case "sm":
      return "small";
    case "md":
      return "default";
    case "lg":
      return "large";
    case "xl":
      return "extra large";
    default:
      return fontSize;
  }
}

export function AppSettingsPanel() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const { isLoaded, settings, setPreset, resetSettings } = useAppSettings();
  const [isThemeReady, setIsThemeReady] = React.useState(false);

  React.useEffect(() => {
    setIsThemeReady(true);
  }, []);

  const activeThemeMode = isThemeReady ? (theme ?? "system") : "system";
  const themePreviewLabel = !isThemeReady
    ? "Following system."
    : theme === "system"
      ? `Following system (${resolvedTheme ?? "light"}).`
      : `Locked to ${theme ?? "light"}.`;
  const activePreset = getPresetDefinition(settings.preset);

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden border-dashed bg-muted/20">
        <CardHeader className="border-b border-border/70">
          <CardTitle>Personalize your workspace</CardTitle>
          <CardDescription>
            Choose a complete appearance preset instead of mixing typography,
            radius, and shadows one by one.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-2xl border border-border/70 bg-background p-5">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Live preview
            </p>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <PaletteIcon className="size-5" />
                </div>
                <div>
                  <p className="text-base font-semibold tracking-tight">
                    {activePreset.label} preset
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activePreset.description}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-card p-4">
                  <p className="text-sm font-medium">Typography</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatFontLabel(activePreset.fontFamily)} with{" "}
                    {formatFontSizeLabel(activePreset.fontSize)} scale.
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card p-4">
                  <p className="text-sm font-medium">Surface style</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatRadiusLabel(activePreset.radius)} radius with{" "}
                    {formatShadowLabel(activePreset.shadow)} depth.
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card p-4 sm:col-span-2">
                  <p className="text-sm font-medium">Theme</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {themePreviewLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Quick actions
            </p>
            <div className="mt-4 space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setTheme("system");
                  resetSettings();
                }}
              >
                <RotateCcwIcon className="size-4" />
                Reset appearance preferences
              </Button>
              <p className="text-sm leading-6 text-muted-foreground">
                Each preset locks its own accent, typography, corners, and depth
                so the interface stays visually coherent.
              </p>
              {!isLoaded ? (
                <p className="text-sm text-muted-foreground">
                  Loading saved preferences...
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Theme mode</CardTitle>
            <CardDescription>
              Choose how light and dark surfaces should behave across the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {themeModeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = activeThemeMode === option.value;

              return (
                <OptionButton
                  key={option.value}
                  isActive={isActive}
                  onClick={() => setTheme(option.value)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </OptionButton>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance preset</CardTitle>
            <CardDescription>
              Pick a complete visual system with its own accent, typography,
              radius, and shadow style.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {appearancePresetOptions.map((presetKey) => {
              const preset = getPresetDefinition(presetKey);

              return (
                <OptionButton
                  key={presetKey}
                  isActive={settings.preset === presetKey}
                  onClick={() => setPreset(presetKey)}
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{preset.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {preset.description}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {formatFontLabel(preset.fontFamily)} . {formatRadiusLabel(preset.radius)} . {formatShadowLabel(preset.shadow)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "mt-1 size-6 shrink-0 rounded-full border border-black/10 shadow-xs dark:border-white/10",
                        presetSwatches[presetKey]
                      )}
                    />
                  </div>
                </OptionButton>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
