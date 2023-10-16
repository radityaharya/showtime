"use client";

import Page from "../../../layouts/Page";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
export default function Login() {
  const router = useRouter();
  const { data: session } = useSession();
  const name = session?.user?.name;

  if (name) {
    router.push(`/${name}`);
  }

  return (
    <Page>
      <div className="flex h-screen flex-col items-start gap-5 bg-[#09080f]/80 px-5">
        <div className="flex h-screen w-full flex-col items-center justify-center overflow-auto">
          <span className="font-medium">Logging you in...</span>
        </div>
      </div>
    </Page>
  );
}
