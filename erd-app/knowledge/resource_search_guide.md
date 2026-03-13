# 리소스 검색 가이드

## 핵심 규칙
캐릭터/무기 등 리소스(모델, 아이콘 등)를 찾을 때는 아래 순서로 조회한다.

## 1. Model 테이블 조회
- `Model` 테이블에서 캐릭터 관련 모델 경로를 확인
- 주요 컬럼: `id`, `prefab_dir_low`, `prefab_name_low`, `prefab_dir_high`, `prefab_name_high`

## 2. icon_id 컬럼 조회
- 각 테이블(Character, Weapon, Skill 등)의 `icon_id` 컬럼 값을 확인
- `icon_id` → `find_resource_image(query)` 또는 `search_assets`로 이미지 검색

## 3. 조회 순서
1. `query_game_data`로 해당 캐릭터/항목의 `model_id`, `icon_id` 등 컬럼 조회
2. `Model` 테이블에서 prefab 경로 확인 → `search_assets` 또는 `preview_fbx_animation`
3. `icon_id` 값으로 `find_resource_image` 호출

## 예시
```sql
-- 캐릭터 모델/아이콘 ID 조회
SELECT id, name, model_id, icon_id FROM Character WHERE id = '2001'

-- Model 테이블에서 prefab 경로 조회
SELECT * FROM Model WHERE id = '{model_id}'
```
