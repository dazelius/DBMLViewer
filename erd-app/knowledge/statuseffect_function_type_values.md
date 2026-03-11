# StatusEffectFunction — function_type별 value 의미 가이드

## 컬럼 구조
- `function_type`: EStatusEffectFunctionType Enum
- `function_value1` (v1): 타입별 첫 번째 값
- `function_value2` (v2): 타입별 두 번째 값
- `enum_value1`: 값 적용 방식 (PercentAdd=만분율 가산, None=미사용 등)
- `enum_value2`: 보조 조건 (TimeMax=시간 최대치 제한, None=없음 등)

## 📊 Mod 계열 (스탯 변경 — 가장 많이 사용)
| function_type | v1 | v2 | 설명 |
|---|---|---|---|
| **ModRateMoveSpeed** | 0 | 변화량(만분율) | 이동속도 비율. 예: v2=2000 → +20% |
| **ModRateFireRate** | 0 | 변화량(만분율) | 사격속도 비율. 예: v2=-3000 → -30% |
| **ModRateOffence** | 0 | 변화량(만분율) | 공격력 비율 |
| **ModRateDamage** | 0 | 변화량(만분율) | 피해량 비율 |
| **ModDamageReductionRate** | 0 | 변화량(만분율) | 받는 피해 감소율. 예: v2=3000 → 30% 감소 |
| **ModRateJumpImpulse** | 0 | 변화량(만분율) | 점프력 비율 |
| **ModRateMoa** | 0 | 변화량(만분율) | 탄퍼짐(MOA) 비율 |
| **ModRateMaxInnateShield** | 0 | 변화량(만분율) | 최대 보호막 비율 |
| **ModRateFireDamageBarrierPassed** | 0 | 변화량(만분율) | 배리어 관통 화염 피해 비율 |
| **ModRateFireDamageFromHighGround** | 0 | 변화량(만분율) | 고지대 화염 피해 비율 |
| **ModRunningCool** | 0 | 변화량(만분율) | 달리기 쿨다운 비율 |

> **Mod 계열 공통**: v1=0(미사용), v2=만분율 변화량. enum_value1=PercentAdd

## 🛡️ 보호막/HP 계열
| function_type | v1 | v2 | 설명 |
|---|---|---|---|
| **GetTempShield** | 0 | 보호막량(절대값) | 임시 보호막 부여. 예: v2=100 → 보호막 100 |
| **DotEffectHPFixed** | 고정피해량 | 틱간격(ms) | 도트 피해. 예: v1=5, v2=1000 → 매 1초 5 피해 |
| **HotEffect** | 회복량 | 틱간격(ms) | 도트 힐. 예: v1=10, v2=500 → 매 0.5초 10 회복 |
| **DeferDamageDotEffect** | 비율(만분율) | 0 | 받은 피해를 도트로 분산 |
| **DamageAbsorb** | - | - | 피해 흡수 (DB 미사용, Enum만 존재) |
| **DamageStealHP** | - | - | 피해 흡혈 (DB 미사용, Enum만 존재) |
| **DeathEndure** | - | - | 사망 방지 (DB 미사용, Enum만 존재) |
| **InstantDeath** | 0 | 0 | 즉사 |

## ⚡ 에너지/탄약 계열
| function_type | v1 | v2 | 설명 |
|---|---|---|---|
| **ChangeEnergyByMaxRate** | 에너지타입(Ulti 등) | 비율(만분율) | 최대치 대비 비율로 에너지 변경. 예: v1=Ulti, v2=3000 → 궁극기 30% 충전 |
| **ChangeEnergyOverTime** | 에너지타입(Ulti 등) | 틱당량(만분율) | 지속적 에너지 변경 |
| **ChangeRateEnergy** | 에너지타입(Ulti 등) | 충전률변화(만분율) | 에너지 충전 속도 변경 |
| **ChangeAmmo** | 탄약량(만분율) | 0 | 탄약 변경. 예: v1=10000 → 100% 충전 |
| **NoWeaponAmmoConsume** | 0 | 0 | 탄약 소모 없음 (존재만으로 발동) |
| **ChangeStamina** | - | - | 스태미나 변경 |

## 🔒 CC (군중제어) 계열
| function_type | v1 | v2 | 설명 |
|---|---|---|---|
| **Stun** | 0 | 0 | 기절 (존재만으로 발동, duration은 SE 테이블에서) |
| **Silence** | 0 | 0 | 침묵 (스킬 사용 불가) |
| **Freeze** | 0 | 0 | 빙결 (DB 미사용, Enum만 존재) |
| **Taunt** | 0 | 0 | 도발 |

> **CC 계열 공통**: v1=0, v2=0. 값 없이 존재 자체로 효과 발동. 지속시간은 StatusEffect.duration 또는 PassiveEffect.val1에서 결정.

## 👁️ 유틸리티 계열
| function_type | v1 | v2 | 설명 |
|---|---|---|---|
| **Stealth** | 0 | 0 | 은신 (존재만으로 발동) |
| **Tracked** | 0 | 0 | 추적됨 (위치 노출) |
| **Immune** | 0 | 0 | 면역 (피해 무효) |
| **CollisionSwitch** | - | - | 충돌 전환 |
| **BlockInteraction** | - | - | 상호작용 차단 (DB 미사용) |
| **DenyUseItem** | - | - | 아이템 사용 불가 (DB 미사용) |
| **RemoveSkillWeapon** | 0 | 0 | 스킬 무기 제거 |
| **RunStatusEffectEnemyInAllySight** | SE_ID | 0 | 아군 시야 내 적에게 SE 부여 |

## 🔫 기타 특수 계열
| function_type | v1 | v2 | 설명 |
|---|---|---|---|
| **AddExecuteEffectByAttackDamage** | - | - | 공격 피해 기반 실행 효과 추가 |
| **ShieldExecuteDamageToHP** | - | - | 보호막 피해를 HP로 전환 (코드 참조 확인) |

## 📌 enum_value1 / enum_value2 해석
### enum_value1 (값 적용 방식)
- `None`: 미사용 또는 절대값
- `PercentAdd`: 만분율 가산 (10000=100%)

### enum_value2 (보조 조건)
- `None`: 없음
- `TimeMax`: 시간 최대치 제한 (DotEffectHPFixed 등에서 사용)

## ⚠️ 무기 모듈에서 자주 사용하는 조합
| 모듈 효과 | function_type | v1 | v2 예시 |
|---|---|---|---|
| 임시 보호막 100 | GetTempShield | 0 | 100 |
| 이동속도 +20% | ModRateMoveSpeed | 0 | 2000 |
| 사격속도 -30% | ModRateFireRate | 0 | -3000 |
| 은신 | Stealth | 0 | 0 |
| 궁극기 10% 충전 | ChangeEnergyByMaxRate | Ulti | 1000 |
| 받는 피해 -20% | ModDamageReductionRate | 0 | 2000 |
