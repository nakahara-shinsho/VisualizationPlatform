
/* FAULT_INJECTION_TIME*/

SELECT test.test_execution_id,
       event.error - min(test.fault_injection_time) AS FI_ERROR
       
FROM fplus.test_execution test
LEFT JOIN (SELECT test_execution_id,min(timestamp) AS error FROM fplus.event WHERE type = "TYPE_ERROR" GROUP BY test_execution_id) AS event
ON test.test_execution_id = event.test_execution_id
GROUP BY test.test_execution_id;

