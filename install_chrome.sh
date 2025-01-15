#!/bin/bash

set -e

echo "Installing Chromium..."
apt-get update
apt-get install -y chromium-browser

echo "Chromium installation completed."
