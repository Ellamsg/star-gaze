"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

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
import { useAuth, useChangePassword, useLogoutAll } from "@/hooks/use-auth";
import type { ChangePasswordFormValues } from "@/types/auth";

type Tab = "profile" | "password" | "notifications";

const passwordRules = [
  { id: "length", label: "At least 12 characters", test: (value: string) => value.length >= 12 },
  { id: "upper", label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { id: "lower", label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
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
  const { data: admin } = useAuth();
  const changePassword = useChangePassword();
  const logoutAll = useLogoutAll();
  const [reveal, setReveal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    control,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const next = useWatch({ control, name: "newPassword" }) ?? "";
  const confirm = useWatch({ control, name: "confirmPassword" }) ?? "";
  const passed = passwordRules.filter((rule) => rule.test(next)).length;
  const serverError =
    changePassword.error instanceof Error ? changePassword.error.message : null;

  const submit = async (values: ChangePasswordFormValues) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      notify("Password updated. Other sessions were signed out.", "success");
    } catch {
      // The server error is rendered below the fields.
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h2 className="text-[15px] font-semibold text-cream">Change password</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Signed in as {admin?.email ?? "the owner"}. Use the password you sign
          in with, then pick something you haven’t used elsewhere.
        </p>

        <form
          className="mt-4 space-y-3.5"
          aria-busy={changePassword.isPending}
          onSubmit={handleSubmit(submit)}
        >
          <Field
            label="Current password"
            htmlFor="current-password"
            error={errors.currentPassword?.message}
          >
            <TextInput
              id="current-password"
              type={reveal ? "text" : "password"}
              autoComplete="current-password"
              {...register("currentPassword", {
                required: "Enter your current password.",
                maxLength: { value: 128, message: "At most 128 characters." },
              })}
            />
          </Field>

          <Field
            label="New password"
            htmlFor="new-password"
            error={errors.newPassword?.message}
          >
            <div className="relative">
              <TextInput
                id="new-password"
                type={reveal ? "text" : "password"}
                autoComplete="new-password"
                className="pr-12"
                {...register("newPassword", {
                  required: "Enter a new password.",
                  maxLength: { value: 128, message: "At most 128 characters." },
                  validate: (value) =>
                    passwordRules.every((rule) => rule.test(value)) ||
                    "The new password doesn’t meet all the rules yet.",
                })}
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
            htmlFor="confirm-password"
            error={
              errors.confirmPassword?.message ??
              (confirm.length > 0 && confirm !== next
                ? "Passwords don’t match yet."
                : undefined)
            }
          >
            <TextInput
              id="confirm-password"
              type={reveal ? "text" : "password"}
              autoComplete="new-password"
              {...register("confirmPassword", {
                required: "Confirm the new password.",
                validate: (value) =>
                  value === getValues("newPassword") || "Passwords don’t match.",
              })}
            />
          </Field>

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

          {serverError ? (
            <p className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
              {serverError}
            </p>
          ) : null}

          <Button
            type="submit"
            className="mt-5 w-full sm:w-auto"
            icon="lock"
            loading={changePassword.isPending}
          >
            {changePassword.isPending ? "Updating…" : "Update password"}
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="text-[15px] font-semibold text-cream">Sessions</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Signed in as {admin?.email ?? "the owner"}. Seen something odd? Sign
          out every device — including this one.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          icon="logout"
          loading={logoutAll.isPending}
          onClick={() => logoutAll.mutate()}
        >
          {logoutAll.isPending ? "Signing out…" : "Sign out everywhere"}
        </Button>
      </Card>
    </div>
  );
}
