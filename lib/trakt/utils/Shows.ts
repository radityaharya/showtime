import { BaseUtil } from "./Base";
import { MAX_DAYS_AGO, MAX_PERIOD } from "./Base";
import ical from "ical-generator";

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
  async getShowsBatch(
    daysAgo: number,
    period: number
  ): Promise<MappedEpisode[]> {
    if (daysAgo > MAX_DAYS_AGO || period > MAX_PERIOD) {
      throw new Error(
        `days_ago must be less than ${MAX_DAYS_AGO} and period must be less than ${MAX_PERIOD}`
      );
    }

    const getEpisodes = async (startDate: string, days: number) => {
      console.log(`getEpisodes: startDate: ${startDate}, days: ${days}`);
      return await this._request(
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
    };

    const startDate = new Date(
      Date.now() - new Date(daysAgo * 24 * 60 * 60 * 1000).getTime()
    )
      .toISOString()
      .slice(0, 10);
    const endDate = new Date(Date.now() + period * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const episodes: Episode[] = [];
    let maxDays = 20;
    let days = 0;
    let currentDate = startDate;
    const requests = [];
    while (currentDate < endDate) {
      if (currentDate === endDate) {
        maxDays = period - days;
      }
      requests.push(
        getEpisodes(currentDate, Math.min(maxDays, period - days))
          .then((response) => {
            days += maxDays;
            return response;
          })
          .catch((error) => {
            throw new Error(error);
          })
      );
      currentDate = new Date(
        new Date(currentDate).getTime() + maxDays * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .slice(0, 10);
    }
    const responses = await Promise.all(requests);
    episodes.push(...responses.flat());

    const mappedOutput: MappedEpisode[] = episodes.map((item: Episode) => ({
      dateStr: new Date(item.first_aired).toUTCString(),
      dateUnix: new Date(item.first_aired).getTime() / 1000,
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
          airsAt: new Date(item.first_aired).toUTCString(),
          airsAtUnix: new Date(item.first_aired).getTime() / 1000,
          ids: item.show.ids,
        },
      ],
    }));

    // Group by date_str
    const groupedOutput: MappedEpisode[] = mappedOutput.reduce(
      (acc: MappedEpisode[], item: MappedEpisode) => {
        const dateStrSlice = item.dateStr.slice(0, 16);
        const found = acc.find(
          (groupedItem) => groupedItem.dateStr.slice(0, 16) === dateStrSlice
        );
        if (found) {
          found.items.push(item.items[0]);
        } else {
          acc.push({
            dateStr: item.dateStr,
            dateUnix: item.dateUnix,
            items: item.items,
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
