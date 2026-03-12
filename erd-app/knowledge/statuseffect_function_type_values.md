# StatusEffectFunction 테이블 작업 가이드

> 비율=만분율, 시간=ms, null인 곳만 null 입력 가능

## 컬럼 구조
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | int32 | PK |
| function_type | EStatusEffectFunctionType | 함수 타입 |
| function_value1 | string | 타입별 값1 |
| function_value2 | string | 타입별 값2 |
| enum_value1 | EStatusEffectDescValueType | value1 표시 형식 (PercentAdd=만분율 가산, None=미사용) |
| enum_value2 | EStatusEffectDescValueType | value2 표시 형식 (TimeMax=시간 최대치 제한, None=없음) |

## EStatusEffectFunctionType - 값 사용법

### 스탯 비율 변경 (v1=증감율, v2=null)
| 타입 | 설명 |
|---|---|
| ModRateOffence(1) | 공격력 스탯 증감(%) |
| ModRateDefence(2) | 방어력 스탯 증감(%) |
| ModRateDamage(3) | 주는 대미지 증감(%) |
| ModRateDamageHitby(4) | 받는 대미지 증감(%) |
| ModRateMoveSpeed(5) | 이동 속도 증감(%) |
| ModRateInteractionSpeed(6) | 인터랙션 속도 증감(%) |
| ModRateAttackSpeed(15) | 일반 사격 속도 증감(%) |
| ModRateHealBy(49) | 받는 치유량 증감(%) |
| ModRateStaminaRecovery(50) | 스태미너 회복 속도 증감(%) |
| ModCooldownHaste(42) | 쿨다운 가속 스탯 증감 |
| ModCriticalStrikeDamage(44) | 크리티컬 대미지 스탯 증감 |
| ModRateHitOptionDelay(68) | hit_option_delay 증감 (1 이상) |
| ModRateNormalAttackSpeed(70) | 기본 공격 속도 증감(%) |
| ModRateNormalAttackDamage(72) | 기본 공격 피해량 증감(%) |
| ModRateSkillDamage(73) | 스킬 피해량 증감(%) |
| ModRateIncreaseShield(74) | 주는 보호막량 증감(%) |
| ModRateShieldFromSpell(75) | 받는 보호막 증감(%) |
| ModRateArmorPenetration(76) | 방어 관통 증감(%) |
| ModRateIncreaseEnergyGain(77) | 에너지 획득 증감(%) |
| ModRateFireRate(78) | 사격 속도 증감(%) |
| ModRateJumpImpulse(79) | 점프 높이 증감(%) |
| ModRateMoa(84) | 탄착군 범위 증감(%) |
| ModReloadSpeed(86) | 재장전 속도 증감(%) |
| ModRateFireDamageBarrierPassed(87) | 방벽 통과 피해 증감(%) |
| ModHealthRegen(92) | 체력 리젠 |
| ModRateMaxInnateShield(99) | 최대 고유실드 증감(%) |
| ModRateFireDamageFromHighGround(100) | 고지대 피해 증감(%) |
| ModDamageShieldReductionModifier(101) | 보호막이 받는 피해량 감소 증감(%) |
| ModRateHeal | 주는 치유량 증감(%) |
| ModRateSpreadRange | 탄착군 범위 증감(%) |
| ModRateArmor | 방어력 증감(%) |
| ModRateAttack | 공격력 증감(%) |
| ModRateMeleeDamage | 근접 물리 피해 증감(%) |
| ModRateRangedDamage | 원거리 물리 피해 증감(%) |

### 스탯 고정 변경 (v1=증감값, v2=null)
| 타입 | 설명 |
|---|---|
| ModCriticalStrike(43) | 크리티컬 스탯 증감 |
| ModEnemyCriticalHit(27) | 피격 시 공격자 크리티컬 확률 보정 |
| ModStrength | 힘 증감 |
| ModDexterity | 민첩 증감 |
| ModIntelligence | 지능 증감 |
| ModWisdom | 지혜 증감 |
| ModConstitution | 건강 증감 |

### 도트 효과 (v1=값, v2=적용 주기ms)
| 타입 | 설명 | v1 |
|---|---|---|
| DotEffectHPMaxRate(7) | 최대 체력 비율로 지속 증감 | 증감율 |
| DotEffectSTMaxRate(8) | 최대 스태미너 비율로 지속 증감 | 증감율 |
| DotEffectHPFixed(9) | 체력 고정 값 지속 증감 | 증감 값 |
| DotEffect(51) | 시전자 공격력 비례 대미지 (방어력 계산 포함) | 시전자 공격력 배율 |
| HotEffect(52) | 시전자 공격력 비례 회복 | 시전자 공격력 배율 |

### CC (v2=null)
| 타입 | 설명 | v1 |
|---|---|---|
| Stun(10) | 기절 | null |
| Silence(14) | 침묵 | null |
| Freeze(58) | 빙결 | 해제 시 피해 공격력 계수 |
| Sleep(59) | 수면 | 해제 시 피해 공격력 계수 |
| Taunt(13) | 도발 (몬스터, PC/용병 제외) | null |
| TauntMerc(56) | 도발 (용병) | null |

### 보호막
| 타입 | 설명 | v1 | v2 |
|---|---|---|---|
| ShieldHPRate(11) | 최대 체력 비례 보호막 | HP 비율 | null |
| GetShield(80) | 보호막 획득 (고정 수치) | 증감 값 | null |
| GetTempShield(83) | 임시 보호막 | 보호막 비례 퍼센트 배율 | 고정 수치 |
| ShieldExecuteDamageToHP(20) | ExecuteEffect 피해 결과만큼 보호막 획득 | ExecuteEffect id | 보호막 전환율 |
| OverHeal(35) | HP 회복 초과분 → 보호막 전환 | HP 비율 | HP 고정치 |

### 에너지 (v1=대상 에너지 타입 Enum)
| 타입 | 설명 | v1 | v2 |
|---|---|---|---|
| ChangeEnergy(19) | 에너지 고정 변동 | 대상 에너지 타입 Enum | 정수 회복량 |
| ChangeRateEnergy(60) | 에너지 비율 변동 | 대상 에너지 타입 Enum | 비율 회복량 |
| ModMaxEnergy(21) | 에너지 최대치 증감 | 대상 에너지 타입 Enum | 증감 값 |
| ChangeEnergyOverTime(63) | 초당 에너지 변동 (정수) | 대상 에너지 타입 Enum | 정수 회복량 |
| InfiniteEnergy(64) | 에너지 무한 | null | 0=끝나고 복원 |
| EnergyBlock(65) | 에너지 현재 값 고정, 증감 불가 | null | null |
| ChangeEnergyOnHitby(66) | 피격 시 에너지 증감 | 타입 | 증감치 |
| ChangeEnergyByMaxRate(81) | 에너지 최대 수치에 비례한 에너지 증감 | 대상 에너지 타입 Enum | 비율 변동량 |
| ChangeAmmo(85) | 탄약 변동 | 비율 변동량 | 정수 변동량 |

### 패시브/상태효과 실행
| 타입 | 설명 | v1 | v2 |
|---|---|---|---|
| RunPassive(16) | 패시브 적용 | Passive id | null |
| StackMaxRunStatusEffect(57) | 스택 최대 도달 시 다른 SE 실행 | 상태 효과 ID | 지속 시간 |
| StackZeroRunStatusEffect(61) | 스택 0 소멸 시 다른 SE 실행 | 상태 효과 ID | 지속 시간 |
| RunStatusEffectEnemyInAllySight(91) | 아군 시야 내 적에게 SE 적용 | StatusEffect ID | null |

### 피해 변환
| 타입 | 설명 | v1 | v2 |
|---|---|---|---|
| ReflectDamage(26) | 대미지 반사 (방어력 무시) | 비율 반사량 | 정수 반사량 |
| DamageStealHP(25) | 입힌 대미지 일부 회복 | 비율 회복량 | 정수 회복량 |
| DamageAbsorb(36) | 받은 대미지 비율만큼 회복 (대미지 상쇄) | 비율 회복량 | null |
| DeferDamageDotEffect(88) | 피해 지연 도트 | 비율 | 시간(ms) |
| IncreaseArmorLowHp(23) | HP 손실률 × 계수 방어력 증감(%) | 계수 | null |
| IncreaseAttackLowHp(22) | HP 손실률 × 계수 공격력 증감(%) | 계수 | null |
| IncreaseDamageHitByLowHp(82) | HP 손실률 × 계수만큼 받는 대미지 증감(%) | 계수 | null |

### 쿨다운
| 타입 | 설명 | v1 | v2 |
|---|---|---|---|
| ModRunningCool(42) | 특정 슬롯 액티브의 돌고 있는 쿨다운 증감 | 쿨다운 증감 값 | 슬롯 번호 (1~4번) |

### 스킬 수정 (target_id별)
| 타입 | 설명 | v1 | v2 |
|---|---|---|---|
| SwapExecuteValue | Execute값 교체 | 교체ID | null |
| SwapExecuteRangeValue | 범위값 교체 | 교체값 | null |
| SwapExecuteRangeId | 범위ID 교체 | 교체RangeID | null |
| SwapExecuteResultDisplayId | 결과표시ID 교체 | 교체DisplayID | null |
| SwapExecuteEffectValue | 효과값 교체 | 교체값 | null |
| SwapExecuteEffectPartHitId | 파트히트ID 교체 | 교체PartHitID | null |
| ModExecuteEffectValue | 효과값 수정 | 수정값 | null |

### 기타 유틸리티
| 타입 | 설명 | v1 | v2 |
|---|---|---|---|
| Stealth | 은신 (존재만으로 발동) | 0 | 0 |
| Tracked | 추적됨 (위치 노출) | 0 | 0 |
| Immune | 면역 (피해 무효) | 0 | 0 |
| InstantDeath | 즉사 | 0 | 0 |
| NoWeaponAmmoConsume | 탄약 소모 없음 | 0 | 0 |
| RemoveSkillWeapon | 스킬 무기 제거 | 0 | 0 |
| CollisionSwitch | 충돌 전환 | - | - |
| DeathEndure | 사망 방지 | - | - |
