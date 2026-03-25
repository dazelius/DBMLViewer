# Quest 관련 테이블

## AchievementLevel — 업적 레벨 경험치 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| achievement_level |  |  | 업적 레벨 키값 |
| req_achievement_point |  |  | 레벨 업 조건이 되는 누적 필요 업적 경험치 (0이면 최대 레벨) |
| reward_id |  |  | 레벨 업 시 지급되는 보상 id 입력 (0이면 보상 없음) |
| grade_icon |  |  | 레벨 아이콘의 리소스명 |

## Achievement — 업적의 메인 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| achievement_id |  |  | 데이터 키값 |
| achievement_type |  |  | 업적 대분류 타입 (계정 업적, 캐릭터 업적) |
| mission_set_id |  |  | 업적으로 수행해야 하는 미션 그룹의 id |

