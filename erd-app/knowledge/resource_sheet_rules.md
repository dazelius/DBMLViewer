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
  - `data-model`: 캐릭터 메시 FBX 경로
  - `data-anim`: 애니메이션 FBX 경로
  - `data-label`: 표시 이름
- **바인딩 개수 제한**: 핵심 모션만 선별 (로비 1~2개 + 스킬 대표 3~4개, 총 6개 이내)
- 나머지 애니메이션은 테이블 목록으로 정리

## 3. 섹션 구성 순서
1. 이미지 리소스 (캐릭터/스킬/패시브/퍼크 아이콘)
2. 3D 모델 (캐릭터 메시 FBX + 무기/장비 테이블 + 프리팹)
3. 애니메이션 (임베드 미리보기 + 전체 목록 테이블)
4. FX 프리팹 (스킬별 그룹)
5. 사운드 (audio-player 임베드)
6. 스킨 (data-embed="query" 사용)
7. 무기 스킨 + 기어 세트
8. 퍼크 (data-embed="query" 사용)
9. 파일 트리 구조 (마지막, 필수)

## 4. patch_artifact 갱신 규칙

### 4-1. 갱신 전 DB 조회 필수
- 갱신 전에 반드시 관련 쿼리로 최신 데이터를 먼저 확인
- 조회 결과를 기존 문서와 비교하여 변경/추가/삭제 필요 부분 식별

### 4-2. find 문자열 정확성
- find 텍스트는 기존 HTML에서 **공백/줄바꿈/들여쓰기까지 100% 동일**하게 복사
- 고유하게 식별 가능한 충분히 긴 문자열 (20자 이상)
- style/script 태그는 수정하지 않음

### 4-3. 깨진 HTML 수정
- 기존 문서에 잘린 테이블이나 중복 닫힘 태그 등 깨진 HTML이 있으면 함께 수정
- 예: 무기 섹션 하단에 이전 테이블 잔해가 남은 경우 → 제거

### 4-4. 빈 섹션 → 쿼리 임베드 교체
- "결과 없음" embed-empty 상태의 섹션은 `data-embed="query"`로 교체하여 라이브 쿼리로 갱신

### 4-5. 누락 섹션 추가
- DB 조회 결과 기존 문서에 없는 리소스 카테고리(예: 퍼크 아이콘)가 발견되면 적절한 위치에 섹션 추가

### 4-6. 파일 트리 동기화
- 새 섹션이 추가되면 파일 트리에도 해당 경로를 반영

## 5. 스킨 섹션 규칙
- 캐릭터 스킨은 `data-embed="query"` 사용하여 항상 최신 DB 데이터 반영
- 무기 스킨도 동일하게 `data-embed="query"` 사용
- 쿼리에 `#group_memo`, `#name_memo` 등 메모 컬럼 포함하여 가독성 확보

## 6. 무기 리스트 규칙
- 장착 무기는 GearSet 기반으로 아이콘 + 상세 테이블 모두 표시
- 무기 아이콘 이미지: `/api/images/smart?name=icon_weapon_XXX` 형식
- 무기 타입 아이콘: `/api/images/smart?name=icon_weapontype_XXX` 형식
- 스킬 무기(전술방패 등)도 별도 표시

## 7. ⚠️ patch 시 자주 발생하는 깨짐 패턴 (필수 체크)

### 7-1. nav 탭 중복/손상
- **증상**: `<span onclick="...">` 태그가 중첩되거나, 이전 patch에서 잘린 잔해가 남음
- **예시**: `<span onclick="document.getElementById('<span onclick="...">`처럼 태그 안에 태그가 들어감
- **해결**: nav 전체 영역을 find → 깨끗한 탭 목록으로 replace
- **예방**: nav 탭 수정 시 반드시 `<nav class="toc-tabs">` ~ `</nav>` 범위 전체를 확인

### 7-2. data-embed 쿼리의 &quot; 인코딩 문제
- **증상**: `data-sql` 속성 내 `&quot;`가 렌더링/파싱 시 깨져서 쿼리 실패
- **해결**: SQL WHERE 절의 문자열 값은 **반드시 작은따옴표(`'`)** 사용
- **올바른 예**: `data-sql="SELECT ... WHERE use_target_id = '1001'"`
- **잘못된 예**: `data-sql="SELECT ... WHERE use_target_id = &quot;1001&quot;"`
- ⛔ `&quot;`(HTML 이스케이프 큰따옴표) 절대 사용 금지 → 작은따옴표로 통일

### 7-3. WeaponSkin 쿼리 컬럼명 주의
- **증상**: `target_character_id` 같은 존재하지 않는 컬럼으로 쿼리 → 결과 없음
- **해결**: 쿼리 작성 전 `show_table_schema`로 실제 컬럼명 확인 필수
- **패턴**: WeaponSkin은 `use_target_id`가 아닌 다른 FK 컬럼일 수 있으므로 반드시 스키마 확인
- **일반 규칙**: data-embed="query" 쿼리를 처음 작성하거나 수정할 때, 해당 테이블 스키마를 먼저 조회

### 7-4. 깨진 한글 문자(mojibake) 정리
- **증상**: `��`(replacement character, U+FFFD)가 텍스트 중간에 나타남
- **원인**: 이전 patch에서 멀티바이트 한글이 잘리면서 발생
- **해결**: 갱신 시 문서 전체에서 `��` 검색 → 원래 한글로 복원
- **자주 깨지는 위치**: h3 제목(애니메이션→애니메이션), 테이블 th(파일명→파일명), 설명 텍스트