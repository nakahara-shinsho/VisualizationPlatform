
SELECT test_execution_id,
       min(CASE WHEN type = 'TYPE_ERROR' THEN timestamp ELSE NULL END) AS error,
       min(CASE WHEN type = 'TYPE_FAILURE' THEN timestamp ELSE NULL END) AS failure,
       max(CASE WHEN value LIKE '%RECOVERY%' AND value LIKE '%END%'THEN timestamp ELSE NULL END) AS recovery
FROM fplus.event
GROUP BY test_execution_id;
