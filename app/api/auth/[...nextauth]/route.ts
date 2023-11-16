import NextAuth, { NextAuthOptions } from "next-auth";
import TraktProvider from "next-auth/providers/trakt";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "../../../../lib/mongo/mongoPromise";
import { Users } from "@/lib/util/users";
import type { Session } from "next-auth";

export type customSession = Session & {
  accessToken?: {
    slug: string;
    access_token: string;
    refresh_token: string;
    expires_at: number;
    token_type: "Bearer";
    scope: string;
    expires_in: number;
    created_at: number;
  };
};

const collection_prefix = process.env.MONGO_COLLECTION_PREFIX || "nextauth_";
export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.NEXTAUTH_DB,
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
    async session({ session, user, token }): Promise<customSession> {
      const sessionUser = session as customSession;

      const customToken = token as {
        name: string;
        email: string;
        picture: string;
        sub: string;
        accessToken: {
          slug: string;
          access_token: string;
          refresh_token: string;
          expires_at: number;
          token_type: "Bearer";
          scope: string;
          expires_in: number;
          created_at: number;
        };
        iat: number;
        exp: number;
        jti: string;
      };

      sessionUser.accessToken = customToken.accessToken;
      return sessionUser;
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      if (token.sub) {
        const accessToken = await new Users().getAccessToken("", token.sub);
        if (accessToken) {
          token.accessToken = accessToken;
        }
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
