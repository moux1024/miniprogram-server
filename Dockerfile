# 微信小程序商城后端 — 生产镜像
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# 仅安装生产依赖（利用 package-lock 保证可复现）
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . .

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "src/server.js"]
