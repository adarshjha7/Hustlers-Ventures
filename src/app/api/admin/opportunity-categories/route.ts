import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("opportunity_categories")
    .select("*")
    .order("sort_order")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, slug, description, sort_order, image_url, volatility_level } = await req.json();

  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("opportunity_categories")
    .insert({
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
      description: description?.trim() || null,
      sort_order: sort_order ? Number(sort_order) : 0,
      image_url: image_url?.trim() || null,
      volatility_level: volatility_level || null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "A category with this slug already exists." }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ category: data });
}

export async function PATCH(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, name, slug, description, sort_order, is_active, image_url, volatility_level } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

  const fields: Record<string, unknown> = {};
  if (name !== undefined)             fields.name             = name.trim();
  if (slug !== undefined)             fields.slug             = slug.trim().toLowerCase().replace(/\s+/g, "-");
  if (description !== undefined)      fields.description      = description?.trim() || null;
  if (sort_order !== undefined)       fields.sort_order       = Number(sort_order);
  if (is_active !== undefined)        fields.is_active        = is_active;
  if (image_url !== undefined)        fields.image_url        = image_url?.trim() || null;
  if (volatility_level !== undefined) fields.volatility_level = volatility_level || null;

  const { data, error } = await supabaseAdmin
    .from("opportunity_categories")
    .update(fields)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}

export async function DELETE(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

  // Check if any opportunities use this category
  const { count } = await supabaseAdmin
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${count} opportunity${count === 1 ? "" : "s"} use this category.` },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("opportunity_categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
