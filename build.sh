#!/usr/bin/env bash
# Exit on error
set -o errexit

# If running from project root, move into backend directory
if [ -d "backend" ]; then
  cd backend
fi

chmod +x build.sh
./build.sh
