# Passive / Perk 작업 가이드

## 멀티키 구조

### PassiveProperty 멀티키
- PassiveProperty는 **id + property_id** 조합이 멀티키
- 하나의 Passive 안에 여러 개의 PassiveProperty 행을 **id를 같게** 하여 연결
- 예: id=8001012, property_id=1 / id=8001012, property_id=2 → 같은 Passive에 2개 Property

### PerkEffect 멀티키
- PerkEffect는 **id + eff_id** 조합이 멀티키
- 하나의 Perk 안에 여러 개의 PerkEffect 행을 **id를 같게** 하여 연결
- 예: id=8001021, eff_id=1 / id=8001021, eff_id=2 / id=8001021, eff_id=3 → 같은 Perk에 3개 Effect

---

## ⭐ PassiveEffect 핵심 원칙: 1 Property : 1 Effect

- **동일한 run_condition(발동 조건)에 효과를 여러 개 걸고 싶으면 → PassiveProperty 행을 분리**
- PassiveEffect는 하나의 PassiveProperty에 effect_id 하나만 연결
- effect_id를 2개 이상 넣는 방식은 지원하지 않음

### ✅ 올바른 예시 (효과 2개, 같은 조건)
| id | prop_id | run_condition | effect_id |
|----|---------|--------------|-----------|
| 8004011 | 1 | AttackHit | 80040111 (GetMarkA) |
| 8004011 | 2 | AttackHit | 80040112 (RemoveMarkB) |

### ❌ 잘못된 예시
| id | prop_id | run_condition | effect_id |
|----|---------|--------------|-----------|
| 8004011 | 1 | AttackHit | 80040111, 80040112 ← 불가 |

---

## ⭐ run_condition val 값 입력 규칙

- run_condition에 따라 **val1, val2 등의 의미가 달라짐**
- **반드시 코드를 직접 확인**하여 각 condition이 val을 어떻게 파싱하는지 확인 후 입력
- Enum 이름만 보고 임의로 값을 추정하지 말 것

### ⚠️ 코드 구현 자체가 없는 경우
- 해당 run_condition에 대한 **코드 구현이 아예 존재하지 않으면** → val 값을 **임의로 입력해도 무방**
- 단, 나중에 코드가 구현될 때 val 의미가 달라질 수 있으므로 **메모에 "코드 미구현 상태로 임의 입력" 표기 권장**

---

## ⭐ PassiveEffect val 값 입력 규칙

- PassiveEffect의 **val1~val4** 의미는 `passive_effect_type`(EPassiveEffectType)에 따라 달라짐
- **반드시 코드를 직접 확인**하여 해당 effect type이 val을 어떻게 파싱하는지 확인 후 입력

### ✅ 확인된 PassiveEffect val 매핑
| passive_effect_type | val1 의미 | val2 의미 | 참고 |
|---|---|---|---|
| GetStatusEffect | duration(ms) — SE 지속시간 | -1 고정 | 코드 확인 완료 |
| GetStatusEffectCurrentHitTarget | duration(ms) — SE 지속시간 | -1 고정 | 동일 파싱 구조 |

> GetStatusEffect 사용 시: val1 = duration(ms), StatusEffect.duration 컬럼은 비워둠

---

## 작업 순서 (FK 순서)

**Passive:**
1. PassiveEffect 등록
2. PassiveProperty 등록 (effect_id → PassiveEffect.id 참조)
3. Passive 등록 (passive_property_id 참조)

**Perk:**
1. PerkEffect 등록
2. Perk 등록 (perk_effect_group_id 참조)

## 데이터 등록 전 권장 순서
1. 매핑표를 **아티팩트에 먼저 정리**
2. 검토 후 **일괄 등록**
3. PassiveEffect ID 체계: `{PassiveID}{두자리순번}` (예: Passive 8004011 → PassiveEffect 80040111, 80040112 ...)

---

## PassiveProperty 컬럼 상세
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | int32 | PK(multi) - Passive.id와 동일 |
| property_id | byte | 같은 id 내 순번 |
| passive_start_cool | int32 | 시작 쿨타임(ms) |
| passive_activate_cool | int32 | 발동 쿨타임(ms) |
| passive_round_limit | int16 | 라운드 내 발동 횟수 제한 |
| passive_spawn_limit | int16 | 스폰 내 발동 횟수 제한 |
| passive_effect_id | int32 | PassiveEffect 참조 ID |
| required_mark | int32 | 필요 마크 ID (0=없음) |
| blocked_mark | int32 | 차단 마크 ID (0=없음) |
| run_condition_type | EPassiveConditionType | 발동 조건 |
| run_condtion_value1 | int32 | 발동 조건 값1 |
| run_condtion_value2 | int32 | 발동 조건 값2 |
| kill_condition_type | EPassiveConditionType | 종료 조건 |
| kill_condtion_value1 | int32 | 종료 조건 값1 |
| kill_condtion_value2 | int32 | 종료 조건 값2 |

## EPassiveConditionType 전체 목록

> 비교연산: 0=같음, 1=미만, 2=초과, 3=이하, 4=이상

| 값 | 이름 | 설명 | v1 | v2 |
|---|---|---|---|---|
| 0 | None | - | - | - |
| 1 | Always | 항상 (쿨다운/횟수 제한은 적용) | -1 | -1 |
| 2 | ExistEnemyInRange | 주변 적 존재 시 | 0=근접, 1=중범위, 2=전체 | 수량(이상) |
| 3 | ExistEnemyInRangeUnder | 주변 적 미달 시 | 0=근접, 1=중범위, 2=전체 | 수량(미만) |
| 4 | AttackHitby | 피격 | -1 | -1 |
| 5 | Respawned | 리스폰 | -1 | -1 |
| 6 | AllyDeath | 아군 사망 | -1 | 0=모든, 1=HP0사망, 2=surrender |
| 7 | GetAssist | 어시스트 | 0=자신, 1=파티포함, 2=무조건 | 적용 확률 |
| 8 | StageStart | 스테이지 입장 | -1 | -1 |
| 9 | KillTarget | 적 처치 | -1=모든 | -1 |
| 10 | ExistAllyInRange | 주변 아군 존재 시 | 0=근접, 1=중범위, 2=전체 | 수량(이상) |
| 11 | AttackHit | 공격 적중 | 0=모든, 2=사격, 3=헤드샷 | 적중 횟수 |
| 12 | ExistAllyInRangeUnder | 주변 아군 미달 시 | 0=근접, 1=중범위, 2=전체 | 수량(미만) |
| 13 | OwnShieldPercentCompare | 보호막 비율 비교 | 비교값(%) | 비교연산 |
| 14 | DamageTakenHPPercentCompareForDefer | HP비율 피해 비교(지연) | 비교값(%) | 비교연산 |
| 15 | EnemyActionInRange | 범위 내 적 행동 | 범위(cm) | -1 |
| 16 | Reload | 재장전 | -1 | -1 |
| 17 | MoveSelf | 자신 이동 | -1 | -1 |
| 18 | KillTargetNearbyEnemySource | 처치 적 주변 source 검출 | 범위(cm) | 최대 검출 수 |
| 19 | OwnDeath | 자신 사망 | -1 | -1 |
| 20 | ApplyPassiveEffect | PassiveEffect 적용됨 | PassiveEffect ID | -1 |
| 21 | GetMark | 마크 획득 | MarkID | -1 |
| 22 | LoseMark | 마크 소실 | MarkID | -1 |
| 23 | IsOnPoint | 거점 위에 있을 때 | -1 | -1 |
| 24 | UseJump | 점프 사용 | -1 | -1 |
| 25 | IsGrounded | 지면 착지 | -1 | -1 |
| 26 | SkillWeaponShattered | 스킬무기 파괴됨 | -1 | -1 |
| 27 | GetAssistOrKill | 어시스트 또는 킬 | 0=자신, 1=파티포함, 2=무조건 | -1 |
| 28 | KilledEnemyRespawned | 처치한 적 리스폰 | -1 | -1 |
| 29 | WeaponAttackFullChargeHit | 최대충전 적중(preCharge only) | 미사용(0~1) | -1 |
| 30 | OnCurrentAmmoEmpty | 탄약 소진 | -1 | -1 |
| 31 | SwapWeapon | 무기 교체 | 0=모든, 1=주무기로, 2=보조무기로 | -1 |
| 32 | ReloadWeapon | 장전 성공 | -1 | -1 |
