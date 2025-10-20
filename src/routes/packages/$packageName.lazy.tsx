import { createLazyFileRoute, useSearch } from "@tanstack/react-router";
import { Book, Heart, Share2 } from "lucide-react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
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
  ChartTooltipContent,
  ChartLegend
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useMemo, type ReactNode } from "react";
import { PackageDetailsSkeleton } from "@/components/PackageDetailsSkeleton";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { Badge } from "@/components/ui/badge";
import { TbDownload } from "react-icons/tb";
import { HiMiniArrowsUpDown, HiMiniArrowUp } from "react-icons/hi2";

dayjs.extend(relativeTime);
type StatDetails = {
  rank?: number;
  typeRank?: number;
  total: number;
  dates: Record<string, number>;
  prev?: {
    rank?: number;
    typeRank?: number;
    total: number;
  };
};

type PackageStats = {
  hits: StatDetails;
  bandwidth: StatDetails;
};

type PackageVersionStat = {
  type: string;
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

type NpmPackageMetadata = {
  tags: Record<string, string>;
  versions: string[];
};
type GhPackageTag = {
  commit: { sha: string; date: string };
};
type GhPackageMetadata = {
  tags: Record<string, GhPackageTag>;
  versions: string[];
};
type PackageMetadata = NpmPackageMetadata | GhPackageMetadata;

type NpmData = {
  time: Record<string, string>;
};

// Reusable Stat Card Component
const StatCard = ({
  title,
  value,
  icon,
  unit
}: {
  title: string;
  value: React.ReactNode;
  icon: ReactNode;
  unit?: string;
}) => {
  return (
    <Card>
      <CardContent>
        <div className="flex gap-2">
          <div>{icon}</div>
          <div>
            <div className="text-sm font-medium text-gray-400">{title}</div>
            <div className="text-xl font-bold">
              {value}
              {unit}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function relativeDate(past: Date): string {
  return dayjs(past).fromNow();
}

export const Route = createLazyFileRoute("/packages/$packageName")({
  component: PackageDetails
});

const chartConfig = {
  hits: {
    label: "Hits",
    color: "#8C96FC"
  },
  bandwidthInGB: {
    label: "Bandwidth (GB)",
    color: "#B774FC"
  }
};

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short"
});

function PackageDetails() {
  const { packageName } = Route.useParams();
  const search = useSearch({ from: "/packages/$packageName" });

  const type = search?.type || "npm";
  const isGh = type === "gh";

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

  const { hitsChange, bandwidthChange } = useMemo(() => {
    if (!stats?.hits?.prev || !stats?.bandwidth?.prev)
      return { hitsChange: null, bandwidthChange: null };

    const hitsChange =
      stats.hits.prev.total !== 0
        ? ((stats.hits.total - stats.hits.prev.total) / stats.hits.prev.total) *
          100
        : 0;

    const bandwidthChange =
      stats.bandwidth.prev.total !== 0
        ? ((stats.bandwidth.total - stats.bandwidth.prev.total) /
            stats.bandwidth.prev.total) *
          100
        : 0;

    return { hitsChange, bandwidthChange };
  }, [stats]);

  const chartData = useMemo(() => {
    if (!stats?.hits?.dates) return [];

    const hitsDates = stats.hits.dates;
    const bandwidthDates = stats.bandwidth.dates || {};

    return Object.keys(hitsDates)
      .map((date) => ({
        date: new Date(date),
        hits: hitsDates[date],
        bandwidthInGB: bandwidthDates[date] || 0
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [stats]);

  if (
    isLoadingStats ||
    isLoadingWeekStats ||
    isLoadingMetadata ||
    (type === "npm" && isLoadingNpm)
  ) {
    return <PackageDetailsSkeleton />;
  }

  if (!stats || !weekStats || !metadata || (!isGh && !npmData)) {
    return <div>Package not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start flex-wrap lg:flex-nowrap gap-4">
            <div className="flex gap-4">
              <div className="w-14 h-14 bg-[#8C96FC] rounded-md"></div>
              <div className="flex flex-col gap-2">
                <h1 className="text-lg lg:text-xl font-bold">{packageName}</h1>
                <div className="flex items-center gap-2">
                  <Badge>{type === "npm" ? "npm" : "GitHub"}</Badge>
                  <div className="text-sm">v{weekStats?.[0]?.version}</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Download description for downloading {packageName}
                </p>
              </div>
            </div>
            <div className="flex space-x-2 flex-wrap lg:flex-nowrap gap-4">
              <Button variant="outline">
                <Heart className="mr-2 h-4 w-4" /> Favorite
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
              value={`${(stats.hits.total / 1_000_000_000).toFixed(2)}B`}
              icon={<TbDownload size={30} className="text-[#555BFF]" />}
            />
            <StatCard
              title="BANDWIDTH"
              value={(stats.bandwidth.total / 1_000_000_000).toFixed(2)}
              unit="GB"
              icon={<HiMiniArrowsUpDown size={30} className="text-[#555BFF]" />}
            />
            <StatCard
              title="HITS CHANGE"
              value={
                hitsChange === null ? (
                  <span>-</span>
                ) : (
                  <span
                    className={
                      hitsChange === null
                        ? ""
                        : hitsChange > 0
                          ? "text-green-600"
                          : "text-red-600"
                    }
                  >
                    {bandwidthChange > 0 ? "+" : ""}
                    {hitsChange?.toFixed(2)}%
                  </span>
                )
              }
              icon={<HiMiniArrowUp size={30} className="text-[#84CC16]" />}
            />
            <StatCard
              title="BANDWIDTH CHANGE"
              value={
                bandwidthChange === null ? (
                  <span>-</span>
                ) : (
                  <span
                    className={
                      bandwidthChange === null
                        ? ""
                        : bandwidthChange > 0
                          ? "text-green-600"
                          : bandwidthChange < 0
                            ? "text-red-600"
                            : ""
                    }
                  >
                    {bandwidthChange > 0 ? "+" : ""}
                    {bandwidthChange?.toFixed(2)}%
                  </span>
                )
              }
              icon={<HiMiniArrowsUpDown size={30} className="text-[#8C96FC]" />}
            />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader className="bg-table-header-bg">
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Downloads (Last 7 days)</TableHead>
                      <TableHead>Tag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isGh
                      ? Object.entries(
                          (metadata as GhPackageMetadata).tags || {}
                        )
                          .slice(0, 5)
                          .map(([tagName]) => (
                            <TableRow key={tagName}>
                              <TableCell>{tagName}</TableCell>
                              <TableCell>
                                {(
                                  versionHitsMap.get(tagName) ?? 0
                                ).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {tagName.includes("beta")
                                  ? "beta"
                                  : tagName.includes("alpha")
                                    ? "alpha"
                                    : "latest"}
                              </TableCell>
                            </TableRow>
                          ))
                      : Object.entries(
                          (metadata as NpmPackageMetadata).tags || {}
                        ).map(([tag, version]) => (
                          <TableRow key={tag}>
                            <TableCell>{version}</TableCell>
                            <TableCell>
                              {(
                                versionHitsMap.get(version) ?? 0
                              ).toLocaleString()}
                            </TableCell>
                            <TableCell>{tag}</TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Version history</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader className="bg-table-header-bg">
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Hits</TableHead>
                      <TableHead>Published</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isGh
                      ? weekStats?.map((versionStat: PackageVersionStat) => {
                          const tagName = versionStat.version;
                          const tagData = (metadata as GhPackageMetadata)
                            .tags?.[tagName];
                          const publishDate = tagData
                            ? new Date(tagData.commit.date)
                            : null;
                          const relative = publishDate
                            ? relativeDate(publishDate)
                            : "Unknown";

                          return (
                            <TableRow key={tagName}>
                              <TableCell>{tagName}</TableCell>
                              <TableCell>
                                {versionStat.hits.total.toLocaleString()}
                              </TableCell>
                              <TableCell>{relative}</TableCell>
                            </TableRow>
                          );
                        })
                      : (metadata as NpmPackageMetadata).versions?.map(
                          (version) => {
                            const publishDateStr = npmData?.time?.[version];
                            const publishDate = publishDateStr
                              ? new Date(publishDateStr)
                              : null;
                            const relative = publishDate
                              ? relativeDate(publishDate)
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
                          }
                        )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="max-h-max">
          <CardHeader>
            <CardTitle className="text-lg">Package Downloads</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => dayjs(value).format("MMM D")}
                />
                <YAxis
                  tickFormatter={(value) =>
                    compactNumberFormatter.format(value as number)
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value: ValueType) =>
                        compactNumberFormatter.format(Number(value))
                      }
                    />
                  }
                />
                <ChartLegend />
                <Area
                  dataKey="hits"
                  type="natural"
                  fill="var(--color-hits)"
                  fillOpacity={0.4}
                  stroke="var(--color-hits)"
                />
                <Area
                  dataKey="bandwidthInGB"
                  type="natural"
                  fill="var(--color-bandwidthInGB)"
                  fillOpacity={0.4}
                  stroke="var(--color-bandwidthInGB)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
