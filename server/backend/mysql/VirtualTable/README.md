# 1次データセット用Virtual Table 一覧
|データセット名| Virtual Table (JSON)|
|--------|--------|
|SCENARIO_EXECUTION|scenario_execution.json|
|TEST_EXECUTION|test_execution.json|
|FAULT_POINT_INFO|fault_point_info.json|
|FAULT_POINT_HIERARCHY_INFO|fault_point_hierarchy_info.json|
|EVENT|event.json|
|PC2LINE|pc2.line.json|
|CAUSE_INFO|cause_info.json|
|CAUSE_INFO_HIERARCHY_INFO|cause_info_hierarchy.json|
|RECORD_INFO_TYPE_INFO|record_info_type_info.json|


# 2次データセットVirtual Table一覧

|　シナリオ| チャート/データセット| Virtual Table(JSON) |生成タイプ|
|--------|--------|---------|-|
|共通|FOURTH_QUADRANT|fourth_quadrant.json|Static|
|共通|COVERAGE|coverage.json|Static|
|共通|SCENARIO_INFORMATION|scenario_information.json|Static|
|共通|ConfusionMatrix|confusionMatrix.json|Dynamic|
|7-1|テスト数の時間推移(四象限) |fourth_quadrant_accumulated_by_min.json|Dynamic|
|7-1|ポイントカバレッジの時間推移|point_coverage_accumulated_by_min.json|Dynamic|
|7-1|要因カバレッジの時間推移|cause_coverage_accumulated_by_min.json|Dynamic|
|7-1|コードカバレッジの時間推移|code_coverage_accumulated_by_min.json|Dynamic|
|7-1|サイクルカバレッジの時間推移|cycle_coverage_accumulated_by_min.json|Dynamic|














