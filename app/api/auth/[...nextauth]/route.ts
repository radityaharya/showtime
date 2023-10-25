import NextAuth, { NextAuthOptions } from "next-auth";
import TraktProvider from "next-auth/providers/trakt";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "../../../../lib/mongo/mongoPromise";

const collection_prefix = process.env.MONGO_COLLECTION_PREFIX || "nextauth_";
export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: "test",
    collections: {
      Users: `${collection_prefix}users`,
      Accounts: `${collection_prefix}accounts`,
      Sessions: `${collection_prefix}sessions`,
      VerificationTokens: `${collection_prefix}verificationTokens`,
    },
  }),
  session: { strategy: "jwt" },
  providers: [
    TraktProvider({
      clientId: process.env.TRAKT_CLIENT_ID as string,
      clientSecret: process.env.TRAKT_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET as string,
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      return true;
    },
    async redirect({ url, baseUrl }) {
      return `${baseUrl}/auth/success`;
    },
    async session({ session, user, token }) {
      return session;
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
