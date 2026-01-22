import React, { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { BarChart3, CalendarDays, Filter, LineChart, Sparkles, TrendingUp } from 'lucide-react';

interface ReportSummary {
  invoice_count: number;
  total_revenue: string;
  line_item_count: number;
}

interface ReportRow {
  id: number;
  invoice_no: string;
  invoice_date: string;
  warehouse: { id: number; name: string | null } | null;
  owner: { id: number; name: string | null } | null;
  grand_total: string;
}

interface ReportResponse {
  summary: ReportSummary;
  reports: ReportRow[];
  filters: Record<string, string | null>;
  generated_at: string;
}

export const Reports: React.FC = () => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [category, setCategory] = useState('');
  const [owner, setOwner] = useState('');
  const [reportData, setReportData] = useState<ReportResponse | null>(null);

  const summaryCards = [
    {
      title: 'Revenue trend',
      value: '$128.4K',
      delta: '+12.4%',
      icon: TrendingUp,
      tone: 'text-emerald-500',
      bg: 'from-emerald-400/15 to-transparent',
    },
    {
      title: 'Top category',
      value: 'Wellness',
      delta: '42% mix',
      icon: LineChart,
      tone: 'text-sky-500',
      bg: 'from-sky-400/15 to-transparent',
    },
    {
      title: 'Fulfillment SLA',
      value: '98.7%',
      delta: 'On time',
      icon: BarChart3,
      tone: 'text-amber-500',
      bg: 'from-amber-400/15 to-transparent',
    },
  ];

  const filterPayload = useMemo(() => {
    const payload: Record<string, string> = {};
    if (startDate) payload.start_date = startDate;
    if (endDate) payload.end_date = endDate;
    if (warehouse) payload.warehouse = warehouse;
    if (category) payload.category = category;
    if (owner) payload.owner = owner;
    return payload;
  }, [startDate, endDate, warehouse, category, owner]);

  const reportQueryMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/reports/query/', filterPayload);
      return res.data as ReportResponse;
    },
    onSuccess: (data) => {
      setReportData(data);
      toast({ title: 'Filters applied', description: 'Report results have been updated.' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Report failed', description: 'Unable to fetch report data.' });
    },
  });

  const saveViewMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post('/reports/views/', { name, filters: filterPayload });
      return res.data;
    },
    onSuccess: () => {
      toast({ title: 'View saved', description: 'Your filter preset has been stored.' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Save failed', description: 'Unable to save this view.' });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/reports/schedules/', {
        name: 'Weekly report',
        cadence: 'weekly',
        recipients: ['ops-leads@pharmacy.io'],
        filters: filterPayload,
      });
      return res.data;
    },
    onSuccess: () => {
      toast({ title: 'Schedule configured', description: 'Delivery cadence has been updated.' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Schedule failed', description: 'Unable to schedule report delivery.' });
    },
  });

  const handleApplyFilters = () => {
    reportQueryMutation.mutate();
  };

  const handleSaveView = () => {
    const name = window.prompt('Name this report view', 'Leadership overview');
    if (!name) {
      return;
    }
    saveViewMutation.mutate(name);
  };

  const handleConfigureSchedule = () => {
    scheduleMutation.mutate();
  };

  return (
    <div className="space-y-8">
      <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-10 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        </div>
        <CardContent className="relative z-10 flex flex-col gap-5 p-8">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            <Sparkles className="h-4 w-4" />
            Curated analytics suite
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight">Reports & insights</h1>
            <p className="max-w-2xl text-sm text-white/70">
              Build a premium reporting workspace with filtered trends, sales health, and
              compliance-ready exports that feel effortless to navigate.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase">
              Live dashboards
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase">
              Export-ready
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase">
              SLA tracking
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.title} className="border border-white/10 bg-white/70 shadow-lg backdrop-blur dark:bg-slate-900/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${card.bg} ${card.tone}`}>
                <card.icon className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-semibold text-slate-900 dark:text-white">{card.value}</div>
              <p className={`text-xs font-medium ${card.tone}`}>{card.delta}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-white/10 bg-white/70 shadow-lg backdrop-blur dark:bg-slate-900/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4 text-sky-500" />
              Report filters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="report-start">Start date</Label>
              <Input
                id="report-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-end">End date</Label>
              <Input
                id="report-end"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-warehouse">Warehouse</Label>
              <Input
                id="report-warehouse"
                placeholder="Warehouse ID"
                value={warehouse}
                onChange={(event) => setWarehouse(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-category">Category focus</Label>
              <Input
                id="report-category"
                placeholder="Category ID"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-owner">Owner</Label>
              <Input
                id="report-owner"
                placeholder="Owner ID"
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button
                className="bg-slate-900 text-white hover:bg-slate-800"
                onClick={handleApplyFilters}
                disabled={reportQueryMutation.isPending}
              >
                Apply filters
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveView}
                disabled={saveViewMutation.isPending}
              >
                Save view
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-amber-300" />
              Next scheduled delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-white/70">
              Schedule auto-generated weekly summaries and deliver them to leadership with a
              single click.
            </p>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Next drop</p>
              <p className="text-lg font-semibold">Friday · 09:30 AM</p>
              <p className="text-xs text-white/60">Sent to: ops-leads@pharmacy.io</p>
            </div>
            <Button
              className="w-full bg-white text-slate-900 hover:bg-white/90"
              onClick={handleConfigureSchedule}
              disabled={scheduleMutation.isPending}
            >
              Configure schedule
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-dashed border-slate-200 bg-white/70 shadow-inner backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
        <CardContent className="py-10">
          {reportData ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Report results
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Generated {new Date(reportData.generated_at).toLocaleString()} with the current filters.
                  </p>
                </div>
                <Button variant="outline" className="border-slate-200 bg-white" onClick={handleApplyFilters}>
                  Refresh results
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border border-slate-200/70 bg-white/80 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Invoices</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-semibold">{reportData.summary.invoice_count}</CardContent>
                </Card>
                <Card className="border border-slate-200/70 bg-white/80 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total revenue</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-semibold">
                    ${Number(reportData.summary.total_revenue).toLocaleString()}
                  </CardContent>
                </Card>
                <Card className="border border-slate-200/70 bg-white/80 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Line items</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-semibold">{reportData.summary.line_item_count}</CardContent>
                </Card>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.reports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                          No invoices match the current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportData.reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.invoice_no}</TableCell>
                          <TableCell>{new Date(report.invoice_date).toLocaleDateString()}</TableCell>
                          <TableCell>{report.warehouse?.name ?? '—'}</TableCell>
                          <TableCell>{report.owner?.name ?? '—'}</TableCell>
                          <TableCell className="text-right">
                            ${Number(report.grand_total).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white">
                <BarChart3 className="h-6 w-6" />
              </span>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">No report generated yet</h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  Craft a premium report by selecting filters and scheduling delivery. Generated
                  reports will appear here with export-ready actions.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-slate-200 bg-white"
                onClick={handleApplyFilters}
                disabled={reportQueryMutation.isPending}
              >
                Generate first report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
