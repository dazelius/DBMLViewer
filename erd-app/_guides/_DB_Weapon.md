# Weapon 관련 테이블

## WeaponSelfStat — 방패 자체 스탯 (내구력 관련)
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| max_health |  |  | 최대 체력(hp) |
| health_regen |  |  | 초 당 체력 증감 값 |
| max_innate_shield |  |  | 최대 재생_보호막 보유량 |
| innate_shield_regen_draw |  |  | 방패를 들고 있을 때 초 당 재생_보호막 증감 값 |
| innate_shield_regen_sheath |  |  | 방패를 넣고 있을 때 초 당 재생_보호막 증감 값 |
| heal_rate |  |  | 주는 회복량 (만분율) |
| heal_by_rate |  |  | 받는 회복량 (만분율) |
| temp_shield_rate |  |  | 주는 임시 보호막량 (만분율) |
| temp_shield_by_rate |  |  | 받는 임시 보호막량 (만분율) |
| damage_reduction_rate |  |  | 받는 모든 피해 증감율 (만분율) |
| bullet_damage_reduction_rate |  |  | 받는 탄환(Bullet) 타입으로 인한 피해 증감율 (만분율) |
| splash_damage_reduction_rate |  |  | 받는 폭발(Splash) 타입으로 인한 피해 증감율 (만분율) |
| skill_damage_reduction_rate |  |  | 받는 스킬 피해 감소 배율 (만분율) |

## WeaponSkin — 무기 스킨 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| name_id |  |  | 이름 키값 (���컬라이제이션) |
| desc_id |  |  | 설명 키값 (로컬라이제이션) |
| target_character_id |  |  | 해당 무기 스킨을 사용하는 캐릭터 id (아웃게임 표기용도) |
| weapon_model_id |  |  | 무기 모델 데이터 |
| skin_weapon_type |  |  | 스킨이 적용 타입 |
| use_target_id |  |  | 스킨 적용무기 id |
| portrait |  |  | 포트레이트 이미��� 이름 |
| icon |  |  | 무기 아이콘 |
| anim_controller |  |  | 애니메이터 컨트롤러 이름 (Assets/GameContents/Animation/AnimationController) |
| socket |  |  | 무기 프리팹이 부착될 캐릭터 본 이름 |
| skin_resource_id |  |  | 사용할 스킨 리소스 ID |
| is_default |  |  | 디폴트 스킨 여부 (번들 포함 체크용) |
| effect_settings |  |  | 이펙트 및 사운드 세팅 _ 스트립트 오브젝트 명 |

## WeaponStatDisplay — UI 무기 스탯 표시 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| weapon_type |  |  | 데이터 키값(무기 타입) |
| ui_sort_order |  |  | 시너지가 UI에 표시될 때의 정렬 순서, 무기 타입과 조합하여 복합키로 사용 |
| stat_type |  |  | 스탯 타입 |

## WeaponStat — 총기 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| damage_base |  |  | 기본 피해량 (바디샷 피해량) |
| damage_head_modifier |  |  | 헤드샷 피해 증감율 |
| damage_body_modifier |  |  | 몸통샷 피해 증감율 |
| damage_limb_modifier |  |  | 림샷 피해 증감율 |
| damage_shield_modifier |  |  | 보호막의 피해 흡수 배율 (만분율) |
| damage_self_value |  |  | 자기 자신에게 대미지를 주는 비율 (만분���) |
| damage_ally_value |  |  | 자신을 제외한, 같은 편 아군 플레이어 (구조물 포함)에게 대미지를 주는 비율 (만분율) |
| damage_enemy_value |  |  | 적군에게 대미지를 주는 비율 (만분율) |
| heal_base |  |  | 힐 판정 발생 시, 해당 수치 만큼 생명력 회복 수행 |
| fire_rate |  |  | 사격 속도(RPM) |
| effective_range |  |  | 사거리(cm) |
| damage_falloff_start_distance |  |  | 대미지 감쇠가 시작되는 거리 (cm) |
| damage_falloff_end_distance |  |  | 대미지 감쇠가 끝나는 거리 (cm) |
| bot_approach_distance |  |  | [봇] 봇이 누군가에게 접근할 때 최소 도달해야 하는 거리 |
| damage_falloff_min_value |  |  | 감쇠 시 최소 피해 비율(만분율, 10000이면 감쇠 미적용) |
| mag_capacity_1 |  |  | 1단계 탄창량(1회 장전량) |
| mag_capacity_2 |  |  | 2단계 탄창량(1회 장전량) |
| mag_capacity_3 |  |  | 3단계 탄창량(1회 장전량) |
| no_anim_reload_time |  |  | 애니메이션 연출 없을 때 재장전 시간(ms) |
| reload_time |  |  | 무기의 기본 재장전 시간 (ms) |
| ammo_amount_spawn |  |  | 노획(전리품)으로 획득되는 탄창 수(스폰 시 기본값) |
| ammo_amount_airdrop |  |  | 에어드랍으로 획득되는 탄창 수(스폰 시 기본값) |
| move_speed |  |  | 기본 이동 속도(cm/s) _> 이걸로 오버라이드 해줘야 함. |
| move_speed_rate_stand_hip |  |  | hip 상태 이동 속도 배율(만분율) |
| move_speed_rate_stand_hip_fire |  |  | hip fire 상태 이동 속도 배율(만분율) |
| move_speed_rate_stand_aim |  |  | aim 상태 이동 속도 배율(만분율) |
| move_speed_rate_stand_ads |  |  | ads 상태 이동 속도 배율(만분율) |
| move_speed_rate_stand_reload |  |  | reload 상태 이동 속도 배율(만분율) |
| move_speed_rate_stand_equip |  |  | equip 상태 이동 속도 배율(만분율) |
| move_speed_rate_crouch_hip |  |  | crouch hip 상태 이동 속도 배율(만분율) |
| move_speed_rate_crouch_hip_fire |  |  | crouch hip fire 상태 이동 속도 배율(만분율) |
| move_speed_rate_crouch_aim |  |  | crouch aim 상태 이동 속도 배율(만분율) |
| move_speed_rate_crouch_ads |  |  | crouch ads 상태 이동 속도 배율(만분율) |
| move_speed_rate_crouch_reload |  |  | crouch reload 상태 이동 속도 배율(만분율) |
| move_speed_rate_crouch_equip |  |  | crouch equip 상태 이동 속도 배율(만분율) |
| deviation_standing |  |  | 서 있을 때 지향 사격 탄퍼짐(만분율) |
| deviation_crouch |  |  | 앉아 있을 때 지향 사격 탄퍼짐(만분율) |
| deviation_rate_aim |  |  | aim 상태 탄퍼짐 보정 배율(만분율) |
| deviation_rate_ads |  |  | 조준 시 탄퍼짐 보정 배율(만분율) |
| deviation_rate_move |  |  | 이동 시 탄퍼짐 보정 배율(만분율) |
| deviation_rate_jump |  |  | 점프 시 탄퍼짐 보정 배율(만분율) |
| moa_base |  |  | 총기 기본 정확도 |
| moa_max |  |  | MOA 보너스로 인해 최대로 늘어날 수 있는 MOA 값 |
| moa_increment_per_shot |  |  | MOA 보너스 상태에서 발 당 늘어나는 MOA 값 |
| moa_bonus_shot_count |  |  | MOA 보너스 유지 사격 수 |
| moa_bonus_reset_time |  |  | MOA 보너스 리셋 발동 시간(ms) |
| moa_recovery |  |  | recovery_delay 시간 이후, 초 당 감소하는 MOA 값 |
| moa_recovery_delay |  |  | 사격 중지 후, MOA가 회복 되기 전의 딜레이 시간(ms) |
| aim_assist_hip_fire_radius |  |  | Hip Fire 어시스트 발동 반경(px) |
| aim_assist_ads_enter_raidus |  |  | ADS 진입 어시스트 발동 반경(px) |
| aim_assist_ads_fire_radius |  |  | ADS 사격 어시스트 발동 반경(px) |
| aim_assist_keep_fire |  |  | 에임 어시스트 연사 규칙이 적용되는 최대 사격 수 |
| aim_assist_keep_recover_time |  |  | 에임 어시스트 연사 누적 횟수 초기화 시간(ms) |
| aim_assist_duration |  |  | 에임 어시스트의 카메라 이동 중에 시야가 고정되는 시간 |
| burst_shot_count |  |  | 점사량 |
| burst_interval |  |  | 점사 딜레이(ms) |
| burst_min_input_interval |  |  | 최소 입력 간격(ms, 점사 등에서 입력 허용 최소 시간) |
| burst_final_shot_modifier |  |  | 마지막 점사 탄환(burst_shot_count 번째) 에 추가 대미지 배율 |
| pellet_count |  |  | 산탄량 |
| pellet_spread |  |  | 산탄도 |
| heat_max |  |  | 최대 열량, 이 값 도달 시 과열, 0이면 과열 미사용 |
| heat_per_shot |  |  | 발사당 열 증가량 |
| heat_cooldown_rate |  |  | 초당 열 감소량 |
| heat_cooldown_delay |  |  | 발사 후 열 감소 지연 시간(ms) |
| overheat_cooldown_time |  |  | 과열 시 강제 쿨다운 시간(ms) |
| post_fire_delay |  |  | 발사 후 사격을 중단하고, 연속 사격이 불가능하게 하는 시간.(ms, 특별한 무기에만 사용) |
| force_delay_rate |  |  | 발사 후, 재장전 및 무기 교체를 수행하지 않도록 막는 시간. 현재 fire_rate 에 기반(만분율) |
| draw_duration |  |  | 무기 교체 시간 (ms) (사격 불가) |
| fire_hit_energy_gain |  |  | 총기 사격 적중 시, 사격자가 얻게 되는 에너지량 |
| energy_gain_head_modifier |  |  | 헤드샷 적중 시 에너지 충전량 배율(만분율) |
| autofire_radius |  |  | 자동 사격 _ 화면 너비의 해당 비율을 반지름으로 갖는 원을 사출하여 탐색 |
| autofire_trigger_timer |  |  | 자동 사격 _ 발사 대기 타이머 (ms) |
| autofire_grace_timer |  |  | 자동 사격 _ 발사 종료 대기 타이머 (ms) |
| charge_max_time |  |  | 최대 충전 단계 도달 시간 (ms) |
| charge_tier |  |  | 충전 단계 수 |
| charge_damage_modifier_per_tier |  |  | 충전 단계당 대미지 증감율 (만분율) |
| charge_damage_modifier_max |  |  | 최대 충전 단계 도달시 추가 대미지 증감율 (만분율) |
| charge_ammo_consume_modifier_per_tier |  |  | 충전 단계당 탄환 소모량 증감율 (만분율) |
| consecutive_fire_max_damage_rate |  |  | 무기 연사에 따른 대미지 최대 증���율 (만분율) |
| consecutive_fire_max_count |  |  | 대미지 최대 증가율에 도달하기 위한 연속 발사 수 |
| consecutive_fire_threshold |  |  | 연사 끊김을 판정하는 시간 (ms) |

## Weapon — 무기 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| weapon_type |  |  | 무기 종류 |
| weapon_type_icon |  |  | 무기 종류 아이콘 |
| fire_type |  |  | 무기 사격 유형 (auto, semi, throwable, charge…) |
| ammo_type |  |  | 탄약 유형 (ex. Bullet_556) |
| source_type |  |  | 무기 소스 타입(Skill 일때에는 스킬 대미지계산을 따름) |
| aim_mode |  |  | 조준 모드 진입 모드 |
| auto_reload |  |  | 탄창이 비었을 때 자동 재장전할지 여부 |
| weapon_stat_id |  |  | 무기 스탯 ID |
| weapon_self_stat_id |  |  | 무기 자체 스탯 ID (방패 등 자체 스탯이 필요한 경우) |
| default_skin_id |  |  | 무기 기본 스킨 ID |
| weapon_fire_setting |  |  | 발사 카메라 반동 및 축 관련 세팅 _ 스트립트 오브젝트 |
| projectile_id |  |  | 발사체 외래 키 |
| passive_id |  |  | 해당 무기를 들고있을 때에만 활성화 되는 패시브 |
| aim_assist_target |  |  | aim assist가 작동하는 대상 |
| auto_fire_target |  |  | auto fire 가 작동하는 대상 |
| crosshair_aim |  |  | 해당 무기 사용 중 크로스헤어의 중앙 지점 파츠 |
| crosshair_line |  |  | 해당 무기 사용 중 크로스헤어의 스프레드 라인 파츠 |
| crosshair |  |  | 해당 무기 사용 중 크로스헤어 교체 (null: 기본 리소스) |
| block_move |  |  | 무기 사용 중 이동 금지 여부 (스탯, 버프에 상관없이 막음) |
| block_jump |  |  | 무기 사용 중 점프 금지 여부 |
| is_swap_clear |  |  | 다른 무기로 교체 시 사라지는 속성 |
| force_stance |  |  | 무기 사용 중 고정시킬 스탠스(None: 고정 안 됨) |
| force_aim |  |  | 무기 사용 중 고정시킬 조준 모드(None: 고정 안 됨) |
| base_rotation_mode |  |  | 무기 장착 중 기본 캐릭터 회전 모드(None: 고정 안 됨) |
| block_jump_state |  |  | 애니메이션 상태가 점프로 진입하는 것을 금지할지 여부 |
| camera_setting_stand_hip |  |  | stand_hip 상태 camera 세팅 _ 스트립트 오브젝트 명 |
| camera_setting_stand_hip_fire |  |  | stand_hip_fire 상태 camera 세팅 _ 스트립트 오브젝트 명 |
| camera_setting_stand_aim |  |  | stand_aim 상태 camera 세팅 _ 스트립트 오브젝트 명 |
| camera_setting_stand_ads |  |  | stand_ads 상태 camera 세팅 _ 스트립트 오브젝트 명 |
| camera_setting_crouch_hip |  |  | crouch_hip 상태 camera 세팅 _ 스트립트 오브젝트 명 |
| camera_setting_crouch_hip_fire |  |  | crouch_hip_fire 상태 camera 세팅 _ 스트립트 오브젝트 명 |
| camera_setting_crouch_aim |  |  | crouch_aim 상태 camera 세팅 _ 스트립트 오브젝트 명 |
| camera_setting_crouch_ads |  |  | crouch_ads 상태 camera 세팅 _ 스트립트 오브젝트 명 |
| vinette_setting |  |  | 비네트 세팅 _ 스크립트 오브젝트 명 |
| autofire_condition |  |  | 자동 사격 _ 조건 (항상 가능 / ADS 상태에서만 가능 / 불가) |
| initial_aim_assist_state |  |  | 해당 무기의 aim assist 토글 상태 초기값 |
| initial_auto_fire_state |  |  | 해당 무기의 auto fire 토글 상태 초기값 |

