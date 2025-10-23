import { getSessionUser } from "@/lib/session";
import { ProfilView } from "@/components/user/profil-view";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const sessionUser = await getSessionUser();
  return <ProfilView sessionUser={sessionUser} />;
}
