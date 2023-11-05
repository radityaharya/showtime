import { BaseUtil, MAX_DAYS_AGO, MAX_PERIOD } from "./Base";
import ical from "ical-generator";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { TmdbAPI } from "@/lib/tmdb/Tmdb";
import { Collection } from "@/lib/mongo/mongo";
import { ImgProxy } from "@/lib/imgproxy/ImgProxy";
dayjs.extend(utc);

export interface MappedEpisode {
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
    providers: any;
    episodeIds: {
      trakt: number | null;
      tvdb: number | null;
      imdb: string | null;
      tmdb: string | null;
      tvrage: number | null;
    };
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
    daysAgo?: number,
    period?: number,
    dateStart?: string,
    dateEnd?: string,
    emit_history?: Boolean,
  ): Promise<MappedEpisode[]> {
    try {
      emit_history = emit_history || false;
      const perfStart = performance.now();
      let startDate;
      if (daysAgo && period) {
        if (daysAgo > MAX_DAYS_AGO || period > MAX_PERIOD) {
          throw new Error(
            `Invalid input: daysAgo must be less than ${MAX_DAYS_AGO} and period must be less than ${MAX_PERIOD}`,
          );
        }
        startDate = dayjs().subtract(daysAgo, "day");
      } else if (dateStart && dateEnd) {
        startDate = dayjs(dateStart);
        period = dayjs(dateEnd).diff(startDate, "day");
      } else if (period && daysAgo && dateStart && dateEnd) {
        throw new Error(
          "Invalid input: Either daysAgo and period or dateStart and dateEnd must be provided",
        );
      } else {
        throw new Error(
          "Invalid input: Either daysAgo and period or dateStart and dateEnd must be provided",
        );
      }

      const tmdb = new TmdbAPI();

      const userSlug = await this._request("/users/me", "GET");
      const cacheKey = `shows_${userSlug.ids.slug}_${dayjs().format(
        "YYYY-MM-DD-H",
      )}_${daysAgo}_${period}`;
      // const cachedData = await this.redis_client.get(cacheKey);

      // if (cachedData && cachedData !== "undefined" && cachedData !== "null") {
      //   console.log("returned cached show for", cacheKey);
      //   return JSON.parse(cachedData);
      // }

      const getEpisodes = async (
        startDate: dayjs.Dayjs,
        days: number,
        emit_history?: Boolean,
      ) => {
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

        const tmdbPromises: Promise<void>[] = [];
        const traktPromises: Promise<void>[] = [];

        if (Array.isArray(response)) {
          response.forEach((item) => {
            const showIds = item.show.ids;
            if (showIds.tmdb) {
              tmdbPromises.push(
                (async () => {
                  const [images, detail, providers] = await Promise.all([
                    tmdb.tv.getImages(showIds.tmdb),
                    tmdb.tv.getDetails(showIds.tmdb),
                    tmdb.tv.getWatchProviders(showIds.tmdb),
                  ]);

                  item.show.images = images;
                  item.show.details = detail;

                  const country = "ID";
                  let provider = null;
                  if (providers.results[country]) {
                    const countryProviders =
                      providers.results[country].flatrate || [];
                    provider = countryProviders.reduce(
                      (
                        prev: { display_priority: number },
                        current: { display_priority: number },
                      ) => {
                        return prev.display_priority < current.display_priority
                          ? prev
                          : current;
                      },
                    );
                  } else {
                    if (providers.results.US) {
                      const countryProviders =
                        providers.results.US.flatrate || [];
                      provider = countryProviders.reduce(
                        (
                          prev: { display_priority: number },
                          current: { display_priority: number },
                        ) => {
                          return prev.display_priority <
                            current.display_priority
                            ? prev
                            : current;
                        },
                      );
                    }
                  }
                  item.show.providers = provider;
                })(),
              );
            }

            if (!emit_history) {
              if (item.episode.ids.trakt) {
                // https://api.trakt.tv/sync/history/episodes/:id
                traktPromises.push(
                  (async () => {
                    const watched = (await this.getHistory("episodes", {
                      trakt: item.episode.ids.trakt,
                    })) as any;
                    if (watched) {
                      if (watched.length >= 1) {
                        item.episode.watched = watched[0].watched_at;
                      } else {
                        item.episode.watched = false;
                      }
                    } else {
                      item.episode.watched = false;
                    }
                  })(),
                );
              }
            }
          });
        }

        await Promise.allSettled(tmdbPromises);
        await Promise.allSettled(traktPromises);
        return response;
      };

      const batchSize = 32;
      const numBatches = Math.ceil(period / batchSize);
      const showsQueue = [];

      for (let i = 0; i < numBatches; i++) {
        showsQueue.push(
          getEpisodes(
            startDate.add(i * batchSize, "day"),
            Math.min(batchSize, period - i * batchSize),
            emit_history,
          ),
        );
      }

      const responses = await Promise.all(showsQueue);

      const entries = responses.flat();

      const groupedOutput = new Map<string, MappedEpisode>();
      for (const item of entries) {
        try {
          const date = dayjs(item.first_aired).utc();
          const dateStr = date.format("ddd, DD MMM YYYY");
          const dateUnix = date.unix();
          const key = dateStr;
          const imgproxy = new ImgProxy();
          const mappedEpisode = {
            show: item.show?.title || "",
            season: item.episode.season,
            number: item.episode.number,
            title: item.episode.title,
            overview: item.episode.overview || "",
            network: item.show.details?.networks?.[0]?.name || "",
            // networkLogo: `https://image.tmdb.org/t/p${item.show.details?.networks?.[0]?.logo_path}`,
            networkLogo: imgproxy.buildUrl(
              `https://image.tmdb.org/t/p${item.show.details?.networks?.[0]?.logo_path}`,
              80,
            ),
            runtime: item.episode.runtime || 30,
            // background: `https://image.tmdb.org/t/p/w500${item.show.images?.backdrops?.[0]?.file_path}`,
            background: imgproxy.buildUrl(
              `https://image.tmdb.org/t/p/w500${item.show.images?.backdrops?.[0]?.file_path}`,
              80,
            ),
            // logo: `https://image.tmdb.org/t/p/w500${item.show.images?.logos?.[0]?.file_path}`,
            logo: imgproxy.buildUrl(
              `https://image.tmdb.org/t/p/w500${item.show.images?.logos?.[0]?.file_path}`,
              80,
            ),
            airsAt: date.format(),
            airsAtUnix: dateUnix,
            ids: item.show.ids,
            episodeIds: {
              trakt: item.episode.ids.trakt,
              tvdb: item.episode.ids.tvdb,
              imdb: item.episode.ids.imdb,
              tmdb: `/tv/${item.show.ids.tmdb}/season/${item.episode.season}/episode/${item.episode.number}`,
              tvrage: item.episode.ids.tvrage,
            },
            providers: {
              display_priority: item.show.providers?.display_priority,
              logo_path: `https://image.tmdb.org/t/p${item.show.providers?.logo_path}`,
              provider_id: item.show.providers?.provider_id,
              provider_name: item.show.providers?.provider_name,
            },
            watched: item.episode.watched,
          };

          const group = groupedOutput.get(key);
          if (group) {
            group.items.push(mappedEpisode);
          } else {
            groupedOutput.set(key, {
              dateStr,
              dateUnix,
              items: [mappedEpisode],
            });
          }
        } catch (error) {
          console.error("Error processing TV show data:", error);
          console.error("Problematic item:", item);
          throw new Error("Error processing TV show data");
        }
      }

      const data = Array.from(groupedOutput.values());
      const calendarStore = await Collection("calendar_store_shows");
      const bulkOps = data.map((item) => {
        const date = dayjs(
          item.dateUnix * 1000 - (item.dateUnix % 86400) * 1000,
        ).toDate();
        const filter = { slug: userSlug.ids.slug, date };
        const update = {
          $set: {
            slug: userSlug.ids.slug,
            date,
            items: item.items,
            size: item.items.length,
            updatedAt: Date.now(),
          },
        };
        return { updateOne: { filter, update, upsert: true } };
      });
      await calendarStore.bulkWrite(bulkOps, { ordered: false });

      await this.redis_client.set(cacheKey, JSON.stringify(data), "EX", 60);
      const perfEnd = performance.now();
      console.log(`getShowsBatch(new) took ${perfEnd - perfStart}ms`);
      return data;
    } catch (error) {
      console.error("Error retrieving TV show data:", error);
      throw new Error("Error retrieving TV show data");
    }
  }

  async getShowsCalendar(days_ago = 30, period = 90) {
    const episodes = await this.getShowsBatch(
      days_ago,
      period,
      undefined,
      undefined,
      true,
    );
    // console.log("episodes", episodes);
    const flattenedEpisodes = episodes
      .flatMap(({ items }) => items)
      .filter(({ runtime }) => runtime !== null && runtime !== 0);

    const user = await this._request("/users/me", "GET");

    // TODO: Optional extended as a user config
    const calendarStore = await Collection("calendar_store_shows");
    const pastEpisodes = await calendarStore
      .find({
        slug: user.ids.slug,
        date: {
          $lte: dayjs().subtract(days_ago, "day").toDate(),
          $gte: dayjs().subtract(240, "day").toDate(),
        },
      })
      .toArray();
    const pastFlattenedEpisodes = pastEpisodes.flatMap(({ items }) => items);

    const cal = ical({ name: "Trakt.tv Shows Calendar" });
    const tmdb = new TmdbAPI();
    const showDetailsCache = new Map();
    const promises = flattenedEpisodes.map(
      async ({
        ids,
        runtime,
        show,
        season,
        number,
        title,
        overview,
        airsAtUnix,
        network,
      }) => {
        let show_detail_promise;
        if (ids.tmdb) {
          if (showDetailsCache.has(ids.tmdb)) {
            show_detail_promise = Promise.resolve(
              showDetailsCache.get(ids.tmdb),
            );
          } else {
            show_detail_promise = tmdb.tv.getDetails(ids.tmdb);
            showDetailsCache.set(ids.tmdb, show_detail_promise);
          }
        } else {
          show_detail_promise = Promise.resolve(null);
        }
        const show_detail = await show_detail_promise;
        const summary = `${show} - S${season
          .toString()
          .padStart(2, "0")}E${number.toString().padStart(2, "0")}`;

        const description = overview ? `${title}\n${overview}` : title;
        cal.createEvent({
          start: new Date(airsAtUnix * 1000),
          end: new Date(airsAtUnix * 1000 + runtime * 60 * 1000),
          summary,
          description,
          location: show_detail ? show_detail.networks[0].name : network,
        });
      },
    );
    await Promise.allSettled(promises);
    pastFlattenedEpisodes.forEach(
      ({ show, season, number, title, overview, airsAtUnix, network }) => {
        const summary = `${show} - S${season
          .toString()
          .padStart(2, "0")}E${number.toString().padStart(2, "0")}`;

        const description = overview ? `${title}\n${overview}` : title;
        cal.createEvent({
          start: new Date(airsAtUnix * 1000),
          summary,
          description,
          location: network,
        });
      },
    );
    return cal;
  }
}
