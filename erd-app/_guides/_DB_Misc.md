# Misc 관련 테이블

## BattleModeInfo — 배틀모드 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| battle_type |  |  | 모드 구분자 |
| battle_type_name |  |  | 모드 네이밍 텍스트 키 |
| map_group_id |  |  | 실제 MAP 을 정하기 위한 그룹 값 |
| thema_count |  |  | 맵 선택 로직에서 선택하는 테마 수량 지정 |
| team_count |  |  | 참여하는 팀의 수 |
| team_player_count |  |  | 팀 당 참여 가능한 인원 수 |
| max_round_count |  |  | 진행 가능 총 라운드 |
| need_win_round_count |  |  | 승리에 필요한 라운드 수량을 입력한다 일부 모드는 해당 값 사용 하지 않음 |
| shift_round |  |  | 공수교대가 일어나는 라운드 (0 또는 공란 인 경우 공수교대 없음.) |
| round_time |  |  | 1개 라운드 최대 진행 가능 시간 값 (ms 단위 / 1초 = 10000) |
| overtime_check |  |  | 추가 시간 부여 적용 여부 체크 컬럼 TRUE = 추가 시간 부여 존재 FALSE = 없음 |
| overtime_value |  |  | 추가 시간 부여 시간 값 (ms 단위) overtime_check = TRUE 일 때만 동작. |
| overtime_heal_ratio |  |  | 추가 시간 부여 시 체력 회복 비율 소수점 단위로 입력 가능 (예시 = 0.50) |
| overtime_heal_fixed |  |  | 추가 시간 부여 시 기본 체력 회복(정수) 숫자로 입력(회복 수치 0 ~ 100) |
| overtime_tempshield_default_ratio |  |  | 추가 시간 부여 시 보호막 기본 비율 소수점 단위로 입력 가능 (예시 = 0.50) |
| overtime_tempshield_respawn_ratio |  |  | 추가 시간 부여 시 보호막 리스폰당 비율 소수점 단위로 입력 가능 (예시 = 0.25) |
| overtime_passive_01 |  |  | 추가 시간 부여 시 부여할 추가 패시브 효과 01 Passive.id 입력 / 값이 없으면, 동작하지 않음 overtime_check = TRUE 인 경우만 적용 |
| overtime_passive_02 |  |  | 추가 시간 부여 시 부여할 추가 패시브 효과 02 Passive.id 입력 / 값이 없으면, 동작하지 않음 overtime_check = TRUE 인 경우만 적용 |
| start_tactical_select |  |  | 게임 시작 시 [전술 선택] 이 존재하는 지 여부 TRUE = 시작 시 전술 선택 가능 FALSE = 시작 시 전술 선택 불가능 |
| start_tactical_count |  |  | 전술 선택 리스트 최초 표시 수량 start_tactical_select 가 TRUE 인 경우만 체크한다. 모드에 따라 다르게 설정 가능 |
| start_tactical_select_time |  |  | 전술 선택 가능 시간 값 (ms 단위) start_tactical_select 가 TRUE 인 경우만 체크한다. 지정된 시간 동안 전술 선택 가능 |
| spectator_check |  |  | 관전 가능 여부 설정 |
| spectator_map_camera |  |  | 관전 전용 MAP 카메라 사용 여부 설정(개인전용) |
| respawn_check |  |  | 리스폰 가능 여부 설정 |
| respawn_count |  |  | 리스폰이 가능한 경우 가능한 횟수를 지정한다. respawn_check = TRUE 인 경우만 사용. 0 또는 공란인 경우 무제한 리스폰 가능으로 처리 |
| respawn_time |  |  | 사망 후 다음 리스폰까지의 대기 시간을 지정한다. (ms) respawn_check = TRUE 인 경우만 사용. 리스폰이 불가능한 경우에는 값을 0 또는 공란 처리 사망 연출 이후부터 카운트 시작. |
| respawn_add_time |  |  | 사망 시 증가 시간 값 2번째 사망 시 부터 적용 매 사망 시마다 해당 값을 추가 한다. 수식으로 표현하면 respawn_time + ( respawn_add_time * (사망횟수 _1) ) 단, respawn_max_time 값 이상 값은 적용될 수 없다. |
| respawn_max_time |  |  | 사망 시 MAX 값을 지정하기 위한 컬럼 해당 값 이상 사망 시간이 증가하지는 않는다. ��� 값이 15000 이면? respawn_time + ( respawn_add_time * (사망횟수 _1) ) 계산이 15000 이상이 되더라도 15000 으로 처리 |
| airdropinfo_check |  |  | 에어 드랍 여부 설정 |
| airdropinfo_id |  |  | 에어드랍 이 존재하는 경우 연결되는 정보를 입력 0 또는 공란인 경우 에어드랍 존재하지 않음. |
| character_duplicate |  |  | 중복 캐릭터 선택 가능 여부 |
| reward_id |  |  | 해당 모드 완료 시 획득 보상 |
| spc_supply_crate_count |  |  | 특별 보급 상자의 한차례의 스폰 개수 |
| spc_supply_crate_time_min_01 |  |  | 특별 보급 상자의 스폰 시간 minimum 값 (차례 : 1) |
| spc_supply_crate_time_max_01 |  |  | 특별 보급 상자의 스폰 시간 maximum 값 (차례 : 1) |
| spc_supply_crate_time_min_02 |  |  | 특별 보급 상자의 스폰 시간 minimum 값 (차례 : 2) |
| spc_supply_crate_time_max_02 |  |  | 특별 보급 상자의 스폰 시간 maximum 값 (차례 : 2) |
| carpet_bombing_time_min_01 |  |  | [전장 변수] 융단 폭격 스폰 시간 minimum 값 (차례 : 1) |
| carpet_bombing_time_max_01 |  |  | [전장 변수] 융단 폭격 스폰 시간 maximum 값 (차례 : 1) |

## BattlePassUI — 배틀 패스의 UI 설정 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| battle_pass_ui_id |  |  | 고유 ID (PK) |
| battle_pass_id |  |  | 배틀 패스 ID (FK) |
| sort_order |  |  | 배틀 패스 화면의 좌측 탭에서 노출되는 정렬 순위 |
| main_reward_id |  |  | 중앙 프리뷰에 노출할 메인 보상 ID (FK) |
| preview_asset_id |  |  | 메인 보상 대신 별도 프리뷰 지정 시 사용할 모델 ID (FK) |
| bg_theme |  |  | 배틀 패스 화면의 배경 테마 이미지 에셋명 |
| is_display |  |  | 해당 패스를 노출할지 여부 |

## BattlePass — 배틀 패스의 메인 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| battle_pass_id |  |  | 고유 ID (PK) |
| event_id |  |  | 배틀 패스 이벤트 ID (FK) |
| level_up_need_exp |  |  | 배틀 패스에서 1레벨 상승에 필요한 경험치 수량 (모든 레벨에서 고정값) |
| daily_mission_set_id |  |  | 배틀 패스의 일일 미션 세트 id (FK) |
| weekly_mission_set_id |  |  | 배틀 패스의 주간 미션 세트 id (FK) |
| season_mission_set_id |  |  | 배틀 패스의 시즌 미션 세트 id (FK) |
| daily_mission_display_count |  |  | 일일 미션 풀에서 유저에게 노출할 미션 수량 |
| weekly_mission_display_count |  |  | 주간 미션 풀에서 유저에게 노출할 미션 수량 |
| season_mission_display_count |  |  | 시즌 미션 풀에서 유저에게 노출할 미션 수량 |
| battle_pass_reward_id |  |  | 배틀 패스에서 사용할 보상 id (FK) |
| level_purchase_currency_type |  |  | 배틀 패스 레벨 구매에 필요한 소모 재화 타입 |
| level_purchase_price |  |  | 배틀 패스 1레벨 구매에 필요한 재화의 수량 |

## BotActionDecision — 봇 액션 사용 결정
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | Skill Decision ID |
| group_id |  |  | 그룹 ID |
| bot_condition_id1 |  |  | 조건 ID |
| condition_relation |  |  | 조건 관계 |
| bot_condition_id2 |  |  | 조건 ID |
| action_type |  |  | 하고자 하는 액션의 타입 |
| use_rate |  |  | 사용 확률(만분율) |
| check_tic |  |  | 몇 Tic 마다 체크할 것인지의 여부 |

## BotActionStat — 봇 ���동/정확도 스탯
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | ActionStat ID |
| acc_trans_blind |  |  | 투명/블라인드 정확도 |
| acc_hip_base |  |  | 기본 힙샷 정확도 |
| acc_aim_base |  |  | 기본 에임 정확도 |
| acc_aim_headshot |  |  | 헤드샷 에임 정확도 |
| acc_penalty_walk |  |  | 걷기 정확도 페널티 |
| acc_penalty_run |  |  | 달리기 정확도 페널티 |
| acc_penalty_to_moving |  |  | 이동 대상 정확도 페널티 |
| acc_penalty_per_1m |  |  | 1m당 정확도 페널티 |
| shot_follow_rotate_speed |  |  | 사격 추적 회전 속도 (각속도) |
| prepare_shot_hip_base |  |  | 힙샷 사격 준비 시간(ms) |
| prepare_shot_aim_base |  |  | 에임샷 사격 준비 시간(ms) |
| prepare_shot_penalty_walk |  |  | 걷기 중 사격 준비 시간 페널티(ms) |
| prepare_shot_penalty_run |  |  | 달리기 중 사격 준비 시간 페널티(ms) |
| prepare_shot_penalty_to_moving |  |  | 이동 중인 대상 사격 준비 시간 페널티(ms) |
| skill_initial_time |  |  | 스킬 사용 초기 대기 시간(ms) |
| skill_incorrect_rate |  |  | 스킬 오사용 확률(만분율) |
| reload_fail_rate |  |  | 재장전 실패 확률(만분율) |

## BotBattleMovement — 봇 전투 이동 패턴
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | Movement ID |
| group_id |  |  | Group Key ( Log 추적 이슈로 MultiKey보다 Group_id 선호 ) |
| group |  |  | Group ( Group 단위로 계산됨 ) |
| priority_value |  |  | 우선순위 |
| faction |  |  | 진영 |
| condition_id |  |  | 조건 ID |
| take_cover |  |  | 엄폐 가중치 |
| rush_enemy |  |  | 돌격 가중치 |
| escape |  |  | 후퇴 가중치 |
| move_decision_chk |  |  | Move Decision을 하기 위한 가중치 |

## BotCondition — 봇 조건 정의
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | Condition ID |
| cond_type |  |  | 조건 타입 |
| cond_value |  |  | 조건 값 (거리 등) |
| compare_op |  |  | 비교 연산자 |
| compare_value |  |  | 비교 값 |

## BotData — 봇 캐릭터 데이터
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | Bot ID |
| class_filter |  |  | 클래스 필터 |
| battlemodeinfo_id |  |  | 대응되는 전투 모드 ( 기재되지 않은 경우 _1을 사용 ) |
| character_id |  |  | 캐릭터 ID |
| bot_lv |  |  | 봇 레벨 |
| bot_score_value |  |  | 봇 점수값 |
| bot_type |  |  | 봇 타입 |
| spc_pattern |  |  | 봇의 특별한 유형 |
| actionstat_id |  |  | 행동 스탯 ID |
| sensor_id |  |  | 센서 ID |
| movedecision_group_id |  |  | 이동 결정 Group ID |
| actiondecision_group_id |  |  | 액션 사용 결정 Group ID |
| skilldecision_group_id |  |  | 스킬 사용 결정 Group ID |
| targetselector_group_id |  |  | 적 타게팅 설정 Group ID |
| battlemovement_group_id |  |  | 전투 중 이동 설정 Group ID |
| escapetarget_group_id |  |  | 후퇴 행동 시 타겟 설정 Group ID |
| shotselector_group_id |  |  | 사격 시 행동 선택 Group ID |
| shotamount_group_id |  |  | 사격의 수량 선택 Group ID |

## BotEscapeTarget — 봇 후퇴 대상 선택
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | Escape Target ID |
| group_id |  |  | Group Key ( Log 추적 이슈로 MultiKey보다 Group_id 선호 ) |
| group |  |  | Group ( Group 단위로 계산됨 ) |
| priority_value |  |  | 그룹 내 우선순위 |
| movepoint_type |  |  | 조건 충족 시의 이동 지점 타입 |
| bot_condition_id_1 |  |  | 조건 ID 1 |
| condition_relation |  |  | 조건 관계 |
| bot_condition_id_2 |  |  | 조건 ID 2 |
| escape_target_weight |  |  | 조건 충족 시의 해당 Target에 대한 점수 |

## BotMoveDecision — 봇 이동 결정 로직
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | Decision ID |
| group_id |  |  | Move Decision's Group ID ( 실 사용 Key ) |
| battle_type |  |  | 전투 타입 |
| faction |  |  | 진영 |
| priority_value |  |  | 우선순위 |
| bot_condition_id_1 |  |  | 조건 ID 1 |
| condition_relation |  |  | 조건 관계 (AND/OR) |
| bot_condition_id_2 |  |  | 조건 ID 2 |
| decision_rate |  |  | 조건 충족 시 Row의 이동 설정을 따를 것인지에 대한 여부 |
| check_point |  |  | 조건 충족으로 인해 설정된 이동 타겟으로 이동 중 추가 Move Decision 과정을 거칠 것인지의 세팅 |
| move_decision |  |  | 조건 충족 시 이동 타겟 |

## BotSensor — 봇 센서/시야 설정
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | Sensor ID |
| sensor_trans_blind |  |  | 투명/블라인드 센서 |
| sensor_max_distance |  |  | 최대 감지 거리 |
| sight_check_duration |  |  | 시야 체크 주기(ms) |
| sight_hallucination_rate |  |  | 환각 비율(만분율) |
| sight_distance_1st |  |  | 1차 시야 거리 |
| sight_angle_1st |  |  | 1차 시야 각도 |
| sight_detect_rate_1st |  |  | 1차 감지 비율(만분율) |
| sight_distance_2nd |  |  | 2차 시야 거리 |
| sight_angle_2nd |  |  | 2차 시야 각도 |
| sight_detect_rate_2nd |  |  | 2차 감지 비율(만분율) |
| sight_distance_3rd |  |  | 3차 시야 거리 |
| sight_angle_3rd |  |  | 3차 시야 각도 |
| mapcheck_distance |  |  | 맵(미니맵)을 이용한 감지 거리 (cm) |
| mapcheck_detect_rate |  |  | 맵(미니맵)을 이용한 감지 비율 (만분율) |
| pain_detect_rate |  |  | 피격 시 감지 비율 (만분율) |
| hearing_distance |  |  | 사운드를 이용한 감지 거리 (cm) |
| hearing_detect_rate |  |  | 사운드를 이용한 감지 비율 (만분율) |
| enemy_location_detect_rate |  |  | 적 위치 정보에 의한 감지 비율 (만분율) |
| pain_enemy_location_detect_rate |  |  | 피격 시 적 위치 정보에 의한 감지 비율 (만분율) |
| reaction_sight_distance |  |  | 반응하기 위한 시야 거리 (cm) |
| reaction_sight_detect_rate |  |  | 반응하기 위한 시야 감지 비율 (만분율) |

## BotShotAmount — 봇 사격량 결정
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | Shot Amount ID |
| group_id |  |  | Group Key ( Log 추적 이슈로 MultiKey보다 Group_id 선호 ) |
| weapon_slot |  |  | Weapon Slot No. ( Main = 0 , Sub = 1 ) |
| use_ammo_pct |  |  | 사용 탄약 비율 (만분율) |
| weight |  |  | 선택 가중치 |

## BotShotSelector — 봇 사격/장전 결정
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | Shot Selector ID |
| group_id |  |  | Group Key ( Log 추적 이슈로 MultiKey보다 Group_id 선호 ) |
| group |  |  | Group ( Group 단위로 계산됨 ) |
| priority_value |  |  | 우선순위 |
| bot_condition_id |  |  | 조건 ID |
| weight_fire |  |  | 사격 가중치 |
| weight_reload |  |  | 장전 가중치 |
| weight_hold |  |  | 대기 가중치 |

## BotStepPoint — 봇 스텝 포인트 데이터
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | Key |
| scene |  |  | Map scene file name ( Mapping Index ) |
| step_no |  |  | Step point number ( Mapping Index ) |
| step_lv |  |  | Step Level |
| faction |  |  | Applicable faction |
| point_type |  |  | Step point Type ( Normal / S.P. / Occupied ) |
| linked_point_no_01 |  |  | Step point number of destination point 01 |
| linked_rate_01 |  |  | Selection rate for step point number ( point_no ) 01 |
| linked_point_no_02 |  |  | Step point number for destination point 02 |
| linked_rate_02 |  |  | Selection rate for step point number ( point_no ) 02 |
| linked_point_no_03 |  |  | Step point number for destination point 03 |
| linked_rate_03 |  |  | Selection rate for step point number ( point_no ) 03 |
| linked_point_no_04 |  |  | Step point number for destination point 04 |
| linked_rate_04 |  |  | Selection rate for step point number ( point_no ) 04 |
| linked_point_no_05 |  |  | Step point number for destination point 05 |
| linked_rate_05 |  |  | Selection rate for step point number ( point_no ) 05 |

## BotTargetSelector — 봇 적 선택 우선순위
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | Selector ID |
| group_id |  |  | Group Key ( Log 추적 이슈로 MultiKey보다 Group_id 선호 ) |
| group |  |  | Group ( Group 단위로 계산됨 ) |
| target_type |  |  | Target Selector가 체크를 진행할 때 타겟의 사이드는 어떨지 |
| priority_value |  |  | 우선순위 |
| condition_id |  |  | 조건 ID |
| select_point |  |  | 선택 포인트 |

## CardPresetEnhance — 강화 패시브 묶음과 등장 가중치 관리
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 카드 프리셋 그룹 ID |
| card_id |  |  | 항목 대상이 되는 card id |
| weight |  |  | 같은 그룹 내에서 해당 패시브가 등장할 가중치 |
| target_character_id |  |  | 특정 캐릭터에서만 추첨되는지 여부 (_1: 캐릭터 무관 상시 등장) |
| target_battlefield_effect_id |  |  | 특정 전장 변수가 맵에 할당되어있을 때에만 추첨되는지 여부 (_1: 상시 등장) |
| target_position |  |  | 특정 공격/수비진영에서만 추첨되는지 여부 (All: 라운드 무관 상시 등장) |
| target_round |  |  | 특정 라운드에서만 추첨되는지 여부 (_1: 라운드 무관 상시 등장) |
| account_level_min |  |  | 계정 레벨이 해당 값 이상일 때에만 등장 |
| account_level_max |  |  | 계정 레벨이 해당 값 이하일 때에만 등장 |
| character_level_min |  |  | 캐릭터 레벨이 해당 값 이상일 때에만 등장 |
| character_level_max |  |  | 캐릭터 레벨이 해당 값 이하일 때에만 등장 |

## CardPresetTactical — 전술 패시브 묶음과 등장 가중치 관리
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 카드 프리셋 그룹 ID |
| card_id |  |  | 항목 대상이 되는 card id |
| weight |  |  | 같은 그룹 내에서 해당 패시브가 등장할 가중치 |
| target_slot |  |  | 특정 슬롯에서만 추첨되는지 여부 |
| target_character_id |  |  | 특정 캐릭터에서만 추첨되는지 여부 (_1: 캐릭터 무관 상시 등장) |
| target_battlefield_effect_id |  |  | 특정 전장 변수가 맵에 할당되어있을 때에만 추첨되는지 여부 (_1: 상시 등장) |
| target_position |  |  | 특정 공격/수비진영에서만 추첨되는지 여부 (All: 라운드 무관 상시 등장) |
| target_round |  |  | 특정 라운드에서만 추첨되는지 여부 (_1: 라운드 무관 상시 등장) |
| account_level_min |  |  | 계정 레벨이 해당 값 이상일 때에만 등장 |
| account_level_max |  |  | 계정 레벨이 해당 값 이하일 때에만 등장 |
| character_level_min |  |  | 캐릭터 레벨이 해당 값 이상일 때에만 등장 |
| character_level_max |  |  | 캐릭터 레벨이 해당 값 이하일 때에만 등장 |

## CardSynergy — 전술 패시브 시너지
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| type |  |  | 카드 시너지 타입 (멀티키) |
| synergy_grade |  |  | 시너지 단계, 복합기 생성용 식���자 |
| required_card_count |  |  | 시너지 활성화를 위해 필요한 팀 내 동일 유형의 전술 패시브 수량 |
| name |  |  | 시너지의 이름 스트링 키 |
| desc |  |  | 시너지의 설명 스트링 키 |
| icon |  |  | 시너지의 아이콘 이름 |
| synergy_effect_type |  |  | 시너지 효과와 연결할 테이블과 그 유형 |
| synergy_effect_target_id |  |  | 연결되는 테이블에서 참고할 id 번호 |
| ui_sort_order |  |  | 시너지가 UI에 표시될 때의 정렬 순서 |

## Card — 강화/전술 패시브의 정의 및 기본 특성
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| category |  |  | 0이외의 값이 있다면, 동일 그룹 내의 카드가 중복으로 출현하지 않음 |
| type |  |  | 카드의 기본 유형(강화/전술 패시브) _ 해당 값에 따라 참조하는 Preset 테이블이 다름 |
| name |  |  | 카드의 이름 스트링 키 |
| desc |  |  | 카드의 설명 스트링 키 |
| icon |  |  | 카드의 아이콘 이름 |
| is_duplication |  |  | 이미 습득한 카드가 반복하여 등장 가능한지에 대한 여부 |
| card_effect_type |  |  | Card와 연결할 테이블과 그 유형 |
| card_effect_target_id |  |  | 연결되는 테이블에서 참고할 id 번호 |
| card_synergy_type |  |  | 해당 card가 부여하는 시너지 타입 (전술 패시브) |
| card_synergy_select_name |  |  | 카드 선택지에서 보이는 시너지 이름 |

## ClanBadgePart — 클랜 배지 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| clan_badge_part_id |  |  | 고유 id (PK) |
| badge_part_type |  |  | 클랜 배지의 부위 타입 (Emblem, Frame) |
| sort_order |  |  | 클랜 배지 부위 안에서의 정렬 순서 |
| badge_asset |  |  | 이미지 아이콘의 리소스 파일명 |
| clear_condition_type |  |  | 콘텐츠(배지 부위)��� 오픈하기 위한 조건 타입 |
| clear_condition_value |  |  | clear_condition_type 에 해당하는 조건 수치 값 |
| content_unlock_msg |  |  | 콘텐츠가 잠겨 있을 때 터치하면 출력해 줄 안내 메시지 |
| is_display |  |  | 리스트에서 노출할 지 여부 |

## ClanRole — 클랜 직위별 권한 설정 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| clan_role_id |  |  | 데이터 키값 |
| clan_role_type |  |  | 클랜 내 직위 종류 |
| clan_permission_group_id |  |  | 해당 직위가 가질 수 있는 권한 그룹 |
| clan_role_icon |  |  | 출력할 직위 아이콘 파일명 |

## CommonConfig — 공용 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| name |  |  | 데이터 키값 |
| value |  |  | 데이터 값 |

## ContentUnlock — 콘텐츠 언락 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| content_unlock_id |  |  | 테이블 고유 id |
| content_unlock_type |  |  | 오픈 콘텐츠 타입 |
| unlock_target_value |  |  | content_unlock_type 에 따라 타깃이 필요할 경우 사용 |
| clear_condition_type |  |  | 콘텐츠를 오픈 하기 위한 조건 타입 |
| clear_condition_value |  |  | clear_condition_type 에 해당하는 조건 수치 값 |
| content_name |  |  | 연출에서 사용될 ��텐츠 이름 |
| content_desc |  |  | 콘텐츠에 대한 설명 |
| content_icon |  |  | 연출에서 사용될 콘텐츠 아이콘 |
| content_unlock_msg |  |  | 콘텐츠가 잠겨 있을 때 출력해 줄 안내 메시지 |
| is_display |  |  | 언락시 연출을 출력할지 여부 |
| priority |  |  | 연출이 중복 될 때 먼저 출력할 우선 순위 |

## Currency — 재화 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| currency_id |  |  | 테이블 고유 id |
| currency_type |  |  | 재화 타입 |
| name_id |  |  | 아이템 이름(Aegis Localization Key 값) |
| desc_id |  |  | 아이템 설명(Aegis Localization Key 값) |
| icon_id |  |  | 아이콘 ID |

## DamageModTag — DamageModTag의 적용에 관한 정보
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 태그 id (공격자_피격자 매칭) |
| additive_damage_rate |  |  | 피해량 증감율 (만분율) |
| force_headshot |  |  | 강제 헤드샷 적용 여부 |
| ignore_damage_reduction |  |  | 피해 감소 연산 무시 여부 |

## Effect — 이펙트 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| resName |  |  | 에셋 어드레서블 |
| boneName |  |  | 이펙트의 부모가 될 본 이름 |
| isLoop |  |  | Loop 여부 |

## Enum — Enum 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| enum_type |  |  | 이넘 키값 |
| enum_value |  |  | 이넘 이름 |
| enum_Index |  |  | 해당 이넘 타입 인덱스 (유일) |

## Event — 이벤트의 메인 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| event_id |  |  | 이벤트의 고유 id (PK) |
| event_logic_type |  |  | 이벤트 로직 유형 (BattlePass, MissionList, MissionTree 등) |
| event_target_type |  |  | 이벤트 노출 대상 타입 (AllUsers, NewUsers, ReturningUsers) |
| user_days |  |  | NewUsers or ReturningUsers일 때 설정할 날짜(일) 수를 입력 |
| reset_cycle_type |  |  | 초기화 주기 유형 (Daily, Weekly, Monthly) |
| reset_day_week_type |  |  | 초기화 되는 요일 (EResetCycleType이 Weekly일 때만 사용) |
| reset_day_of_month |  |  | 초기화 되는 일자 (EResetCycleType이 Monthly일 때만 사용) |
| reset_time |  |  | 초기화 시간의 입력 값 (HH:mm:ss / 날짜는 무시) |
| event_name |  |  | 이벤트 제목의 로컬 키 |
| event_desc |  |  | 이벤트 설명의 로컬 키 |
| event_category_type |  |  | 통합 이벤트 페이지 내 카테고리 탭 (None = 별도 페이지형) |
| priority_order |  |  | 카테고리 탭 내 정렬 우선순위 (오름차순 / 0 = 별도 페이지형) |
| start_date |  |  | 이벤트 시작 시간 |
| end_date |  |  | 이벤트 종료 시간 |
| claim_grace_days |  |  | 이벤트 종료 후 보상 수령 유예 기간(일 / 유예 없음=end_date) |
| mission_set_id |  |  | 사용할 미션 세트 ID (FK) |

## Immune — 특정 StatusEffect가 걸리지 않는 면역 목록 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| target_function_type |  |  | 면역이 될 statusFucntionType |
| target_statuseffect_category |  |  | 면역이 될 statusCategory |

## Interactable — 상호작용 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 고유 ID |
| interaction_type |  |  | 상호작용 타입 |
| execution_type |  |  | 실행 방식 |
| interaction_duration |  |  | 상호작용 소요 시간 (초) |
| interaction_range |  |  | 상호작용 가능 거리 |
| interaction_priority |  |  | 우선순위 |
| prompt_key |  |  | UI 프롬프트 로컬라이제이션 키 |
| detect_mode |  |  | 감지 방식 (시선/범위/혼합) |
| player_anim_key |  |  | 플레이어 애니메이션 트리거 키 |
| object_anim_key |  |  | 오브젝트 애니메이션 트리거 키 |
| complete_effect_id |  |  | 완료 이펙트 ID |
| complete_sound_id |  |  | 완료 사운드 ID |
| start_effect_id |  |  | 시작 이펙트 ID |
| start_sound_id |  |  | 시작 사운드 ID |
| cancel_effect_id |  |  | 취소 이펙트 ID |
| cancel_sound_id |  |  | 취소 사운드 ID |
| max_use_count |  |  | 최대 사용 횟수 (0=무제한) |
| cooldown_time |  |  | 재사용 대기 시간 (초) |
| respawn_time |  |  | 리스폰 시간 (초) |
| is_destructible |  |  | 파괴 가능 여부 |
| max_durability |  |  | 최대 내구도 (0=무적) |
| destroy_effect_id |  |  | 파괴 이펙트 ID |
| destroy_sound_id |  |  | 파괴 사운드 ID |
| enable_visual |  |  | 비주얼 피드백 사용 여부 |
| outline_color |  |  | 외곽선 색상 (hex 예: //00FF88) |
| indicator_effect_id |  |  | 인디케이터 이펙트 ID |
| indicator_offset_y |  |  | 인디케이터 Y 오프셋 |

## LobbyUI — 로비 UI 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| range_type |  |  | 로비 화면 영역 값 |
| content_type |  |  | 아이콘 기능 타입값 |
| icon |  |  | 출력할 아이콘 파일명 |
| name |  |  | 출력할 이름 Key |
| priority |  |  | 출력할 우선 순위 |
| is_display |  |  | 로비에 아이콘 출력 여부 |

## Mark — 마크(Mark)의 기본 정보
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | Mark 호출에 사용할 id |

## Model — 모델(프리펩) 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| prefab_dir_low |  |  | low 프리펩이 있는 폴더 경로 |
| prefab_name_low |  |  | low 프리펩의 파일 이름 |
| prefab_dir_high |  |  | high 프리펩이 있는 폴더 경로 |
| prefab_name_high |  |  | high 프리펩의 파일 이름 |
| prefab_dir_server |  |  | server 프리펩이 있는 폴더 경로 |
| prefab_name_server |  |  | server 프리펩의 파일 이름 |
| scale |  |  | (만분률) 확대/축소 배율 |

## Module — 모듈 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| passive_group_id |  |  | 동일 효과로 간주하기 위한 값 |
| is_additive |  |  | 중첩 보유 가능 여부, FALSE이면 덮어씀 |
| module_type |  |  | property만 사용, effect만 사용, 둘다 사용 |
| module_passive_property_id |  |  | 사용할 ModulePassiveProperty 그룹의 ID (_1이면 미사용) |
| module_passive_effect_id |  |  | 사용할 ModulePassiveEffect 그룹의 ID, 기존의 Perk 대체 (_1이면 미사용) |
| target_weapon_id |  |  | 특정 무기 고유 모듈일 경우 = 무기 id, 공용모듈 = _1 (장착가능 여부) |
| is_swap_clear |  |  | 무기 모듈 패시브일 때, 무기 교체 시 임시로 비활성화 여부 (다시 장착하면 재적용 됨) |
| is_kill_ownerdeath |  |  | 보유자 사망 시 패시브 삭제 여부 |
| is_kill_round_end |  |  | 라운드 종료 시 패시브 삭제 여부 |
| is_kill_shift_round |  |  | 라운드 종료로 인한 공격/수비 진영 교대 시 패시브 삭제 여부 |
| display_name |  |  | 모듈 이름 키값 (로컬라이제이션) |
| display_desc |  |  | 모듈 설명 키값 (로컬라이제이션) |
| icon |  |  | 모듈 아이콘 파일명 |

## NetworkObject — Network Object 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| type |  |  | 타입 식별 |
| netobject_id |  |  | 네트웍 Object ID |
| prefab_path |  |  | 리소스 url |

## Option — 게임 옵션 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| option_category_type |  |  | 옵션 카테고리 탭 |
| name_id |  |  | 옵션 이름 로컬 키 |
| option_content_type |  |  | 개별 옵션 항목 정의 |
| option_ui_type |  |  | 옵션 UI 타입 설정 |
| order |  |  | 옵션 출력 순서 |
| content_string |  |  | option_ui_type에 따른 개별 사용 |
| is_outgame_option |  |  | 아웃게임 옵션 출력 여부 |
| is_ingame_option |  |  | 인게임 옵션 출력 여부 |
| is_reset |  |  | 초기화 버튼 사용 시 초기화 여부 |
| default_value |  |  | 최초 옵션 설정값, 초기화 시 설정값 |

## PerkEffect — 퍽 효과 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 (멀티키) |
| effect_id |  |  | 복합기 생성용 식별자 |
| perk_effect_type |  |  | 효과 타입 (PassiveEffect의 enum과 동일하게 사용) |
| effect_target_id |  |  | 효과 타입에 따라 찾을 ID |
| effect_value1 |  |  | 효과 값 |
| effect_value2 |  |  | 효과 값 |
| effect_value3 |  |  | 효과 값 |
| effect_value4 |  |  | 효과 값 |

## Perk — 퍽 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| name_id |  |  | 이름 Key |
| desc_id |  |  | 설명 Key |
| icon |  |  | 아이콘 파일명 |
| perk_type |  |  | 퍽 타입 |
| use_target_id |  |  | 무기 고유 모듈일 경우 = 무기 id, 공용모듈 = _1 |
| perk_lv |  |  | 패시브 레벨 |
| perk_group_id |  |  | 동일 효과로 간주하기 위한 값 |
| perk_effect_group_id |  |  | 사용할 PerkEffect 그룹의 ID |
| skill_ui_id |  |  | 이름, 설명, 아이콘 정보를 가진 SkillUI ID |
| is_additive |  |  | 중첩 보유 가능 여부, FALSE이면 덮어씀 |
| is_swap_clear |  |  | 무기 모듈 패시브일 때, 무기 교체 시 임시로 비활성화 여부 (다시 장착하면 재적용 됨) |

## Ping — 인게임 핑
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 핑 id |
| is_ping_sound |  |  | 핑 사운드 사용 여부 |
| is_ping_text |  |  | 핑 텍스트 알림 사용 여부 |
| is_ping_minimap |  |  | 미니맵 핑 사용 여부 |
| ping_trigger |  |  | 핑 발동 조건 |
| ping_icon_asset |  |  | 핑 아이콘 이미지 어셋 파일 |
| ping_string_id |  |  | 핑 텍스트 Key |
| default_sound_asset |  |  | 핑 사운드 어셋 파일 |
| ping_duration |  |  | 미니맵 핑 유지 시간 (단위: ms) |

## ProjectileSkin — 투사체 스킨 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| model_id |  |  | 투사체 모델 데이터 |
| skin_resource_id |  |  | 사용할 스킨 리소스 ID |
| is_default |  |  | 디폴트 스킨 여부 (번들 포함 체크용) |
| effect_settings |  |  | 이펙트 및 사운드 세팅 _ 스트립트 오브젝트 명 |

## Projectile — 투사체 메인 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| projectile_type |  |  | 프로젝타일의 타입(히트스캔 or 투사체) |
| netobject_id |  |  | NetworkObject id 연결 |
| projectile_skin_id |  |  | 투사체 스킨 ID |
| socket |  |  | 투사체 시작 위치 본. ※Weapon의 Projectile은 muzzle 고정 |
| projectile_speed |  |  | 투사체의 속도(cm/s) |
| lifetime |  |  | 투사체 유지 시간(ms) |
| life_end_effect |  |  | 유지시간 종료 후 적용될 효과. |
| effect_ally |  |  | 아군에 닿을 경우 적용될 효과 |
| effect_enemy |  |  | 적에게 닿을 경우 적용될 효과 |
| effect_enemy_skill_object |  |  | 적의 방벽과 소환물에 닿을 경우 적용될 효과 |
| effect_env |  |  | 배경 / 배경 프랍에 닿��� 경우 적용될 효과 |
| effect_others |  |  | 중립 맵 오브젝트에 닿을 경우 적용될 효과 |
| elemental_type |  |  | 무기 피해 유형(총알, 폭발…) |
| on_hit_execute_id1 |  |  | 투사체의 collider와 닿을 때 발생하는 skill_execute_id1 |
| on_hit_execute_id2 |  |  | 투사체의 collider와 닿을 때 발생하는 skill_execute_id2 |
| on_destroy_execute_id1 |  |  | 투사체 파괴시 발생할 skill_execute_id1 |
| on_destroy_execute_id2 |  |  | 투사체 파괴시 발생할 skill_execute_id2 |
| splash_damage_profile_id |  |  | 스플래쉬 대미지의 계산 방식 id |
| trajectory_ally |  |  | 아군에게 닿을 경우 궤적의 변경 방식 |
| trajectory_enemy |  |  | 적에게 닿을 경우 궤적의 변경 방식 |
| trajectory_enemy_skill_object |  |  | 적의 방벽과 소환물에 닿을 경우 궤적의 변경 방식 |
| trajectory_env |  |  | 배경 / 배경 프랍에 닿을 경우 궤적의 변경 방식 |
| trajectory_others |  |  | 중립 맵 오브젝트에 닿을 경우 궤적의 변경 방식 |
| trajectory_value |  |  | 투사체의 궤적 결과가 bounce일 경우, 튕길때 속도 계수 |

## Ranking — 시즌 랭킹
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 랭킹 ID |
| ranking_type |  |  | 랭킹 그룹 타입 (Rank=상위 n위, Percentile=상위 n%) |
| ranking_value |  |  | 랭킹 그룹 타입에 따른 순위 수치 |
| string_id |  |  | 보상 전시 화면의 텍스트 Key 연결 |
| reward_id |  |  | Reward 테이블 참조 ID |

## SkinResource — 스킨 리소스 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| composition_id |  |  | 복합키 생성용 식별자 |
| resource_parts |  |  | 스킨 적용 부분을 결정하는 식별자 (Muzzle, Head…) |
| resource_type |  |  | 적용할 리소스 종류 (Prefab, Anim, Sound, FX, UI…) |
| asset_ref |  |  | 대상에 적용할 리소스 이름 |

## StatusEffectFunction — StatusEffect 적용 효과
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| function_type |  |  | 효과 타입 (//Define참조) |
| function_value1 |  |  | 효과 값 1번 |
| function_value2 |  |  | 효과 값 2번 |
| enum_value1 |  |  | 팝업 표기 값 1번 |
| enum_value2 |  |  | 팝업 표기 값 2번 |

## StatusEffectGroup — StatusEffect 그룹 정의
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| stack_max |  |  | 스택 최대 누적 값 |
| stack_down_condition |  |  | 스택 하락 조건/트리거 타입 |
| stack_down_condition_value |  |  | 하락 조건에서 참조할 값 |
| stack_down_count |  |  | 하락할 스택 수 |
| popup_force_first |  |  | 처음 걸렸을 때 툴팁을 표현할 지 |
| vinette_effect_id |  |  | 해당 상태 효과 도중 HUD에 비네팅 연출 id |
| vinette_setting |  |  | 비네트 세팅 _ 스크립트 오브젝트 명 |

## StatusEffect — StatusEffect의 최상위 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| status_effect_category |  |  | 카테고리(버프, 디버프…) |
| status_effect_group_id |  |  | statusEffect 그룹 id |
| duration |  |  | (부활 직후 무적에서만 사용) |
| stack_type |  |  | 스택 타입 (Overwrite / Stack) |
| stack_up_count |  |  | 초기 stack 개수 |
| priority |  |  | 동일 그룹에서 적용 우선도 |
| is_death_clear |  |  | 죽었을 때 초기화 여부 |
| is_battle_start |  |  | [ai로직] 해당 statusEffect에 걸렸을 때, 적 탐색으로 전환 |
| function_id1 |  |  | statusEffectFunction id 1번 |
| function_id2 |  |  | statusEffectFunction id 2번 |
| mark_id |  |  | 상태 효과 적��� 중 부여할 마크 구분자 |
| status_effect_res |  |  | 해당 statusEffect에 걸렸을 때 fx(연출) |
| status_effect_icon |  |  | 아이콘 이름 |
| status_effect_name |  |  | 이름 스트링 키 |
| status_effect_desc |  |  | 설명 스트링 키 |
| is_assist |  |  | 해당 버프/디버프를 어시스트로 판단하는지 여부 |
| disruption_score |  |  | 방해 점수 (디버프의 강도를 점수로 환산) |

## Stat — 스탯의 기본 정보
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| stat_type |  |  | 스탯 타입 |
| minimum_value |  |  | 해당 스탯의 최소 값 |
| maximum_value |  |  | 해당 스탯의 최대 값 |
| is_percent |  |  | (스탯 표기 방식) % 출력 여부 |
| decimal_place |  |  | (스탯 표기 방식) 소수점 위치 |
| ui_sort_order |  |  | UI 표기 순서, 0이면 표기 제외 |

## Tier — 티어 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 티어의 ID(키값) |
| tier_name |  |  | 티어 이름 |
| icon_id |  |  | 티어의 아이콘 id |
| division |  |  | 티어 내의 디비전 번호(0인 경우 해당 티어에는 디비전이 없음) |
| sort_order |  |  | 해당 티어의 순서(1이 가장 높은 티어 / 숫자가 높을 수록 낮은 티어) |
| promotion_type |  |  | 다음 디비전(티어)으로 승급하기 위한 규칙 _ Direct = max_rp 달성 시 자동 승급 _ Cutoff = 서버 순위를 기준으로 상위 n명만 승급 _ None = 승급 불가 |
| max_rp |  |  | 해당 디비전에서 보유할 수 있는 최대 승점 _ ‘promotion_type'이 'Direct’인 경우 최대 승점 도달 시 다음 디비전(티어)로 승급 _ 값이 0일 경우 보유 제한 없음 |
| cutoff_rank |  |  | 다음 디비전(티어)에 진입하기 위한 서버 순위 _ ‘promotion_type'이 'Cutoff’인 경우에만 사용 |
| demotion_shield |  |  | 해당 티어 승급 시 적용되는 강등 보호막의 수 _ 각 티어별로 첫 진입 시에만 적용됨 |
| daily_decay_protection |  |  | 1일 게임 접속 시 획득하는 휴면 강등 보호 |
| decay_protection_limit |  |  | 보유 가능한 휴면 강등 보호의 최대치 |
| is_tier_decay |  |  | 휴면 강등 적용 여부 |
| decay_rank_points |  |  | 휴면 강등 적용 시 매일 감소하는 승점 |
| tier_base_mu |  |  | 해당 티어의 표준 MMR(mu) |
| season_reset_demotion |  |  | 시즌 초기화 시 강등되는 티어 단계 |
| ladder_points_by_tier |  |  | 해당 티어 달성 시 획득하는 ladder_points(랭킹 집계용 포인트) |

## Title — 칭호 아이템
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 칭호 ID |
| name_id |  |  | 칭호 이름 ID |
| desc_id |  |  | 칭호 설명 ID |
| image_asset |  |  | 칭호 이미지 파일 |

