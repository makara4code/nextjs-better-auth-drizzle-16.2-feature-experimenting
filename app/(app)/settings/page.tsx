import { AppSettingsPanel } from "@/components/settings/app-settings-panel";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Control appearance preferences for this device, including theme mode,
          typography, scale, and accent color.
        </p>
      </div>
      <AppSettingsPanel />
    </div>
  );
}
