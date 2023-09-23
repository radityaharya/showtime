import { ShowsUtil } from "./utils/Shows";
import { BaseUtil } from "./utils/Base";
import { MoviesUtil } from "./utils/Movies";

export class TraktAPI extends BaseUtil {
  public Shows: ShowsUtil;
  public Movies: MoviesUtil;
  constructor(oauth_token?: string) {
    super(oauth_token);
    this.Shows = new ShowsUtil(oauth_token);
    this.Movies = new MoviesUtil(oauth_token);
  }
  async getUserInfo() {
    return this._request("/users/me", "GET");
  }
}
export default TraktAPI;
