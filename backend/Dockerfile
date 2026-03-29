# Use lightweight Java image
FROM eclipse-temurin:17-jdk-alpine

# Set working directory
WORKDIR /app

# Install tools required by Maven Wrapper
RUN apk add --no-cache curl unzip

# Copy project files
COPY . .

# Build Spring Boot project
RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

# Expose port (for local use)
EXPOSE 8080

# Run Spring Boot using Render PORT
CMD ["sh", "-c", "java -jar target/*.jar --server.port=${PORT:-8080}"]