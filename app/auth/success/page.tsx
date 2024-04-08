import { authOptions, customSession } from "@/app/api/auth/[...nextauth]/route";
// import Page from "../../../layouts/Page";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function Login() {
  // const router = useRouter();
  const session = (await getServerSession(authOptions)) as customSession;
  // console.log("Success page session: ", session);
  const slug = session.accessToken?.slug;

  if (slug) {
    redirect(`/${slug}`);
  } else {
    redirect(`/`);
  }
}
