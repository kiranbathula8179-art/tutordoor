import { Construction } from "lucide-react";

import { Card, CardBody } from "@/components/ui/Card";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy">{title}</h1>
      <Card className="mt-6">
        <CardBody className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Construction className="h-8 w-8 text-slate-400" />
          <p className="font-medium text-navy">This section is being built next.</p>
          <p className="max-w-sm text-sm text-slate-500">
            The layout, navigation, and auth for this portal are fully wired — this feature's detailed screen
            follows in the next build pass.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
