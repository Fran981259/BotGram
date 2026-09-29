import { redirect } from "next/navigation";

/** /admin redireciona automaticamente para o dashboard. */
export default function AdminRootPage() {
  redirect("/admin/dashboard");
}
