import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Pencil } from 'lucide-react';

const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];
const journalTypes = ['SALES', 'PURCHASE', 'CASH', 'GENERAL'];

const defaultAccountForm = {
  code: '',
  name: '',
  type: 'ASSET',
  is_active: true,
};

const defaultJournalForm = {
  code: '',
  name: '',
  type: 'GENERAL',
};

const createDefaultEntryForm = () => ({
  entry_no: '',
  date: '',
  journal_id: '',
  memo: '',
  ref_type: '',
  ref_id: '',
  lines: [
    {
      account_id: '',
      debit: '',
      credit: '',
      memo: '',
    },
  ],
});

export default function Accounting() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editingJournalId, setEditingJournalId] = useState(null);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [accountForm, setAccountForm] = useState(defaultAccountForm);
  const [journalForm, setJournalForm] = useState(defaultJournalForm);
  const [entryForm, setEntryForm] = useState(createDefaultEntryForm);

  const { data: accounts, isLoading: accountsLoading, error: accountsError } = useQuery({
    queryKey: ['accounting', 'accounts'],
    queryFn: async () => {
      const res = await api.get('/accounting/accounts/');
      return res.data.results || res.data;
    },
  });

  const { data: journals, isLoading: journalsLoading, error: journalsError } = useQuery({
    queryKey: ['accounting', 'journals'],
    queryFn: async () => {
      const res = await api.get('/accounting/journals/');
      return res.data.results || res.data;
    },
  });

  const { data: entries, isLoading: entriesLoading, error: entriesError } = useQuery({
    queryKey: ['accounting', 'entries'],
    queryFn: async () => {
      const res = await api.get('/accounting/entries/');
      return res.data.results || res.data;
    },
  });

  const accountLookupByCode = useMemo(() => {
    const lookup = {};
    (accounts || []).forEach((account) => {
      lookup[account.code] = account;
    });
    return lookup;
  }, [accounts]);

  const journalLookupByCode = useMemo(() => {
    const lookup = {};
    (journals || []).forEach((journal) => {
      lookup[journal.code] = journal;
    });
    return lookup;
  }, [journals]);

  const accountMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingAccountId) {
        return api.put(`/accounting/accounts/${editingAccountId}/`, payload);
      }
      return api.post('/accounting/accounts/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting', 'accounts'] });
      setAccountModalOpen(false);
      setEditingAccountId(null);
      setAccountForm(defaultAccountForm);
      toast({ title: 'Account saved', description: 'Account details have been updated.' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Account failed', description: 'Could not save account.' });
    },
  });

  const journalMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingJournalId) {
        return api.put(`/accounting/journals/${editingJournalId}/`, payload);
      }
      return api.post('/accounting/journals/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting', 'journals'] });
      setJournalModalOpen(false);
      setEditingJournalId(null);
      setJournalForm(defaultJournalForm);
      toast({ title: 'Journal saved', description: 'Journal details have been updated.' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Journal failed', description: 'Could not save journal.' });
    },
  });

  const entryMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingEntryId) {
        return api.put(`/accounting/entries/${editingEntryId}/`, payload);
      }
      return api.post('/accounting/entries/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting', 'entries'] });
      setEntryModalOpen(false);
      setEditingEntryId(null);
      setEntryForm(createDefaultEntryForm());
      toast({ title: 'Entry saved', description: 'Journal entry has been updated.' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Entry failed', description: 'Could not save entry.' });
    },
  });

  const openAccountModal = () => {
    setEditingAccountId(null);
    setAccountForm(defaultAccountForm);
    setAccountModalOpen(true);
  };

  const openJournalModal = () => {
    setEditingJournalId(null);
    setJournalForm(defaultJournalForm);
    setJournalModalOpen(true);
  };

  const openEntryModal = () => {
    setEditingEntryId(null);
    setEntryForm(createDefaultEntryForm());
    setEntryModalOpen(true);
  };

  const handleAccountEdit = (account) => {
    setEditingAccountId(account.id);
    setAccountForm({
      code: account.code ?? '',
      name: account.name ?? '',
      type: account.type ?? 'ASSET',
      is_active: account.is_active ?? true,
    });
    setAccountModalOpen(true);
  };

  const handleJournalEdit = (journal) => {
    setEditingJournalId(journal.id);
    setJournalForm({
      code: journal.code ?? '',
      name: journal.name ?? '',
      type: journal.type ?? 'GENERAL',
    });
    setJournalModalOpen(true);
  };

  const handleEntryEdit = (entry) => {
    const journalId = journalLookupByCode[entry.journal_code]?.id || '';
    const mappedLines = (entry.lines || []).map((line) => ({
      account_id: accountLookupByCode[line.account_code]?.id
        ? String(accountLookupByCode[line.account_code]?.id)
        : '',
      debit: line.debit ?? '',
      credit: line.credit ?? '',
      memo: line.memo ?? '',
    }));
    setEditingEntryId(entry.id);
    setEntryForm({
      entry_no: entry.entry_no ?? '',
      date: entry.date ?? '',
      journal_id: journalId ? String(journalId) : '',
      memo: entry.memo ?? '',
      ref_type: entry.ref_type ?? '',
      ref_id: entry.ref_id ?? '',
      lines: mappedLines.length ? mappedLines : createDefaultEntryForm().lines,
    });
    setEntryModalOpen(true);
  };

  const handleEntryLineChange = (index, field, value) => {
    setEntryForm((prev) => {
      const updatedLines = [...prev.lines];
      updatedLines[index] = { ...updatedLines[index], [field]: value };
      return { ...prev, lines: updatedLines };
    });
  };

  const addEntryLine = () => {
    setEntryForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { account_id: '', debit: '', credit: '', memo: '' }],
    }));
  };

  const removeEntryLine = (index) => {
    setEntryForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, lineIndex) => lineIndex !== index),
    }));
  };

  const submitAccount = (event) => {
    event.preventDefault();
    accountMutation.mutate({
      code: accountForm.code,
      name: accountForm.name,
      type: accountForm.type,
      is_active: accountForm.is_active,
    });
  };

  const submitJournal = (event) => {
    event.preventDefault();
    journalMutation.mutate({
      code: journalForm.code,
      name: journalForm.name,
      type: journalForm.type,
    });
  };

  const submitEntry = (event) => {
    event.preventDefault();
    const payload = {
      entry_no: Number(entryForm.entry_no),
      date: entryForm.date,
      journal_id: Number(entryForm.journal_id),
      memo: entryForm.memo || null,
      ref_type: entryForm.ref_type || null,
      ref_id: entryForm.ref_id || null,
      lines: entryForm.lines.map((line) => ({
        account_id: line.account_id ? Number(line.account_id) : null,
        debit: line.debit ? Number(line.debit) : 0,
        credit: line.credit ? Number(line.credit) : 0,
        memo: line.memo || null,
      })),
    };
    entryMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Accounting</h2>
          <p className="text-muted-foreground">Manage your chart of accounts, journals, and entries.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openAccountModal}>
            <Plus className="mr-2 h-4 w-4" />
            New Account
          </Button>
          <Button onClick={openJournalModal} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Journal
          </Button>
          <Button onClick={openEntryModal} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{accounts?.length ?? 0}</p>
            <p className="text-sm text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Journals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{journals?.length ?? 0}</p>
            <p className="text-sm text-muted-foreground">Configured journals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{entries?.length ?? 0}</p>
            <p className="text-sm text-muted-foreground">Recent journal entries</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Chart of Accounts</CardTitle>
            <Button size="sm" onClick={openAccountModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Loading accounts...
                    </TableCell>
                  </TableRow>
                ) : accountsError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-destructive">
                      Failed to load accounts.
                    </TableCell>
                  </TableRow>
                ) : accounts?.length ? (
                  accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{account.type}</TableCell>
                      <TableCell>{account.is_active ? 'Active' : 'Inactive'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleAccountEdit(account)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No accounts found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Journals</CardTitle>
            <Button size="sm" variant="outline" onClick={openJournalModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journalsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Loading journals...
                    </TableCell>
                  </TableRow>
                ) : journalsError ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-destructive">
                      Failed to load journals.
                    </TableCell>
                  </TableRow>
                ) : journals?.length ? (
                  journals.map((journal) => (
                    <TableRow key={journal.id}>
                      <TableCell>{journal.code}</TableCell>
                      <TableCell>{journal.name}</TableCell>
                      <TableCell>{journal.type}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleJournalEdit(journal)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No journals found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Journal Entries</CardTitle>
          <Button size="sm" variant="outline" onClick={openEntryModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Journal</TableHead>
                <TableHead>Memo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entriesLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading entries...
                  </TableCell>
                </TableRow>
              ) : entriesError ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-destructive">
                    Failed to load entries.
                  </TableCell>
                </TableRow>
              ) : entries?.length ? (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.entry_no}</TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.journal_name}</TableCell>
                    <TableCell>{entry.memo || '—'}</TableCell>
                    <TableCell>{entry.posted ? 'Posted' : 'Draft'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEntryEdit(entry)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No entries found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {entries?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {entries.slice(0, 4).map((entry) => (
                <Card key={`entry-card-${entry.id}`} className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-base">Entry #{entry.entry_no}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">Journal:</span> {entry.journal_name}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Date:</span> {entry.date}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Lines:</span> {entry.lines?.length ?? 0}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Memo:</span> {entry.memo || '—'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={accountModalOpen} onOpenChange={setAccountModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingAccountId ? 'Edit Account' : 'New Account'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitAccount}>
            <div className="grid gap-2">
              <Label htmlFor="account-code">Code</Label>
              <Input
                id="account-code"
                value={accountForm.code}
                onChange={(event) => setAccountForm((prev) => ({ ...prev, code: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-name">Name</Label>
              <Input
                id="account-name"
                value={accountForm.name}
                onChange={(event) => setAccountForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select
                value={accountForm.type}
                onValueChange={(value) => setAccountForm((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">Toggle to deactivate this account.</p>
              </div>
              <Switch
                checked={accountForm.is_active}
                onCheckedChange={(checked) => setAccountForm((prev) => ({ ...prev, is_active: checked }))}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={accountMutation.isPending}>
                {accountMutation.isPending ? 'Saving...' : 'Save Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={journalModalOpen} onOpenChange={setJournalModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingJournalId ? 'Edit Journal' : 'New Journal'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitJournal}>
            <div className="grid gap-2">
              <Label htmlFor="journal-code">Code</Label>
              <Input
                id="journal-code"
                value={journalForm.code}
                onChange={(event) => setJournalForm((prev) => ({ ...prev, code: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="journal-name">Name</Label>
              <Input
                id="journal-name"
                value={journalForm.name}
                onChange={(event) => setJournalForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select
                value={journalForm.type}
                onValueChange={(value) => setJournalForm((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {journalTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={journalMutation.isPending}>
                {journalMutation.isPending ? 'Saving...' : 'Save Journal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={entryModalOpen} onOpenChange={setEntryModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingEntryId ? 'Edit Entry' : 'New Journal Entry'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitEntry}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="entry-no">Entry Number</Label>
                <Input
                  id="entry-no"
                  type="number"
                  value={entryForm.entry_no}
                  onChange={(event) => setEntryForm((prev) => ({ ...prev, entry_no: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="entry-date">Date</Label>
                <Input
                  id="entry-date"
                  type="date"
                  value={entryForm.date}
                  onChange={(event) => setEntryForm((prev) => ({ ...prev, date: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Journal</Label>
                <Select
                  value={entryForm.journal_id}
                  onValueChange={(value) => setEntryForm((prev) => ({ ...prev, journal_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select journal" />
                  </SelectTrigger>
                  <SelectContent>
                    {journals?.length ? (
                      journals.map((journal) => (
                        <SelectItem key={journal.id} value={String(journal.id)}>
                          {journal.code} - {journal.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        {journalsLoading ? 'Loading journals...' : 'No journals available'}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="entry-memo">Memo</Label>
                <Input
                  id="entry-memo"
                  value={entryForm.memo}
                  onChange={(event) => setEntryForm((prev) => ({ ...prev, memo: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="entry-ref-type">Reference Type</Label>
                <Input
                  id="entry-ref-type"
                  value={entryForm.ref_type}
                  onChange={(event) => setEntryForm((prev) => ({ ...prev, ref_type: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="entry-ref-id">Reference ID</Label>
                <Input
                  id="entry-ref-id"
                  value={entryForm.ref_id}
                  onChange={(event) => setEntryForm((prev) => ({ ...prev, ref_id: event.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Lines</h3>
                <Button type="button" size="sm" variant="outline" onClick={addEntryLine}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Line
                </Button>
              </div>
              {entryForm.lines.map((line, index) => (
                <div key={`line-${index}`} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="grid gap-2 md:col-span-2">
                      <Label>Account</Label>
                      <Select
                        value={line.account_id}
                        onValueChange={(value) => handleEntryLineChange(index, 'account_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts?.length ? (
                            accounts.map((account) => (
                              <SelectItem key={account.id} value={String(account.id)}>
                                {account.code} - {account.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              {accountsLoading ? 'Loading accounts...' : 'No accounts available'}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Debit</Label>
                      <Input
                        type="number"
                        value={line.debit}
                        onChange={(event) => handleEntryLineChange(index, 'debit', event.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Credit</Label>
                      <Input
                        type="number"
                        value={line.credit}
                        onChange={(event) => handleEntryLineChange(index, 'credit', event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Line Memo</Label>
                    <Input
                      value={line.memo}
                      onChange={(event) => handleEntryLineChange(index, 'memo', event.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEntryLine(index)}
                      disabled={entryForm.lines.length === 1}
                    >
                      Remove line
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={entryMutation.isPending}>
                {entryMutation.isPending ? 'Saving...' : 'Save Entry'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
