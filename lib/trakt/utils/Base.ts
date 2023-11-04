// import clientPromise from "@/lib/mongo/mongoPromise";
import { Users } from "@/lib/util/users";
import clientPromise from "@/lib/mongo/mongoPromise";

const Redis = require("ioredis");
export const MAX_DAYS_AGO = 360;
export const MAX_PERIOD = 390;

export interface AccessToken {
  slug: string;
  access_token: {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    created_at: number;
  };
}
export class BaseUtil {
  private client_id: string;
  private client_secret: string;
  private redirect_uri: string;
  private accessToken?: AccessToken;
  public redis_client: typeof Redis;
  public user_slug?: string;
  private api_url: string;

  constructor(
    accessToken: AccessToken | undefined,
    user_slug: string | undefined,
  ) {
    this.client_id = process.env.TRAKT_CLIENT_ID!;
    this.client_secret = process.env.TRAKT_CLIENT_SECRET!;
    this.redirect_uri = process.env.HOST + "/api/trakt/callback";
    this.user_slug = user_slug;
    this.accessToken = accessToken;
    this.api_url = "https://api.trakt.tv";
    this.redis_client = new Redis(process.env.REDIS_URL, {
      keepAlive: 5000,
    });
    this.onInit();
  }

  onInit() {
    if (!this.user_slug) {
      this._request("/users/me", "GET").then((res) => {
        this.user_slug = res.user.ids.slug;
      });
    }
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

    if (this.user_slug !== undefined && this.accessToken === undefined) {
      const users = new Users();
      const token = await users.getAccessToken(this.user_slug);
      if (await this._isAccesTokenExpired(token)) {
        console.info("Refreshing access token for", this.user_slug);
        await this.refreshAccessToken(token);
      }
      this.accessToken = token;
    }

    let oauth_token;

    if (this.accessToken) {
      if (await this._isAccesTokenExpired(this.accessToken)) {
        console.info("Refreshing access token for", this.accessToken.slug);
        await this.refreshAccessToken(this.accessToken);
      }
      oauth_token = this.accessToken.access_token;
    }

    if (headers && headers.Authorization) {
      oauth_token = headers.Authorization.split(" ")[1];
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        "trakt-api-key": this.client_id,
        "trakt-api-version": "2",
        ...(oauth_token ? { authorization: `Bearer ${oauth_token}` } : {}),
        ...headers,
      },
      body: body && typeof body !== "string" ? JSON.stringify(body) : body,
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const body = await response.json();

      if (response.ok) {
        return body;
      } else {
        throw new Error(body.message);
      }
    }

    return response.text(); // or handle non-JSON response
  }

  async _isAccesTokenExpired(access_token: AccessToken) {
    const { expires_in, created_at } = access_token.access_token;
    const isTokenExpired = Date.now() / 1000 > created_at + expires_in;
    return isTokenExpired;
  }

  async refreshAccessToken(access_token: AccessToken) {
    const newAccessToken = await this._request("/oauth/token", "POST", {
      refresh_token: access_token.access_token.refresh_token,
      client_id: this.client_id,
      client_secret: this.client_secret,
      redirect_uri: this.redirect_uri,
      grant_type: "refresh_token",
    });

    if (newAccessToken && this.accessToken) {
      this.accessToken.access_token = newAccessToken;
    }

    const slug = this._request("/users/me", "GET").then(
      (res) => res.user.ids.slug,
    );

    const users = new Users();
    await users.refreshAccessToken(await slug, newAccessToken);
  }

  async getHistory(
    type: string,
    ids: { trakt?: number; imdb?: string; tmdb?: number },
  ) {
    if (!this.user_slug) {
      throw new Error("No user slug");
    }
    if (!ids.trakt && !ids.imdb && !ids.tmdb) {
      throw new Error("No valid ids");
    }
    if (!["movies", "shows", "seasons", "episodes"].includes(type)) {
      throw new Error("Invalid type");
    }
    const client = await clientPromise;
    const db = client.db("trakt_ical2");
    const collection = db.collection("history");

    const definedIds: { [key: string]: number | string | undefined } =
      Object.entries(ids).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = value;
          }
          return acc;
        },
        {} as { [key: string]: number | string | undefined },
      );

    const history = await collection.findOne({
      user_slug: this.user_slug,
      ids: definedIds,
    });

    // return if cached history is less than 50 minutes old
    if (
      history &&
      Array.isArray(history.response) &&
      history.updated_at > Date.now() - 50 * 60 * 1000
    ) {
      return history.response;
    } else {
      if (
        history &&
        history.response.length === 0 &&
        history.updated_at.getTime() > Date.now() - 10 * 60 * 1000
      ) {
        console.log(
          "Returning cached history with length 0 and updated_at is not within 10 minutes",
        );
        return history.response;
      }
      // console.log("Fetching history from trakt");
      const response = await this._request(
        `/sync/history/${type}/${ids.trakt}`,
        "GET",
        undefined,
      );
      await collection.updateOne(
        { user_slug: this.user_slug, ids },
        {
          $set: {
            updated_at: new Date(),
            response,
            watched:
              response.episodes?.some((ep: any) => ep.watched_at) ||
              response.movies?.some((m: any) => m.watched_at),
          },
        },
        { upsert: true },
      );
      return response;
    }
  }

  // async getHistoryBatch(
  //   type: string,
  //   ids: { trakt?: number; imdb?: string; tmdb?: number }[],
  // ) {
  //   if (!this.user_slug) {
  //     throw new Error("No user slug");
  //   }
  //   if (!ids.length) {
  //     throw new Error("No valid ids");
  //   }
  //   if (!["movies", "shows", "seasons", "episodes"].includes(type)) {
  //     throw new Error("Invalid type");
  //   }
  //   const client = await clientPromise;
  //   const db = client.db("trakt_ical2");
  //   const collection = db.collection("history");

  //   const definedIds: { [key: string]: number | string | undefined }[] =
  //     ids.map((id) =>
  //       Object.entries(id).reduce(
  //         (acc, [key, value]) => {
  //           if (value !== undefined) {
  //             acc[key] = value;
  //           }
  //           return acc;
  //         },
  //         {} as { [key: string]: number | string | undefined },
  //       ),
  //     );

  //   const bulkOps = definedIds.map((id) => ({
  //     updateOne: {
  //       filter: { user_slug: this.user_slug, ids: id },
  //       update: {
  //         $set: { user_slug: this.user_slug, ids: id, updated_at: new Date() },
  //       },
  //       upsert: true,
  //     },
  //   }));

  //   await collection.bulkWrite(bulkOps);

  //   const allHistory = await collection
  //     .find({ user_slug: this.user_slug, ids: { $in: definedIds } })
  //     .toArray();

  //   return allHistory.map((history) => history.response);
  // }

  async postHistory(body: any) {
    const response = await this._request("/sync/history", "POST", body);
    const type = Object.keys(body)[0];
    const client = await clientPromise;
    const db = client.db("trakt_ical2");
    const collection = db.collection("history");

    await collection.updateOne(
      {
        user_slug: this.user_slug,
        ids: body[type][0].ids,
      },
      {
        $set: {
          updated_at: new Date(),
          response,
          watched:
            response.episodes?.some((ep: any) => ep.watched_at) ||
            response.movies?.some((m: any) => m.watched_at),
        },
      },
      { upsert: true },
    );

    const updatedHistory = await collection.findOne({
      user_slug: this.user_slug,
      ids: body[type][0].ids,
    });
    return updatedHistory;
  }

  async removeHistory(body: any) {
    const response = await this._request("/sync/history/remove", "POST", body);
    const type = Object.keys(body)[0];
    const client = await clientPromise;
    const db = client.db("trakt_ical2");
    const collection = db.collection("history");
    if (response.deleted[type] === 0) {
      throw new Error("Nothing deleted");
    }
    await collection.updateOne(
      {
        user_slug: this.user_slug,
        ids: body[type][0].ids,
      },
      {
        $set: {
          updated_at: new Date(),
          response: [],
          watched: false,
        },
      },
      { upsert: true },
    );

    const updatedHistory = await collection.findOne({
      user_slug: this.user_slug,
      ids: body[type][0].ids,
    });

    return updatedHistory;
  }
}
