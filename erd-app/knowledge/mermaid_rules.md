# Mermaid 다이어그램 작성 규칙

## 핵심 원칙
Mermaid 다이어그램에서 복잡한 테이블 스키마나 상세 정보를 표시하려 하면 **100% 렌더링 실패**한다.
대신 `data-embed="graph"` 태그를 사용하여 자동 생성하도록 해야 한다.

## 절대 금지 사항

### 1. 노드 라벨에 복잡한 내용 금지
```
❌ 실패 예시:
SE["📋StatusEffect
🗄️StatusEffectEffect · 17컬럼 · 관계 4개
컬럼타입속성설명idint32PK데이터 키값..."]
```
- 줄바꿈, 테이블 형식, 이모지 조합, 긴 텍스트 → 파싱 에러 발생

### 2. 특수문자 금지
- `+`, `%`, `&`, `<`, `>`, `"`, `'`, `#`, `{`, `}` 등 노드 ID/라벨에 사용 금지

### 3. 한글 노드 ID 금지
```
❌ 플레이어-->스킬시스템
✅ Player["플레이어"]-->SkillSys["스킬 시스템"]
```

## 올바른 사용법

### 방법 1: data-embed="graph" 태그 사용 (권장)
```html
<div data-embed="graph" data-tables="StatusEffect,StatusEffectGroup,StatusEffectFunction"></div>
```
- 지정된 테이블 간 FK 관계를 자동으로 Mermaid 다이어그램 생성
- 복잡한 스키마 관계도에 최적

### 방법 2: 단순한 Mermaid 직접 작성
```html
<div class="mermaid">graph LR\n    A["테이블A"]-->B["테이블B"]\n    B-->C["테이블C"]</div>
```
- 노드 라벨은 짧고 간결하게 (테이블명만)
- 반드시 `\n` + 4칸 들여쓰기로 줄바꿈
- 노드 ID는 영문/숫자/언더스코어만

## 선택 기준
| 상황 | 사용할 방법 |
|------|------------|
| DB 테이블 관계도 | `data-embed="graph"` |
| 단순 플로우차트 | Mermaid 직접 (짧은 라벨) |
| 복잡한 정보 표시 | 별도 테이블 HTML로 분리 |

## 에러 메시지 패턴
```
Parse error on line X: Expecting 'SQE', 'PE', ... got 'STR'
```
이 에러가 나오면 노드 라벨이 너무 복잡한 것이므로, `data-embed="graph"` 태그로 교체할 것.
