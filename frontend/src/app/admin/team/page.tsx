"use client";

import { useMemo, useState } from "react";

import { useAdmin } from "@/components/admin/store";
import { Icon } from "@/components/admin/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  PageHeader,
  Select,
  Sheet,
  TextInput,
  Toggle,
  cn,
} from "@/components/admin/ui";
import { roleLabels, roles, type Role, type Staff } from "@/data/admin";
import { formatDate } from "@/lib/date";

const roleTone: Record<Role, "pink" | "sky" | "green" | "amber"> = {
  owner: "pink",
  manager: "sky",
  stylist: "green",
  front_desk: "amber",
};

const roleAccess: Record<Role, string> = {
  owner: "Everything, including team, billing and studio settings.",
  manager: "Bookings, clients, payments, refunds and the service menu.",
  stylist: "Their own appointments and client notes. No money screens.",
  front_desk: "Bookings, clients and payments. No refunds or settings.",
};

export default function TeamPage() {
  const { state, addStaff, updateStaff, removeStaff, notify } = useAdmin();
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);

  const counts = useMemo(
    () =>
      roles.reduce<Record<Role, number>>(
        (total, role) => ({
          ...total,
          [role]: state.staff.filter((member) => member.role === role).length,
        }),
        { owner: 0, manager: 0, stylist: 0, front_desk: 0 }
      ),
    [state.staff]
  );

  const current = state.staff.find((member) => member.id === editing?.id) ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="The team"
        title="Admins"
        accent="& roles"
        description="Staff sign in here, not on the client site. Roles decide who sees money and who only sees the chair."
        action={
          <Button icon="plus" onClick={() => setInviting(true)}>
            Invite
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {roles.map((role) => (
          <div
            key={role}
            className="rounded-2xl border border-hairline/60 bg-surface/60 px-3.5 py-3"
          >
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{roleLabels[role]}</p>
            <p className="mt-1 font-display text-xl leading-none text-cream">{counts[role]}</p>
          </div>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {state.staff.map((member) => (
          <li key={member.id}>
            <button
              type="button"
              onClick={() => setEditing(member)}
              className="flex w-full items-center gap-3 rounded-[22px] border border-hairline/60 bg-surface/70 px-3.5 py-3 text-left transition hover:border-pink/25 active:scale-[0.995]"
            >
              <Avatar name={member.name} tone={roleTone[member.role]} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="break-words text-[14px] font-medium leading-snug text-cream">
                    {member.name}
                  </p>
                  {!member.joinedAt ? <Badge tone="amber">Invite pending</Badge> : null}
                  {!member.active ? <Badge tone="slate">Paused</Badge> : null}
                </div>
                <p className="break-words text-[12px] text-muted">{member.email}</p>
              </div>
              <Badge tone={roleTone[member.role]}>{roleLabels[member.role]}</Badge>
              <Icon name="chevronRight" size={15} className="shrink-0 text-muted" />
            </button>
          </li>
        ))}
      </ul>

      <Card className="mt-6 p-5">
        <h2 className="text-[15px] font-semibold text-cream">What each role can do</h2>
        <ul className="mt-3 space-y-2.5">
          {roles.map((role) => (
            <li key={role} className="flex gap-3">
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  role === "owner" ? "bg-pink/15 text-pink" : "bg-white/[0.05] text-muted"
                )}
              >
                <Icon name={role === "owner" ? "lock" : "shield"} size={13} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-cream">{roleLabels[role]}</p>
                <p className="text-[12px] leading-relaxed text-muted">{roleAccess[role]}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Sheet
        open={inviting}
        onClose={() => setInviting(false)}
        title="Invite an admin"
        description="They'll get an email to set a password. Client accounts are separate — clients never sign in."
      >
        <InviteForm
          onCancel={() => setInviting(false)}
          onSubmit={(form) => {
            addStaff({
              name: form.name,
              email: form.email,
              phone: form.phone,
              role: form.role,
              active: true,
              joinedAt: undefined,
            });
            setInviting(false);
            notify(`Invite sent to ${form.email}.`, "success");
          }}
        />
      </Sheet>

      <Sheet
        open={current !== null}
        onClose={() => setEditing(null)}
        title={current?.name ?? "Team member"}
        description={current ? `Joined ${current.joinedAt ? formatDate(current.joinedAt) : "— invite pending"}` : undefined}
      >
        {current ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-hairline/60 bg-canvas/30 p-4">
              <Avatar name={current.name} tone={roleTone[current.role]} />
              <div className="min-w-0">
                <p className="break-words text-sm font-medium text-cream">{current.name}</p>
                <p className="break-words text-[12px] text-muted">{current.email}</p>
                <p className="text-[12px] text-muted">{current.phone}</p>
              </div>
            </div>

            <Field
              label="Role"
              hint={current.role === "owner" ? "The owner role can't be changed here." : roleAccess[current.role]}
            >
              <Select
                value={current.role}
                disabled={current.role === "owner"}
                onChange={(event) => {
                  const role = event.target.value as Role;
                  updateStaff(current.id, { role });
                  notify(`${current.name} is now ${roleLabels[role]}.`, "success");
                }}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="rounded-2xl border border-hairline/60 bg-canvas/30 px-4">
              <Toggle
                checked={current.active}
                onChange={(active) => {
                  updateStaff(current.id, { active });
                  notify(active ? "Access restored." : "Access paused.", "success");
                }}
                label="Dashboard access"
                description="Pausing keeps their history but blocks sign-in."
              />
            </div>

            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-4">
              <p className="text-[12px] leading-relaxed text-rose-200/90">
                {current.role === "owner"
                  ? "The owner account is protected. Transfer ownership before removing it."
                  : "Removing revokes access immediately. Their past appointments stay assigned to them."}
              </p>
              <Button
                variant="danger"
                size="sm"
                className="mt-3"
                disabled={current.role === "owner"}
                onClick={() => {
                  if (!window.confirm(`Remove ${current.name} from the team?`)) return;
                  const result = removeStaff(current.id);
                  notify(result.message, result.ok ? "success" : "danger");
                  if (result.ok) setEditing(null);
                }}
              >
                Remove from team
              </Button>
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}

function InviteForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (form: { name: string; email: string; phone: string; role: Role }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("stylist");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (name.trim().length < 2) {
      setError("Enter their full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 7) {
      setError("Enter a phone number with at least 7 digits.");
      return;
    }
    setError(null);
    onSubmit({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), role });
  };

  return (
    <div className="space-y-4">
      <Field label="Full name">
        <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Zainab Musa" />
      </Field>
      <Field label="Work email">
        <TextInput
          type="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@petalandlash.studio"
        />
      </Field>
      <Field label="Phone">
        <TextInput
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+234 801 234 5678"
        />
      </Field>
      <Field label="Role" hint={roleAccess[role]}>
        <Select value={role} onChange={(event) => setRole(event.target.value as Role)}>
          {roles.map((option) => (
            <option key={option} value={option}>
              {roleLabels[option]}
            </option>
          ))}
        </Select>
      </Field>

      {error ? (
        <p className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button onClick={submit} icon="plus">
          Send invite
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
