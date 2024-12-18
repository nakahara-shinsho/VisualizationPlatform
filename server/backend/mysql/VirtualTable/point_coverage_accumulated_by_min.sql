

/* TOTAL */
SELECT DATE_FORMAT(EXECUTION_START_TIME, '%Y-%m-%d %H:%i') AS time ,
       (SELECT count(DISTINCT fault_injection_point_id)*100 / (SELECT count(DISTINCT fpoint_id) FROM fplus.fault_point_info) 
       FROM fplus.coverage
       WHERE  date_format(execution_start_time, '%Y-%m-%d %H:%i') <= date_format(a.execution_start_time, '%Y-%m-%d %H:%i')) AS point_coverage
FROM fplus.coverage a
GROUP BY DATE_FORMAT(EXECUTION_START_TIME, '%Y-%m-%d %H:%i');
