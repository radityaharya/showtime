import { type NextPage } from "next";
import Link from "next/link";
import PageWIthGradient from "@/layouts/Page";
import { ChevronRight } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Showtime",
  description: "Keep track of your favorite shows and movies with showtime.",
};
type customPageType = NextPage & {
  showGradient?: boolean;
};

const Home: customPageType = () => {
  return (
    <PageWIthGradient>
      <div className="items-left flex max-h-screen min-h-screen w-full flex-col overflow-auto">
        <div className="flex min-h-screen flex-col items-start justify-center py-2 pt-10 drop-shadow-md">
          <div className="flex flex-col items-start gap-5 px-5 md:gap-6 md:px-20">
            <div className="flex flex-col items-start gap-4">
              <div className="flex flex-col items-start gap-2">
                <span className="text-left text-7xl text-gray-100">
                  <span className="font-bold">Showtime</span>
                </span>
                <span className="max-w-[270px] text-left text-base text-white/80 font-medium">
                  <span>
                    Keep track of your favorite shows and movies with showtime.
                  </span>
                </span>
              </div>
            </div>
            <span className="flex flex-col items-center justify-center gap-4 md:flex-row">
              <Link
                className="flex items-center justify-center gap-5 rounded-2xl border-2 border-white bg-white px-4 py-3"
                href="/auth"
              >
                <span className="font-medium text-black">Login</span>
                <ChevronRight size={24} color="black" />
              </Link>
              {/* <Link
                className="flex items-center justify-center gap-5 rounded-2xl border-2 border-white bg-transparent px-4 py-3"
                href="/host"
              >
                <span className="font-medium text-white">Login</span>
                <ChevronRight size={24} color="white" />
              </Link> */}
            </span>
          </div>
        </div>
      </div>
    </PageWIthGradient>
  );
};

Home.showGradient = true;

export default Home;
