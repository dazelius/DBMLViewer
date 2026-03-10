# 리소스 시트 작성 규칙

## 1. 파일 트리 구조 (필수)
- 리소스 시트(캐릭터/무기 등) 작성 시 반드시 **파일 트리 구조** 섹션을 마지막에 포함할 것
- `<div class="file-tree">` + `<span class="hl">` 형식으로 주요 폴더 하이라이트
- 와일드카드(`*`) 표기로 유사 파일 그룹화
  - 예: `vanguard_skill_tacticalshield_*.fbx (8 walk + start/loop/end/killed)`
- 카테고리 순서: Character mesh → Animation → AnimController → FX → Weapon → Sound → Skin → DevAssets

## 2. 애니메이션 바인딩 규칙
- 애니메이션 미리보기(`data-embed="fbx-anim"`)에는 반드시 캐릭터 메시 모델을 바인딩해야 함
- 필수 속성:
  - `data-model`: 캐릭터 메시 FBX 경로 (예: `GameContents/Character/Player/Player_g_1/vanguard_low/mesh/vanguard_low.fbx`)
  - `data-anim`: 애니메이션 FBX 경로
  - `data-label`: 표시 이름
- **바인딩 개수 제한**: 전체를 다 임베드하지 않고, 핵심 모션만 선별 (로비 대기 1~2개 + 스킬 대표 3~4개, 총 6개 이내)
- 나머지 애니메이션은 테이블 목록으로 정리

## 3. 섹션 구성 순서
1. 이미지 리소스 (캐릭터/스킬/패시브/퍼크 아이콘)
2. 3D 모델 (캐릭터 메시 FBX + 무기/장비 테이블 + 프리팹)
3. 애니메이션 (임베드 미리보기 + 전체 목록 테이블)
4. FX 프리팹 (스킬별 그룹)
5. 사운드 (audio-player 임베드)
6. 스킨 (data-embed="query" 사용)
7. 무기 스킨 + 기어 세트
8. 파일 트리 구조 (마지막, 필수)

## 4. patch_artifact 갱신 규칙
리소스 시트를 갱신(patch)할 때 반드시 지켜야 할 패턴:

### 4-1. 갱신 전 DB 조회 필수
- 갱신 전에 반드시 `build_character_profile` + 관련 쿼리(`CharacterSkin`, `WeaponSkin`, `Perk`, `Passive` 등)로 최신 데이터를 먼저 확인
- 조회 결과를 기존 문서와 비교하여 변경/추가/삭제 필요 부분 식별

### 4-2. find 문자열 정확성
- find 텍스트는 기존 HTML에서 **공백/줄바꿈/들여쓰기까지 100% 동일**하게 복사
- 고유하게 식별 가능한 충분히 긴 문자열 (20자 이상)
- style/script 태그는 수정하지 않음

### 4-3. 깨진 HTML 수정
- 기존 문서에 잘린 테이블이나 중복 닫힘 태그 등 깨진 HTML이 있으면 함께 수정
- 예: 무기 섹션 하단에 이전 테이블 잔해(`</td><td>UMP-벨리알...`)가 남은 경우 → 제거

### 4-4. 빈 섹션 → 쿼리 임베드 교체
- "결과 없음" embed-empty 상태의 섹션은 `data-embed="query"`로 교체하여 라이브 쿼리로 갱신
- 예: 캐릭터 스킨 섹션이 비어있으면 → `<div data-embed="query" data-sql="SELECT ...">` 형식으로 교체

### 4-5. 누락 섹션 추가
- DB 조회 결과 기존 문서에 없는 리소스 카테고리(예: 퍼크 아이콘)가 발견되면 적절한 위치에 섹션 추가
- 이미지 리소스 섹션 내에 하위 h3로 추가하는 것이 자연스러움

### 4-6. 파일 트리 동기화
- 새 섹션이 추가되면 파일 트리에도 해당 경로를 반영
- 기존 파일 트리의 카테고리 순서 유지

## 5. 스킨 섹션 규칙
- 캐릭터 스킨은 `data-embed="query"` 사용하여 항상 최신 DB 데이터 반영
- 무기 스킨도 동일하게 `data-embed="query"` 사용
- 쿼리에 `#group_memo`, `#name_memo` 등 메모 컬럼 포함하여 가독성 확보

## 6. 무기 리스트 규칙
- 장착 무기는 GearSet 기반으로 아이콘 + 상세 테이블 모두 표시
- 무기 아이콘 이미지: `/api/images/smart?name=icon_weapon_XXX` 형식
- 무기 타입 아이콘: `/api/images/smart?name=icon_weapontype_XXX` 형식
- 스킬 무기(전술방패 등)도 별도 표시