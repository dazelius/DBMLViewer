# 주요 테이블 정보 아티팩트 템플릿

사용자가 특정 테이블의 정보를 보여달라고 요청할 때 아래 구성으로 아티팩트를 생성한다.

## 구성 (4개 섹션)

1. **헤더** — 테이블명 + 간단한 설명 (gradient 배경 카드)
2. **관계도 그래프** — `data-embed="graph"` (해당 테이블 + FK로 연결된 테이블들)
3. **스키마** — `data-embed="schema"` (컬럼 정보)
4. **Relations** — `data-embed="relations"` (FK 관계 목록)
5. **데이터 (전체)** — `data-embed="query"` (SELECT * FROM 테이블명)

## HTML 템플릿

```html
<html>
<body style="background:#0f1117;color:#e2e8f0;font-family:'Pretendard',sans-serif;padding:24px;">
<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:24px;border-radius:12px;margin-bottom:24px;">
  <h1 style="margin:0 0 8px;color:#fff;">{테이블명} 테이블 관계도</h1>
  <p style="margin:0;color:#94a3b8;">{테이블명} 중심 FK 연결 테이블 그래프</p>
</div>

<div data-embed="graph" data-tables="{테이블명},{FK연결테이블1},{FK연결테이블2},..."></div>

<h2 style="color:#a5b4fc;margin-top:32px;">{테이블명} 스키마</h2>
<div data-embed="schema" data-table="{테이블명}"></div>

<h2 style="color:#a5b4fc;margin-top:32px;">{테이블명} 관계(Relations)</h2>
<div data-embed="relations" data-table="{테이블명}"></div>

<h2 style="color:#a5b4fc;margin-top:32px;">{테이블명} 데이터 (전체)</h2>
<div data-embed="query" data-sql="SELECT * FROM {테이블명}"></div>

</body>
</html>
```

## 사용 시 주의사항
- `data-tables`에는 해당 테이블 + FK로 직접 연결된 테이블들을 쉼표로 나열
- FK 연결 테이블은 시스템 프롬프트의 FK 관계 목록이나 show_table_schema 결과로 확인
- 데이터가 매우 많은 테이블은 SELECT에 LIMIT 추가 고려
- 아티팩트 제목: "{테이블명} 테이블 관계도"
