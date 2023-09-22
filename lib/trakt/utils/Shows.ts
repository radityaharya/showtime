import { BaseUtil } from "./Base";
import { MAX_DAYS_AGO, MAX_PERIOD } from "./Base";
import ical from "ical-generator";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

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

  async getShowsBatch(
    daysAgo: number,
    period: number
  ): Promise<MappedEpisode[]> {
    if (daysAgo > MAX_DAYS_AGO || period > MAX_PERIOD) {
      throw new Error(
        `days_ago must be less than ${MAX_DAYS_AGO} and period must be less than ${MAX_PERIOD}`
      );
    }

    const startDate = dayjs().subtract(daysAgo, "day");

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
        }
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
          Math.min(batchSize, period - i * batchSize)
        )
      );
    }

    const responses = await Promise.all(requests);
    const entries = responses.flat();

    const groupedOutput = new Map<string, MappedEpisode>();
    for (const item of entries) {
      const date = dayjs(item.first_aired).utc();
      const dateStr = date.format("ddd, DD MMM YYYY");
      const dateUnix = date.unix();
      const key = dateStr;

      const mappedEpisode = {
        show: item.show.title,
        season: item.episode.season,
        number: item.episode.number,
        title: item.episode.title,
        overview: item.episode.overview,
        network: item.show.network,
        runtime: item.episode.runtime || 30,
        background: item.show.images?.fanart?.full,
        logo: item.show.images?.logo?.full,
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
    }

    return Array.from(groupedOutput.values());
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
