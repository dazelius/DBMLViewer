# 게임 버그 헌팅 워크플로

## 트리거
"버그 찾아줘", "버그 찾아", "QA 해줘", "게임 버그", "크래시 원인", "코드랑 데이터 비교", "런타임 버그" 등

## 개요
게임 데이터(Excel)와 C# 소스코드를 **크로스 체크**하여 실제 런타임에서 발생할 수 있는 버그를 탐지한다.
단순 데이터 포맷 검증이 아닌, **코드 로직 + 데이터 값 조합에서 발생하는 게임 버그**를 찾는 것이 목표.

## 버그 유형 (찾아야 할 것)

| 유형 | 예시 | 심각도 |
|------|------|--------|
| Division by Zero | 코드에서 `fire_rate`로 나누는데 데이터에 0인 행 | CRASH |
| Null/Missing Reference | 코드가 FK로 다른 테이블 참조하는데 해당 ID가 없음 | CRASH |
| Enum Out of Range | 코드에서 switch 3까지만 처리, 데이터에 4 존재 | CRASH/LOGIC |
| Dead Code Path | 데이터 값이 코드의 특정 분기에 절대 도달 못함 | LOGIC |
| Unreachable Condition | Bot AI condition 임계값이 100% 초과로 절대 트리거 안 됨 | LOGIC |
| Stat Mismatch | 패시브가 fire_rate 증가인데 무기가 근접 → 효과 없음 | LOGIC |
| Infinite Loop Risk | 스킬 쿨타임 0 + 연사 제한 없음 → 무한 시전 | BALANCE/CRASH |
| Overflow Risk | 수치 계산 결과가 int/float 범위 초과 가능 | CRASH |
| Unused Data | 어디서도 참조되지 않는 데이터 행 (고아 레코드) | WASTE |

## 워크플로 단계

### 1단계: 게임 시스템 선택
사용자가 특정 시스템을 요청하지 않으면, 아래 우선순위로 분석:
1. **전투 시스템** — Character, CharacterStat, Skill, SkillExecute, SkillExecuteEffect, Weapon, WeaponStat, Projectile
2. **패시브/버프** — Passive, PassiveProperty, StatusEffect, Perk, Mark
3. **Bot AI** — BotData, BotActionStat, BotCondition, BotActionDecision, BotSkillDecision, BotTargetSelector
4. **보상/아이템** — Reward, ConsumableItem, ModuleItem, Gear, Card
5. **기타** — BattlePass, BattleModeInfo, NetworkObject

### 2단계: 데이터 수집
선택한 시스템의 테이블 데이터를 조회:
```
query_game_data("SELECT * FROM [테이블] LIMIT 100")
show_table_schema([테이블명])
```
- 컬럼 타입, 값 분포, 특이값(0, -1, 빈값, 극단값) 파악
- FK 관계 맵핑

### 3단계: 관련 C# 코드 분석
해당 시스템의 코드를 찾아서 읽기:
```
search_code({ query: "테이블명 또는 컬럼명", type: "content" })
read_code_file({ path: "찾은 파일 경로" })
```

**핵심 분석 포인트:**
- 데이터를 로드/파싱하는 코드: 어떤 컬럼을 읽는지, 타입 캐스팅은 어떻게 하는지
- 수학 연산: 나누기, 곱하기, 제곱 등에서 0이나 음수 입력 가능성
- switch/case, if/else 분기: 모든 enum 값을 커버하는지
- null 체크: 참조 데이터가 없을 때 대비하는지
- 루프/재귀: 데이터 조건에 따라 무한루프 가능성

### 4단계: 크로스 체크 — 데이터 × 코드
데이터 값과 코드 로직을 대조하여 버그 후보 식별:

**체크리스트:**
- [ ] 코드에서 나누기 하는 컬럼의 데이터에 0이 있는가?
- [ ] switch/enum 처리에서 데이터의 모든 값을 커버하는가?
- [ ] FK 참조하는 코드에서 null 체크를 하는가? 데이터에 깨진 참조가 있는가?
- [ ] 수치 계산 결과가 오버플로우 될 수 있는 극단값 조합이 있는가?
- [ ] 조건문의 임계값이 데이터상 도달 불가능한 값인가?
- [ ] 타이머/쿨타임이 0이어서 무한 반복 가능한가?
- [ ] 비활성화된 데이터를 참조하는 활성 데이터가 있는가?

### 5단계: 버그 리포트 작성

각 발견 항목을 아래 형식으로 정리:

```
🐛 BUG-001: [한 줄 요약]
━━━━━━━━━━━━━━━━━━━━
심각도: CRASH / LOGIC / BALANCE
시스템: [관련 시스템명]
데이터: [테이블.컬럼 = 문제 값]
코드:   [파일명:라인 근처 — 문제 로직 설명]
시나리오: [이 버그가 실제로 발생하는 상황]
수정 제안: [데이터 수정 or 코드 수정 방향]
```

:::visualizer{type="table" title="🐛 버그 헌팅 결과"} 로 전체 요약 테이블 제공

## 분석 전략 팁

### 고위험 패턴 (우선 탐지)
1. **`/ variable`** — 나누기 대상이 데이터에서 오는 모든 곳
2. **`Dictionary[key]`** / **`Array[index]`** — 인덱스가 데이터에서 오는 곳
3. **`(Type)value`** 캐스팅 — 데이터 타입과 코드 기대 타입 불일치
4. **`while`/`for` 루프 조건에 데이터 값 사용** — 종료 조건 미충족 가능성

### 코드 검색 키워드
- 테이블 이름 그대로 (e.g., `CharacterStat`, `SkillExecute`)
- 컬럼명 (e.g., `fire_rate`, `cooldown`, `damage_type`)
- `Reference`, `DataManager`, `TableManager`, `GetData`, `LoadData`
- `Parse`, `Convert`, `TryParse`

## 범위 조절
- "스킬 쪽 버그 찾아줘" → Skill 관련 테이블 + 코드만 분석
- "전체 버그 헌팅" → 시스템별로 순차 분석 (시간 소요 안내)
- "빠르게" → 데이터 이상치 + FK만 체크 (코드 분석 생략)

## 주의사항
- 0이나 -1은 "미사용" 센티넬일 수 있음 → 코드에서 센티넬 처리 여부 확인
- 서버/클라이언트 코드 구분: NetworkClient vs ScriptDev
- 분석 결과는 "가능성"이므로, 확정이 아닌 "검토 필요" 톤으로 리포트
- 한 번에 너무 많은 테이블을 분석하면 컨텍스트 초과 → 시스템별로 나눠서 분석
