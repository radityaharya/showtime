import { BaseUtil } from "./Base";
import { MAX_DAYS_AGO, MAX_PERIOD } from "./Base";
import ical from "ical-generator";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { TmdbAPI } from "@/lib/tmdb/Tmdb";

dayjs.extend(utc);

interface MappedEpisode {
  dateStr: string;
  dateUnix: number;
  items: {
    show: string;
    season: number;
    number: number;
    title: string;
    overview: string;
    network: string;
    runtime: number;
    background: string | undefined;
    logo: string | undefined;
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

type Image = {
  aspect_ratio: number;
  height: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
};

type Episode = {
  season: number;
  number: number;
  runtime: number;
  overview: string;
  title: string;
  ids: {
    trakt: number;
    tvdb: number;
    imdb: string | null;
    tmdb: number;
    tvrage: number | null;
  };
};

type Show = {
  title: string;
  year: number;
  ids: {
    trakt: number;
    slug: string;
    tvdb: number;
    imdb: string | null;
    tmdb: number;
    tvrage: number | null;
  };
  images: {
    backdrops: Image[];
    id: number;
    logos: Image[];
    posters: Image[];
  };
  details: any;
};

type AiredEpisode = {
  first_aired: string;
  episode: Episode;
  show: Show;
};

export class ShowsUtil extends BaseUtil {
  async getShowsBatch(
    daysAgo: number,
    period: number,
  ): Promise<MappedEpisode[]> {
    if (daysAgo > MAX_DAYS_AGO || period > MAX_PERIOD) {
      throw new Error(
        `days_ago must be less than ${MAX_DAYS_AGO} and period must be less than ${MAX_PERIOD}`,
      );
    }

    const startDate = dayjs().subtract(daysAgo, "day");
    const tmdb = new TmdbAPI();
    const getEpisodes = async (startDate: dayjs.Dayjs, days: number) => {
      const response = await this._request(
        "/calendars/my/shows",
        "GET",
        undefined,
        undefined,
        {
          start_date: startDate.format("YYYY-MM-DD"),
          days,
          extended: "full",
        },
      );

      let tmdbPromises: Promise<void>[] = [];

      if (Array.isArray(response)) {
        tmdbPromises = response.map(
          async (item: { show: { ids: any; images: any, details: any} }) => {
            const show_ids = item.show.ids;
            if (show_ids.tmdb) {
              const images = await tmdb.tv.getImages(show_ids.tmdb);
              item.show.images = images;
              const detail = await tmdb.tv.getDetails(show_ids.tmdb);
              item.show.details= detail;
            }
          },
        );
      }

      await Promise.all(tmdbPromises);

      return response;
    };

    const batchSize = 20;
    const numBatches = Math.ceil(period / batchSize);
    const showsQueue = [];

    for (let i = 0; i < numBatches; i++) {
      showsQueue.push(
        getEpisodes(
          startDate.add(i * batchSize, "day"),
          Math.min(batchSize, period - i * batchSize),
        ),
      );
    }

    const responses = (await Promise.all(showsQueue)) as AiredEpisode[][];
    const entries = responses.flat();

    const groupedOutput = new Map<string, MappedEpisode>();
    for (const item of entries) {
      try {
        const date = dayjs(item.first_aired).utc();
        const dateStr = date.format("ddd, DD MMM YYYY");
        const dateUnix = date.unix();
        const key = dateStr;

        const mappedEpisode = {
          show: item.show?.title || "",
          season: item.episode.season,
          number: item.episode.number,
          title: item.episode.title,
          overview:item.episode.overview || "", 
          network: item.show.details?.networks?.[0]?.name || "",
          runtime: 30,
          background: `https://image.tmdb.org/t/p/w500${item.show.images?.backdrops?.[0]?.file_path}`,
          logo: `https://image.tmdb.org/t/p/w500${item.show.images?.logos?.[0]?.file_path}`,
          airsAt: date.format(),
          airsAtUnix: dateUnix,
          ids: item.show.ids,
        };

        if (groupedOutput.has(key)) {
          groupedOutput.get(key)!.items.push(mappedEpisode);
        } else {
          groupedOutput.set(key, {
            dateStr,
            dateUnix,
            items: [mappedEpisode],
          });
        }
      } catch (error) {
        console.error(error);
        console.error(item);
      }
    }

    return Array.from(groupedOutput.values());
  }

  async getShowsCalendar(days_ago = 30, period = 90) {
    let episodes = await this.getShowsBatch(days_ago, period);

    const flattenedEpisodes = [];
    for (const episode of episodes) { 
      flattenedEpisodes.push(...episode.items);
    }

    const cal = ical({ name: "Trakt.tv Shows Calendar" });
    const tmdb = new TmdbAPI();
    const promises = [];
    for (const episode of flattenedEpisodes) {
      if (episode.runtime === null || episode.runtime === 0) {
        episode.runtime = 30;
      }
      const show_ids = episode.ids;
      let show_detail_promise;
      if (show_ids.tmdb) {
        show_detail_promise = tmdb.tv.getDetails(show_ids.tmdb);
      } else {
        show_detail_promise = Promise.resolve(null);
      }
      promises.push(
        show_detail_promise.then((show_detail) => {
          const summary = `${episode.show} - S${episode.season
            .toString()
            .padStart(2, "0")}E${episode.number.toString().padStart(2, "0")}`;

          const description = episode.overview
            ? `${episode.title}\n${episode.overview}`
            : episode.title;
          cal.createEvent({
            start: new Date(episode.airsAtUnix * 1000),
            summary: summary,
            description: description,
            location: show_detail
              ? show_detail.networks[0].name
              : episode.network,
          });
        }),
      );
    }
    await Promise.all(promises);
    return cal;
  }
}
