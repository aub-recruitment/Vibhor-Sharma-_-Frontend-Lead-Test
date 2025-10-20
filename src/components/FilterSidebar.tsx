import { Check } from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type Filters = {
  minHits: string;
  minBandwidth: string;
  period: string;
  specificMonth: string;
  specificQuarter: string;
  specificYear: string;
};

interface FilterSidebarProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  initialFilters: Filters;
  onApply: (filters: Filters) => void;
}

const PeriodItem = ({
  value,
  label,
  currentPeriod,
  onClick
}: {
  value: string;
  label: string;
  currentPeriod: string;
  onClick: (value: string) => void;
}) => (
  <button
    type="button"
    className={cn(
      "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted w-full text-left",
      currentPeriod === value && "bg-muted"
    )}
    onClick={() => onClick(value)}
  >
    <span>{label}</span>
    {currentPeriod === value && <Check className="h-4 w-4" />}
  </button>
);

const periodOptions = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "s-month", label: "s - month" },
  { value: "s-quarter", label: "s - quarter" },
  { value: "s-year", label: "s - year" }
];

const specificPeriodOptions = [
  { value: "specific-month", label: "Specific month" },
  { value: "specific-quarter", label: "Specific quarter" },
  { value: "specific-year", label: "Specific year" }
];

export function FilterSidebar({
  isOpen,
  onOpenChange,
  initialFilters,
  onApply
}: FilterSidebarProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const handleApply = () => {
    onApply(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    onApply(initialFilters);
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Filter</SheetTitle>
        </SheetHeader>
        <div className="grid gap-6 p-4 overflow-y-auto">
          <div className="grid gap-2">
            <Label htmlFor="min-hits">Minimum Hits (Billions)</Label>
            <Input
              id="min-hits"
              placeholder="Filter by hits"
              value={filters.minHits}
              onChange={(e) =>
                setFilters({ ...filters, minHits: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="min-bandwidth">Minimum Bandwidth (GBs)</Label>
            <Input
              id="min-bandwidth"
              placeholder="Filter by bandwidth"
              value={filters.minBandwidth}
              onChange={(e) =>
                setFilters({ ...filters, minBandwidth: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Region</Label>
            {periodOptions.map((opt) => (
              <PeriodItem
                key={opt.value}
                {...opt}
                currentPeriod={filters.period}
                onClick={(value) => setFilters({ ...filters, period: value })}
              />
            ))}
            {/* <Accordion type="single" collapsible>
              <AccordionItem value="specific-periods">
                <AccordionTrigger className="p-2">
                  Specific period
                </AccordionTrigger>
                <AccordionContent className="pl-2"> */}
            {specificPeriodOptions.map((opt) => (
              <PeriodItem
                key={opt.value}
                {...opt}
                currentPeriod={filters.period}
                onClick={(value) => setFilters({ ...filters, period: value })}
              />
            ))}
            {/* </AccordionContent>
              </AccordionItem>
            </Accordion> */}
          </div>
          {filters.period === "specific-month" && (
            <div className="grid gap-2">
              <Label htmlFor="specific-month">Specific month</Label>
              <Input
                id="specific-month"
                placeholder="e.g., 2025-01"
                value={filters.specificMonth}
                onChange={(e) =>
                  setFilters({ ...filters, specificMonth: e.target.value })
                }
              />
            </div>
          )}
          {filters.period === "specific-quarter" && (
            <div className="grid gap-2">
              <Label htmlFor="specific-quarter">Specific quarter</Label>
              <Input
                id="specific-quarter"
                placeholder="e.g., 2025-Q1"
                value={filters.specificQuarter}
                onChange={(e) =>
                  setFilters({ ...filters, specificQuarter: e.target.value })
                }
              />
            </div>
          )}
          {filters.period === "specific-year" && (
            <div className="grid gap-2">
              <Label htmlFor="specific-year">Specific year</Label>
              <Input
                id="specific-year"
                placeholder="e.g., 2025"
                value={filters.specificYear}
                onChange={(e) =>
                  setFilters({ ...filters, specificYear: e.target.value })
                }
              />
            </div>
          )}
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
