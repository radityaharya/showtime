FROM node:latest
WORKDIR /app
COPY . .
RUN npm i
# pass env variable to nextjs
RUN npm run build --production --e
EXPOSE 3000
ENV PORT 3000
CMD ["./node_modules/.bin/next", "start", "--port", "3000"]