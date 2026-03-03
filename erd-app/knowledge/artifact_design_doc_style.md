# 아티팩트 기획서 디자인 스타일 가이드

## 1. 전체 구조

```html
<!-- 1. 헤더 섹션 -->
<div class="header">
  <h1>시스템 이름</h1>
  <p>한 줄 설명</p>
  <div style="margin-top:8px">
    <span class="tag">태그1</span>
    <span class="tag">태그2</span>
  </div>
</div>

<!-- 2. 탭 메뉴 목차 (헤더 바로 아래, sticky) -->
<nav class="toc-tabs">
  <span onclick="document.getElementById('섹션id').scrollIntoView({behavior:'smooth'})">섹션명</span>
  ...
</nav>

<!-- 3. 본문 컨테이너 -->
<div class="main-content">
  <div class="section" id="섹션id">
    <h2>1. 섹션 제목</h2>
    ...
  </div>
</div>
```

## 2. 필수 CSS 스타일

```css
/* 다크 테마 기본 */
body { background: #0f1117; color: #e2e8f0; font-family: 'Pretendard', sans-serif; }

/* 헤더 */
.header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; border-radius: 12px; margin-bottom: 0; }
.header h1 { margin: 0 0 8px 0; color: #fff; }
.header p { margin: 0; color: #94a3b8; }
.tag { background: #6366f1; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-right: 6px; }

/* 탭 메뉴 목차 */
.toc-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  background: #1a1a2e;
  border-bottom: 2px solid #6366f1;
  position: sticky;
  top: 0;
  z-index: 100;
}
.toc-tabs span {
  padding: 6px 14px;
  background: #252540;
  border-radius: 16px;
  cursor: pointer;
  font-size: 13px;
  color: #a5b4fc;
  transition: all 0.2s;
}
.toc-tabs span:hover {
  background: #6366f1;
  color: #fff;
}

/* 본문 */
.main-content { padding: 0 16px; }
.section { margin: 24px 0; padding: 20px; background: #1e1e2e; border-radius: 8px; }
.section h2 { color: #a5b4fc; border-bottom: 1px solid #333; padding-bottom: 8px; margin-top: 0; }
.section h3 { color: #818cf8; margin-top: 20px; }

/* 테이블 */
table { width: 100%; border-collapse: collapse; margin: 12px 0; }
th { background: #252540; color: #a5b4fc; padding: 10px; text-align: left; }
td { padding: 10px; border-bottom: 1px solid #333; }
tr:hover { background: #252540; }

/* 파일 트리 */
.file-tree { background: #0d1117; padding: 16px; border-radius: 8px; font-family: monospace; white-space: pre; overflow-x: auto; line-height: 1.6; }
.file-tree .highlight { color: #7dd3fc; }

/* 코드 */
code { background: #252540; padding: 2px 6px; border-radius: 4px; color: #fbbf24; }

/* 이미지 그리드 */
.img-row { display: flex; gap: 16px; flex-wrap: wrap; }
.img-box { text-align: center; }
.img-box img { max-width: 200px; border-radius: 8px; }
.img-box p { margin: 8px 0 0; color: #94a3b8; font-size: 13px; }

/* Mermaid */
.mermaid { background: #1a1a2e; padding: 16px; border-radius: 8px; text-align: center; }
```

## 3. 목차 탭 메뉴 규칙

1. **위치**: 헤더 바로 아래, `<div class="main-content">` 바로 위
2. **sticky 고정**: `position: sticky; top: 0`으로 스크롤 시 상단 고정
3. **간결한 라벨**: "1. 개요" → "개요", "5. 클래스 상세" → "클래스"
4. **스크롤 이동**: `onclick="document.getElementById('id').scrollIntoView({behavior:'smooth'})"`

## 4. 섹션 구성 권장

| 순서 | 섹션 | 내용 |
|------|------|------|
| 1 | 개요 | 시스템 목적, 한 줄 요약 |
| 2 | 핵심 특징 | 주요 기능 테이블 |
| 3 | 파일 구조 | file-tree로 디렉토리 표시 |
| 4 | 파이프라인 | Mermaid LR 다이어그램 |
| 5 | 클래스 상세 | 클래스별 메서드 테이블 |
| 6 | 파라미터 | Inspector 파라미터 테이블 |
| 7 | 머티리얼/리소스 | 이미지, 셰이더, 텍스처 |
| 8 | 연동 시스템 | 의존성, 연동 지점 |
| 9 | 사용 시나리오 | 단계별 ol 리스트 |

## 5. Mermaid 다이어그램 규칙

- 가로 방향 `graph LR` 권장 (세로 TD는 공간 차지 큼)
- 노드 텍스트 간결하게: `A["GuidePoints"]-->B["NavMesh"]`
- 반드시 `\n` + 4칸 들여쓰기로 줄바꿈
- 한글 라벨은 `["한글"]` 형식 필수

## 6. 주의사항

- `</div>` 닫기 태그 누락 주의 (main-content 등)
- 탭 목차가 헤더와 본문 사이에 정확히 위치해야 함
- section들은 main-content 안에 있어야 레이아웃 정상 작동
