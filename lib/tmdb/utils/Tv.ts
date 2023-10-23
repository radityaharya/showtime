import { BaseUtil } from "./Base";

export class TvUtil extends BaseUtil {
  async getDetails(tvId: number | string) {
    return this._request(`/tv/${tvId}`, "GET");
  }

  async getImages(tvId: number | string) {
    return this._request(`/tv/${tvId}/images`, "GET");
  }

  async getTvVideos(tvId: number | string) {
    return this._request(`/tv/${tvId}/videos`, "GET");
  }

  async getEpisodeVideos(
    tvId: number | string,
    seasonNumber: number | string,
    episodeNumber: number | string,
  ) {
    return this._request(
      `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/videos`,
      "GET",
    );
  }

  async getWatchProviders(tvId: number | string) {
    return this._request(`/tv/${tvId}/watch/providers`, "GET");
  }
}
