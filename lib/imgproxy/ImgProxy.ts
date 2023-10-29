import pb from "@bitpatty/imgproxy-url-builder";

const IMGPROXY_KEY = process.env.IMGPROXY_KEY!;
const IMGPROXY_SALT = process.env.IMGPROXY_SALT!;
const IMGPROXY_URL = process.env.IMGPROXY_URL!;

export class ImgProxy {
  public buildUrl(url: string, quality = 75) {
    return pb()
      .quality(quality)
      .format("webp")
      .build({
        path: url,
        signature: {
          key: IMGPROXY_KEY,
          salt: IMGPROXY_SALT,
          size: 32,
        },
        baseUrl: IMGPROXY_URL,
      });
  }
}
