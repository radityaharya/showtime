interface MovieItem {
  overview: string;
  released: string;
  releasedUnix: number;
  runtime: number;
  title: string;
  background?: string;
  logo?: string;
  show?: string;
  season?: number;
  number?: number;
  airsAtUnix?: number;
  network?: string;
}

interface MovieData {
  type: "movies";
  dateStr: string;
  dateUnix: number;
  items: MovieItem[];
}

interface MoviesResponse {
  data: MovieData[];
  type: "movies";
}

interface ShowItem {
  airsAt: string;
  airsAtUnix: number;
  number: number;
  overview: string | null;
  runtime: number | null;
  season: number;
  show: string;
  title: string;
  background?: string;
  logo?: string;
  releasedUnix?: number;
  network?: string;
}

interface ShowData {
  type: "shows";
  dateStr: string;
  dateUnix: number;
  items: ShowItem[];
}

interface ShowsResponse {
  data: ShowData[];
  type: "shows";
}

export type {
  MovieItem,
  MovieData,
  MoviesResponse,
  ShowItem,
  ShowData,
  ShowsResponse,
};
