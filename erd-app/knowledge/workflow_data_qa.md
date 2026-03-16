# 데이터 QA 워크플로

## 트리거
"데이터 검증", "QA", "이상한 거 없어", "버그 찾아", "무결성 확인", "데이터 확인", "검증 해줘", "이상치", "깨진 참조" 등

## 워크플로 단계

### 1단계: 등록된 검증 룰 실행
- list_validation_rules로 현재 등록된 룰 확인
- 룰이 있으면 전체 검증 실행 → 위반 목록 수집
- 룰이 없으면 2단계부터 직접 수행

### 2단계: FK 무결성 체크
- 스키마의 FK 관계를 기반으로 **고아 레코드(orphan)** 탐색
- SQL 패턴:
  ```sql
  SELECT A.id, A.[fk_column] FROM [자식테이블] A
  WHERE A.[fk_column] NOT IN (SELECT id FROM [부모테이블])
  AND A.[fk_column] != 0 AND A.[fk_column] != -1
  ```
- 주요 FK 관계를 우선 체크 (Character→CharacterStat, Skill→SkillUI, Passive→PassiveProperty 등)
- 발견된 고아 레코드 목록을 마크다운 표로 정리

### 3단계: 이상치 탐지
- 주요 수치 컬럼의 통계 조회:
  ```sql
  SELECT MIN(hp) AS min_hp, MAX(hp) AS max_hp, AVG(hp) AS avg_hp FROM CharacterStat
  ```
- **평균의 3배 이상** 또는 **0 이하**(양수여야 할 컬럼)인 값을 이상치로 식별
- 특히 체크할 패턴:
  - HP/ATK/DEF가 0인 행 (NotNull 위반 가능)
  - 쿨타임이 음수인 행
  - 확률 값이 100 초과 또는 0 미만
  - ID가 비어있는 행

### 4단계: 중복 체크
- PK 컬럼의 중복 확인:
  ```sql
  SELECT id, COUNT(*) AS cnt FROM [테이블] GROUP BY id HAVING cnt > 1
  ```
- 멀티키 테이블(PassiveProperty 등)은 복합키 기준으로 체크

### 5단계: 결과 리포트
- 심각도별 분류:
  | 심각도 | 유형 | 영향 |
  |--------|------|------|
  | CRITICAL | FK 깨짐 (고아 레코드) | 게임 크래시 가능 |
  | CRITICAL | PK 중복 | 데이터 로드 실패 |
  | ERROR | NotNull 위반 (0/빈값) | 기능 오작동 |
  | WARNING | 이상치 (극단값) | 밸런스 문제 가능 |

- :::visualizer{type="table" title="데이터 QA 결과"} 로 위반 목록 시각화
- 각 위반에 대해 **수정 제안** 포함:
  - FK 깨짐 → "이 행을 삭제하거나, 참조 대상을 추가할 수 있습니다"
  - 이상치 → "이 값이 의도된 것인지 확인해주세요"
- 수정 가능한 건에 대해 "자동 수정할까요?" 제안 (edit_game_data로 연계)

## 범위 조절
- 사용자가 특정 테이블만 요청: 해당 테이블 + 직접 FK 관계만 체크
- "전체 검증": 모든 테이블 순회 (시간 소요 안내)
- "빠른 검증": 1단계(등록 룰) + 2단계(FK) 만 수행

## 주의사항
- val 값이 0이나 -1인 것은 "미사용"을 의미하는 경우가 많음 → FK 체크에서 제외
- 멀티키 테이블은 단일 id로 중복 판단하면 오탐 → 복합키 기준 사용
- 결과가 많으면 CRITICAL/ERROR 먼저 보여주고, WARNING은 접어서 표시
