FROM node:22-alpine
WORKDIR /app
COPY backend ./backend
ENV AI_HOST=0.0.0.0
EXPOSE 3001
CMD ["node", "backend/server.js"]
