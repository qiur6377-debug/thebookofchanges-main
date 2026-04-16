FROM node:22-bookworm

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip python3-venv \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY requirements.txt ./
RUN python3 -m pip install --break-system-packages -r requirements.txt

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
