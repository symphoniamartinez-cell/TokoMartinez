"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { loginAction } from "./actions";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result = await loginAction(username, password);

    if (!result.ok) {
      setError(result.message);
      setPending(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Username">
        <Input
          autoFocus
          autoCapitalize="none"
          autoComplete="username"
          placeholder="mis. joko"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </Field>

      <Field label="Kata Sandi">
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg text-ink-faint transition hover:text-ink"
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </Field>

      {error && <Alert>{error}</Alert>}

      <Button type="submit" size="lg" block disabled={pending} className="mt-1">
        {pending ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>
            <LogIn size={17} />
            Masuk
          </>
        )}
      </Button>

      <p className="text-center text-[12px] leading-relaxed text-ink-faint">
        Akun dibuatkan oleh Super Admin. Hubungi pengurus bila lupa kata sandi.
      </p>
    </form>
  );
}
