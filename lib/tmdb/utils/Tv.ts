import { BaseUtil } from "./Base";

export class TvUtil extends BaseUtil {
  async getDetails(tvId: number | string) {
    return this._request(`/tv/${tvId}`, "GET");
  }

  async getImages(tvId: number | string) {
    return this._request(`/tv/${tvId}/images`, "GET");
  }
}
