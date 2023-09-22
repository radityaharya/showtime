import { BaseUtil } from "./Base";
import { MAX_DAYS_AGO, MAX_PERIOD } from "./Base";
import ical from "ical-generator";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

interface Episode {
  first_aired: string;
  show: {
    title: string;
    network: string;
    images: {
      fanart: {
        full: string;
      };
      logo: {
        full: string;
      };
    };
    ids: {
      trakt: number | null;
      slug: string | null;
      tvdb: number | null;
      imdb: string | null;
      tmdb: number | null;
      tvrage: number | null;
    };
  };
  episode: {
    season: number;
    number: number;
    title: string;
    overview: string;
    runtime: number | null;
  };
}

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

export class ShowsUtil extends BaseUtil {
  getShowImages(
    showId: number | string,
    callback: (response: Response | undefined) => void
  ) {
    this.tmdb.tv
      .getImages({
        pathParameters: {
          tv_id: showId,
        },
      })
      .then((response: any) => {
        const backdropPath = response.data.backdrops[0].file_path;
        fetch(`https://image.tmdb.org/t/p/original${backdropPath}`)
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

  async getShowsBatch(daysAgo: number, period: number): Promise<MappedEpisode[]> {
    if (daysAgo > MAX_DAYS_AGO || period > MAX_PERIOD) {
      throw new Error(
        `days_ago must be less than ${MAX_DAYS_AGO} and period must be less than ${MAX_PERIOD}`
      );
    }

    const cache: { [key: string]: Episode[] } = {};

    const getEpisodes = async (startDate: string, days: number) => {
      console.log(`getEpisodes: startDate: ${startDate}, days: ${days}`);
      const cacheKey = `${startDate}-${days}`;
      if (cache[cacheKey]) {
        return cache[cacheKey];
      }
      const response = await this._request(
        "/calendars/my/shows",
        "GET",
        undefined,
        undefined,
        {
          start_date: startDate,
          days,
          extended: "full",
        }
      );
      cache[cacheKey] = response;
      return response;
    };

    const startDate = dayjs().subtract(daysAgo, "day").format("YYYY-MM-DD");

    const entries: Episode[] = [];
    const batchSize = 20;
    const numBatches = Math.ceil(period / batchSize);
    const requests = [];
    for (let i = 0; i < numBatches; i++) {
      const currentDate = dayjs(startDate)
        .add(i * batchSize, "day")
        .format("YYYY-MM-DD");
      const days = Math.min(batchSize, period - i * batchSize);
      requests.push(getEpisodes(currentDate, days));
    }
    const responses = await Promise.all(requests);
    responses.forEach((response) => {
      entries.push(...response);
    });

    const groupedOutput: MappedEpisode[] = entries.reduce(
      (acc: MappedEpisode[], item: Episode) => {
        const dateStr = dayjs(item.first_aired)
          .utc()
          .format("ddd, DD MMM YYYY");
        const found = acc.find((groupedItem) => groupedItem.dateStr === dateStr);
        if (found) {
          found.items.push({
            show: item.show.title,
            season: item.episode.season,
            number: item.episode.number,
            title: item.episode.title,
            overview: item.episode.overview,
            network: item.show.network,
            runtime: item.episode.runtime || 30, // Set default runtime if null or 0
            background: item.show.images?.fanart?.full,
            logo: item.show.images?.logo?.full,
            airsAt: dayjs(item.first_aired).utc().format(),
            airsAtUnix: dayjs(item.first_aired).unix(),
            ids: item.show.ids,
          });
        } else {
          acc.push({
            dateStr,
            dateUnix: dayjs(item.first_aired).unix(),
            items: [
              {
                show: item.show.title,
                season: item.episode.season,
                number: item.episode.number,
                title: item.episode.title,
                overview: item.episode.overview,
                network: item.show.network,
                runtime: item.episode.runtime || 30, // Set default runtime if null or 0
                background: item.show.images?.fanart?.full,
                logo: item.show.images?.logo?.full,
                airsAt: dayjs(item.first_aired).utc().format(),
                airsAtUnix: dayjs(item.first_aired).unix(),
                ids: item.show.ids,
              },
            ],
          });
        }
        return acc;
      },
      []
    );

    return groupedOutput;
  }
  async getShowsCalendar(days_ago = 30, period = 90) {
    let episodes = await this.getShowsBatch(days_ago, period);
    console.log(JSON.stringify(episodes));

    // flatten mapped episodes to single array
    const flattenedEpisodes = [];
    for (const episode of episodes) {
      flattenedEpisodes.push(...episode.items);
    }

    const cal = ical({ name: "Trakt.tv Calendar" });
    for (const episode of flattenedEpisodes) {
      if (episode.runtime === null || episode.runtime === 0) {
        episode.runtime = 30;
      }
      console.log(episode ? episode.ids : "no show");
      const show_ids = episode.ids;
      let show_detail;
      if (show_ids.tmdb) {
        show_detail = await this.tmdb.tv.getDetails({
          pathParameters: {
            tv_id: show_ids.tmdb,
          },
        });
      }

      const summary = `${episode.title} - S${episode.season
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
          ? show_detail.data.networks[0].name
          : episode.network,
      });
    }
    return cal;
  }
}
