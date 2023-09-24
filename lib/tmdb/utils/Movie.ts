import { BaseUtil } from "./Base";

export class MovieUtil extends BaseUtil {
  async getDetails(movieId: number | string) {
    return this._request(`/movie/${movieId}`, "GET");
  }

  async getImages(movieId: number | string) {
    return this._request(`/movie/${movieId}/images`, "GET");
  }
}
