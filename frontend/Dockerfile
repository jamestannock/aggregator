# build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json vite.config.js tailwind.config.js ./
COPY index.html .
COPY src ./src
RUN npm install && npm run build

# serve w/ tiny Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
