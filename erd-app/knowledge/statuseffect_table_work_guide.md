# StatusEffect 테이블 작업 가이드

## Duration(지속시간) 규칙
- **StatusEffect 테이블의 duration 컬럼은 직접 사용하지 않음** (부활 직후 무적 같은 극소수 예외만 해당)
- 지속시간은 **PassiveEffect** 또는 **SkillExecuteEffect** 테이블에서 지정
  - PassiveEffect: `GetStatusEffect` 타입 사용 시 해당 PassiveEffect의 duration 값으로 SE 지속시간 설정
  - SkillExecuteEffect: 스킬에서 SE 부여 시 SkillExecuteEffect의 duration 값으로 설정
- StatusEffect.duration 컬럼은 비워두는 것이 기본

## 등록 순서 (FK 순서)
1. **StatusEffectFunction** — 실제 효과 (GetTempShield, ModRateFireRate 등)
2. **StatusEffectGroup** — 스택 정책 (stack_max, stack_down_condition 등)
3. **StatusEffect** — 메인 테이블 (category, group_id, function_id 연결)

## 3개 테이블 역할
| 테이블 | 역할 | 핵심 컬럼 |
|--------|------|-----------|
| StatusEffectFunction | 효과 수치 정의 | function_type, function_value1, function_value2 |
| StatusEffectGroup | 스택/해제 정책 | stack_max, stack_down_condition |
| StatusEffect | 메인 (카테고리, 그룹, 기능 연결) | status_effect_category, status_effect_group_id, function_id1/2, stack_type |

## 기존 패턴 참고: 임시 보호막 (GetTempShield)
- StatusEffectFunction: function_type=GetTempShield, function_value1=0, function_value2=보호막량
- StatusEffectGroup: stack_max=1, stack_down_condition=비움
- StatusEffect: category=Buff, stack_type=Overwrite, stack_up_count=1, is_death_clear=1, duration=비움
