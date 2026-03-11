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

## 작업 순서 (FK 순서)

1. **PassiveEffect** 등록
2. **PassiveProperty** 등록 (effect_id는 위에서 등록한 PassiveEffect.id 참조)
3. **Passive** 등록 (passive_property_id 참조)

Perk:
1. **PerkEffect** 등록
2. **Perk** 등록 (perk_effect_group_id 참조)

---

## 데이터 등록 전 권장 순서

1. 매핑표를 **아티팩트에 먼저 정리**
2. 검토 후 **일괄 등록**
3. PassiveEffect ID 체계: `{PassiveID}{두자리순번}` (예: Passive 8004011 → PassiveEffect 80040111, 80040112 ...)
