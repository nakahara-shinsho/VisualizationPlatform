
/* FAULT_INJECTION_TIME*/

SELECT test.test_execution_id, fault_injection_pc,fault_injection_time,
       error_detected_time, failure_detected_time, recovery_start_time, recovery_end_time
FROM fplus.test_execution test
LEFT JOIN 
(SELECT test_execution_id, 
 min(CASE WHEN type = 'TYPE_ERROR' THEN timestamp ELSE NULL END) AS error_detected_time,
 min(CASE WHEN type = 'TYPE_FAILURE' THEN timestamp ELSE NULL END) AS failure_detected_time,
 min(CASE WHEN value LIKE '%RECOVERY%' AND value LIKE '%START%'THEN timestamp ELSE NULL END) AS recovery_start_time,
 max(CASE WHEN value LIKE '%RECOVERY%' AND value LIKE '%END%'THEN timestamp ELSE NULL END) AS recovery_end_time 
 FROM fplus.event
 GROUP BY test_execution_id
) AS event
ON test.test_execution_id = event.test_execution_id
GROUP BY test.test_execution_id;

