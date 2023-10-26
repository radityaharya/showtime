import { BaseUtil, MAX_DAYS_AGO, MAX_PERIOD } from "./Base";
import ical from "ical-generator";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { TmdbAPI } from "@/lib/tmdb/Tmdb";
import { Collection } from "@/lib/mongo/mongo";

dayjs.extend(utc);

export interface MappedMovies {
  dateStr: string;
  dateUnix: number;
  items: {
    title: string;
    overview: string;
    runtime: number;
    background: string | undefined;
    logo: string | undefined;
    status: string;
    airsAt: string;
    airsAtUnix: number;
    ids: {
      trakt: number | null;
      slug: string | null;
      tvdb: number | null;
      imdb: string | null;
      tmdb: number | null;
      tvrage: number | null;
    };
  }[];
}

// eslint-disable-next-line no-unused-vars
type Image = {
  aspect_ratio: number;
  height: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
};

export class MoviesUtil extends BaseUtil {
  async getMoviesBatch(
    daysAgo?: number,
    period?: number,
    dateStart?: string,
    dateEnd?: string,
  ): Promise<MappedMovies[]> {
    // date format: YYYY-MM-DD
    let startDate;
    if (daysAgo && period) {
      if (daysAgo > MAX_DAYS_AGO || period > MAX_PERIOD) {
        throw new Error(
          `days_ago must be less than ${MAX_DAYS_AGO} and period must be less than ${MAX_PERIOD}`,
        );
      }
      startDate = dayjs().subtract(daysAgo, "day");
    } else if (dateStart && dateEnd) {
      startDate = dayjs(dateStart);
      period = dayjs(dateEnd).diff(startDate, "day");
    } else {
      throw new Error(
        "Either daysAgo and period or dateStart and dateEnd must be provided",
      );
    }

    const tmdb = new TmdbAPI();
    const userSlug = await this._request("/users/me", "GET");

    const getMovies = async (startDate: dayjs.Dayjs, days: number) => {
      const response = await this._request(
        "/calendars/my/movies",
        "GET",
        undefined,
        undefined,
        {
          start_date: startDate.format("YYYY-MM-DD"),
          days,
          // extended: "full",
        },
      );

      let tmdbPromises: Promise<void>[] = [];

      if (Array.isArray(response)) {
        tmdbPromises = response.map(
          async (item: { movie: { ids: any; images: any; details: any } }) => {
            const movie_ids = item.movie.ids;
            if (movie_ids.tmdb) {
              const images = await tmdb.movie.getImages(movie_ids.tmdb);
              item.movie.images = images;
              const detail = await tmdb.movie.getDetails(movie_ids.tmdb);
              item.movie.details = detail;
            }
          },
        );
      }

      await Promise.all(tmdbPromises);

      return response;
    };

    const batchSize = 20;
    const numBatches = Math.ceil(period / batchSize);
    const requests = [];

    for (let i = 0; i < numBatches; i++) {
      requests.push(
        getMovies(
          startDate.add(i * batchSize, "day"),
          Math.min(batchSize, period - i * batchSize),
        ),
      );
    }

    const responses = (await Promise.all(requests)) as any[][];
    const entries = responses.flat();

    const groupedOutput = new Map<string, MappedMovies>();
    for (const item of entries) {
      try {
        const date = dayjs(item.released).utc();
        const dateStr = date.format("ddd, DD MMM YYYY");
        const dateUnix = date.unix();
        const key = dateStr;

        const MappedMovies = {
          title: item.movie.title,
          overview: item.movie.details.overview,
          status: item.movie.details?.status || "",
          runtime: 30,
          background: `https://image.tmdb.org/t/p/w500${item.movie.images?.backdrops?.[0]?.file_path}`,
          logo: `https://image.tmdb.org/t/p/w500${item.movie.images?.logos?.[0]?.file_path}`,
          airsAt: date.format(),
          airsAtUnix: dateUnix,
          ids: item.movie.ids,
        };

        if (groupedOutput.has(key)) {
          groupedOutput.get(key)!.items.push(MappedMovies);
        } else {
          groupedOutput.set(key, {
            dateStr,
            dateUnix,
            items: [MappedMovies],
          });
        }
      } catch (error) {
        console.error(error);
        console.error(item);
      }
    }

    const data = Array.from(groupedOutput.values());

    const calendarStore = await Collection("calendar_store_shows");
    const promises = [];

    for (const item of data) {
      promises.push(
        calendarStore.updateOne(
          {
            slug: userSlug.ids.slug,
            date: dayjs(
              item.dateUnix * 1000 - (item.dateUnix % 86400) * 1000,
            ).toDate(),
          },
          {
            $set: {
              slug: userSlug.ids.slug,
              date: dayjs(
                item.dateUnix * 1000 - (item.dateUnix % 86400) * 1000,
              ).toDate(),
              items: item.items,
              size: item.items.length,
              updatedAt: new Date(),
            },
          },
          { upsert: true },
        ),
      );
    }

    await Promise.all(promises);

    return data;
  }

  async getMoviesCalendar(days_ago = 30, period = 90) {
    const entries = await this.getMoviesBatch(days_ago, period);

    const flattenedEntries = [];
    for (const entry of entries) {
      flattenedEntries.push(...entry.items);
    }

    const user = await this._request("/users/me", "GET");

    // TODO: Optional extended as a user config
    const calendarStore = await Collection("calendar_store_movies");
    const pastEpisodes = await calendarStore
      .find({
        slug: user.ids.slug,
        date: {
          $lte: dayjs().subtract(days_ago, "day").toDate(),
        },
      })
      .toArray();
    for (const episode of pastEpisodes) {
      flattenedEntries.push(...episode.items);
    }

    const cal = ical({ name: "Trakt.tv Movies Calendar" });

    const promises: any[] = [];
    for (const entry of flattenedEntries) {
      if (entry.runtime === null || entry.runtime === 0) {
        entry.runtime = 120;
      }
      console.log(entry ? entry.ids : "no movie");

      const summary = `${entry.title}`;

      const description = entry.overview
        ? `${entry.title}\n${entry.overview}`
        : entry.title;
      cal.createEvent({
        start: new Date(entry.airsAtUnix * 1000),
        summary,
        description,
        location: entry.status,
      });
    }

    await Promise.all(promises);
    return cal;
  }
}
