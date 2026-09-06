export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <p className="font-medium">This screen is coming in the next step</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The route, sidebar entry and title are already in place.
        </p>
      </div>
    </div>
  );
}
