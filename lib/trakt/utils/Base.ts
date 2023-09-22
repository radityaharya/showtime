import ical from "ical-generator";
import MovieDB from "node-themoviedb";

export const MAX_DAYS_AGO = 30;
export const MAX_PERIOD = 90;

export class BaseUtil {
  private client_id: string;
  private client_secret: string;
  private oauth_token?: string;
  public tmdb: MovieDB;
  private api_url: string;

  constructor(oauth_token?: string) {
    this.client_id = process.env.TRAKT_CLIENT_ID!;
    this.client_secret = process.env.TRAKT_CLIENT_SECRET!;
    this.oauth_token = oauth_token;
    this.tmdb = new MovieDB(process.env.TMDB_API_KEY!);
    this.api_url = "https://api.trakt.tv";
  }

  async _request(
    path: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: any,
    headers?: any,
    query?: any
  ) {
    const url = new URL(path, this.api_url);
    if (query) {
      Object.keys(query).forEach((key) =>
        url.searchParams.append(key, query[key])
      );
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
      body: JSON.stringify(body),
    });
    return response.json();
  }
}