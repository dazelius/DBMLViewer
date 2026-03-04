# 캐릭터 리소스 시트 — 무기 리소스 연결 규칙

## 1. 무기 리스트 섹션 추가
- 캐릭터 리소스 시트 작성 시 **무기 리스트** 섹션을 반드시 포함한다.
- 위치: 스킨 섹션 이후, 무기 스킨 섹션 이전 (또는 스킨과 무기 스킨을 합쳐서 구성)
- 탭 목차에 "무기" 항목 추가

## 2. 무기 데이터 조회 방법
- 캐릭터의 `character_gear_set_id` → [[CharacterGearSet]] 테이블에서 기어 ID 조회
- 기어 ID → [[Gear]] 테이블에서 `weapon_id` 확인
- `weapon_id` → [[Weapon]] 테이블에서 무기 상세 정보 조회
- 또는 직접: `SELECT * FROM Weapon WHERE use_character_id = '캐릭터ID'` 등으로 연결된 무기 탐색

## 3. 무기 아이콘 이미지 표시
- 각 무기의 아이콘을 `find_resource_image`로 검색하여 이미지 행으로 표시
- 검색 키워드: `icon_weapon_무기명` (예: `icon_weapon_s1897`, `icon_weapon_ump`)
- 이미지 형식:
```html
<div class="img-row">
  <div class="img-box">
    <img src="/api/images/smart?name=icon_weapon_무기명">
    <p>무기 표시명<br><code>weapon_id</code></p>
  </div>
  ...
</div>
```

## 4. 무기 상세 테이블
- 아이콘 아래에 무기 상세 정보 테이블 또는 `data-embed="query"` 태그로 DB 데이터 표시
- 주요 표시 정보: weapon_id, 무기명, weapon_type, ammo_type, 관련 gear_id

## 5. 무기 스킨 섹션
- 무기 리스트 아래에 무기 스킨도 함께 표시
- `data-embed="query"` 태그로 WeaponSkin 테이블 조회:
```html
<div data-embed="query" data-sql="SELECT id, `#name_memo` AS name, weapon_id, model_id FROM WeaponSkin WHERE weapon_id IN ('weapon_id1','weapon_id2',...)"></div>
```

## 6. 기어 세트 참조 (선택)
- CharacterGearSet의 전체 슬롯(fist, weapon_main_1/2, weapon_sub, helmet, chest)을 테이블로 정리할 수도 있음
- 기어 → 무기 연결 관계를 명시하면 더 좋음
