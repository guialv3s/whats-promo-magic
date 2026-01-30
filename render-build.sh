#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
# Instala o Chrome para o Puppeteer
npx puppeteer browsers install chrome