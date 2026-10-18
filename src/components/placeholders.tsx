import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * A screen (or section) for a feature that isn't built yet but is part of the
 * product vision. Shows a "Coming soon" badge, a one-paragraph explainer and
 * optional sample content.
 */
export function ComingSoon({
  title,
  explainer,
  children,
}: {
  title: string;
  explainer: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Card data-placeholder="coming-soon">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{title}</CardTitle>
          <Badge variant="secondary">Coming soon</Badge>
        </div>
        <CardDescription className="max-w-prose">{explainer}</CardDescription>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}

/** A single muted line for something planned for a later version. */
export function LaterLine({ children }: { children: React.ReactNode }) {
  return (
    <p data-placeholder="later" className="text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function PageHeader({ title, description }: { title: string; description?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

/**
 * Temporary stand-in for a screen whose ticket hasn't landed yet. Distinct from
 * ComingSoon, which marks features that are deliberately placeholders in the MVP.
 */
export function UnderConstruction({ issue }: { issue: number }) {
  return (
    <p data-placeholder="under-construction" className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
      This screen is being built (GitHub issue #{issue}).
    </p>
  );
}
