start /B node ./server/backend/workers_default
start /B node ./server/backend/worker_for_datalist
start /B node-inspector --web-port=2001 --debug-port=2000 --web-host=localhost --no-preload --hidden=--hidden node_modules/
grunt devcss