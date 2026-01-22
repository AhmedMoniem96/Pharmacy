import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3, CalendarDays, Filter, LineChart, Sparkles, TrendingUp } from 'lucide-react';

export const Reports: React.FC = () => {
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
              <Label htmlFor="report-range">Date range</Label>
              <Select defaultValue="30">
                <SelectTrigger id="report-range">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Quarter to date</SelectItem>
                  <SelectItem value="365">Year to date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-warehouse">Warehouse</Label>
              <Select defaultValue="downtown">
                <SelectTrigger id="report-warehouse">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="downtown">Downtown HQ</SelectItem>
                  <SelectItem value="north">North distribution</SelectItem>
                  <SelectItem value="east">East fulfillment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-category">Category focus</Label>
              <Input id="report-category" placeholder="Search categories" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-owner">Owner</Label>
              <Input id="report-owner" placeholder="Assign analyst" />
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button className="bg-slate-900 text-white hover:bg-slate-800">Apply filters</Button>
              <Button variant="outline">Save view</Button>
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
            <Button className="w-full bg-white text-slate-900 hover:bg-white/90">Configure schedule</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-dashed border-slate-200 bg-white/70 shadow-inner backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
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
          <Button variant="outline" className="border-slate-200 bg-white">
            Generate first report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
