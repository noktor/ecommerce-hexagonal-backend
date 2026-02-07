# Dockerfile per a l'aplicació Node.js
FROM node:18-alpine

# Instal·lar eines de compilació necessàries per bcrypt i altres mòduls natius
RUN apk add --no-cache python3 make g++

# Establir directori de treball
WORKDIR /app

# Copiar arxius de configuració
COPY package*.json ./
COPY tsconfig.json ./
COPY .npmrc* ./

# Instal·lar pnpm
RUN npm install -g pnpm

# Instal·lar totes les dependències amb pnpm
RUN pnpm install

# Construir bcrypt manualment després de la instal·lació
# Primer aprovar els builds i després reconstruir bcrypt
RUN cd node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt && \
    npm run install || \
    (cd /app && npm rebuild bcrypt --build-from-source) || \
    (cd /app && pnpm rebuild bcrypt)

# Copiar codi font
COPY src/ ./src/

# Exposar port de l'API
EXPOSE 3000

# Per desenvolupament: usar ts-node directament
# Per producció: compilar primer amb `pnpm run build` i després `pnpm start`
CMD ["pnpm", "run", "dev"]

