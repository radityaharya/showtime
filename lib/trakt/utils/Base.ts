import { Collection } from "@/lib/mongo/mongo";
export const MAX_DAYS_AGO = 120;
export const MAX_PERIOD = 90;

export class BaseUtil {
  private client_id: string;
  private client_secret: string;
  private oauth_token?: string;
  private user_slug?: string;
  private api_url: string;

  constructor(oauth_token?: string, user_slug?: string) {
    this.client_id = process.env.TRAKT_CLIENT_ID!;
    this.client_secret = process.env.TRAKT_CLIENT_SECRET!;
    this.user_slug = user_slug;
    this.oauth_token = oauth_token;
    this.api_url = "https://api.trakt.tv";
  }

  async init() {
    if (!this.user_slug) {
      throw new Error("User slug not set");
    }

    const token = await this.slugToToken(this.user_slug);
    this.oauth_token = token;
  }

  async _request(
    path: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: any,
    headers?: any,
    query?: any,
  ) {
    const url = new URL(path, this.api_url);

    if (query) {
      const searchParams = new URLSearchParams(query);
      url.search = searchParams.toString();
    }

    if (!this.oauth_token) {
      console.log("this.oauth_token: ", this.oauth_token);
      console.log("this.user_slug: ", this.user_slug);
      throw new Error("OAuth token not set");
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        "trakt-api-key": this.client_id,
        "trakt-api-version": "2",
        ...(this.oauth_token
          ? { authorization: `Bearer ${this.oauth_token}` }
          : {}),
        ...headers,
      },
      body: body && typeof body !== "string" ? JSON.stringify(body) : body,
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    return response.text(); // or handle non-JSON response
  }

  async slugToToken(slug: string) {
    const col = await Collection("users");
    const user = await col.findOne({ slug });

    if (!user) {
      throw new Error(`User ${slug} not found`);
    }

    return user.access_token.access_token;
  }

}
