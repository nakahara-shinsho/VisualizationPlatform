

/* TOTAL */
SELECT count(DISTINCT fault_injection_point_id)*100 / (SELECT count(DISTINCT fpoint_id) FROM fplus.fault_point_info) 
FROM fplus.coverage;
