# 리소스 시트 작성 규칙

## 1. 파일 트리 구조 (필수)
- 리소스 시트(캐릭터/무기 등) 작성 시 반드시 **파일 트리 구조** 섹션을 마지막에 포함할 것
- `<div class="file-tree">` + `<span class="hl">` 형식으로 주요 폴더 하이라이트
- 와일드카드(`*`) 표기로 유사 파일 그룹화
  - 예: `vanguard_skill_tacticalshield_*.fbx (8 walk + start/loop/end/killed)`
- 카테고리 순서: Character mesh → Animation → AnimController → FX → Weapon → Sound → DevAssets

## 2. 애니메이션 바인딩 규칙
- 애니메이션 미리보기(`data-embed="fbx-anim"`)에는 반드시 캐릭터 메시 모델을 바인딩해야 함
- 필수 속성:
  - `data-model`: 캐릭터 메시 FBX 경로 (예: `GameContents/Character/Player/Player_g_1/vanguard_low/mesh/vanguard_low.fbx`)
  - `data-anim`: 애니메이션 FBX 경로
  - `data-label`: 표시 이름
- **바인딩 개수 제한**: 전체를 다 임베드하지 않고, 핵심 모션만 선별 (로비 대기 1~2개 + 스킬 대표 3~4개, 총 6개 이내)
- 나머지 애니메이션은 테이블 목록으로 정리

## 3. 섹션 구성 순서
1. 이미지 리소스 (캐릭터/스킬/패시브 아이콘)
2. 3D 모델 (캐릭터 메시 FBX + 무기/장비 테이블 + 프리팹)
3. 애니메이션 (임베드 미리보기 + 전체 목록 테이블)
4. FX 프리팹 (스킬별 그룹)
5. 사운드 (audio-player 임베드)
6. 스킨 (data-embed="query" 사용)
7. 무기 스킨 + 기어 세트
8. 파일 트리 구조 (마지막, 필수)