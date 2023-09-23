import { BaseUtil } from "./Base";
import { MAX_DAYS_AGO, MAX_PERIOD } from "./Base";
import ical from "ical-generator";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

interface MappedMovies {
  dateStr: string;
  dateUnix: number;
  items: {
    show: string;
    title: string;
    overview: string;
    runtime: number;
    // background: string | undefined;
    // logo: string | undefined;
    network: string;
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

export class MoviesUtil extends BaseUtil {
  getMovieImages(
    showId: number | string,
    callback: (response: Response | undefined) => void,
  ) {
    this.tmdb.tv
      .getImages({
        pathParameters: {
          tv_id: showId,
        },
      })
      .then((response: any) => {
        const backdropPath = response.data.backdrops[0].file_path;
        fetch(`https://image.tmdb.org/m/p/original${backdropPath}`)
          .then((response: Response) => {
            callback(response);
          })
          .catch((error: any) => {
            console.log(error);
            callback(undefined);
          });
      })
      .catch((error: any) => {
        console.log(error);
        callback(undefined);
      });
  }

  async getMoviesBatch(
    daysAgo: number,
    period: number,
  ): Promise<MappedMovies[]> {
    if (daysAgo > MAX_DAYS_AGO || period > MAX_PERIOD) {
      throw new Error(
        `days_ago must be less than ${MAX_DAYS_AGO} and period must be less than ${MAX_PERIOD}`,
      );
    }

    const startDate = dayjs().subtract(daysAgo, "day");

    const getEpisodes = async (startDate: dayjs.Dayjs, days: number) => {
      const response = await this._request(
        "/calendars/my/movies",
        "GET",
        undefined,
        undefined,
        {
          start_date: startDate.format("YYYY-MM-DD"),
          days,
          extended: "full",
        },
      );
      return response;
    };

    const batchSize = 20;
    const numBatches = Math.ceil(period / batchSize);
    const requests = [];

    for (let i = 0; i < numBatches; i++) {
      requests.push(
        getEpisodes(
          startDate.add(i * batchSize, "day"),
          Math.min(batchSize, period - i * batchSize),
        ),
      );
    }

    const responses = await Promise.all(requests);
    const entries = responses.flat();

    const groupedOutput = new Map<string, MappedMovies>();
    for (const item of entries) {
      const date = dayjs(item.first_aired).utc();
      const dateStr = date.format("ddd, DD MMM YYYY");
      const dateUnix = date.unix();
      const key = dateStr;

      console.log(item);
      const mappedMovie = {
        show: item.movie.title,
        title: item.movie.title,
        overview: item.movie.overview,
        runtime: item.movie.runtime || 30,
        // background: item.movie.images?.fanart?.full,
        // logo: item.show.images?.logo?.full,
        network: item.movie.tagline,
        airsAt: date.format(),
        airsAtUnix: dateUnix,
        ids: item.movie.ids,
      };

      if (groupedOutput.has(key)) {
        groupedOutput.get(key)!.items.push(mappedMovie);
      } else {
        groupedOutput.set(key, {
          dateStr,
          dateUnix,
          items: [mappedMovie],
        });
      }
    }

    return Array.from(groupedOutput.values());
  }

  async getMoviesCalendar(days_ago = 30, period = 90) {
    let entries = await this.getMoviesBatch(days_ago, period);

    // flatten mapped episodes to single array
    const flattenedEntries = [];
    for (const entry of entries) {
      flattenedEntries.push(...entry.items);
    }

    const cal = ical({ name: "Trakt.tv Calendar" });
    for (const entry of flattenedEntries) {
      if (entry.runtime === null || entry.runtime === 0) {
        entry.runtime = 120;
      }
      console.log(entry ? entry.ids : "no show");
      const movie_ids = entry.ids;
      let show_detail;
      if (movie_ids.tmdb) {
        show_detail = await this.tmdb.movie.getDetails({
          pathParameters: {
            movie_id: movie_ids.tmdb,
          },
        });
      }

      const summary = `${entry.title}`;

      const description = entry.overview
        ? `${entry.title}\n${entry.overview}`
        : entry.title;
      cal.createEvent({
        start: new Date(entry.airsAtUnix * 1000),
        summary: summary,
        description: description,
        location: entry.network,
      });
    }
    return cal;
  }
}
