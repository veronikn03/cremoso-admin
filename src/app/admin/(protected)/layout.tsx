import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { withRetry } from "@/lib/supabase/retry";
import AdminNav from "./AdminNav";
import HeaderActions from "./HeaderActions";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await withRetry(() => supabase.auth.getUser());

  if (!user) {
    redirect("/admin/login");
  }

  const { data: isAdmin } = await withRetry(() => supabase.rpc("is_admin"));

  if (!isAdmin) {
    redirect("/admin/login");
  }

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.jpg" alt="" className="brand-mark" />
          <span style={{ display: "block" }}>
            <h1>Cremoso Gourmet</h1>
            <span>Mi panel</span>
          </span>
        </div>
        <HeaderActions />
      </header>
      <AdminNav />
      {children}
    </div>
  );
}
