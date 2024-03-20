
# Showtime

Get upcoming schedules from Trakt. Integrate it with your Calendar of choice!


## Self Hosting

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/GDOxtk?referralCode=radityaharya)

To selfhost this application on your machine, follow these steps:

### Prerequisites

1. Node.js and npm must be installed on your system. If not, download and install them from the official website: [Node.js Download Page](https://nodejs.org/) or just use [bun](https://bun.sh/) 👀

2. MongoDB should be installed and running. You can download it from the official website: [MongoDB Download Page](https://www.mongodb.com/try/download/community).

3. Redis should be installed and running if your application uses it for caching or other purposes. You can download it from the official website: [Redis Download Page](https://redis.io/download).

### Setup

1. Clone the repository to your local machine:

```bash
git clone https://github.com/radityaharya/showtime
```

2. Navigate to the project directory:

```bash
cd <project_directory>
```

3. Install dependencies:

```bash
bun install
```
```bash
npm install
```
```bash
pnpm install
```
4. Create a `.env.local` file in the root of the project and add the necessary environment variables. Refer to the provided table in the README for a list of required variables.

### Start the Application

1. Start MongoDB:

```bash
# Start MongoDB (if not running as a service)
mongod
```

2. Start Redis (if applicable):

```bash
# Start Redis (if not running as a service)
redis-server
```

3. Start the Next.js application:

```bash
bun run dev
```
```bash
npm run dev
```
4. The application will be running locally at `http://localhost:3000`. Open a web browser and navigate to this URL to access the application.

5. to build the application, run:

```bash
bun run build
```
```bash
npm run build
```

### Additional Notes

- Make sure to use the application is accessible to the internet as it is needed for calendar providers to get the Calendar data. You can use services such as [ngrok](https://ngrok.com/), [Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/) to expose your local server to the internet.

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

| Environment Variable     | Description                                                                                                      | Example |
|-------------------------|------------------------------------------------------------------------------------------------------------------|---------|
| HOST                    | The host where the application is deployed.                                                                     | 0.0.0.0 |
| PORT                    | The port on which the application will listen for incoming requests.                                             | 3000 |
| TRAKT_CLIENT_ID         | The client ID used for authenticating with the Trakt API.                                                        | |
| TRAKT_CLIENT_SECRET     | The client secret used for authenticating with the Trakt API.                                                    | |
| MONGO_URL               | The URL of the MongoDB instance or database used by the application.                                             | mongodb://your-mongo-url:27017/your-db-name |
| IMGPROXY_KEY            | A key required for authenticating with the Imgproxy service.                                                      | |
| IMGPROXY_SALT           | A salt used for generating secure image URLs with Imgproxy.                                                        | |
| IMGPROXY_URL            | The URL of the Imgproxy service, if used for image processing and manipulation.                                   | |
| TMDB_API_KEY            | The API key used for authenticating with The Movie Database (TMDb) API.                                          | |
| TMDB_ACCESS_TOKEN       | An access token required for authenticating with TMDb services.                                                  | |
| REDIS_URL               | The URL of the Redis server if it's used for caching or other purposes.                                          | redis://your-redis-url:6379/0 |
| NEXTAUTH_URL            | The URL at which the NextAuth.js authentication service is hosted.                                               | http://localhost:3000 |
| NEXTAUTH_SECRET         | A secret used by NextAuth.js for cryptographic operations.                                                       | random-secret |
| NEXTAUTH_DB             | The database connection URL or configuration used by NextAuth.js for user authentication.                         | |
| SENTRY_AUTH_TOKEN       | An authentication token used for logging errors and exceptions with Sentry.                                      | |
| NEXT_PUBLIC_SENTRY_DSN  | The Data Source Name (DSN) used for logging errors and exceptions with Sentry.                                   | |
## Disclaimer

This project is not affiliated with Trakt. For the best experience and access to advanced features, it is recommended to subscribe to Trakt's VIP plan, which includes iCal integration.

Please note that this project was created for personal enjoyment and experimentation. It is not an official Trakt product and is not endorsed or supported by Trakt. Use it at your own discretion.

This project uses the [Trakt API](https://trakt.docs.apiary.io/) to retrieve upcoming schedules. It also uses the [The Movie Database (TMDb) API](https://developers.themoviedb.org/3/getting-started/introduction) to retrieve movie and TV show information.

For any issues or concerns, please open an issue on GitHub or contact me on [contact@radityaharya.com](mailto:contact@radityaharya.com)

Branding Attributions:
<div style="display:flex;justify-content:space-between;">
  <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg" alt="TMDb Logo" width="200"/>
  <img src="https://static.radityaharya.com/trakt-wide-red-white.svg" alt="Trakt Logo" width="200"/>
</div>

---
