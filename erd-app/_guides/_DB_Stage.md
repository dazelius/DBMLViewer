# Stage 관련 테이블

## ClanPermissionGroup — 클랜의 권한 그룹 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| clan_permission_group_id |  |  | 데이터 키값 |
| clan_permission_type |  |  | 클랜 권한 종류 |

## MapInfo — Map 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| map_group_id |  |  | 실제 MAP 을 정하기 위한 그룹 값 (멀티키) |
| id |  |  | 고유 MAP ID |
| battle_type |  |  | 모드 구분자 |
| theme |  |  | 고유 테마 선언자(숫자로 구분) |
| order |  |  | 테마 내부에서 출력 순서 낮은 번호부터 순차적으로 진행된다. 라운드 1~3 순차 진행을 위한 조치 |
| scene |  |  | 실제 MAP 정보 씬 정보를 연결 |
| result_scene |  |  | 결과 화면 등에서 사용하기 위한 전용 씬 정보를 연결 |
| mapname |  |  | 로딩 등에서 사용할 MAP 이름 연결(스트링키 입력) |
| displayimg |  |  | MAP 이미지 리소스 정보를 연결 |
| displayimg_lobby |  |  | 로비 MAP 이미지 리소스 정보를 연결 |
| minimap |  |  | 미니맵 리소스 정보를 연결 |
| minimap_range |  |  | 미니맵 HUD에 커버되는 맵 범위 |
| battlefield_effect_group_id |  |  | 맵별로 발생 가능한 전장 변수 효과 그룹 연결 차후 구현 후 DATA 연결 필요 (ForeignKey) |
| offset_x |  |  | 미니맵 X 기준 위치값 |
| offset_y |  |  | 미니맵 Y 기준 위치값 |
| map_size |  |  | 맵 크기 (단위: cm) |
| tactical_card_preset_id |  |  | 전술 패시브 프리셋 그룹의 id |

## MapObjectStat — 스탯의 기본 정보
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| stat_type_1 |  |  | 대상 스탯 타입 |
| stat_value_1 |  |  | 대상 스탯의 값 |
| stat_type_2 |  |  | 대상 스탯 타입 |
| stat_value_2 |  |  | 대상 스탯의 값 |

## MapObject — Map Object 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 고유 ID |
| model_id |  |  | 모델 ID |
| trigger_type |  |  | 조건 타입 |
| trigger_time |  |  | 시간 조건 |
| trigger_distance |  |  | 거리 조건 |
| trigger_target |  |  | 조건 타겟 |
| trigger_amount_comp |  |  | 조건의 수량 조건에 대한 부등식 |
| trigger_amount |  |  | 조건의 수량 조건 |
| trigger_exclusive |  |  | 조건의 독점 여부 |
| function_type |  |  | 기능 |
| function_value1 |  |  | 기능 밸류 1 |
| function_value2 |  |  | 기능 밸류 2 |
| function_target |  |  | 기능 타겟 |
| function_eff_count |  |  | 플레이어 1인에게 유효한 횟수 |
| function_round_count |  |  | 라운드에서 유효한 횟수 |

## MissionSet — 미션의 상세 정의 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| mission_id |  |  | 미션의 id (PK) |
| mission_set_id |  |  | 다른 테이블이 참조하는 미션 세트 id (FK) |
| display_order |  |  | 미션의 표시 및 진행 순서를 결정하는 값 |
| chapter |  |  | 챕터 단위로 그룹화할 때 사용 |
| is_pool |  |  | 미션 풀 여부 (미션 풀 안에서 일부 미션만 당첨되는 구조일 때 사용) |
| pick_weight |  |  | 미션 풀에서 추출 시 적용되는 가중치 |
| mission_type |  |  | 범용 미션 타입 |
| target_character_id |  |  | 특정 캐릭터 전용일 경우 해당 캐릭터의 id 입력 |
| target_mode_id |  |  | 특정 매치 모드 전용일 경우 해당 모드의 id 입력 |
| target_id |  |  | 타겟 id 추가 지정이 필요할 경우 사용, mission_type에 따라 다른 참조 |
| target_value |  |  | 미션 클리어 목표가 되는 value 입력 |
| mission_title |  |  | 미션의 명칭 (UI 노출용) |
| mission_desc |  |  | 미션의 설명 (UI 노출용) |
| shortcuts_id |  |  | 미션 바로 가기 경로 id (개발 전 미사용) |
| reward_id |  |  | 미션 보상의 reward_id (FK) |
| is_milestone |  |  | 마일스톤 주요 보상으로 UI에서 강조 및 차등이 필요한 경우 사용 |

