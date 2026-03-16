# 신규 콘텐츠 추가 워크플로

## 트리거
"캐릭터 추가", "스킬 추가", "아이템 추가", "새 콘텐츠", "데이터 세팅", "신규 등록" 등

## 워크플로 단계

### 1단계: 관련 테이블 전수 파악
- show_table_schema로 대상 테이블의 FK 관계를 **양방향** 탐색
- 부모 테이블(이 테이블이 참조하는 것) + 자식 테이블(이 테이블을 참조하는 것) 모두 확인
- 사용자에게 "아래 테이블에 데이터가 필요합니다. 어디까지 세팅할까요?" 형태로 리스트 제시
- 누락하면 FK 참조 오류로 게임 크래시 → 빠뜨리지 않는 게 핵심

#### 캐릭터 추가 시 관련 테이블 체크리스트
| 순서 | 테이블 | 필수 | 설명 |
|------|--------|------|------|
| 1 | Character | O | 기본 정보 |
| 2 | CharacterStat | O | 레벨별 스탯 |
| 3 | CharacterSkin | O | 기본 스킨 |
| 4 | Skill | - | 스킬 보유 시 |
| 5 | SkillUI | - | 스킬 UI |
| 6 | Passive | - | 패시브 보유 시 |
| 7 | PassiveProperty | - | Passive의 속성 |
| 8 | PassiveEffect | - | Passive의 효과 |
| 9 | Perk | - | 퍽 보유 시 |
| 10 | PerkEffect | - | Perk의 효과 |

### 2단계: 기존 데이터 패턴 참조
- query_game_data로 **유사한 기존 데이터** 조회 (예: 같은 등급/클래스의 캐릭터)
- ID 패턴, 컬럼 값 범위, 필수 컬럼 확인
- clone_source 사용 여부 판단:
  - 기존 캐릭터 기반 → clone_source 사용 (Python이 자동 복사)
  - 완전 신규 → csv 사용
- ID 할당: 기존 ID 패턴 확인 → 마지막 순번 + 1 (bible_tabling_id_rules 참조)

### 3단계: 멀티테이블 편집 계획 수립
- FK 참조 순서: **자식(참조되는 쪽) → 부모(참조하는 쪽)** 순서로 등록
  - 예: PassiveEffect → PassiveProperty → Passive → Character
- 같은 xlsx 여러 시트 → 하나의 edit_plan 배열로 통합 (분리 호출 금지!)
- :::progress 트래커로 진행 상태 표시

### 4단계: 편집 실행 후 자동 검증
- edit_game_data / add_game_data_rows 완료 후:
  1. 등록된 validation rule이 있으면 검증 실행
  2. FK 참조 무결성 직접 확인: `SELECT id FROM [자식] WHERE fk_col NOT IN (SELECT id FROM [부모])`
  3. NotNull 컬럼 누락 확인
- 위반 발견 시 → 즉시 사용자에게 알리고 수정 제안

### 5단계: 변경 요약
- 어떤 테이블에 몇 행이 추가/수정되었는지 마크다운 표로 정리
- 주요 값 (ID, 이름, 스탯 등) 포함 — "N행 추가됨"만 나열 금지
- :::visualizer{type="process"} 로 전체 진행 상태 시각화

## 주의사항
- 사용자가 하나의 테이블만 언급해도, 관련 테이블을 proactive하게 제안할 것
- "나머지는 나중에" 요청 시 존중하되, 빠진 테이블 목록은 반드시 남겨둘 것
- #메모 컬럼에는 한글 설명 텍스트를 채울 것
