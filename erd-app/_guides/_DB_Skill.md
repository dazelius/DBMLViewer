# Skill 관련 테이블

## BotSkillDecision — 봇 스킬 사용 결정
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | Skill Decision ID |
| group_id |  |  | 그룹 ID |
| skill_slot |  |  | 스킬 슬롯 (_1이면 weapon_id 참조) |
| weapon_id |  |  | 무기 ID (_1이면 skill_id 참조) |
| priority |  |  | 우선순위 |
| set |  |  | 조건의 set No. |
| keep_pre_action |  |  | 이전 액션을 이어나갈지 여부 ( 사격 등 ) |
| usable_peace |  |  | 비전투 사용 가능 여부 |
| condition_type |  |  | 조건 타입 (Required/Disabled/Bonus) |
| skill_target |  |  | 스킬 타겟 Enum |
| skill_target_value |  |  | 스킬 타겟 Enum의 Value값 (조건) |
| bot_condition_id |  |  | 조건 ID |
| cool_time |  |  | 해당 조건으로 사용 시 해당 조건이 동작하기 위한 Cooltime |
| use_rate |  |  | 사용 확률(만분율) |
| is_add_rate |  |  | 사용하기 전까지 확률이 누적될지 여부 |
| force_use_count |  |  | 쿨이 0인 상태에서 해당 횟수만큼 계산실패하면 강제로 사용할 수 있는 위치까지 이동하여 사용 (_1 사용하지 않음) |

## ModulePassiveEffect — 모듈 패시브 효과 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 모듈 패시브 효과 그룹ID |
| effect_id |  |  | 그룹 내 번호 구분자 |
| module_passive_effect_type |  |  | 효과 타입 |
| effect_target_id |  |  | 효과 타입에 따라 찾을 ID |
| effect_value1 |  |  | 효과 값 |
| effect_value2 |  |  | 효과 값 |
| effect_value3 |  |  | 효과 값 |
| effect_value4 |  |  | 효과 값 |

## ModulePassiveProperty — 모듈 패시브 조건 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 모듈 패시브 프로퍼티 그룹ID |
| property_id |  |  | 그룹 내 번호 구분자 |
| module_passive_effect_id |  |  | 적용시킬 ModulePassiveEffect Group ID |
| passive_start_cool |  |  | 시작 쿨다운 |
| passive_activate_cool |  |  | 한 번 활성화한 후, 다음 활성화까지의 쿨다운 |
| passive_round_limit |  |  | 라운드당 발동 횟수 제한 (다음 라운드에서 초기화) |
| passive_spawn_limit |  |  | 스폰당 발동 횟수 제한 (리스폰 시 초기화) |
| required_mark |  |  | 이 값에 해당하는 마크가 있으면 컨디션 체크 |
| blocked_mark |  |  | 이 값에 해당하는 마크가 없으면 컨디션 체크 |
| run_condition_type |  |  | 활성화 조건 |
| run_condtion_value1 |  |  | 활성화 조건 값 |
| run_condtion_value2 |  |  | 활성화 조건 값 |
| kill_condition_type |  |  | 비활성화 조건 |
| kill_condtion_value1 |  |  | 비활성화 조건 값 |
| kill_condtion_value2 |  |  | 비활성화 조건 값 |

## PassiveEffect — 패시브 효과 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| passive_effect_type |  |  | 효과 타입 |
| effect_target_id |  |  | 효과 타입에 따라 찾을 ID |
| effect_value1 |  |  | 효과 값 |
| effect_value2 |  |  | 효과 값 |
| effect_value3 |  |  | 효과 값 |
| effect_value4 |  |  | 효과 값 |

## PassiveProperty — 패시브 조건 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 종속될 패시브 ID |
| property_id |  |  | 복합기 생성용 식별자 |
| passive_start_cool |  |  | 시작 쿨다운 |
| passive_activate_cool |  |  | 한 번 활성화한 후, 다음 활성화까지의 쿨다운 |
| passive_round_limit |  |  | 라운드당 발동 횟수 제한 (다음 라운드에서 초기화) |
| passive_spawn_limit |  |  | 스폰당 발동 횟수 제한 (리스폰 시 초기화) |
| passive_effect_id |  |  | 적용시킬 PassiveEffect ID |
| required_mark |  |  | 이 값에 해당하는 마크가 있으면 컨디션 체크 |
| blocked_mark |  |  | 이 값에 해당하는 마크가 없으면 컨디션 체크 |
| run_condition_type |  |  | 활성화 조건 |
| run_condtion_value1 |  |  | 활성화 조건 값 |
| run_condtion_value2 |  |  | 활성화 조건 값 |
| kill_condition_type |  |  | 비활성화 조건 |
| kill_condtion_value1 |  |  | 비활성화 조건 값 |
| kill_condtion_value2 |  |  | 비활성화 조건 값 |

## Passive — 패시브 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| passive_lv |  |  | 패시브 레벨 |
| passive_group_id |  |  | 동일 효과로 간주하기 위한 값 |
| passive_property_id |  |  | 사용할 PassvieProperty 그룹의 ID |
| skill_ui_type |  |  | UI 참고를 위한 분류 |
| display_name |  |  | 패시브 이름 키값 (로컬라이제이션) |
| display_desc |  |  | 패시브 설명 키값 (로컬라이제이션) |
| icon |  |  | 패시브 아이콘 파일명 |
| passive_type |  |  | 패시브 타입 |
| use_target_id |  |  | 무기 고유 모듈일 경우 = 무기 id, 공용모듈 = _1 |
| skill_ui_id |  |  | 이름, 설명, 아이콘 정보를 가진 SkillUI ID |
| is_additive |  |  | 중첩 보유 가능 여부, FALSE이면 덮어씀 |
| is_swap_clear |  |  | 무기 모듈 패시브일 때, 무기 교체 시 임시로 비활성화 여부 (다시 장착하면 재적용 됨) |
| is_kill_ownerdeath |  |  | 보유자 사망 시 패시브 삭제 여부 |
| is_kill_round_end |  |  | 라운드 종료 시 패시브 삭제 여부 |
| is_kill_shift_round |  |  | 라운드 종료로 인한 공격/수비 진영 교대 시 패시브 삭제 여부 |
| token_equip_cost |  |  | 코드 확인 후 제거 필요 (구 아웃게임 관련) |

## SkillCondition — 스킬 조건 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| skill_fk |  |  | 컨디션이 적용될 원본 스킬 ID |
| check_condition |  |  | 조건 타입 |
| condtion_value1 |  |  | 조건 값1 |
| condtion_value2 |  |  | 조건 값2 |

## SkillExecuteEffect — 스킬 실행 효과 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| effect_type |  |  | 효과 유형 |
| attack_type |  |  | 피해 유형 (근접, 원거리, 마법, …) |
| damage_type |  |  | 피해 계수 산정 방식 (일반, 방어력 비례, 대상 최대 체력 비례, …) |
| weapon_type |  |  | 거리별 피해 감쇠 커브를 결정하기 위한 무기 타입 |
| elemental_type |  |  | 속성 (미구현) |
| rate |  |  | 적중 확률 (상태 효과에만 적용) |
| effect_value1 |  |  | 효과 값 |
| effect_value2 |  |  | 효과 값 |
| effect_value3 |  |  | 효과 값 |
| life_steal_ratio |  |  | [effect가 Damage 일때만] 입힌 피해양의 일부를 생명력으로 회복 (만분율) |
| hit_type |  |  | 피격 강도 (일반, 슈퍼아머크래시, …) |
| execute_result_display_id |  |  | 반응 연출 ID |
| part_hit_id |  |  | 부위 타격 ID |
| caster_result_energy_gain |  |  | 해당 효과 적중 시 시전자의 에너지 충전량 |

## SkillExecuteRange — 스킬 실행 범위 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| exec_target |  |  | 대상 필터 (적, 내 파티, 전부, …) |
| check_target_num |  |  | 적중 가능한 대상 수 |
| exec_target_compare |  |  | 적중 가능한 대상 수를 필터하는 조건 타입 (체력, 거리, …) |
| exec_shape_type |  |  | 범위 형태 (호, 박스, 발사체, …) |
| shape_value1 |  |  | 범위 값, 범위 형태에 따라 다르게 사용 |
| shape_value2 |  |  | 범위 값, 범위 형태에 따라 다르게 사용 |
| shape_value3 |  |  | 범위 값, 범위 형태에 따라 다르게 사용 |
| shape_value4 |  |  | 범위 값, 범위 형태에 따라 다르게 사용 |
| spawn_position_type |  |  | 범위 생성 피봇 (발사체, 스킬 시작 위치, 현재 위치, …) |
| shape_position |  |  | 위치 오프셋 |
| shape_rotation |  |  | 회전 오프셋 |
| divide_count |  |  | 연속 판정 횟수 |
| repeat_duration |  |  | 판정 지속 시간, 이 시간을 횟수로 나누어 연속 판정 발생 |
| warning_display_time |  |  | 워닝 사인 시간 (미구현) |
| warning_display_type |  |  | 워닝 사인 유형 (미구현) |

## SkillExecuteResultDisplay — 스킬 실행 반응 연출 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| hit_option |  |  | 반응 유형 (일반, 넉다운, 넉백, …) |
| rotate_to_attacker |  |  | 피격 시 공격자를 향해 강제 회전할지 여부 |
| hit_option_delay |  |  | 연출 시간 |
| hit_push_distance |  |  | 강제이동 거리 |
| hit_force_air |  |  | 띄워 올리는 힘 |
| hit_push_duration |  |  | 강제이동 지속 시간 |
| display_priority |  |  | 우선도 |
| display_priority_wall |  |  | 우선도 저항력, 이 값보다 우선도가 높은 반응 연출로만 덮어씀 |
| battle_display_set_id |  |  | 연출 세트 ID |
| hit_result_res |  |  | 고정 연출 JSON 이름 |
| is_result_upperbody |  |  | 반응 연출 중 상체 모션만 사용할지 여부 |
| caster_result_res |  |  | 시전자 연출 JSON 이름 |
| is_caster_result_upperbody |  |  | 시전자 연출 중 상체 모션만 사용할지 여부 |
| bone_shake_direction |  |  | 본 쉐이크 방향 |
| bone_shake_impulse |  |  | 본 쉐이크 힘 |
| char_shake_impulse |  |  | 캐릭터 쉐이크 힘 |

## SkillExecute — 스킬 실행 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| execute_check_type |  |  | 실행 유형 (일반, 발사체, 가드, 기폭, ...) |
| execute_range_id |  |  | 실행 범위 정보 ID |
| execute_effect_id1 |  |  | 실행할 효과 ID |
| execute_effect_id2 |  |  | 실행할 효과 ID |
| execute_effect_id3 |  |  | 실행할 효과 ID |
| execute_effect_id4 |  |  | 실행할 효과 ID |
| execute_effect_id5 |  |  | 실행할 효과 ID |
| caster_result_execute_effect |  |  | 1개라도 적중 시 시전자에게 부여할 효과 ID |

## SkillSet — 스킬 묶음 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| slot |  |  | 할당할 액티브 스킬의 슬롯 번호 |
| skill_id |  |  | 스킬 id |

## SkillSummon — 스킬 소환 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| character_id |  |  | 소환할 캐릭터 ID |
| netobject_id |  |  | NetworkObject id 연결 |
| spawn_pos_type |  |  | 스폰 위치 유형 (지면, 캐릭터 부착, …) |
| summon_position |  |  | 위치 오프셋 |
| summon_rotate |  |  | 회전 오프셋 |
| life_duration |  |  | 소환물 수명 |
| is_kill_skillend |  |  | 소환한 스킬 종료 시 소환물 삭제 여부 |

## SkillTrans — 스킬 전환 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| skill_fk |  |  | 트랜스가 발동할 원본 스킬 ID |
| trans_id |  |  | 한 스킬 내 트랜스 우선도 및 복합키 생성용 식별자로 사용할 값 |
| trans_skill_id |  |  | 트랜스 결과로 발동할 스킬 ID |
| check_trans_type |  |  | 조건 판단 시점 (시작 시, 시전 중, 버튼 홀드 중) |
| trans_condition |  |  | 조건 타입 |
| trans_condition_value |  |  | 조건 값 |
| trans_enable_start |  |  | 트랜스 가능 시작 시점(ms) |
| trans_enable_end |  |  | 트랜스 가능 종료 시점(ms) |
| enable_visualize |  |  | 조건 만족 시 스킬 버튼 교체 여부 |
| ignore_cooldown |  |  | 조건 만족 시 원본 스킬의 쿨다운을 무시하고 실행할지 여부 |

## SkillUI — 스킬 UI 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| skill_ui_type |  |  | UI 참고를 위한 분류. |
| display_name |  |  | 스킬 이름 키값 (로컬라이제이션) |
| display_desc |  |  | 스킬 설명 키값 (로컬라이제이션) |
| icon |  |  | 스킬 아이콘 파일명 |

## Skill — 스킬 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| skill_tool_title |  |  | 액션 툴 상에서 보일 이름 |
| skill_ui_type |  |  | UI 참고를 위한 분류 |
| skill_group_id |  |  | 동일 스킬로 인식하도록 하는 식별자 (스킬 레벨 등에서 사용) |
| display_name |  |  | 스킬 이름 키값 (로컬라이제이션) |
| display_desc |  |  | 스킬 설명 키값 (로컬라이제이션) |
| icon |  |  | 스킬 아이콘 파일명 |
| skill_id_display_data |  |  | 아이콘 정보에 필요한 SkillUI 테이블 ID |
| skill_category |  |  | 스킬 분류별 효과를 주기 위한 값 |
| skill_type |  |  | 액션 타입 |
| crosshair_aim |  |  | 해당 무기 사용 중 크로스헤어의 중앙 지점 파츠 |
| crosshair_line |  |  | 해당 무기 사용 중 크로스헤어의 스프레드 라인 파츠 |
| directional_animation |  |  | 방향 입력에 따른 애니메이션 변경 여부 |
| origin_link_id |  |  | 이 스킬을 링크로 호출할 스킬 ID |
| next_link_id |  |  | 링크할 스킬 ID |
| charge_link |  |  | Charge 스킬에서 max_duration 초과 시 링크될 스킬 ID |
| passive_address_id |  |  | 패시브가 찾을 타겟 그룹 주소용 ID |
| startcool |  |  | 스킬 최초 사용 대기 시간(ms) |
| cooldown |  |  | 스킬 재사용 대기 시간(ms) |
| stack_max |  |  | 스킬 최대 충전 횟수 |
| change_stamina_value |  |  | 기본 스태미너 증감량 |
| change_stamina_tick |  |  | 추가 스태미너 증감 시점(ms) |
| change_stamina_value_tick |  |  | 추가 스태미너 증감량 |
| change_en_type |  |  | 소모하는 에너지 타입 |
| change_en_value |  |  | 기본 에너지 증감량 |
| change_en_tick |  |  | 추가 에너지 증감 시점(ms) |
| change_en_value_tick |  |  | 추가 에너지 증감량 |
| priority |  |  | 우선도 |
| priority_wall |  |  | 우선도 저항력, 이 값보다 우선도가 높은 스킬 사용 시 캔슬됨 |
| movable_rate |  |  | 시전 중 이동 속도(만분율) |
| rotatable_rate |  |  | 시전 중 회전 감도(만분율) |
| base_rotation_mode |  |  | 스킬 사용 중 고정할 캐릭터 회전 모드(None: 고정 안 됨) |
| is_jumpable |  |  | 시전 중 점프 가능 여부 |
| available_tag |  |  | 체공 중 사용 가능 여부 |
| proper_distance |  |  | AI 스킬 사용 적정 거리(cm) |
| skill_distance |  |  | 스킬 사거리(cm) |
| max_duration |  |  | 스킬 최대 시전 시점(ms) |
| min_skill_delay |  |  | 스킬 캔슬 가능 시점(ms) |
| forceplay_start |  |  | 강제 플레이 판정 시작 시점(ms) |
| forceplay_end |  |  | 강제 플레이 판정 종료 시점(ms) |
| input_rec_start |  |  | 스킬 선입력 녹화 시작 시점(ms) |
| affected_attack_speed |  |  | 스킬 속도가 공격 속도의 영향을 받을지 여부 |
| aggro_plat_value |  |  | 스킬 사용 시 어그로 고정 수치 부여량 |
| aggro_value |  |  | 스킬 효과의 어그로 획득 계수(만분율) |
| execute_option |  |  | 엑스큐트 연속 실행 판정 타입 |
| execute_chk_type |  |  | 엑스큐트 실행 타이밍의 기준 구간 (캐스트, 루프, 플레이, …) |
| execute_start1 |  |  | 1번 엑스큐트 실행 시점(ms) |
| execute_id1 |  |  | 1번 엑스큐트 ID |
| execute_start2 |  |  | 2번 엑스큐트 실행 시점(ms) |
| execute_id2 |  |  | 2번 ���스큐트 ID |
| execute_start3 |  |  | 3번 엑스큐트 실행 시점(ms) |
| execute_id3 |  |  | 3번 엑스큐트 ID |
| execute_start4 |  |  | 4번 엑스큐트 실행 시점(ms) |
| execute_id4 |  |  | 4번 엑스큐트 ID |
| execute_start5 |  |  | 5번 엑스큐트 실행 시점(ms) |
| execute_id5 |  |  | 5번 엑스큐트 ID |
| mark_id |  |  | 스킬 사용 도중 부여할 상태 마크 구분자 |
| mark_start |  |  | 스킬 사용 중 마크가 부여되는 타이밍(ms) |
| mark_end |  |  | 스킬 사용 중 마크가 해제되는 타이밍(ms) |
| dmg_mod_tag_id |  |  | 스킬 사용 도중 부여할 대미지 태그 구분자 |
| dmg_mod_tag_start |  |  | 스킬 사용 중 대미지 태그가 부여되는 타이밍(ms) |
| dmg_mod_tag_end |  |  | 스킬 사용 중 대미지 태그가 해제되는 타이밍(ms) |
| armor_type |  |  | 스킬 아머 유형 |
| armor_start |  |  | 스킬 아머 시작 시점(ms) |
| armor_end |  |  | 스킬 아머 종료 시점(ms) |
| armor_immune |  |  | 아머 도중 적용할 이뮨 ID |
| look_direction |  |  | 스킬 시작 방향 |
| chase_start |  |  | 방향 보정 시작 시간(ms) |
| chase_end |  |  | 방향 보정 종료 시간(ms) |
| chase_range |  |  | 방향 보정 발동 허용 각도(도) |
| chase_distance |  |  | 방향 보정 발동 최대 거리(cm) |
| ai_homing_start |  |  | AI 호밍 시작 시점(ms) |
| ai_homing_end |  |  | AI 호밍 종료 시점(ms) |
| ai_homing_speed |  |  | AI 호밍 초당 회전 각속도(도) |
| cast_step_res |  |  | 캐스트 구간 연출 데이터 |
| loop_step_res |  |  | 루프 구간 연출 데이터 |
| cast_duration |  |  | 캐스트 지속 시간 |
| play_step_res |  |  | 플레이 구간 연출 데이터 |
| allow_spawn_area |  |  | 안전 지대에서 스킬의 사용을 허가할 것인지 여부 |
| target_play_res |  |  | 타겟이 재생할 연출 데이터 |
| passive_id |  |  | 스킬 보유 시 자동 획득되는 패시브 ID |
| post_skill_draw |  |  | 스킬 실행 후 원래 무기 드로우 동작 실행 여부 |

