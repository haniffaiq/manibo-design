"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { DataTable, type DataTableColumn } from "@grove/ui/data-table";
import { Input } from "@grove/ui/input";
import { Modal } from "@grove/ui/modal";
import { PageFrame } from "@/components/page-frame";
import { SolutionLoadErrorState } from "@grove/web-shared/components/solution-load-error-state";
import { SolutionUnavailableState } from "@grove/web-shared/components/solution-unavailable-state";
import {
  getDriverStatus,
  getDriverVerificationJob,
  importDriversCsv,
  listDrivers,
  listDriverVerificationJobs,
  updateDriver,
  type DriverImportResult,
  type DriverRecord,
  type DriverStatusResponse,
  type DriverVerificationJobDetail,
  type DriverVerificationJobSummary,
} from "./api/driver-verification";
import { PlatformApiError } from "@grove/web-shared/api/platform";
import type { SolutionState } from "@grove/web-shared/types/solution-state";
import * as swrKeys from "./lib/swr-keys";

const EMPTY_DRIVERS: DriverRecord[] = [];
const EMPTY_JOBS: DriverVerificationJobSummary[] = [];
const DRIVER_PAGE_SIZE = 200;
const JOB_PAGE_SIZE = 200;
type DriverFilter = "all" | "active" | "inactive";
type JobFilter = "all" | "needs_attention" | "completed";
type ImportState = {
  fileName: string | null;
  csv: string;
  result: DriverImportResult | null;
  busy: boolean;
  error: string | null;
};

function toErrorMessage(error: unknown): string {
  if (error instanceof PlatformApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Not recorded";
  }
  return new Date(value).toLocaleString();
}

function humanizeText(value: string | null | undefined): string {
  if (!value) {
    return "Not recorded";
  }
  return value
    .split(/[_\-.\s]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function jobNeedsAttention(job: DriverVerificationJobSummary): boolean {
  if (job.status !== "completed") {
    return true;
  }
  if (job.outcome === "discrepancy" || job.outcome === "unreachable") {
    return true;
  }
  if (job.last_error) {
    return true;
  }
  return flaggedItems(job.discrepancy_flags).length > 0;
}

function flaggedItems(flags: Record<string, unknown>): string[] {
  return Object.entries(flags)
    .flatMap(([key, value]) => {
      if (value === true) {
        return [humanizeText(key)];
      }
      if (Array.isArray(value) && value.length > 0) {
        return [`${humanizeText(key)}: ${value.join(", ")}`];
      }
      return [];
    })
    .filter((item) => item.trim().length > 0);
}

function extractedItems(fields: Record<string, unknown>): Array<{ label: string; value: string }> {
  return Object.entries(fields)
    .flatMap(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        return [];
      }
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return [];
        }
        return [{ label: humanizeText(key), value: value.join(", ") }];
      }
      if (typeof value === "object") {
        return [{ label: humanizeText(key), value: JSON.stringify(value) }];
      }
      return [{ label: humanizeText(key), value: String(value) }];
    });
}

function driverStateLabel(active: boolean): string {
  return active ? "Ready for calls" : "Paused";
}

function driverStateVariant(active: boolean): "success" | "neutral" {
  return active ? "success" : "neutral";
}

function outcomeLabel(outcome: string | null): string {
  if (outcome === "confirmed") {
    return "Confirmed";
  }
  if (outcome === "discrepancy") {
    return "Needs review";
  }
  if (outcome === "unreachable") {
    return "Could not reach driver";
  }
  return "Still running";
}

function outcomeVariant(outcome: string | null): "success" | "warning" | "error" | "neutral" {
  if (outcome === "confirmed") {
    return "success";
  }
  if (outcome === "discrepancy") {
    return "warning";
  }
  if (outcome === "unreachable") {
    return "error";
  }
  return "neutral";
}

function jobStatusLabel(status: string): string {
  if (status === "completed") {
    return "Finished";
  }
  if (status === "failed") {
    return "Failed";
  }
  if (status === "scheduled") {
    return "Scheduled";
  }
  if (status === "pending") {
    return "Waiting to run";
  }
  if (status === "running") {
    return "In progress";
  }
  return humanizeText(status);
}

function jobStatusVariant(status: string): "success" | "warning" | "error" | "neutral" {
  if (status === "completed") {
    return "success";
  }
  if (status === "failed") {
    return "error";
  }
  if (status === "running") {
    return "warning";
  }
  return "neutral";
}

function latestTelematicsSummary(status: DriverStatusResponse | null): string {
  if (!status) {
    return "No vehicle update recorded yet.";
  }
  const position = status.telematics_position.label
    ? String(status.telematics_position.label)
    : status.telematics_position.lat !== undefined && status.telematics_position.lng !== undefined
      ? `${status.telematics_position.lat}, ${status.telematics_position.lng}`
      : "Location not supplied";
  return `${humanizeText(status.telematics_status)} · ${position}`;
}

function buildImportTemplate(): string {
  return "driver_id,phone,name\ndrv-1001,+37061234567,Driver Example\n";
}

export default function DriversPage({ solutionState }: { solutionState: SolutionState }) {
  const { enabled, error: solutionError, isLoading: solutionLoading } = solutionState;
  const [driverFilter, setDriverFilter] = useState<DriverFilter>("all");
  const [jobFilter, setJobFilter] = useState<JobFilter>("needs_attention");
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editBusy, setEditBusy] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importState, setImportState] = useState<ImportState>({
    fileName: null,
    csv: buildImportTemplate(),
    result: null,
    busy: false,
    error: null,
  });

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusDriver, setStatusDriver] = useState<DriverRecord | null>(null);
  const [statusDetail, setStatusDetail] = useState<DriverStatusResponse | null>(null);

  const [jobOpen, setJobOpen] = useState(false);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobDetail, setJobDetail] = useState<DriverVerificationJobDetail | null>(null);

  const activeParam = driverFilter === "all" ? undefined : driverFilter === "active";

  const {
    data: driversData,
    error: driversError,
    isLoading: driversLoading,
    mutate: mutateDrivers,
  } = useSWR(enabled ? swrKeys.driverVerificationDrivers(activeParam) : null, () => listDrivers({ active: activeParam, limit: DRIVER_PAGE_SIZE, offset: 0 }), {
    revalidateOnFocus: false,
  });

  const {
    data: jobsData,
    error: jobsError,
    isLoading: jobsLoading,
    mutate: mutateJobs,
  } = useSWR(enabled ? swrKeys.driverVerificationJobs() : null, () => listDriverVerificationJobs({ limit: JOB_PAGE_SIZE, offset: 0 }), {
    revalidateOnFocus: false,
  });

  const drivers = driversData?.drivers ?? EMPTY_DRIVERS;
  const jobs = jobsData?.jobs ?? EMPTY_JOBS;

  const filteredDrivers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return drivers;
    }
    return drivers.filter((driver) => {
      const haystack = [driver.driver_id, driver.name ?? "", driver.phone ?? ""].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [drivers, searchTerm]);

  const filteredJobs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return jobs.filter((job) => {
      if (jobFilter === "needs_attention" && !jobNeedsAttention(job)) {
        return false;
      }
      if (jobFilter === "completed" && job.status !== "completed") {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [job.driver_id, job.driver_name ?? "", job.outcome ?? "", ...flaggedItems(job.discrepancy_flags)].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [jobFilter, jobs, searchTerm]);

  const summary = useMemo(() => {
    const activeDrivers = drivers.filter((driver) => driver.active).length;
    const pausedDrivers = drivers.length - activeDrivers;
    const attentionJobs = jobs.filter(jobNeedsAttention).length;
    const confirmedJobs = jobs.filter((job) => job.outcome === "confirmed").length;
    return { activeDrivers, pausedDrivers, attentionJobs, confirmedJobs };
  }, [drivers, jobs]);

  function closeEditModal(): void {
    if (editBusy) {
      return;
    }
    setEditOpen(false);
    setEditingDriver(null);
    setEditName("");
    setEditPhone("");
    setEditActive(true);
  }

  function openEditModal(driver: DriverRecord): void {
    setEditingDriver(driver);
    setEditName(driver.name ?? "");
    setEditPhone(driver.phone ?? "");
    setEditActive(driver.active);
    setEditOpen(true);
    setActionError(null);
    setNotice(null);
  }

  async function submitEdit(): Promise<void> {
    if (!editingDriver) {
      return;
    }
    setEditBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await updateDriver(editingDriver.driver_id, {
        name: editName.trim() || null,
        phone: editPhone.trim() || null,
        active: editActive,
      });
      await mutateDrivers();
      setNotice(`Saved details for ${editingDriver.name ?? editingDriver.driver_id}.`);
      closeEditModal();
    } catch (error) {
      setActionError(toErrorMessage(error));
    } finally {
      setEditBusy(false);
    }
  }

  function closeImportModal(): void {
    if (importState.busy) {
      return;
    }
    setImportOpen(false);
    setImportState({
      fileName: null,
      csv: buildImportTemplate(),
      result: null,
      busy: false,
      error: null,
    });
  }

  async function handleImportFile(file: File | null): Promise<void> {
    if (!file) {
      return;
    }
    const csv = await file.text();
    setImportState((current) => ({
      ...current,
      csv,
      fileName: file.name,
      result: null,
      error: null,
    }));
  }

  async function runImport(dryRun: boolean): Promise<void> {
    const csv = importState.csv.trim();
    if (!csv) {
      setImportState((current) => ({ ...current, error: "Paste a CSV file before continuing." }));
      return;
    }

    setImportState((current) => ({ ...current, busy: true, error: null }));
    setActionError(null);
    setNotice(null);
    try {
      const result = await importDriversCsv(csv, { dryRun });
      setImportState((current) => ({ ...current, busy: false, result }));
      if (!dryRun && result.status === 200) {
        await mutateDrivers();
        setNotice(`Imported ${result.created + result.updated} driver records.`);
        closeImportModal();
      }
    } catch (error) {
      setImportState((current) => ({ ...current, busy: false, error: toErrorMessage(error) }));
    }
  }

  async function openStatusModal(driver: DriverRecord): Promise<void> {
    setStatusDriver(driver);
    setStatusOpen(true);
    setStatusLoading(true);
    setStatusError(null);
    setStatusDetail(null);
    try {
      const response = await getDriverStatus(driver.driver_id);
      setStatusDetail(response);
    } catch (error) {
      setStatusError(toErrorMessage(error));
    } finally {
      setStatusLoading(false);
    }
  }

  function closeStatusModal(): void {
    setStatusOpen(false);
    setStatusDriver(null);
    setStatusDetail(null);
    setStatusError(null);
  }

  async function openJobModal(jobId: string): Promise<void> {
    setJobOpen(true);
    setJobLoading(true);
    setJobError(null);
    setJobDetail(null);
    try {
      const response = await getDriverVerificationJob(jobId);
      setJobDetail(response);
    } catch (error) {
      setJobError(toErrorMessage(error));
    } finally {
      setJobLoading(false);
    }
  }

  function closeJobModal(): void {
    setJobOpen(false);
    setJobDetail(null);
    setJobError(null);
  }

  const driverColumns: DataTableColumn<DriverRecord>[] = [
    {
      id: "driver",
      header: "Driver",
      cell: (driver) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-[var(--color-neutral-900)]" data-testid={`driver-name-${driver.driver_id}`}>
            {driver.name ?? "Name not added"}
          </span>
          <span className="text-xs text-[var(--color-neutral-500)]">Reference: {driver.driver_id}</span>
        </div>
      ),
    },
    {
      id: "phone",
      header: "Phone",
      cell: (driver) => driver.phone ?? "Missing phone number",
    },
    {
      id: "state",
      header: "Availability",
      cell: (driver) => <Badge variant={driverStateVariant(driver.active)}>{driverStateLabel(driver.active)}</Badge>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: (driver) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void openStatusModal(driver)}>
            Latest vehicle update
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openEditModal(driver)}>
            Edit driver
          </Button>
        </div>
      ),
    },
  ];

  const jobColumns: DataTableColumn<DriverVerificationJobSummary>[] = [
    {
      id: "driver",
      header: "Driver",
      cell: (job) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-[var(--color-neutral-900)]">{job.driver_name ?? job.driver_id}</span>
          <span className="text-xs text-[var(--color-neutral-500)]">Reference: {job.driver_id}</span>
        </div>
      ),
    },
    {
      id: "outcome",
      header: "Result",
      cell: (job) => (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant={outcomeVariant(job.outcome)}>{outcomeLabel(job.outcome)}</Badge>
            <Badge variant={jobStatusVariant(job.status)}>{jobStatusLabel(job.status)}</Badge>
          </div>
          {job.last_error ? <span className="text-xs text-[var(--color-error-700)]">{job.last_error}</span> : null}
        </div>
      ),
    },
    {
      id: "attention",
      header: "What needs checking",
      cell: (job) => {
        const items = flaggedItems(job.discrepancy_flags);
        if (items.length === 0) {
          return <span className="text-sm text-[var(--color-neutral-500)]">No mismatch recorded</span>;
        }
        return (
          <div className="flex flex-wrap gap-2">
            {items.slice(0, 2).map((item) => (
              <Badge key={`${job.job_id}-${item}`} variant="warning">
                {item}
              </Badge>
            ))}
            {items.length > 2 ? <span className="text-xs text-[var(--color-neutral-500)]">+{items.length - 2} more</span> : null}
          </div>
        );
      },
    },
    {
      id: "when",
      header: "Call time",
      cell: (job) => formatDateTime(job.call_started_at ?? job.scheduled_at),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (job) => (
        <Button size="sm" variant="outline" data-testid={`driver-job-open-${job.job_id}`} onClick={() => void openJobModal(job.job_id)}>
          Review check
        </Button>
      ),
    },
  ];

  if (solutionLoading) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-8 text-sm text-[var(--color-neutral-500)]">
        Checking workspace access…
      </div>
    );
  }

  if (solutionError) {
    return (
      <SolutionLoadErrorState
        title="Driver checks"
        detail="We could not confirm whether driver verification is available for this workspace."
        errorMessage={toErrorMessage(solutionError)}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!enabled) {
    return <SolutionUnavailableState title="Driver checks" detail="This workspace is not turned on for your organization." />;
  }

  return (
    <PageFrame className="px-6 py-8">
      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[linear-gradient(135deg,#fff_0%,#f7fafc_100%)] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-primary-700)]">Hoptrans operations</p>
            <div>
              <h1 className="text-3xl font-semibold text-[var(--color-neutral-900)]">Driver checks</h1>
              <p className="mt-2 text-sm text-[var(--color-neutral-600)]">
                Keep the driver list current, catch mismatch calls early, and hand managers a clear review trail without exposing raw workflow internals.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              Import driver list
            </Button>
            <Button variant="secondary" onClick={() => {
              void mutateDrivers();
              void mutateJobs();
            }}>
              Refresh workspace
            </Button>
          </div>
        </div>
        {actionError ? <p className="mt-4 text-sm text-[var(--color-error-700)]">{actionError}</p> : null}
        {notice ? <p className="mt-4 text-sm text-[var(--color-success-700)]">{notice}</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <p className="text-sm text-[var(--color-neutral-500)]">Active drivers</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-[var(--color-neutral-900)]">{summary.activeDrivers}</p>
            <p className="mt-2 text-sm text-[var(--color-neutral-500)]">Ready to receive verification calls now.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm text-[var(--color-neutral-500)]">Paused drivers</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-[var(--color-neutral-900)]">{summary.pausedDrivers}</p>
            <p className="mt-2 text-sm text-[var(--color-neutral-500)]">Excluded until contact details or availability are fixed.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm text-[var(--color-neutral-500)]">Checks needing review</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-[var(--color-neutral-900)]">{summary.attentionJobs}</p>
            <p className="mt-2 text-sm text-[var(--color-neutral-500)]">Calls with mismatches, failed outreach, or incomplete runs.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm text-[var(--color-neutral-500)]">Confirmed recently</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-[var(--color-neutral-900)]">{summary.confirmedJobs}</p>
            <p className="mt-2 text-sm text-[var(--color-neutral-500)]">Drivers whose latest completed call matched the system record.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-neutral-900)]">Driver directory</h2>
                <p className="text-sm text-[var(--color-neutral-500)]">Search contact details, pause drivers, or check their latest vehicle update.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "active", "inactive"] as const).map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={driverFilter === value ? "primary" : "outline"}
                    onClick={() => setDriverFilter(value)}
                  >
                    {value === "all" ? "All drivers" : value === "active" ? "Ready now" : "Paused"}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.currentTarget.value)}
              placeholder="Search by driver name, reference, or phone"
            />
            {driversError ? <p className="text-sm text-[var(--color-error-700)]">{toErrorMessage(driversError)}</p> : null}
            {driversLoading ? (
              <p className="text-sm text-[var(--color-neutral-500)]">Loading drivers…</p>
            ) : (
              <div data-testid="driver-directory-table">
                <DataTable columns={driverColumns} rows={filteredDrivers} rowKey="driver_id" emptyState="No drivers match the current filter." />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-neutral-900)]">Recent verification checks</h2>
                <p className="text-sm text-[var(--color-neutral-500)]">Start with the calls that need human review, then drill into the mismatch details.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["needs_attention", "all", "completed"] as const).map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={jobFilter === value ? "primary" : "outline"}
                    onClick={() => setJobFilter(value)}
                  >
                    {value === "needs_attention" ? "Needs review" : value === "completed" ? "Finished only" : "All checks"}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-3 text-sm text-[var(--color-neutral-600)]">
              Managers should work from this queue instead of digging through raw call logs. “Needs review” already combines mismatches, failed calls, and incomplete runs.
            </div>
            {jobsError ? <p className="text-sm text-[var(--color-error-700)]">{toErrorMessage(jobsError)}</p> : null}
            {jobsLoading ? (
              <p className="text-sm text-[var(--color-neutral-500)]">Loading verification checks…</p>
            ) : (
              <div data-testid="driver-jobs-table">
                <DataTable columns={jobColumns} rows={filteredJobs} rowKey="job_id" emptyState="No driver checks match the current filter." />
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Modal
        open={importOpen}
        onClose={closeImportModal}
        title="Import drivers"
        description="Upload or paste a CSV with driver_id and phone. Name is optional."
        className="max-w-3xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" onClick={closeImportModal} disabled={importState.busy}>
              Cancel
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void runImport(true)} disabled={importState.busy}>
                Check file
              </Button>
              <Button onClick={() => void runImport(false)} disabled={importState.busy}>
                Import drivers
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] p-4">
            <label className="flex cursor-pointer flex-col gap-2 text-sm text-[var(--color-neutral-700)]">
              <span className="font-medium text-[var(--color-neutral-900)]">Choose a CSV file</span>
              <span>Use headers: driver_id, phone, name</span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="text-sm"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0] ?? null;
                  void handleImportFile(file);
                }}
              />
            </label>
            {importState.fileName ? <p className="mt-3 text-xs text-[var(--color-neutral-500)]">Loaded: {importState.fileName}</p> : null}
          </div>
          <label className="block space-y-2 text-sm text-[var(--color-neutral-700)]">
            <span className="font-medium text-[var(--color-neutral-900)]">CSV content</span>
            <textarea
              value={importState.csv}
              onChange={(event) => setImportState((current) => ({ ...current, csv: event.currentTarget.value, result: null, error: null }))}
              rows={10}
              className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] px-3 py-2 font-mono text-xs text-[var(--color-neutral-800)] shadow-[var(--shadow-sm)] outline-none focus:border-[var(--color-primary-500)]"
            />
          </label>
          {importState.error ? <p className="text-sm text-[var(--color-error-700)]">{importState.error}</p> : null}
          {importState.result ? (
            <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={importState.result.status === 200 ? "success" : "warning"}>
                  {importState.result.status === 200 ? "File looks ready" : "Fix the highlighted rows"}
                </Badge>
                <span className="text-sm text-[var(--color-neutral-600)]">
                  {importState.result.rows_valid} valid out of {importState.result.rows_received} rows
                </span>
              </div>
              {importState.result.errors.length > 0 ? (
                <ul className="space-y-2 text-sm text-[var(--color-error-700)]">
                  {importState.result.errors.map((item) => (
                    <li key={`${item.row_number}-${item.field}`}>
                      Row {item.row_number}: {humanizeText(item.field)} — {item.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--color-neutral-600)]">No formatting issues found. You can import the file now.</p>
              )}
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={editOpen}
        onClose={closeEditModal}
        title="Update driver"
        description="Correct contact details or pause a driver without re-importing the whole list."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeEditModal} disabled={editBusy}>
              Cancel
            </Button>
            <Button onClick={() => void submitEdit()} disabled={editBusy}>
              Save changes
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-2 text-sm text-[var(--color-neutral-700)]">
            <span className="font-medium text-[var(--color-neutral-900)]">Display name</span>
            <Input value={editName} onChange={(event) => setEditName(event.currentTarget.value)} placeholder="Driver name" />
          </label>
          <label className="block space-y-2 text-sm text-[var(--color-neutral-700)]">
            <span className="font-medium text-[var(--color-neutral-900)]">Phone number</span>
            <Input value={editPhone} onChange={(event) => setEditPhone(event.currentTarget.value)} placeholder="+37061234567" />
          </label>
          <label className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-neutral-700)]">
            <input type="checkbox" checked={editActive} onChange={(event) => setEditActive(event.currentTarget.checked)} />
            Keep this driver available for verification calls
          </label>
        </div>
      </Modal>

      <Modal
        open={statusOpen}
        onClose={closeStatusModal}
        title="Latest vehicle update"
        description={statusDriver ? `Most recent telematics snapshot for ${statusDriver.name ?? statusDriver.driver_id}.` : undefined}
      >
        {statusLoading ? <p className="text-sm text-[var(--color-neutral-500)]">Loading latest vehicle update…</p> : null}
        {statusError ? <p className="text-sm text-[var(--color-error-700)]">{statusError}</p> : null}
        {!statusLoading && !statusError && statusDriver ? (
          <div className="space-y-4 text-sm text-[var(--color-neutral-700)]">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
              <p className="font-medium text-[var(--color-neutral-900)]">{latestTelematicsSummary(statusDetail)}</p>
              <p className="mt-2 text-xs text-[var(--color-neutral-500)]">Last updated: {formatDateTime(statusDetail?.telematics_occurred_at)}</p>
            </div>
            {statusDetail ? (
              <dl className="grid gap-3 md:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-[var(--color-neutral-500)]">Status from provider</dt>
                  <dd className="mt-1 text-[var(--color-neutral-900)]">{humanizeText(statusDetail.telematics_status)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-[var(--color-neutral-500)]">Provider reference</dt>
                  <dd className="mt-1 text-[var(--color-neutral-900)]">{statusDetail.source_provider}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-xs uppercase tracking-[0.14em] text-[var(--color-neutral-500)]">Snapshot details</dt>
                  <dd className="mt-1 overflow-x-auto rounded-[var(--radius-md)] bg-[var(--color-neutral-950)] px-3 py-2 font-mono text-xs text-[var(--color-neutral-100)]">
                    {JSON.stringify(statusDetail.telematics_snapshot, null, 2)}
                  </dd>
                </div>
              </dl>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={jobOpen}
        onClose={closeJobModal}
        title="Verification review"
        description="See what the call captured, what the vehicle feed reported, and why this check was flagged."
        className="max-w-3xl"
      >
        {jobLoading ? <p className="text-sm text-[var(--color-neutral-500)]">Loading verification review…</p> : null}
        {jobError ? <p className="text-sm text-[var(--color-error-700)]">{jobError}</p> : null}
        {!jobLoading && !jobError && jobDetail ? (
          <div className="space-y-5 text-sm text-[var(--color-neutral-700)]">
            <div className="flex flex-wrap gap-2">
              <Badge variant={outcomeVariant(jobDetail.outcome)}>{outcomeLabel(jobDetail.outcome)}</Badge>
              <Badge variant={jobStatusVariant(jobDetail.status)}>{jobStatusLabel(jobDetail.status)}</Badge>
              <Badge variant={jobNeedsAttention(jobDetail) ? "warning" : "success"}>
                {jobNeedsAttention(jobDetail) ? "Needs manager review" : "No issue recorded"}
              </Badge>
            </div>
            <dl className="grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--color-neutral-500)]">Driver</dt>
                <dd className="mt-1 text-[var(--color-neutral-900)]">{jobDetail.driver_name ?? jobDetail.driver_id}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--color-neutral-500)]">Call started</dt>
                <dd className="mt-1 text-[var(--color-neutral-900)]">{formatDateTime(jobDetail.call_started_at)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--color-neutral-500)]">Attempt count</dt>
                <dd className="mt-1 text-[var(--color-neutral-900)]">{jobDetail.attempt_count}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--color-neutral-500)]">Call reference</dt>
                <dd className="mt-1 break-all text-[var(--color-neutral-900)]">{jobDetail.call_id ?? "Not recorded"}</dd>
              </div>
            </dl>

            <section className="space-y-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
              <h3 className="font-semibold text-[var(--color-neutral-900)]">Why this check was flagged</h3>
              {flaggedItems(jobDetail.discrepancy_flags).length > 0 ? (
                <ul className="space-y-2">
                  {flaggedItems(jobDetail.discrepancy_flags).map((item) => (
                    <li key={item} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No mismatch flags were recorded for this check.</p>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-[var(--color-neutral-900)]">What the driver told us</h3>
              {extractedItems(jobDetail.extracted_fields).length > 0 ? (
                <dl className="grid gap-3 md:grid-cols-2">
                  {extractedItems(jobDetail.extracted_fields).map((item) => (
                    <div key={item.label} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
                      <dt className="text-xs uppercase tracking-[0.14em] text-[var(--color-neutral-500)]">{item.label}</dt>
                      <dd className="mt-1 text-[var(--color-neutral-900)]">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-[var(--color-neutral-500)]">No structured answers were stored for this check.</p>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-[var(--color-neutral-900)]">Vehicle feed snapshot</h3>
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
                <p className="font-medium text-[var(--color-neutral-900)]">{humanizeText(jobDetail.telematics_status)}</p>
                <p className="mt-1 text-sm text-[var(--color-neutral-500)]">Updated {formatDateTime(jobDetail.telematics_occurred_at)}</p>
                <pre className="mt-3 overflow-x-auto rounded-[var(--radius-md)] bg-[var(--color-neutral-950)] px-3 py-2 font-mono text-xs text-[var(--color-neutral-100)]">
                  {JSON.stringify(jobDetail.telematics_snapshot, null, 2)}
                </pre>
              </div>
            </section>
          </div>
        ) : null}
      </Modal>
    </PageFrame>
  );
}
