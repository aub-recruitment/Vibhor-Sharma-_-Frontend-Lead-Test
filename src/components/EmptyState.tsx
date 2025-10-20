import { PackageSearch } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border rounded-md">
      <PackageSearch className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-semibold">No Packages Found</h2>
      <p className="text-muted-foreground">
        Try adjusting your search or filters to find what you're looking for.
      </p>
    </div>
  );
}
