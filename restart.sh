#!/bin/bash
echo "Stopping containers..."
docker compose down

echo "Rebuilding containers..."
docker compose build

echo "Starting containers..."
docker compose up