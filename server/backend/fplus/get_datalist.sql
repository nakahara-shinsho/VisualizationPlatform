
SELECT e.upload_id,i.appl_id,i.test_num AS 'テスト数'
FROM fplus.scenario_information i
LEFT JOIN fplus.scenario_execution e
ON e.scenario_execution_id = i.scenario_execution_id AND e.upload_id = i.upload_id ;
