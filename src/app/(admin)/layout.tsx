import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import AdminShell from "@/components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/admin/login");
  }

  return <AdminShell userEmail={user.email ?? ""}>{children}</AdminShell>;
}
