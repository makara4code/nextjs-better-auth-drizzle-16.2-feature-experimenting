export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="h-8 w-40 rounded-md bg-muted" />
        <div className="h-4 w-full max-w-2xl rounded-md bg-muted" />
      </div>
      <div className="grid gap-6">
        <div className="h-72 rounded-xl bg-muted" />
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-80 rounded-xl bg-muted" />
          <div className="h-80 rounded-xl bg-muted" />
          <div className="h-80 rounded-xl bg-muted" />
          <div className="h-80 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
