# SQL 예약어 테이블명 규칙

## 핵심 규칙
alasql에서 예약어와 겹치는 테이블명은 반드시 **대괄호 `[]`**로 감싸야 쿼리가 성공한다.

## 확인된 예약어 테이블 목록
| 테이블명 | 올바른 사용법 |
|----------|--------------|
| Character | `[Character]` |
| CharacterStat | `[CharacterStat]` |
| Option | `[Option]` |
| TABLES (가상테이블) | `[TABLES]` |

⚠️ `CharacterStat`은 백틱, 큰따옴표, 소문자 등 어떤 방법으로도 실패하며, **대괄호만 유일하게 동작**한다.

## 예시
```sql
-- ❌ 실패
SELECT id FROM Character
SELECT id FROM CharacterStat
SELECT id FROM `CharacterStat`
SELECT id FROM "CharacterStat"
SELECT id FROM characterstat

-- ✅ 성공
SELECT id FROM [Character]
SELECT id FROM [CharacterStat]
SELECT * FROM [TABLES]
```

## 안전한 습관
- 예약어 여부가 불확실한 테이블은 `[테이블명]`으로 감싸서 쿼리하면 안전하다.
- 대부분의 테이블(Weapon, Skill, Gear 등)은 대괄호 없이도 정상 동작한다.
- **새로 실패한 테이블이 발견되면 즉시 이 목록에 추가할 것!**
