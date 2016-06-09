@echo off

set NODE_ENV=production

start /B grunt --target=%NODE_ENV%

if "%NODE_ENV%" == "production"  (
  echo "release  version"
  start /B node ./server-release/backend/main
) else (
  start /B node ./server/backend/main
  echo "development  version"
)
