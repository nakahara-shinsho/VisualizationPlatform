# Polyspector / Visualization Platform

## setup
### require  library
```
 erlang
 rabbitmq-server
 nodejs
 npm
 sqlite3-devel
```

### install 3rd party lib from npm
```
 cd VisualizationPlatform/
 npm install
 npm install sqlite3
```

## Boot (default)
```
 node PORT=8888 start server/start.js
 node start server/backend/worker_for_datalist.js
 // sample
 node start server/backend/workers_default.js
```
## Boot (using forever)
```
 forever  PORT=8888 start server/start.js
 forever start server/backend/worker_for_datalist.js
 // sample
 forever start server/backend/workers_default.js
```
## Access
  Please access http://IP_ADDRESS:PORT Using Google Chrome.
