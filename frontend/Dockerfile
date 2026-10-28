# сборка React
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# отдаём собранное через nginx
FROM nginx:alpine

# копиролвание конфига nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# копирование собранного приложения
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]