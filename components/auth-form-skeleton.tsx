import { Card, CardContent } from "@/components/ui/card";
import { FieldDescription, FieldGroup, FieldSeparator } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type AuthField = {
  label: string;
  hint?: string;
};

type AuthFormSkeletonProps = {
  title: string;
  description: string;
  fields: AuthField[];
  submitLabel: string;
  separatorText: string;
  bottomPrompt: string;
  bottomAction: string;
  showSocialButtons?: boolean;
  legalText: string;
};

function SkeletonBar({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("relative", className)}>
      <div className="invisible">{children}</div>
      <div className="absolute inset-0 flex items-center">
        <div className="h-full w-full rounded bg-muted" />
      </div>
    </div>
  );
}

export function AuthFormSkeleton({
  title,
  description,
  fields,
  submitLabel,
  separatorText,
  bottomPrompt,
  bottomAction,
  showSocialButtons = false,
  legalText,
}: AuthFormSkeletonProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="relative">
                  <h1 className="invisible text-2xl font-bold">{title}</h1>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-full rounded bg-muted" />
                  </div>
                </div>
                <div className="relative w-full">
                  <p className="invisible text-balance text-muted-foreground">
                    {description}
                  </p>
                  <div className="absolute inset-0 flex flex-col justify-center gap-2">
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-4/5 self-center rounded bg-muted" />
                  </div>
                </div>
              </div>

              {fields.map((field) => (
                <div key={field.label} className="flex w-full flex-col gap-3">
                  <div className="relative w-fit">
                    <div className="invisible text-sm leading-snug font-medium">
                      {field.label}
                    </div>
                    <div className="absolute inset-0 flex items-center">
                      <div className="h-4 w-full rounded bg-muted" />
                    </div>
                  </div>

                  <div className="relative">
                    {field.hint ? (
                      <div className="mb-3 flex items-center">
                        <div className="invisible text-sm leading-snug font-medium">
                          {field.label}
                        </div>
                        <div className="ml-auto invisible text-sm text-muted-foreground">
                          {field.hint}
                        </div>
                      </div>
                    ) : null}
                    <div className="h-9 rounded-md bg-muted" />
                  </div>
                </div>
              ))}

              <div className="h-5" />

              <SkeletonBar className="h-9 rounded-md">
                <div className="inline-flex items-center justify-center rounded-md px-2.5 text-sm font-medium">
                  {submitLabel}
                </div>
              </SkeletonBar>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                {separatorText}
              </FieldSeparator>

              {showSocialButtons ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-9 rounded-md border border-border bg-background" />
                  <div className="h-9 rounded-md border border-border bg-background" />
                  <div className="h-9 rounded-md border border-border bg-background" />
                </div>
              ) : null}

              <FieldDescription className="text-center">
                <span className="invisible">
                  {bottomPrompt ? `${bottomPrompt} ${bottomAction}.` : `${bottomAction}.`}
                </span>
              </FieldDescription>
            </FieldGroup>
          </div>

          <div className="relative hidden bg-muted md:block">
            <img
              src="https://ui.shadcn.com/placeholder.svg"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        <span className="invisible">{legalText}</span>
      </FieldDescription>
    </div>
  );
}
