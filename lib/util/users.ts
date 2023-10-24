import clientPromise from "../mongo/mongoPromise";

const NEXTAUTH_DB = "test";
const NEXTAUTH_USERS_COLLECTION = "nextauth_users";
const NEXTAUTH_ACCOUNTS_COLLECTION = "nextauth_accounts";

export class Users {
  async getAccessToken(slug: string) {
    const db = (await clientPromise).db(NEXTAUTH_DB);
    const accounts = db.collection(NEXTAUTH_ACCOUNTS_COLLECTION);

    const user = await accounts.findOne({
      providerAccountId: slug,
      provider: "trakt",
    });

    if (!user) {
      throw new Error("User not found");
    }

    const token = {
      slug,
      access_token: user.access_token,
      refresh_token: user.refresh_token,
      expires_at: user.expires_at,
      token_type: user.token_type,
      scope: user.scope,
      expires_in: (user?.expires_at as number) - Math.floor(Date.now() / 1000),
      created_at: user.created_at,
    };
    return token;
  }

  async refreshAccessToken(slug: string, new_access_token: string) {
    const db = (await clientPromise).db(NEXTAUTH_DB);
    const accounts = db.collection(NEXTAUTH_ACCOUNTS_COLLECTION);

    const updated = accounts.updateOne(
      { slug },
      {
        $set: {
          access_token: new_access_token,
        },
      },
    );

    if (!updated) {
      throw new Error("User not found");
    }

    return updated;
  }
}
