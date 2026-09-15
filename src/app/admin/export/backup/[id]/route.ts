import { createClient } from "@/lib/supabase/server";
import { getToken, requireRole } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole(["superadmin"]);
  const { id } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_get_backup", {
    p_token: await getToken(),
    p_backup_id: id,
  });

  if (error || !data) {
    return new Response(JSON.stringify({ error: error?.message ?? "Backup tidak ditemukan" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="backup_${id}.json"`,
    },
  });
}
