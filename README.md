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

## Boot
```
 forever DB=matsuzaki.db PORT=8888 start server/start.js
 forever server/backend/worker_for_datalist.js
 // sample
 forever server/backend/workers_default.js
```

## Access
Please access http://IP_ADDRESS:PORT Using Google Chrome.
