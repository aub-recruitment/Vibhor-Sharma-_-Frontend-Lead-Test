import { createLazyFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Filter,
  LayoutGrid,
  Search,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { FilterSidebar, type Filters } from "@/components/FilterSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useApiQuery } from "@/hooks/useApiQuery";
import useLocalStorage from "@/hooks/useLocalStorage";
import { TableSkeleton } from "@/components/TableSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { Link } from "@tanstack/react-router";
import { useDebounce } from "use-debounce";

type ApiPackage = {
  type: string;
  name: string;
  hits: number;
  bandwidth: number;
  prev: {
    hits: number;
    bandwidth: number;
  };
};

type Package = {
  type: string;
  name: string;
  hits: {
    total: number;
    change: number | null;
  };
  bandwidth: {
    total: number;
    change: number | null;
  };
};

function PercentageChange({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span>-</span>;
  const isPositive = value >= 0;
  return (
    <span className={isPositive ? "text-green-600" : "text-red-600"}>
      {isPositive ? "+" : ""}
      {value.toFixed(2)}%
      {isPositive ? (
        <ArrowUp className="inline-block ml-1 h-4 w-4" />
      ) : (
        <ArrowDown className="inline-block ml-1 h-4 w-4" />
      )}
    </span>
  );
}

export const Route = createLazyFileRoute("/packages/")({
  component: Packages
});

type SortKey = "hits" | "bandwidth";

const initialFilters: Filters = {
  minHits: "",
  minBandwidth: "",
  period: "",
  specificMonth: "",
  specificQuarter: "",
  specificYear: ""
};

function Packages() {
  const [filters, setFilters] = useLocalStorage<Filters>(
    "packageFilters",
    initialFilters
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "asc" | "desc";
  } | null>({ key: "hits", direction: "desc" });

  const [debouncedSearch] = useDebounce(search, 500);

  const handleClearFilter = (filterKey: keyof Filters) => {
    setFilters({
      ...filters,
      [filterKey]: initialFilters[filterKey as keyof Filters]
    });
  };

  const handleClearAllFilters = () => {
    setFilters(initialFilters);
  };

  const appliedFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value !== initialFilters[key as keyof Filters]
  ).length;

  const apiPeriod =
    filters.period === "specific-month"
      ? filters.specificMonth
      : filters.period === "specific-quarter"
        ? filters.specificQuarter
        : filters.period === "specific-year"
          ? filters.specificYear
          : filters.period;

  const apiUrl = "https://data.jsdelivr.com/v1/stats/packages";
  const urlWithParams = new URL(apiUrl);
  if (apiPeriod) urlWithParams.searchParams.set("period", apiPeriod);

  // Only add pagination and sorting if there is no search query
  if (!debouncedSearch) {
    if (sortConfig) {
      urlWithParams.searchParams.set("by", sortConfig.key);
      urlWithParams.searchParams.set("order", sortConfig.direction);
    }
    urlWithParams.searchParams.set("page", String(page));
    urlWithParams.searchParams.set("limit", String(pageSize));
  }

  const {
    data: response,
    isLoading,
    error
  } = useApiQuery<ApiPackage[], true>({
    key: [
      "packages",
      apiPeriod,
      debouncedSearch ? null : sortConfig,
      debouncedSearch ? null : page,
      debouncedSearch ? null : pageSize
    ],
    url: urlWithParams.toString(),
    includeHeaders: true
  });

  const rawData = response?.data;
  const totalPages = Number(response?.headers["x-total-pages"] || 1);

  const data = useMemo(() => {
    if (!rawData) return [];
    return rawData.map((pkg): Package => {
      const hitsChange =
        pkg.prev.hits > 0
          ? ((pkg.hits - pkg.prev.hits) / pkg.prev.hits) * 100
          : pkg.hits > 0
            ? 100
            : 0;
      const bandwidthChange =
        pkg.prev.bandwidth > 0
          ? ((pkg.bandwidth - pkg.prev.bandwidth) / pkg.prev.bandwidth) * 100
          : pkg.bandwidth > 0
            ? 100
            : 0;

      return {
        type: pkg.type,
        name: pkg.name,
        hits: {
          total: pkg.hits,
          change: hitsChange
        },
        bandwidth: {
          total: pkg.bandwidth,
          change: bandwidthChange
        }
      };
    });
  }, [rawData]);

  const filteredData = useMemo(() => {
    if (!debouncedSearch) return data;
    return (
      data?.filter((pkg) =>
        pkg.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      ) || []
    );
  }, [data, debouncedSearch]);

  const sortedData = useMemo(() => {
    if (debouncedSearch) {
      const result = [...filteredData];
      if (sortConfig) {
        result.sort((a, b) => {
          let aValue: string | number;
          let bValue: string | number;
          switch (sortConfig.key) {
            case "hits":
              aValue = a.hits.total;
              bValue = b.hits.total;
              break;
            case "bandwidth":
              aValue = a.bandwidth.total;
              bValue = b.bandwidth.total;
              break;
            default:
              aValue = 0;
              bValue = 0;
          }
          if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        });
      }
      return result;
    }
    return filteredData;
  }, [filteredData, sortConfig, debouncedSearch]);

  const paginatedData = useMemo(() => {
    if (debouncedSearch) {
      const start = (page - 1) * pageSize;
      return sortedData.slice(start, start + pageSize);
    }
    return sortedData;
  }, [sortedData, page, pageSize, debouncedSearch]);

  const displayTotalPages = debouncedSearch
    ? Math.ceil(sortedData.length / pageSize)
    : totalPages;

  const requestSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="inline-block ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="inline-block ml-1 h-4 w-4" />
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center flex-wrap lg:flex-nowrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">GitHub Packages list</h1>
          <p className="text-muted-foreground">
            Explore information about different packages
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => setIsSidebarOpen(true)}>
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
          <Button variant="outline" size="icon">
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {appliedFiltersCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Applied Filters:</span>
          {filters.minHits && (
            <Badge variant="secondary">
              Min Hits: {filters.minHits}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1"
                onClick={() => handleClearFilter("minHits")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.minBandwidth && (
            <Badge variant="secondary">
              Min Bandwidth: {filters.minBandwidth}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1"
                onClick={() => handleClearFilter("minBandwidth")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.period !== initialFilters.period && (
            <Badge variant="secondary">
              Period: {filters.period}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1"
                onClick={() => handleClearFilter("period")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          <Button
            variant="ghost"
            className="text-sm text-red-500 hover:text-red-600"
            onClick={handleClearAllFilters}
          >
            Clear All
          </Button>
        </div>
      )}
      <div className="border rounded-md">
        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            Error: {error.message}
          </div>
        ) : data.length > 0 ? (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader className="bg-table-header-bg">
                <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                  <TableHead>Name</TableHead>
                  <TableHead onClick={() => requestSort("hits")}>
                    Hits (Billions) {getSortIcon("hits")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("bandwidth")}>
                    Bandwidth (GBs) {getSortIcon("bandwidth")}
                  </TableHead>
                  <TableHead>Hits Change</TableHead>
                  <TableHead>Bandwidth Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((pkg) => (
                  <TableRow
                    key={pkg.name}
                    className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r"
                  >
                    <TableCell className="font-medium">
                      <Link
                        to="/packages/$packageName"
                        params={{ packageName: pkg.name }}
                        search={{ type: pkg.type }}
                      >
                        {pkg.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {(pkg.hits.total / 1_000_000_000).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 }
                      )}
                    </TableCell>
                    <TableCell>
                      {(pkg.bandwidth.total / 1_000_000_000).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 }
                      )}
                    </TableCell>
                    <TableCell>
                      <PercentageChange value={pkg.hits.change} />
                    </TableCell>
                    <TableCell>
                      <PercentageChange value={pkg.bandwidth.change} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
      {!isLoading && !error && data.length > 0 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="flex items-center space-x-2">
            <span>Page</span>
            <Select
              value={String(page)}
              onValueChange={(value) => setPage(Number(value))}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: displayTotalPages }, (_, i) => (
                  <SelectItem key={`page-${i + 1}`} value={String(i + 1)}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>of {displayTotalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((prev) => Math.min(prev + 1, displayTotalPages))
            }
            disabled={page === displayTotalPages}
          >
            Next
          </Button>
        </div>
      )}
      <FilterSidebar
        isOpen={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        initialFilters={filters}
        onApply={setFilters}
      />
    </div>
  );
}
