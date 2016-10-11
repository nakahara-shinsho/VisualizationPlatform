set PORT=8004
set DB=demo 
start /B node ./server/start
start /B node ./server/backend/workers_default
start /B node ./server/backend/worker_for_datalist
rem start /B node ./server/backend/workers_for_bigdata.js