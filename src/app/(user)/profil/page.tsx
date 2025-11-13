import { Suspense } from "react";
import { getSessionUser } from "@/lib/session";
import { ProfilView } from "@/components/user/profil-view";

// Metadata untuk SEO
export const metadata = {
  title: "Profil - MeetRead",
  description: "Kelola profil dan pengaturan akunmu",
};

async function ProfileData() {
  const sessionUser = await getSessionUser();
  return <ProfilView sessionUser={sessionUser} />;
}

export default function ProfilPage() {
  return (
    <Suspense fallback={<ProfilLoading />}>
      <ProfileData />
    </Suspense>
  );
}

function ProfilLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] px-6 pb-24 pt-10 text-slate-900">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
        <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
      </div>
    </div>
  );
}
