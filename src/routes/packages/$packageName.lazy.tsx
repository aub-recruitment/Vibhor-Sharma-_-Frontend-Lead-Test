import { createLazyFileRoute, useSearch } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowUpRightFromSquare,
  Book,
  Heart,
  Share2,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { useMemo } from "react";

// Types based on jsDelivr API
type PackageStats = {
  hits: {
    total: number;
    prev: { total: number };
  };
  bandwidth: {
    total: number;
    prev: { total: number };
  };
  versions: Record<string, { hits: number; bandwidth: number }>;
  dates: Record<string, { hits: number; bandwidth: number }>;
  tags: Record<string, string>;
};

type PackageVersionStat = {
  type: "version";
  version: string;
  hits: {
    total: number;
    dates: Record<string, number>;
  };
  bandwidth: {
    total: number;
    dates: Record<string, number>;
  };
  links: {
    self: string;
    files: string;
  };
};

type PackageVersionStats = PackageVersionStat[];

type PackageMetadata = {
  tags: Record<string, string>;
  versions: string[];
};

type NpmData = {
  time: Record<string, string>;
};

// Reusable Stat Card Component
const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  unit
}: {
  title: string;
  value: string;
  change: number | null;
  icon: React.ElementType;
  unit: string;
}) => {
  const isPositive = change != null && change >= 0;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {unit}
        </div>
        {change != null ? (
          <p
            className={`text-xs ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? "+" : ""}
            {change.toFixed(2)}%
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">-</p>
        )}
      </CardContent>
    </Card>
  );
};

function relativeDate(past: Date, now: Date): string {
  const diffMs = now.getTime() - past.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "Today";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export const Route = createLazyFileRoute("/packages/$packageName")({
  component: PackageDetails
});

function PackageDetails() {
  const { packageName } = Route.useParams();
  const search = useSearch({ from: "/packages/$packageName" });

  const type = search?.type || "npm";
  const now = new Date("2025-10-19");

  const { data: stats, isLoading: isLoadingStats } = useApiQuery<PackageStats>({
    key: ["packageStats", packageName],
    url: `https://data.jsdelivr.com/v1/stats/packages/${type}/${packageName}`,
    enabled: !!packageName
  });

  const { data: weekStats, isLoading: isLoadingWeekStats } =
    useApiQuery<PackageVersionStats>({
      key: ["packageWeekStats", packageName],
      url: `https://data.jsdelivr.com/v1/stats/packages/${type}/${packageName}/versions?period=week`,
      enabled: !!packageName
    });

  const { data: metadata, isLoading: isLoadingMetadata } =
    useApiQuery<PackageMetadata>({
      key: ["packageMetadata", packageName],
      url: `https://data.jsdelivr.com/v1/package/${type}/${packageName}`,
      enabled: !!packageName
    });

  const { data: npmData, isLoading: isLoadingNpm } = useApiQuery<NpmData>({
    key: ["npmData", packageName],
    url: `https://registry.npmjs.org/${encodeURIComponent(packageName)}`,
    enabled: !!packageName && type === "npm"
  });

  const versionHitsMap = useMemo(() => {
    const map = new Map<string, number>();
    weekStats?.forEach((v) => {
      map.set(v.version, v.hits.total);
    });
    return map;
  }, [weekStats]);

  console.log(
    "%csrc/routes/packages/$packageName.lazy.tsx:106 stats",
    "color: #007acc;",
    stats
  );

  console.log(
    "%csrc/routes/packages/$packageName.lazy.tsx:114 metadata",
    "color: #007acc;",
    metadata
  );

  const { hitsChange, bandwidthChange } = useMemo(() => {
    if (!stats) {
      return { hitsChange: null, bandwidthChange: null };
    }

    const hitsChange =
      stats.hits.prev.total > 0
        ? ((stats.hits.total - stats.hits.prev.total) / stats.hits.prev.total) *
          100
        : stats.hits.total > 0
          ? 100
          : 0;

    const bandwidthChange =
      stats.bandwidth.prev.total > 0
        ? ((stats.bandwidth.total - stats.bandwidth.prev.total) /
            stats.bandwidth.prev.total) *
          100
        : stats.bandwidth.total > 0
          ? 100
          : 0;

    return { hitsChange, bandwidthChange };
  }, [stats]);

  const chartData = useMemo(
    () =>
      Object.entries(stats?.dates || {})
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
          }),
          hits: data.hits,
          bandwidth: data.bandwidth
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
    [stats]
  );

  if (
    isLoadingStats ||
    isLoadingWeekStats ||
    isLoadingMetadata ||
    (type === "npm" && isLoadingNpm)
  ) {
    return <div>Loading...</div>; // Replace with a skeleton loader later
  }

  if (!stats || !weekStats || !metadata || (type === "npm" && !npmData)) {
    return <div>Package not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{packageName}</h1>
              <p className="text-muted-foreground">
                Download description for downloading {packageName}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Heart className="mr-2 h-4 w-4" /> Favourite
              </Button>
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
              <Button>
                <Book className="mr-2 h-4 w-4" /> Repository
              </Button>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="HITS"
              value={(stats.hits.total / 1_000_000_000).toFixed(2)}
              unit="B"
              change={hitsChange}
              icon={ArrowDownToLine}
            />
            <StatCard
              title="BANDWIDTH"
              value={(stats.bandwidth.total / 1_000_000_000).toFixed(2)}
              unit="GB"
              change={bandwidthChange}
              icon={ArrowUpRightFromSquare}
            />
            <StatCard
              title="HITS CHANGE"
              value=""
              unit=""
              change={hitsChange}
              icon={ArrowUp}
            />
            <StatCard
              title="BANDWIDTH CHANGE"
              value=""
              unit=""
              change={bandwidthChange}
              icon={ArrowDown}
            />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current tags</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Downloads (Last 7 days)</TableHead>
                    <TableHead>Tag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(metadata.tags || {}).map(([tag, version]) => (
                    <TableRow key={tag}>
                      <TableCell>{version}</TableCell>
                      <TableCell>
                        {(versionHitsMap.get(version) ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell>{tag}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Version history</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Downloads (Last 7 days)</TableHead>
                    <TableHead>Published</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {type === "npm" &&
                    metadata.versions?.map((version) => {
                      const publishDateStr = npmData?.time?.[version];
                      const publishDate = publishDateStr
                        ? new Date(publishDateStr)
                        : null;
                      const relative = publishDate
                        ? relativeDate(publishDate, now)
                        : "Unknown";
                      return (
                        <TableRow key={version}>
                          <TableCell>{version}</TableCell>
                          <TableCell>
                            {(
                              versionHitsMap.get(version) ?? 0
                            ).toLocaleString()}
                          </TableCell>
                          <TableCell>{relative}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Package Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px] w-full">
              <AreaChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="hits"
                  type="natural"
                  fill="#8884d8"
                  fillOpacity={0.4}
                  stroke="#8884d8"
                />
                <Area
                  dataKey="bandwidth"
                  type="natural"
                  fill="#82ca9d"
                  fillOpacity={0.4}
                  stroke="#82ca9d"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
