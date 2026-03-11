# Enum 조회 규칙 — 잘림 방지

## 핵심 문제
ENUMS 가상테이블은 **기본 15행까지만 반환**하고 나머지는 잘림.
LIMIT을 줘도 15행 제한은 동일함.

## 해결 방법

### 1. 특정 값 존재 여부 확인 (가장 정확)
```sql
SELECT * FROM ENUMS WHERE enum_name = 'EPassiveEffectType' AND enum_value = 'GetMark'
```

### 2. 키워드로 부분 검색
```sql
SELECT * FROM ENUMS WHERE enum_name = 'EPassiveEffectType' AND enum_value LIKE '%Mark%'
```

### 3. 전체 목록이 필요할 때 — 알파벳 범위 분할 조회
```sql
-- A~G
SELECT enum_value FROM ENUMS WHERE enum_name = 'EPassiveEffectType' AND enum_value < 'H' ORDER BY enum_value
-- H~M
SELECT enum_value FROM ENUMS WHERE enum_name = 'EPassiveEffectType' AND enum_value >= 'H' AND enum_value < 'N' ORDER BY enum_value
-- N~Z
SELECT enum_value FROM ENUMS WHERE enum_name = 'EPassiveEffectType' AND enum_value >= 'N' ORDER BY enum_value
```

### 4. 개수 먼저 확인
```sql
SELECT COUNT(*) as cnt FROM ENUMS WHERE enum_name = 'EPassiveEffectType'
```
→ 15개 초과면 분할 조회 필수

## 주요 Enum 이름 (자주 틀리는 것)
| 용도 | 올바른 Enum 이름 | ❌ 틀린 이름 |
|---|---|---|
| PassiveEffect 타입 | `EPassiveEffectType` (74개) | ~~EPassiveEffectType~~ (맞지만 15행만 나옴 주의) |
| Passive 조건 | `EPassiveConditionType` (33개) | ~~EPassiveRunCondition~~ (없음) |
| PerkEffect 타입 | ENUMS에 없음 → PerkEffect 테이블 DISTINCT로 확인 | ~~EPerkEffectType~~ (없음) |
| Perk 타입 | `EPerkType` | |

## PerkEffect 타입 확인 방법 (ENUMS에 없음)
```sql
SELECT DISTINCT perk_effect_type FROM PerkEffect ORDER BY perk_effect_type
```
또는 Enum 테이블에서:
```sql
SELECT DISTINCT enum_name FROM ENUMS WHERE enum_name LIKE '%Perk%'
```

## ⚠️ 절대 하지 말 것
- `SELECT * FROM ENUMS WHERE enum_name = 'XXX'` 후 결과 15개면 "이게 전부"라고 단정 금지
- 반드시 COUNT 먼저 확인 → 15 초과 시 분할 조회 또는 LIKE 검색
