import { requireStaff } from "@/lib/auth";
import AdminShell from "./admin-shell";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireStaff();
  return <AdminShell session={session}>{children}</AdminShell>;
}
