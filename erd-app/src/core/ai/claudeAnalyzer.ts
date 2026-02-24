import type { ParsedSchema } from '../schema/types.ts';

function buildSchemaPrompt(schema: ParsedSchema): string {
  const { tables, refs, enums, tableGroups } = schema;
  const totalCols = tables.reduce((s, t) => s + t.columns.length, 0);

  const lines: string[] = [
    `## 스키마 개요`,
    `- 테이블: ${tables.length}개, 컬럼: ${totalCols}개, 관계: ${refs.length}개, Enum: ${enums.length}개, 그룹: ${tableGroups.length}개`,
    '',
  ];

  for (const grp of tableGroups) {
    const grpTables = tables.filter((t) => t.groupName === grp.name);
    lines.push(`### 그룹: ${grp.name} (${grpTables.length}개 테이블)`);
    for (const t of grpTables) {
      const pks = t.columns.filter((c) => c.isPrimaryKey).map((c) => c.name);
      const fks = t.columns.filter((c) => c.isForeignKey).map((c) => c.name);
      lines.push(`- **${t.name}** (${t.columns.length}cols) PK:[${pks.join(',')}] FK:[${fks.join(',')}]${t.note ? ` — ${t.note}` : ''}`);
    }
    lines.push('');
  }

  const ungrouped = tables.filter((t) => !t.groupName);
  if (ungrouped.length > 0) {
    lines.push(`### 그룹 미지정 (${ungrouped.length}개 테이블)`);
    for (const t of ungrouped) {
      const pks = t.columns.filter((c) => c.isPrimaryKey).map((c) => c.name);
      const fks = t.columns.filter((c) => c.isForeignKey).map((c) => c.name);
      lines.push(`- **${t.name}** (${t.columns.length}cols) PK:[${pks.join(',')}] FK:[${fks.join(',')}]${t.note ? ` — ${t.note}` : ''}`);
    }
    lines.push('');
  }

  lines.push(`### 관계 요약 (상위 20개)`);
  for (const r of refs.slice(0, 20)) {
    const from = tables.find((t) => t.id === r.fromTable)?.name ?? r.fromTable;
    const to = tables.find((t) => t.id === r.toTable)?.name ?? r.toTable;
    lines.push(`- ${from}.${r.fromColumns.join(',')} → ${to}.${r.toColumns.join(',')} (${r.type})`);
  }
  if (refs.length > 20) lines.push(`- ... 외 ${refs.length - 20}개`);

  return lines.join('\n');
}

export interface AIInsight {
  category: string;
  title: string;
  description: string;
  severity: 'good' | 'advice' | 'warning';
}

export async function analyzeSchemaWithAI(schema: ParsedSchema): Promise<AIInsight[]> {
  const schemaText = buildSchemaPrompt(schema);

  const systemPrompt = `당신은 데이터베이스 아키텍트입니다. 주어진 스키마 구조를 분석하고, 실무에서 도움이 되는 인사이트를 제공하세요.

응답 규칙:
1. 반드시 JSON 배열만 출력하세요. 마크다운이나 설명 텍스트 없이 순수 JSON만.
2. 각 항목은 {"category": string, "title": string, "description": string, "severity": "good"|"advice"|"warning"} 형식.
3. category는: "구조", "성능", "설계패턴", "도메인", "확장성" 중 하나.
4. 5~8개 항목을 생성하세요.
5. 게임 서비스용 DB라는 맥락을 고려하세요.
6. 뻔하고 일반적인 조언은 피하고, 이 스키마에 특화된 구체적 인사이트를 제공하세요.
7. title은 20자 이내로 핵심만, description은 1~2문장으로 구체적인 근거와 제안을 담으세요.`;

  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `다음 DB 스키마를 분석해주세요:\n\n${schemaText}` },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? '';

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('AI 응답에서 JSON을 파싱할 수 없습니다.');

  const parsed: AIInsight[] = JSON.parse(jsonMatch[0]);
  return parsed;
}
