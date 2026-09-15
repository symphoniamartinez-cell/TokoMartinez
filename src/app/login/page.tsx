import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { MartinezLogoFull } from "@/components/brand";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/admin");

  return (
    <div className="petal-bg flex flex-1 flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <MartinezLogoFull className="h-32" />
          <p className="mt-4 text-sm text-ink-soft">Portal Petugas Toko Martinez</p>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
