import ical from "ical-generator";
import MovieDB from "node-themoviedb";

const MAX_DAYS_AGO = 30;
const MAX_PERIOD = 90;

export class TraktAPI {
  private client_id: string;
  private client_secret: string;
  private oauth_token?: string;
  private tmdb: MovieDB;

  constructor(oauth_token?: string) {
    this.client_id = process.env.TRAKT_CLIENT_ID!;
    this.client_secret = process.env.TRAKT_CLIENT_SECRET!;
    this.oauth_token = oauth_token;
    this.tmdb = new MovieDB(process.env.TMDB_API_KEY!);
  }

  /**
   * This is a private method that is used to make requests to the Trakt API.
   * It is not intended to be used outside of this class.
   */
  async _request(
    path: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: any,
    headers?: any,
    query?: any
  ) {
    const url = new URL(`https://api.trakt.tv${path}`);
    console.log(url.toString());
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

  async get_shows_batch(days_ago: number, period: number) {
    let episodes: any[] = [];
    if (days_ago > MAX_DAYS_AGO || period > MAX_PERIOD) {
      throw new Error(
        `days_ago must be less than ${MAX_DAYS_AGO} and period must be less than ${MAX_PERIOD}`
      );
    }

    const get_episodes = (start_date: string, days: number) => {
      console.log(start_date, days);
      return this._request("/calendars/my/shows", "GET", undefined, undefined, {
        start_date,
        days,
        extended: "full",
      });
    };

    const start_date = new Date(Date.now() - days_ago * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const end_date = new Date(Date.now() + period * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    if (
      new Date(end_date).getTime() - new Date(start_date).getTime() <
      33 * 24 * 60 * 60 * 1000
    ) {
      episodes = await get_episodes(start_date, period);
    } else {
      const futures = [];
      let batch_start_date = start_date;
      while (
        new Date(end_date).getTime() - new Date(batch_start_date).getTime() >
        33 * 24 * 60 * 60 * 1000
      ) {
        futures.push(
          Promise.resolve().then(() => get_episodes(batch_start_date, 33))
        );
        batch_start_date = new Date(
          new Date(batch_start_date).getTime() + 33 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .slice(0, 10);
      }
      futures.push(
        Promise.resolve().then(() =>
          get_episodes(
            batch_start_date,
            Math.floor(
              (new Date(end_date).getTime() -
                new Date(batch_start_date).getTime()) /
                (24 * 60 * 60 * 1000)
            )
          )
        )
      );
      episodes = await Promise.all(futures);
      episodes = episodes.flat();
    }
    return episodes;
  }

  async get_movies_batch(days_ago: number, period: number) {
    let movies: any[] = [];
    if (days_ago > MAX_DAYS_AGO || period > MAX_PERIOD) {
      throw new Error(
        `days_ago must be less than ${MAX_DAYS_AGO} and period must be less than ${MAX_PERIOD}`
      );
    }

    const get_movies = (start_date: string, days: number) => {
      console.log(start_date, days);
      return this._request(
        "/calendars/my/movies",
        "GET",
        undefined,
        undefined,
        {
          start_date,
          days,
          extended: "full",
        }
      );
    };

    const start_date = new Date(Date.now() - days_ago * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const end_date = new Date(Date.now() + period * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    if (
      new Date(end_date).getTime() - new Date(start_date).getTime() <
      33 * 24 * 60 * 60 * 1000
    ) {
      movies = await get_movies(start_date, period);
    } else {
      const futures = [];
      let batch_start_date = start_date;
      while (
        new Date(end_date).getTime() - new Date(batch_start_date).getTime() >
        33 * 24 * 60 * 60 * 1000
      ) {
        futures.push(
          Promise.resolve().then(() => get_movies(batch_start_date, 33))
        );
        batch_start_date = new Date(
          new Date(batch_start_date).getTime() + 33 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .slice(0, 10);
      }
      futures.push(
        Promise.resolve().then(() =>
          get_movies(
            batch_start_date,
            Math.floor(
              (new Date(end_date).getTime() -
                new Date(batch_start_date).getTime()) /
                (24 * 60 * 60 * 1000)
            )
          )
        )
      );
      movies = await Promise.all(futures);
      movies = movies.flat();
    }
    return movies;
  }

  async get_shows_calendar(days_ago = 30, period = 90) {
    const episodes = await this.get_shows_batch(days_ago, period);
    console.log(JSON.stringify(episodes));

    const cal = ical({ name: "Trakt.tv Calendar" });
    for (const episode of episodes) {
      if (episode.runtime === null || episode.runtime === 0) {
        episode.runtime = 30;
      }
      console.log(episode ? episode.show.ids : "no show");
      const show_ids = episode.show.ids;
      const show_detail = await this.tmdb.tv.getDetails({
        pathParameters: {
          tv_id: show_ids.tmdb,
        },
      });
      const summary = `${episode.show.title} - S${episode.episode.season
        .toString()
        .padStart(2, "0")}E${episode.episode.number.toString().padStart(2, "0")}`;

      const description = episode.overview
        ? `${episode.title}\n${episode.overview}`
        : episode.title;
      cal.createEvent({
        start: episode.first_aired,
        summary: summary,
        description: description,
        location: show_detail.data.networks[0]?.name,
      });
    }

    return episodes;
  }

  async get_movies_calendar(days_ago = 30, period = 90) {
    const movies = await this.get_movies_batch(days_ago, period);
    const cal = ical({ name: "Trakt.tv Calendar" });
    for (const movie of movies) {
      const year = new Date(movie.released).getFullYear();
      const summary = `${movie.title} (${year})`;
      const description = movie.overview
        ? `${movie.title}\n${movie.overview}`
        : movie.title;
      cal.createEvent({
        start: movie.released,
        end: new Date(new Date(movie.released).getTime() + 2 * 60 * 60 * 1000),
        summary: summary,
        description: description,
      });
    }

    return cal.toString();
  }
}
