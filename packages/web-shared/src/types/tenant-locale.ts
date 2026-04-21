export type TenantUiLocale = "en" | "lt";

export type ShellCopy = {
  title: string;
  subtitle: string;
  sections: {
    operations: string;
    liveSupport: string;
    review: string;
    clinic: string;
    logistics: string;
    manage: string;
  };
  nav: {
    dashboard: string;
    calls: string;
    callOps: string;
    callHistory: string;
    observability: string;
    alerts: string;
    automations: string;
    bookings: string;
    knowledgeBase: string;
    drivers: string;
    team: string;
    activity: string;
    integrations: string;
    settings: string;
  };
  footer: {
    languageLabel: string;
    settingsLink: string;
    signOut: string;
  };
};

export type CommonCopy = {
  loading: string;
  save: string;
  cancel: string;
  search: string;
  refresh: string;
  refreshing: string;
  english: string;
  lithuanian: string;
  notRecorded: string;
  notSet: string;
  unknown: string;
  noResults: string;
  unexpectedError: string;
  any: string;
};

export type PageIntroCopy = {
  title: string;
  description: string;
};

export type CallOpsCopy = PageIntroCopy & {
  dataUnavailable: string;
  partialDataWarning: string;
  liveCallsUnavailable: string;
  performanceUnavailable: string;
};

export type DashboardCopy = PageIntroCopy & {
  refresh: string;
  refreshing: string;
  visibilityError: string;
  dataUnavailable: string;
  partialDataWarning: string;

  liveCallsLabel: string;
  liveCallsDetailActive: string;
  liveCallsDetailIdle: string;
  liveCallsUnavailableDetail: string;
  monthlySpendLabel: string;
  monthlySpendDetail: (utilization: string, budget: string) => string;
  monthlySpendNoBudget: string;
  monthlySpendUnavailableDetail: string;
  completedCallsLabel: string;
  completedCallsDetail: (total: string, averageDuration: string) => string;
  escalatedCallsLabel: string;
  escalatedCallsDetail: (rate: string) => string;
  callsReportUnavailableDetail: string;
  clinicSectionTitle: string;
  clinicSectionDescription: string;
  clinicSectionLink: string;
  clinicConfirmedLabel: string;
  clinicConfirmedDetail: string;
  clinicFollowUpLabel: string;
  clinicFollowUpDetail: string;
  clinicUrgentLabel: string;
  clinicUrgentDetail: string;
  clinicHandedOffLabel: string;
  clinicHandedOffDetail: string;
  latestBookingOutcomesTitle: string;
  unknownCaller: string;
  generalRequest: string;
  cityNotCaptured: string;
  recentClinicOutcomesEmpty: string;
  needsFollowUpBadge: string;
  callQualityTitle: string;
  callQualityClinicDescription: string;
  callQualityDriverDescription: string;
  slowestPathLabel: string;
  callQualityClinicHelp: string;
  callQualityDriverHelp: string;
  openCallOps: string;
  noRecentSlowPath: string;
  slowPathUnavailable: string;
  driverSectionTitle: string;
  driverSectionDescription: string;
  driverSectionLink: string;
  driverActiveLabel: string;
  driverActiveDetail: string;
  driverPausedLabel: string;
  driverPausedDetail: string;
  driverAttentionLabel: string;
  driverAttentionDetail: string;
  driverConfirmedLabel: string;
  driverConfirmedDetail: string;
  latestDriverChecksTitle: string;
  driverNeedsAttentionBadge: string;
  driverLooksGoodBadge: string;
  driverNoOutcomeYet: string;
  recentDriverChecksEmpty: string;
  noWorkspaceTitle: string;
  noWorkspaceDescription: string;
  bookingStatuses: {
    confirmed: string;
    pending: string;
    failed: string;
    handed_off: string;
  };
};

export type AlertsCopy = PageIntroCopy & {
  filtersTitle: string;
  severityLabel: string;
  statusLabel: string;
  sinceLabel: string;
  refresh: string;
  refreshLoading: string;
  queueTitle: string;
  queueLoading: string;
  queueEmpty: string;
  createdColumn: string;
  severityColumn: string;
  statusColumn: string;
  eventColumn: string;
  entityColumn: string;
  actionsColumn: string;
  noMessage: string;
  entityFallback: string;
  ackAction: string;
  resolveAction: string;
  acknowledgedNotice: (eventId: string) => string;
  resolvedNotice: (eventId: string) => string;
  severityOptions: {
    info: string;
    warning: string;
    critical: string;
  };
  statusOptions: {
    open: string;
    acked: string;
    resolved: string;
  };
};

export type ActivityCopy = PageIntroCopy & {
  refresh: string;
  refreshing: string;
  adminOnlyTitle: string;
  adminOnlyMessage: string;
  summary: {
    recentEntries: string;
    successfulChanges: string;
    needsAttention: string;
    latestUpdate: string;
  };
  filtersTitle: string;
  filtersSource: string;
  filterLabels: {
    action: string;
    resourceType: string;
    resourceId: string;
    since: string;
    until: string;
    limit: string;
  };
  filterPlaceholders: {
    action: string;
    resourceType: string;
    resourceId: string;
  };
  applyFilters: string;
  clearFilters: string;
  limitValidation: string;
  rangeValidation: string;
  filtersApplied: string;
  filtersCleared: string;
  recentActivityTitle: string;
  loadingHistory: string;
  emptyState: string;
  columns: {
    when: string;
    whatChanged: string;
    item: string;
    result: string;
    changedBy: string;
    notes: string;
  };
  actorTeamMember: string;
  actorSystem: string;
  systemId: string;
  defaultActivity: string;
  recorded: string;
  noExtraDetails: string;
  actionLabels: Record<string, string>;
  resourceLabels: Record<string, string>;
};

export type SettingsCopy = {
  title: string;
  description: string;
  languageTitle: string;
  languageDescription: string;
  languageLabel: string;
  languageHelp: string;
  languageSaved: string;
  recordingsTitle: string;
  recordingsDescription: string;
  recordingsCurrent: string;
  recordingsCurrentUnknown: string;
  recordingsFieldLabel: string;
  recordingsFieldHelp: string;
  load: string;
  loading: string;
  saved: string;
  adminOnly: string;
  validationRetentionDays: string;
};

export type KnowledgeBaseCopy = {
  title: string;
  description: string;
  searchLabel: string;
  searchPlaceholder: string;
  specialtyLabel: string;
  specialtyAll: string;
  clinicLabel: string;
  clinicAll: string;
  matchesTitle: string;
  matchesDescription: string;
  availableSpecialties: string;
  availableClinics: string;
  doctorsCount: (count: number) => string;
  emptyTitle: string;
  emptyDescription: string;
  loadErrorTitle: string;
  loadErrorDescription: string;
  doctor: string;
  specialty: string;
  clinic: string;
  city: string;
  price: string;
};

export type TenantCopy = {
  shell: ShellCopy;
  common: CommonCopy;
  dashboard: DashboardCopy;
  callOps: CallOpsCopy;
  callHistory: PageIntroCopy;
  observability: PageIntroCopy;
  alerts: AlertsCopy;
  automations: PageIntroCopy;
  bookings: PageIntroCopy;
  activity: ActivityCopy;
  integrations: PageIntroCopy;
  team: PageIntroCopy & {
    adminOnlyTitle: string;
    adminOnlyMessage: string;
  };
  settings: SettingsCopy;
  knowledgeBase: KnowledgeBaseCopy;
};
