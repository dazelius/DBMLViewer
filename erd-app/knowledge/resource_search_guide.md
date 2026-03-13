# 리소스 검색 가이드

## 핵심 규칙
캐릭터/무기 등 리소스(모델, 아이콘 등)를 찾을 때는 아래 순서로 조회한다.

## 1. Model 테이블 조회
- `Model` 테이블에서 캐릭터 관련 모델 경로를 확인
- 주요 컬럼: `id`, `prefab_dir_low`, `prefab_name_low`, `prefab_dir_high`, `prefab_name_high`

## 2. icon_id 컬럼 조회
- 각 테이블(Character, Weapon, Skill 등)의 `icon_id` 컬럼 값을 확인
- `icon_id` → 이미지 URL: `http://100.70.0.223:5173/api/images/file?path=Texture%2F{카테고리}%2F{icon_id}.png`

## 3. 연결된 테이블의 아이콘도 함께 확인
캐릭터 아이콘만 있는 게 아니라, 연결된 테이블들도 아이콘을 가질 수 있다.
조회 대상 테이블과 컬럼:

| 테이블 | 아이콘 컬럼 | 조회 조건 예시 |
|--------|------------|---------------|
| Character | icon_id | WHERE id = '2001' |
| CharacterSkin | icon_id | WHERE id LIKE '2001%' |
| Skill | icon_id | WHERE id LIKE '2001%' |
| SkillUI | **icon** (icon_id 아님!) | WHERE id LIKE '2001%' |
| Passive | icon_id (→ SkillUI 참조) | WHERE id LIKE '2001%' |
| Perk | icon_id (→ SkillUI 참조) | WHERE id LIKE '2001%' |
| Weapon | icon_id | 별도 조회 |

### ⚠️ SkillUI 주의사항
- SkillUI 테이블의 아이콘 컬럼명은 `icon` (icon_id가 아님!)
- Skill, Passive, Perk은 skill_ui_id → SkillUI.id FK로 연결됨
- SkillUI에서 icon을 JOIN으로 가져와야 정확함

```sql
-- 카야 스킬 아이콘 조회 (올바른 방법)
SELECT s.id, su.icon FROM Skill s
JOIN SkillUI su ON s.skill_id_display_data = su.id
WHERE s.id LIKE '2001%'

-- SkillUI 직접 조회
SELECT id, display_name, icon FROM SkillUI WHERE id LIKE '2001%'
```

## 4. 이미지 URL 패턴
```
http://100.70.0.223:5173/api/images/file?path=Texture%2F{카테고리}%2F{파일명}.png
```
- 캐릭터 아이콘: `Texture%2FCharacter%2F{icon_id}.png`
- 스킬 아이콘: `Texture%2FSkill%2F{icon}.png`

## 예시
```sql
-- 캐릭터 모델/아이콘 ID 조회
SELECT id, name, model_id, icon_id FROM Character WHERE id = '2001'

-- Model 테이블에서 prefab 경로 조회
SELECT * FROM Model WHERE id = '{model_id}'

-- SkillUI 아이콘 조회
SELECT id, display_name, icon FROM SkillUI WHERE id LIKE '2001%'
```
