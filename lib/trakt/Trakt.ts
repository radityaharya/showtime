import {ShowsUtil} from './utils/Shows';
import {BaseUtil} from './utils/Base';
export class TraktAPI extends BaseUtil {
  public Shows: ShowsUtil;
  constructor(oauth_token?: string) {
    super(oauth_token);
    this.Shows = new ShowsUtil(oauth_token);
  }
  async getUserInfo() {
    return this._request("/users/me", "GET");
  }

}
export default TraktAPI;