import { ShowsUtil } from "./utils/Shows";
import { MoviesUtil } from "./utils/Movies";
import { AccessToken, BaseUtil } from "./utils/Base";

export class TraktAPI extends BaseUtil {
  public Shows: ShowsUtil;
  public Movies: MoviesUtil;
  constructor(accessToken?: AccessToken, user_slug?: string) {
    super(accessToken, user_slug);
    this.Shows = new ShowsUtil(accessToken, user_slug);
    this.Movies = new MoviesUtil(accessToken, user_slug);
  }

  async getUserInfo() {
    return this._request("/users/me", "GET");
  }
}
export default TraktAPI;
