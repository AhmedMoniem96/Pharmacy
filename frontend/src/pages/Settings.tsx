import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BellRing, ShieldCheck, SlidersHorizontal, UserCircle2 } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-8">
      <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 text-white shadow-2xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-8 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
        </div>
        <CardContent className="relative z-10 flex flex-col gap-4 p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            <SlidersHorizontal className="h-4 w-4" />
            Workspace configuration
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
            <p className="max-w-2xl text-sm text-white/70">
              Personalize how your pharmacy teams collaborate, notify, and stay compliant while
              keeping the brand experience refined.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase">
              Role-based access
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase">
              Smart alerts
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase">
              Compliance sync
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-white/10 bg-white/70 shadow-lg backdrop-blur dark:bg-slate-900/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCircle2 className="h-4 w-4 text-emerald-500" />
              Profile & workspace
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-name">Full name</Label>
              <Input id="settings-name" placeholder="Marina Lee" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-role">Role</Label>
              <Input id="settings-role" placeholder="Operations lead" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-email">Email address</Label>
              <Input id="settings-email" type="email" placeholder="marina@pharmacy.io" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-timezone">Timezone</Label>
              <Input id="settings-timezone" placeholder="UTC +02:00" />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <Button className="bg-slate-900 text-white hover:bg-slate-800">Save profile</Button>
              <Button variant="outline">Invite teammate</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Compliance status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-white/70">
              Keep audits ready with automated policy sync and daily data validation sweeps.
            </p>
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Last audit sync</span>
                <span className="font-semibold text-white">Today, 08:15</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Risk score</span>
                <span className="font-semibold text-emerald-300">Low</span>
              </div>
            </div>
            <Button className="w-full bg-white text-slate-900 hover:bg-white/90">Review policies</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border border-white/10 bg-white/70 shadow-lg backdrop-blur dark:bg-slate-900/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BellRing className="h-4 w-4 text-sky-500" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                label: 'Critical stock alerts',
                description: 'Push alerts for low stock items and critical shortages.',
                defaultChecked: true,
              },
              {
                label: 'Weekly digest',
                description: 'A curated report delivered every Monday morning.',
                defaultChecked: true,
              },
              {
                label: 'Temperature compliance',
                description: 'Immediate alert when cold-chain thresholds are exceeded.',
                defaultChecked: false,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/60 p-4 dark:bg-slate-900/40">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Switch defaultChecked={item.defaultChecked} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-dashed border-slate-200 bg-white/70 shadow-inner backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
          <CardContent className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white">
              <SlidersHorizontal className="h-6 w-6" />
            </span>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Settings hub is ready</h2>
              <p className="text-sm text-muted-foreground">
                Connect more integrations to unlock automation rules and premium monitoring.
              </p>
            </div>
            <Button variant="outline" className="border-slate-200 bg-white">
              Explore integrations
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
