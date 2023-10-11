"use client";

import Image from "next/image";
import Page from "../../layouts/Page";
import { getProviders, signIn, useSession } from "next-auth/react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { useRouter } from "next/navigation";
export default function Login() {

  const router = useRouter()
  const {data: session} = useSession()
  const name = session?.user?.name

  if (name) {
      router.push(`${name}`)
  }

  return (
    <Page>
      <div className="flex h-screen flex-col items-start gap-5 bg-[#09080f]/80 px-5">
        <div className="flex h-screen w-full flex-col items-center justify-center overflow-auto">
          <button
            className="flex items-center justify-center gap-5 rounded-2xl bg-transparent bg-white px-4 py-3 text-black"
            onClick={() => signIn("trakt")}
          >
            <Image
              src="https://iwhksjsfesopygewmtaw.supabase.co/storage/v1/object/public/public/spotify.svg"
              width={24}
              height={24}
              alt="Spotify"
            />
            <span className="font-medium">Login with Spotify</span>
          </button>
        </div>
      </div>
    </Page>
  );
}