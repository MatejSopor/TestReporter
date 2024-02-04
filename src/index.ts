interface ReportSummaryProps {
  reportId: string;
  country: string;
  environment: string;
  dirLink: string;
  date: string;
  time: string;
  duration: string;
  passRate: number;
  suites: number;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
}
