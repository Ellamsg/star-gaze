"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Icon } from "@/components/admin/icons";
import { Button, Card, Field, TextInput } from "@/components/admin/ui";
import { useLogin } from "@/hooks/use-auth";
import type { LoginFormValues } from "@/types/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [reveal, setReveal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  const error = login.error instanceof Error ? login.error.message : null;

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login.mutateAsync({
        email: values.email.trim(),
        password: values.password,
      });
      router.replace("/admin");
    } catch {
      // The mutation error is rendered below the form.
    }
  };

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-canvas px-5 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(700px 420px at 15% 0%, rgba(233,139,166,0.22), transparent 60%), radial-gradient(600px 360px at 100% 100%, rgba(217,125,153,0.14), transparent 55%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink text-canvas shadow-[0_10px_30px_-10px_rgba(233,139,166,0.9)]">
            <Icon name="sparkle" size={21} />
          </span>
          <div>
            <p className="font-display text-[17px] uppercase tracking-wide text-cream">
              Stargaze
            </p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
              Admin
            </p>
          </div>
        </div>

        <Card className="p-6 sm:p-7">
          <h1 className="font-display text-[clamp(1.8rem,5vw,2.3rem)] uppercase leading-none text-cream">
            Sign in
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            This area is for the studio owner. Enter the admin email and password
            created on the server.
          </p>

          <form
            className="mt-6 space-y-4"
            aria-busy={login.isPending}
            onSubmit={handleSubmit(onSubmit)}
          >
            <Field
              label="Email"
              htmlFor="admin-email"
              error={errors.email?.message}
            >
              <TextInput
                id="admin-email"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="you@studio.com"
                {...register("email", {
                  required: "Enter your email.",
                  maxLength: { value: 320, message: "Email is too long." },
                })}
              />
            </Field>

            <Field
              label="Password"
              htmlFor="admin-password"
              error={errors.password?.message}
            >
              <div className="relative">
                <TextInput
                  id="admin-password"
                  type={reveal ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  className="pr-12"
                  {...register("password", {
                    required: "Enter your password.",
                    maxLength: { value: 128, message: "Password is too long." },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setReveal((value) => !value)}
                  aria-label={reveal ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-white/5 hover:text-cream"
                >
                  <Icon name={reveal ? "eyeOff" : "eye"} size={16} />
                </button>
              </div>
            </Field>

            {error ? (
              <p
                role="alert"
                className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-[13px] leading-relaxed text-rose-200"
              >
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              loading={login.isPending}
            >
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-center text-[11.5px] leading-relaxed text-muted">
            Admin access only — there is no public registration. Password resets
            are handled from the server.
          </p>
        </Card>

        <Link
          href="/"
          className="mt-5 block text-center text-[12.5px] text-muted underline-offset-4 transition hover:text-cream hover:underline"
        >
          ← Back to the site
        </Link>
      </div>
    </main>
  );
}
