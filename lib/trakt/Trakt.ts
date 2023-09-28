import { ShowsUtil } from "./utils/Shows";
import { BaseUtil } from "./utils/Base";
import { MoviesUtil } from "./utils/Movies";

export class TraktAPI extends BaseUtil {
  public Shows: ShowsUtil;
  public Movies: MoviesUtil;
  constructor(oauth_token?: string, user_slug?: string) {
    super(oauth_token);
    this.Shows = new ShowsUtil(oauth_token, user_slug);
    this.Movies = new MoviesUtil(oauth_token, user_slug);
  }
  async getUserInfo() {
    return this._request("/users/me", "GET");
  }
}
export default TraktAPI;
