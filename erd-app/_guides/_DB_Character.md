# Character 관련 테이블

## CharacterAppearance — 캐릭터 스킨, 모델, 외형
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| model_id |  |  | 기본 모델 id |
| is_collision_ally |  |  | 아군과 충돌 판정이 존재하는지 여부 |
| is_collision_enemy |  |  | 적군과 충돌 판정이 존재하는지 여부 |
| height |  |  | 기본 (stand) 상태에서 캐릭터 키(cm) |
| height_crouch |  |  | 앉은 상태에서 캐릭터 키(cm) |
| head_skin_id |  |  | 머리 파츠의 skin id |
| mask_skin_id |  |  | 마스크(얼굴 전면/안경) 파츠의 skin id |
| face_paint_skin_id |  |  | 화장 파츠의 skin id |
| shirt_skin_id |  |  | 상의 파츠의 skin id |
| pants_skin_id |  |  | 하의 파츠의 skin id |
| shoes_skin_id |  |  | 신발 파츠의 skin id |
| portrait |  |  | 캐릭터 기본 포트레이트 |
| fullbody_img |  |  | 캐릭터 전신 이미지 |
| minimap_icon |  |  | 미니맵 캐릭터 아이콘 |

## CharacterClass — 캐릭터 클래스에 대한 데이터
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| character_class |  |  | 캐릭터 클래스 enum |
| name_id |  |  | 이름 |
| decs_id |  |  | 설명 |
| icon_id |  |  | 아이콘 |

## CharacterGearSet — 캐릭터의 기본 기어(장비) 세트
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| fist_gear_id |  |  | 맨손 기어 id (무기 없을 때) |
| weapon_gear_main_id_1 |  |  | 주무기 선택지 중 1번에 해당하는 무기 |
| weapon_gear_main_id_2 |  |  | 주무기 선택지 중 2번에 해당하는 무기 |
| weapon_gear_sub_id |  |  | 기본 보조 무기 |
| helmet_gear_id |  |  | 헬멧 기어 id |
| chest_gear_id |  |  | 상의 기어 id |

## CharacterLevel — 캐릭터 경험치 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| character_level |  |  | 캐릭터 레벨(키 값) |
| required_exp |  |  | 요구 누적 경험치 |

## CharacterPassiveSet — 캐릭터 스킨, 모델, 외형
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| passive_id |  |  | 패시브 id |

## CharacterPingSound — 캐릭터 핑 사운드
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| character_id |  |  | 캐릭터 id |
| ping_id |  |  | 핑 id |
| ping_sound_asset |  |  | 핑 사용 시 우선 재생 사운드 파일 |

## CharacterSkin — 스킨 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| name_id |  |  | 이름 키값(로컬라이제이션) |
| desc_id |  |  | 설명 키값(로컬라이제이션) |
| icon |  |  | 캐릭터 스킨 아이콘 |
| skin_character_type |  |  | 스킨이 적용 타입 |
| use_target_id |  |  | 스킨 적용 캐릭터 id |
| model_id |  |  | 스킨 적용 모델 id |
| skin_part |  |  | 스킨이 적용될 부위 (head, gloves, …) |
| portrait |  |  | 포트레이트 이름 |
| character_prefab |  |  | 캐릭터 프리팹 이름 |
| skin_resource_id |  |  | 사용할 스킨 리소스 ID |
| is_default |  |  | 디폴트 스킨 여부 (번들 포함 체크용) |

## CharacterStat — 캐릭터 기초 스탯
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 (멀티키) |
| level |  |  | 대상 레벨. 레벨��� 소유하지 않을 경우 Lv1 에 해당하는 스탯 사용 |
| max_health |  |  | 최대 체력(hp) |
| health_regen |  |  | 초 당 체력 증감 값 |
| max_energy |  |  | 최대 에너지 (ep) |
| energy_gain_modifier |  |  | 에너지 획득 효율(만분율) |
| max_innate_shield |  |  | 최대 재생_보호막 보유량 |
| innate_shield_regen |  |  | 초 당 재생_보호막 증감 값 |
| innate_shield_regen_wait_time |  |  | 보호막 재생 대기시간(ms) |
| dbno_max_health |  |  | 기본 hp가 0이 되어 기절 되었을 때, 사용할 체력 |
| dbno_health_regen |  |  | 기절 체력(dbno_health)의 초 당 변화율. 주로 음수 사용 |
| heal_rate |  |  | 주는 회복량 (만분율) |
| heal_by_rate |  |  | 받는 회복량 (만분율) |
| temp_shield_rate |  |  | 주는 임시 보호막량 (만분율) |
| temp_shield_by_rate |  |  | 받는 임시 보호막량 (만분율) |
| damage_rate |  |  | 주는 모든 피해 증감율 (만분율) |
| damage_reduction_rate |  |  | 받는 모든 피해 증감율 (만분율) |
| bullet_damage_rate |  |  | 주는 탄환(Bullet) 타입으로 인한 피해 증감율 (만분율) |
| bullet_damage_reduction_rate |  |  | 받는 탄환(Bullet) 타입으로 인한 피해 증감율 (만분율) |
| splash_damage_rate |  |  | 주는 폭발(Splash) 타입으로 인한 피해 증감율 (만분율) |
| splash_damage_reduction_rate |  |  | 받는 폭발(Splash) 타입으로 인한 피해 증감율 (만분율) |
| damage_base |  |  | 기본 피해량 (바디샷 피해량) |
| damage_head_modifier |  |  | 헤드샷 피해 증감율 |
| damage_body_modifier |  |  | 몸통샷 피해 증감율 |
| damage_limb_modifier |  |  | 림샷 피해 증감율 |
| damage_shield_modifier |  |  | 보호막의 피해 흡수 배율 (만분율) |
| damage_shield_reduction_modifier |  |  | 보호막이 받는 피해 감소 (만분율) |
| damage_self_value |  |  | 자기 자신에게 대미지를 주는 비율 (만분율) |
| damage_ally_value |  |  | 자신을 제외한, 같은 편 아군 플레이어 (구조물 포함)에게 대미지를 주는 비율 (만분율) |
| damage_enemy_value |  |  | 적군에게 대미지를 주는 비율 (만분율) |
| heal_base |  |  | 힐 판정 발생 시, 해당 수치 만큼 생명력 회복 수행 |
| fire_rate |  |  | 사격 속도(RPM) |
| effective_range |  |  | 사거리(cm) |
| damage_falloff_start_distance |  |  | 대미지 감쇠가 시작되는 거리, effective_range의 만분율 값 |
| damage_falloff_end_distance |  |  | 대미지 감쇠가 끝나는 거리, effective_range의 만분율 값 |
| damage_falloff_min_value |  |  | 감쇠 시 최소 피해 비율(만분율, 10000이면 감쇠 미적용) |
| mag_capacity_1 |  |  | 1단계 탄창량(1회 장전량) |
| mag_capacity_2 |  |  | 2단계 탄창량(1회 장전량) |
| mag_capacity_3 |  |  | 3단계 탄창량(1회 장전량) |
| no_anim_reload_time |  |  | 애니메이션 연출 없을 때 재장전 시간(ms) |
| reload_time |  |  | 무기의 기본 재장전 시간 (ms) |
| reload_speed |  |  | 기본 재장전 시간에 곱해지는 배�� (만분율) |
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
| move_speed_rate_crouch_ads |  |  | crouch ads 상태 이동 속도 배율(만���율) |
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
| durability_head |  |  | 머리 방어구의 내구도 |
| durability_body |  |  | 몸통 방어구의 내구도 |
| damage_reduction_base |  |  | 기본 공격력(damage_base) 감소값 |
| damage_reduction_rate_head |  |  | 머리에 의한 일반 사격 피해 감소율 (만분율) |
| damage_reduction_rate_body |  |  | 몸통에 의한 일반 사격 피해 감소율 (만분율) |
| damage_reduction_rate_limb |  |  | 관절부에 의한 일반 사격 피해 감소율 (만분율) |
| damage_transfer_rate_head |  |  | 머리 방어구의 피해를 내구도로 변환하는 배율 |
| damage_transfer_rate_body |  |  | 몸통 방어구의 피해를 내구도로 변환하는 배율 |
| skill_damage_rate |  |  | 스킬 기본 피해량 |
| skill_damage_reduction_rate |  |  | 받는 스킬 피해 감소 배율 (만분율) |
| skill_speed_rate |  |  | 스킬 공격 속도 배율 (만분율) |
| skill_cooldown_haste |  |  | 스킬 쿨타임(쿨다운) 가속 |
| post_fire_delay |  |  | 발사 후 사격을 중단하고, 연속 사격이 불가능하게 하는 시간.(ms, 특별한 무기에만 사용) |
| force_delay_rate |  |  | 발사 후, 재장전 및 무기 교체를 수행하지 않도록 막는 시간. 현재 fire_rate 에 기반(만분율) |
| draw_duration |  |  | 무기 교체 시간 (ms) (사격 불가) |
| fire_hit_energy_gain |  |  | 총기 사격 적중 시, 사격자가 얻게 되는 에너지량 |
| energy_gain_head_modifier |  |  | 헤드샷 적중 시 에너지 충전량 배율(만분율) |
| innate_shield_regen_draw |  |  | 방패 전용 스탯, 들고 있을 때 초 당 재생_보호막 증감 값 |
| innate_shield_regen_sheath |  |  | 방패 전용 스탯, 넣고 있을 때 초 당 재생_보호막 증감 값 |
| stun_duration |  |  | 기절 상태 효과의 지속 시간 증감율 (만분율) |
| negative_speed_duration |  |  | 이동 속도 감소 상태 효과의 지속 시간 증감율 (만분율) |
| charge_max_time |  |  | 최대 충전 단계 도달 시간 (ms) |
| charge_tier |  |  | 충전 단계 수 |
| charge_damage_modifier_per_tier |  |  | 충전 단계당 대미지 증감율 (만분율) |
| charge_damage_modifier_max |  |  | 최대 충전 단계 도달시 추가 대미지 증감율 (만분율) |
| charge_ammo_consume_modifier_per_tier |  |  | 충전 단계당 탄환 소모량 증감율 (만분율) |
| damage_no_shield_modifier |  |  | 보호막이 없는 대상에 대한 피해 증감율 (만분율) |
| consecutive_fire_max_damage_rate |  |  | 무기 연사에 따른 대미지 최대 증가율 (만분율) |
| consecutive_fire_max_count |  |  | 대미지 최대 증가율에 도달하기 위한 연속 발사 수 |
| consecutive_fire_threshold |  |  | 연사 끊김을 판정하는 시간 (ms) |
| skill_damage_base |  |  | 스킬 위력을 결정하는 스탯. 기본값은 100 |

## Character — 캐릭터 데이터의 최상위 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| type |  |  | 캐릭터 타입 (플레이어, 몬스터…) |
| faction_relation |  |  | 캐릭터의 세력의 관계 정보 ( None인 경우 Mode의 Rule을 따름 ) |
| is_display |  |  | 캐릭터 선택 출력 여부 |
| name_id |  |  | 이름 스트링 키 |
| desc_id |  |  | 설명 스트링 키 |
| character_class |  |  | 캐릭터 클래스 (전사, 궁수…) |
| icon_id |  |  | 캐릭터 icon 이름 |
| default_anim_controller |  |  | 캐릭터 디폴트 애니메이션 컨트롤러 |
| character_appearance_id |  |  | 캐릭터 외형 관련 id |
| character_stat_id |  |  | 기초 스탯 id |
| character_gear_set_id |  |  | 기본 기어 묶음 id |
| character_passive_set_id |  |  | 캐릭터 기본 패시브 묶음 id |
| skill_set_id |  |  | 액티브 스킬 ���음 id |

