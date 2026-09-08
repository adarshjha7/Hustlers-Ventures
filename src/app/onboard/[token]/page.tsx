import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabaseAdmin";
import OnboardForm from "./OnboardForm";

export const dynamic = "force-dynamic";

export default async function OnboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: investor } = await admin
    .from("investors")
    .select("investor_id, investor_name, phone")
    .eq("invite_token", token)
    .is("user_id", null)
    .maybeSingle();

  if (!investor) {
    notFound();
  }

  return (
    <OnboardForm
      token={token}
      prefillName={investor.investor_name ?? ""}
      prefillPhone={investor.phone ?? ""}
    />
  );
}
