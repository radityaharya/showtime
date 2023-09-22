FROM oven/bun

WORKDIR /usr/src/app

COPY package*.json ./

RUN bun install

COPY . .

RUN bun run build

EXPOSE 3000

# Define the command to run the app
CMD ["bun", "start"]
