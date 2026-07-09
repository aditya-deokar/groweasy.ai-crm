"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getImportHistory } from "@/lib/imports/api";
import { PageLayout } from "@/components/layout/page-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ImportJobSummary } from "@/lib/imports/contracts";

export default function ImportHistoryPage() {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["importHistory"],
    queryFn: ({ pageParam }) => getImportHistory(pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.pageInfo.hasMore ? lastPage.pageInfo.nextCursor : undefined,
  });

  const jobs = data?.pages.flatMap((page) => page.jobs) ?? [];

  return (
    <PageLayout
      title="Import History"
      subtitle="View all previous CRM import jobs, their statuses, and summaries."
    >
      <div className="w-full space-y-6">

      <Card>
        <CardHeader>
          <CardTitle>Previous Imports</CardTitle>
          <CardDescription>A complete log of all file uploads and processing status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/70 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Rows</TableHead>
                  <TableHead className="text-right">Imported</TableHead>
                  <TableHead className="text-right">Skipped</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      <TableCell>
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-36 rounded" />
                          <Skeleton className="h-3 w-20 rounded" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-12 rounded" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-12 rounded" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-12 rounded" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-7 w-7 rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-red-500">
                      Failed to load import history.
                    </TableCell>
                  </TableRow>
                ) : jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No import history found.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job: ImportJobSummary) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        }).format(new Date(job.createdAt))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            job.status === "COMPLETED"
                              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400"
                              : job.status === "FAILED"
                              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
                              : job.status === "PROCESSING"
                              ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-400"
                              : ""
                          }
                        >
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{job.totalRows}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">{job.importedCount}</TableCell>
                      <TableCell className="text-right text-red-600 font-medium">{job.skippedCount}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/import?importId=${job.id}`}>
                            View <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </PageLayout>
  );
}
