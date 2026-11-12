"use client";

import { useState } from "react";

import { useAdmin, type Toast } from "@/components/admin/store";
import { Icon } from "@/components/admin/icons";
import {
  Button,
  Card,
  Field,
  PageHeader,
  Segmented,
  TextInput,
  Toggle,
  cn,
} from "@/components/admin/ui";
import { roleLabels, type StudioProfile } from "@/data/admin";

type Tab = "profile" | "password" | "notifications";

const passwordRules = [
  { id: "length", label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { id: "number", label: "One number", test: (value: string) => /\d/.test(value) },
  { id: "symbol", label: "One symbol", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

export default function SettingsPage() {
  const { state, notify } = useAdmin();
  const [tab, setTab] = useState<Tab>("profile");
  const owner = state.staff.find((member) => member.role === "owner");

  return (
    <div>
      <PageHeader
        eyebrow="Your studio"
        title="Settings"
        accent="& access"
        description="Studio details, your password, and the notifications worth waking up for."
      />

      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: "profile", label: "Profile" },
          { value: "password", label: "Password" },
          { value: "notifications", label: "Notifications" },
        ]}
        className="mb-5"
      />

      {tab === "profile" ? (
        <ProfilePanel
          key={JSON.stringify(state.studio)}
          initial={state.studio}
          ownerName={owner?.name ?? "Owner"}
          ownerRole={owner ? roleLabels[owner.role] : "Owner"}
        />
      ) : null}

      {tab === "password" ? <PasswordPanel notify={notify} /> : null}

      {tab === "notifications" ? <NotificationsPanel email={owner?.email} /> : null}
    </div>
  );
}

function ProfilePanel({
  initial,
  ownerName,
  ownerRole,
}: {
  initial: StudioProfile;
  ownerName: string;
  ownerRole: string;
}) {
  const { updateStudio, notify, resetDemo } = useAdmin();
  const [profile, setProfile] = useState(initial);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink/15 text-pink">
            <Icon name="sparkle" size={19} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-cream">{ownerName}</p>
            <p className="text-[12px] text-muted">{ownerRole} · signed in</p>
          </div>
        </div>

        <div className="space-y-3.5">
          <Field label="Studio name">
            <TextInput
              value={profile.name}
              onChange={(event) => setProfile({ ...profile, name: event.target.value })}
            />
          </Field>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Phone">
              <TextInput
                type="tel"
                inputMode="tel"
                value={profile.phone}
                onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
              />
            </Field>
            <Field label="Email">
              <TextInput
                type="email"
                inputMode="email"
                value={profile.email}
                onChange={(event) => setProfile({ ...profile, email: event.target.value })}
              />
            </Field>
          </div>
          <Field label="Address">
            <TextInput
              value={profile.address}
              onChange={(event) => setProfile({ ...profile, address: event.target.value })}
            />
          </Field>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="City">
              <TextInput
                value={profile.city}
                onChange={(event) => setProfile({ ...profile, city: event.target.value })}
              />
            </Field>
            <Field label="Instagram">
              <TextInput
                value={profile.instagram}
                onChange={(event) => setProfile({ ...profile, instagram: event.target.value })}
              />
            </Field>
          </div>
        </div>

        <Button
          className="mt-5 w-full sm:w-auto"
          onClick={() => {
            updateStudio(profile);
            notify("Studio details saved.", "success");
          }}
        >
          Save changes
        </Button>
      </Card>

      <Card className="p-5">
        <h2 className="text-[15px] font-semibold text-cream">Demo data</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Everything on this dashboard is stored in your browser. Resetting puts the sample
          bookings, payments and team back.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => {
            if (!window.confirm("Reset all dashboard data to the demo seed?")) return;
            resetDemo();
            notify("Demo data restored.", "success");
          }}
        >
          Reset demo data
        </Button>
      </Card>
    </div>
  );
}

function NotificationsPanel({ email }: { email?: string }) {
  const { state, updateNotifications } = useAdmin();

  return (
    <Card className="p-5">
      <h2 className="text-[15px] font-semibold text-cream">Notifications</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-muted">
        Sent to {email ?? "the owner"}. Nothing here is noisy — pick what you’d actually act on.
      </p>

      <div className="mt-2 divide-y divide-hairline/60">
        <Toggle
          checked={state.notifications.newBookingEmail}
          onChange={(value) => updateNotifications({ newBookingEmail: value })}
          label="New booking"
          description="Email when a client books or reschedules."
        />
        <Toggle
          checked={state.notifications.reminderSms}
          onChange={(value) => updateNotifications({ reminderSms: value })}
          label="Client reminders"
          description="Text the client 24 hours before their slot."
        />
        <Toggle
          checked={state.notifications.refundAlerts}
          onChange={(value) => updateNotifications({ refundAlerts: value })}
          label="Refund requests"
          description="Ping when someone asks for money back."
        />
        <Toggle
          checked={state.notifications.dailySummary}
          onChange={(value) => updateNotifications({ dailySummary: value })}
          label="Daily summary"
          description="One 8pm email: takings, bookings, no-shows."
        />
      </div>
    </Card>
  );
}

function PasswordPanel({ notify }: { notify: (message: string, tone?: Toast["tone"]) => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passed = passwordRules.filter((rule) => rule.test(next)).length;

  const submit = () => {
    if (current.length === 0) {
      setError("Enter your current password.");
      return;
    }
    if (passed < passwordRules.length) {
      setError("The new password doesn’t meet all the rules yet.");
      return;
    }
    if (next !== confirm) {
      setError("The two new passwords don’t match.");
      return;
    }

    setError(null);
    setCurrent("");
    setNext("");
    setConfirm("");
    notify("Password updated.", "success");
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h2 className="text-[15px] font-semibold text-cream">Change password</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Use the password you sign in with, then pick something you haven’t used elsewhere.
        </p>

        <div className="mt-4 space-y-3.5">
          <Field label="Current password">
            <TextInput
              type={reveal ? "text" : "password"}
              value={current}
              autoComplete="current-password"
              onChange={(event) => setCurrent(event.target.value)}
            />
          </Field>

          <Field label="New password">
            <div className="relative">
              <TextInput
                type={reveal ? "text" : "password"}
                value={next}
                autoComplete="new-password"
                onChange={(event) => setNext(event.target.value)}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setReveal((value) => !value)}
                aria-label={reveal ? "Hide passwords" : "Show passwords"}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-white/5 hover:text-cream"
              >
                <Icon name={reveal ? "eyeOff" : "eye"} size={16} />
              </button>
            </div>
          </Field>

          <Field
            label="Confirm new password"
            error={confirm.length > 0 && confirm !== next ? "Passwords don’t match yet." : undefined}
          >
            <TextInput
              type={reveal ? "text" : "password"}
              value={confirm}
              autoComplete="new-password"
              onChange={(event) => setConfirm(event.target.value)}
            />
          </Field>
        </div>

        <div className="mt-4">
          <div className="flex gap-1.5">
            {passwordRules.map((rule, index) => (
              <span
                key={rule.id}
                className={cn(
                  "h-1 flex-1 rounded-full transition",
                  index < passed ? "bg-pink" : "bg-white/10"
                )}
              />
            ))}
          </div>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {passwordRules.map((rule) => {
              const ok = rule.test(next);
              return (
                <li
                  key={rule.id}
                  className={cn(
                    "flex items-center gap-2 text-[12px]",
                    ok ? "text-emerald-300" : "text-muted"
                  )}
                >
                  <Icon name={ok ? "check" : "close"} size={13} />
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
            {error}
          </p>
        ) : null}

        <Button className="mt-5 w-full sm:w-auto" icon="lock" onClick={submit}>
          Update password
        </Button>
      </Card>

      <Card className="p-5">
        <h2 className="text-[15px] font-semibold text-cream">Sessions</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Seen something odd? Sign out every device — including this one.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          icon="logout"
          onClick={() => notify("Signed out on all devices.", "success")}
        >
          Sign out everywhere
        </Button>
      </Card>
    </div>
  );
}
