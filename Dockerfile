# Railway Dockerfile wrapper - uses backend/Dockerfile
FROM rust:1.75 AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy backend source
COPY backend/Cargo.toml backend/Cargo.lock ./
COPY backend/src ./src

# Build dependencies first (for caching)
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy source and rebuild
COPY backend/src ./src
RUN cargo build --release

# Production image
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 conch

# Copy binary
COPY --from=builder /app/target/release/conch-server /usr/local/bin/conch-server

# Copy migrations
COPY backend/migrations /app/migrations

# Set ownership
RUN chown -R conch:conch /app

# Switch to non-root user
USER conch

# Set working directory
WORKDIR /app

# Expose port
EXPOSE 3000

# Run the server
CMD ["conch-server"]