'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { authClient } from '@/lib/auth-client';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AccountItem = {
  id: string;
  providerId: string;
  provider: string;
  accountId?: string;
};

export function AccountView() {
  const { data: session } = authClient.useSession();
  const user = session?.user ?? null;

  // profile
  const [name, setName] = useState(user?.name ?? '');
  const [image, setImage] = useState(user?.image ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  // email
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  // connections
  const [accounts, setAccounts] = useState<AccountItem[] | null>(null);
  const [connBusy, setConnBusy] = useState<string | null>(null);

  // fx / messages
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // keep inputs in sync if session updates
    setName(user?.name ?? '');
    setImage(user?.image ?? '');
  }, [user?.name, user?.image]);

  async function loadAccounts() {
    try {
      const res = await authClient.listAccounts();
      // normalize
      const list: AccountItem[] = (res?.data ?? []).map((a: any) => ({
        id: String(a.id ?? a.providerId ?? Math.random()),
        providerId: String(a.providerId ?? a.provider ?? ''),
        provider: String(a.provider ?? a.providerId ?? ''),
        accountId: a.accountId ? String(a.accountId) : undefined,
      }));
      setAccounts(list);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to load connected accounts');
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  async function onSaveProfile() {
    setSavingProfile(true);
    setMsg(null);
    setErr(null);
    try {
      await authClient.updateUser({ name: name || undefined, image: image || undefined });
      setMsg('Profile updated.');
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  }

  async function onChangeEmail() {
    setSavingEmail(true);
    setMsg(null);
    setErr(null);
    try {
      await authClient.changeEmail({
        newEmail,
        callbackURL: '/account?email=updated',
      });
      setMsg('Check your inbox to confirm the email change.');
      setNewEmail('');
    } catch (e: any) {
      setErr(e?.message ?? 'Email change failed. Make sure changeEmail is enabled.');
    } finally {
      setSavingEmail(false);
    }
  }

  async function onChangePassword() {
    setSavingPw(true);
    setMsg(null);
    setErr(null);
    try {
      await authClient.changePassword({
        currentPassword: currentPw,
        newPassword: newPw,
        revokeOtherSessions: true,
      });
      setMsg('Password updated. Other sessions were signed out.');
      setCurrentPw('');
      setNewPw('');
    } catch (e: any) {
      setErr(e?.message ?? 'Password change failed');
    } finally {
      setSavingPw(false);
    }
  }

  async function onLink(provider: 'google' | 'github' | 'apple') {
    setConnBusy(provider);
    setMsg(null);
    setErr(null);
    try {
      await authClient.linkSocial({ provider, callbackURL: '/account' });
      // user will be redirected; this line is fallback
    } catch (e: any) {
      setErr(e?.message ?? `Failed to link ${provider}`);
    } finally {
      setConnBusy(null);
    }
  }

  async function onUnlink(providerId: string, accountId?: string) {
    setConnBusy(providerId);
    setMsg(null);
    setErr(null);
    try {
      await authClient.unlinkAccount(accountId ? { providerId, accountId } : { providerId });
      setMsg(`Unlinked ${providerId}.`);
      await loadAccounts();
    } catch (e: any) {
      setErr(e?.message ?? 'Could not unlink account');
    } finally {
      setConnBusy(null);
    }
  }

  async function onDelete() {
    if (!confirm('This will permanently delete your account. Continue?')) return;
    setMsg(null);
    setErr(null);
    try {
      await authClient.deleteUser({}); // may require password or fresh session per server config
      // sign the user out locally afterward
      await authClient.signOut();
    } catch (e: any) {
      setErr(
        e?.message ??
          'Deletion failed. You may need a fresh session, a password, or email verification.'
      );
    }
  }

  const initials = useMemo(() => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
    }
    return (user?.email?.[0] ?? '?').toUpperCase();
  }, [user?.name, user?.email]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Section className="pt-24 pb-6">
        <Container>
          <h1 className="font-heading text-5xl font-extrabold tracking-tight text-slate-900">
            Account
          </h1>
          <p className="mt-2 text-slate-600">Manage your profile, security, and connections.</p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="flex w-full max-w-full flex-wrap gap-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="connections">Connected accounts</TabsTrigger>
              <TabsTrigger value="danger" className="text-red-600">
                Danger zone
              </TabsTrigger>
            </TabsList>

            {(msg || err) && (
              <div className="mt-4 rounded-md border p-3 text-sm">
                {msg ? <span className="text-emerald-700">{msg}</span> : null}
                {err ? <span className="text-red-700">{err}</span> : null}
              </div>
            )}

            <TabsContent value="profile" className="mt-6">
              <Card className="border-slate-200/70">
                <CardHeader>
                  <CardTitle className="font-heading">Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-700 ring-1 ring-blue-500/20">
                      {image ? (
                        <Image
                          src={image}
                          alt="Avatar"
                          width={56}
                          height={56}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600">
                      Signed in as <span className="font-medium text-slate-900">{user?.email}</span>
                    </div>
                  </div>

                  <div className="grid max-w-xl gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Display name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="image">Image URL</Label>
                      <Input id="image" value={image} onChange={(e) => setImage(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={onSaveProfile} disabled={savingProfile}>
                      {savingProfile ? 'Saving…' : 'Save changes'}
                    </Button>
                    <Button variant="ghost" onClick={() => authClient.signOut()}>
                      Sign out
                    </Button>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <Label htmlFor="newEmail">Change email</Label>
                    <div className="flex max-w-xl gap-2">
                      <Input
                        id="newEmail"
                        type="email"
                        placeholder="new@email.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                      <Button onClick={onChangeEmail} disabled={savingEmail || !newEmail}>
                        {savingEmail ? 'Sending…' : 'Update email'}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      We’ll send a confirmation to your current email to approve the change.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <Card className="border-slate-200/70 max-w-xl">
                <CardHeader>
                  <CardTitle className="font-heading">Change password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPw">Current password</Label>
                    <Input
                      id="currentPw"
                      type="password"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="newPw">New password</Label>
                    <Input
                      id="newPw"
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={onChangePassword} disabled={savingPw}>
                      {savingPw ? 'Updating…' : 'Update password'}
                    </Button>
                    <p className="text-xs text-slate-500">
                      Updating can sign out other active sessions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="connections" className="mt-6">
              <Card className="border-slate-200/70">
                <CardHeader>
                  <CardTitle className="font-heading">Connected accounts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onLink('google')}
                      disabled={connBusy === 'google'}
                    >
                      {connBusy === 'google' ? 'Linking…' : 'Link Google'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onLink('github')}
                      disabled={connBusy === 'github'}
                    >
                      {connBusy === 'github' ? 'Linking…' : 'Link GitHub'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onLink('apple')}
                      disabled={connBusy === 'apple'}
                    >
                      {connBusy === 'apple' ? 'Linking…' : 'Link Apple'}
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-sm text-slate-600">Currently linked</div>
                    <ul className="space-y-2">
                      {(accounts ?? []).length === 0 ? (
                        <li className="text-sm text-slate-500">No linked accounts yet.</li>
                      ) : null}
                      {(accounts ?? []).map((a) => (
                        <li
                          key={`${a.providerId}:${a.accountId ?? 'default'}`}
                          className="flex items-center justify-between rounded-md border p-2"
                        >
                          <div className="text-sm">
                            <span className="font-medium capitalize">{a.provider}</span>
                            {a.accountId ? (
                              <span className="text-slate-500"> • {a.accountId}</span>
                            ) : null}
                          </div>
                          <Button
                            variant="ghost"
                            onClick={() => onUnlink(a.providerId, a.accountId)}
                            disabled={connBusy === a.providerId}
                          >
                            Unlink
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="danger" className="mt-6">
              <Card className="border-red-300/60 bg-red-50">
                <CardHeader>
                  <CardTitle className="font-heading text-red-700">Delete account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-red-700">
                    This permanently deletes your account and data. You may need to confirm via
                    email or provide your password depending on your security settings.
                  </p>
                  <Button variant="destructive" onClick={onDelete}>
                    Delete my account
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Container>
      </Section>
    </main>
  );
}
