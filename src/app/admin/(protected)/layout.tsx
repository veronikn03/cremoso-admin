import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "./AdminNav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");

  if (!isAdmin) {
    redirect("/admin/login");
  }

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <h1>Cremoso Gourmet</h1>
          <span>Mi panel</span>
        </div>
      </header>
      <AdminNav />
      {children}
    </div>
  );
}
