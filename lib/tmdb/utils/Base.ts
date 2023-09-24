const Redis = require("ioredis");

export class BaseUtil {
  private access_token: string;
  private api_url: string;
  private api_version = 3;
  public redis_client: typeof Redis;
  public cache_duration = 60 * 60 * 24 * 7; // 1 week

  constructor() {
    this.access_token = process.env.TMDB_ACCESS_TOKEN!;
    this.api_url = "https://api.themoviedb.org";
    this.redis_client = new Redis(process.env.REDIS_URL, {
      keepAlive: 5000,
    });
  }

  async _request(
    path: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: any,
    headers?: any,
    query?: any,
  ) {
    const url = new URL(`${this.api_url}/${this.api_version}${path}`);
    if (query) {
      const searchParams = new URLSearchParams(query);
      url.search = searchParams.toString();
    }
    console.log(url.toString());

    const cache_key = `${method}:${url.toString()}`;
    const cached_data = await this.redis_client.get(cache_key);
    if (cached_data) {
      console.log(`Returning cached data for: ${cache_key}`);
      return JSON.parse(cached_data);
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "radityaharya/showtime",
        ...(this.access_token
          ? { Authorization: `Bearer ${this.access_token}` }
          : {}),
        ...headers,
      },
      body: body && typeof body !== "string" ? JSON.stringify(body) : body,
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();

      await this.redis_client.set(
        cache_key,
        JSON.stringify(data),
        "EX",
        this.cache_duration,
      );
      return data;
    }

    const data = await response.text(); // or handle non-JSON response

    await this.redis_client.set(cache_key, data, "EX", this.cache_duration);
    return data;
  }
}
