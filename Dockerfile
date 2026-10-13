# ─────────────────────────────────────────────────────────────────────────────
# TheBridge — production image (frontend baked into the backend jar)
#   docker build -t thebridge-app .
# ─────────────────────────────────────────────────────────────────────────────

# 1. Build the frontend
FROM node:24-alpine AS frontend
WORKDIR /fe
ENV NODE_OPTIONS=--max-old-space-size=512
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# 2. Build the backend, with the frontend inside classpath:/static
FROM eclipse-temurin:26-jdk AS backend
WORKDIR /app
ENV GRADLE_OPTS="-Xmx640m"
COPY backend/gradlew ./
COPY backend/gradle ./gradle
COPY backend/settings.gradle backend/build.gradle ./
RUN chmod +x gradlew
COPY backend/src ./src
COPY --from=frontend /fe/dist ./src/main/resources/static
RUN ./gradlew --no-daemon bootJar

# 3. Runtime
FROM eclipse-temurin:26-jre
WORKDIR /app
COPY --from=backend /app/build/libs/*.jar app.jar
ENV SERVER_ADDRESS=0.0.0.0
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
