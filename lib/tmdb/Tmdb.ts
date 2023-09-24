import { TvUtil } from "./utils/Tv";
import { BaseUtil } from "./utils/Base";
import { MovieUtil } from "./utils/Movie";

export class TmdbAPI extends BaseUtil {
  public tv: TvUtil;
  public movie: MovieUtil;
  constructor() {
    super();
    this.tv = new TvUtil();
    this.movie = new MovieUtil();
  }
}
export default TmdbAPI;
