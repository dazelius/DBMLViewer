# PassiveEffect 테이블 작업 가이드

> 비율=만분율, 시간=ms, 대상 불필요 시 target_id=-1

## 컬럼 구조
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | int32 | PK(multi) - PassiveProperty.passive_effect_id와 동일 |
| passive_effect_type | EPassiveEffectType | 효과 타입 |
| effect_target_id | int32 | 타입별 대상 ID |
| effect_value1~4 | int32 | 타입별 값 (아래 참조) |

## EPassiveEffectType - 값 사용법

### 스탯 비율 변경 (target_id=-1, v1=증감율, v2~v4=-1)
| 타입 | 설명 | 영향 스탯 |
|---|---|---|
| ModRateMoveSpeed(1) | 이동속도 증감(%) | MoveSpeed |
| ModRateMaxHealth(2) | 최대체력 증감(%) | MaxHealth |
| ModRateHeal(3) | 주는치유 증감(%) | HealRate |
| ModRateHealBy(4) | 받는치유 증감(%) | HealByRate |
| ModRateFireRate(5) | 사격속도 증감(%) | FireRate |
| ModRateAttack(6) | 공격력 비율 증감(%) | DamageBase |
| ModRateDamageHeadModifier(7) | 헤드샷배율 증감(%) | DamageHeadModifier |
| ModRateReloadTime(10) | 재장전시간 증감(%) | ReloadTime |
| ModRateNormalAttackSpeed(12) | 일반공속 증감(%) | FireRate |
| ModSkillCooldownHaste(27) | 쿨감가속 증감(%) | SkillCooldownHaste |
| ModRateInnateShieldRegen(33) | 고유실드리젠 증감(%) | InnateShieldRegen |
| ModRateMoveSpeedRateFire(61) | 사격 중 이속 증감(%) | MoveSpeedRateStandHipFire |
| ModRateMoveSpeedRateReload(62) | 재장전 중 이속 증감(%) | MoveSpeedRateStandReload |

### ModRateMoa(8) - 탄착군(MOA) 증감
| 컬럼 | 설명 |
|---|---|
| target_id | -1 |
| v1 | 증감율(%) |
| v2 | 0(기본)=MoaBase+MoaMax, 1=MoaBase만, 2=MoaMax만 |
| v3~v4 | -1 |

### 스탯 고정 변경 (target_id=-1, v1=증감, v2~v4=-1)
| 타입 | 설명 |
|---|---|
| ModMaxHealth(11) | 최대체력 고정 증감 |
| ModDamageShieldModifier(28) | 실드피해배율 |
| ModDamageNoShieldModifier(38) | 비실드피해배율 |
| ModSkillDamageRate(30) | 스킬피해율 |
| ModEnergyGainModifier(44) | 에너지획득배율 |
| ModDamageReductionRate(32) | 피해감소율 |
| ModForwardLeapImpulse(35) | 점프거리 추가 |
| DamageFalloffFixed(34) | 거리감쇠 고정값 |
| ModDamageShieldReductionModifier(51) | 실드감소배율 |
| ModDamageFalloffMinValue(53) | 거리감쇠 최소값 |
| ModBulletDamageRate(50) | 탄환피해율 |
| ModConsecutiveFireMaxDamageRate(39) | 연사최대피해율 |
| ModConsecutiveFireMaxCount(73) | 연사최대횟수 |
| ModStunDuration(24) | 기절지속시간 증감(ms) |
| ModNegativeSpeedDuration(25) | 감속지속시간 증감(ms) |

### 능력치 고정 변경 (target_id=-1, v1=증감, v2~v4=-1)
| 타입 | 설명 |
|---|---|
| ModStrength | 힘 |
| ModDexterity | 민첩 |
| ModIntelligence | 지능 |
| ModWisdom | 지혜 |
| ModConstitution | 건강 |

### 고유실드 (v1=증감율, v2~v4=-1)
| 타입 | 설명 | target_id |
|---|---|---|
| ModRateMaxInnateShield(36) | 최대고유실드 비율 | -1=본인, 1=스킬1무기, 2=스킬2무기, 3=궁극기무기 |
| ModRateInnateShieldRegenWaitTime(59) | 고유실드리젠 대기시간 | -1=본인, 1=스킬1무기, 2=스킬2무기, 3=궁극기무기 |

### 상태효과 부여 (target_id=StatusEffectID)
| 타입 | 설명 | v1 | v2~v4 |
|---|---|---|---|
| GetStatusEffect(9) | 자신에게 SE 적용 | 부여시간(ms), 불필요 시 0 | -1 |
| GetStatusEffectConditionSource(18) | 조건 소스 대상에게 SE 적용 | 부여시간(ms) | -1 |
| GetStatusEffectCurrentHitTarget(26) | 최근 피격 대상에게 SE 적용 | 부여시간(ms), 무한=-1 | -1 |

### 마크
| 타입 | 설명 | target_id | v1 | v2~v4 |
|---|---|---|---|---|
| GetMark(13) | 자신에게 마크 부여 | Mark.id | 부여시간(ms), 패시브동안=-1 | -1 |
| GetMarkCurrentHitTarget(14) | 피격대상에게 마크 부여 | Mark.id | 부여시간(ms) | -1 |
| RemoveMark(15) | 자신 마크 제거 | Mark.id | -1 | -1 |
| RemoveMarkCurrentHitTarget(16) | 피격대상 마크 제거 | Mark.id | -1 | -1 |

### DmgModTag (target_id=TagID, v1=지속시간ms)
| 타입 | 설명 |
|---|---|
| GetAttackerDmgModTag(65) | 공격자 DmgMod태그 부여(자신) |
| GetTargetDmgModTag(66) | 타겟 DmgMod태그 부여(자신) |
| GetAttackerDmgModTagCurrentHitTarget(67) | 공격자 DmgMod태그 부여(피격대상) |
| GetTargetDmgModTagCurrentHitTarget(68) | 타겟 DmgMod태그 부여(피격대상) |
| RemoveAttackerDmgModTag(69) | 공격자 DmgMod태그 제거(자신) |
| RemoveTargetDmgModTag(70) | 타겟 DmgMod태그 제거(자신) |
| RemoveAttackerDmgModTagCurrentHitTarget(71) | 공격자 DmgMod태그 제거(피격대상) |
| RemoveTargetDmgModTagCurrentHitTarget(72) | 타겟 DmgMod태그 제거(피격대상) |

### 피해지연 (target_id=StatusEffectID, v1=지속시간ms)
| 타입 | 설명 |
|---|---|
| DeferDamageTaken(17) | 받은 피해를 SE 도트로 분산 |

### 실행계 (target_id=ExecuteID, v1~v4=-1)
| 타입 | 설명 |
|---|---|
| RunExecute(19) | Execute 실행 |
| RunExcuteConditionSource(23) | 조건 소스 대상 위치에 Execute 실행 |
| ExeucteInRangeKill(21) | 킬 범위 내 Execute 실행 |

### 스킬 수정 (target_id=대상ID)
| 타입 | target_id | v1 | v2 | v3 | v4 |
|---|---|---|---|---|---|
| SwapExecuteValue(37) | ExecuteID | 교체effect_id1 | 교체effect_id2 | 교체effect_id3 | 교체effect_id4 |
| SwapCasterResultExecuteEffect(40) | ExecuteID | 교체caster_result_id | -1 | -1 | -1 |
| ModExecuteEffectValue(47) | ExecuteEffectID | modValue1 | modValue2 | modValue3 | modRate |
| ModExecuteRangeValue(48) | ExecuteRangeID | shape_value1증감 | shape_value2증감 | shape_value3증감 | shape_value4증감 |
| SwapStatusEffectValue(46) | StatusEffectID | 교체function_id1 | 교체function_id2 | -1 | -1 |
| ModStatusEffectFunctionValue(49) | SEFunctionID | modFuncValue1 | modFuncValue2 | -1 | -1 |
| ModSkillStackMax(45) | SkillID | 변경량 | -1 | -1 | -1 |
| ModSkillCool(41) | SkillGroup | 쿨 증감(ms) | -1 | -1 | -1 |
| ResetPassiveCoolDown(29) | 대상PassiveID | -1 | -1 | -1 | -1 |

### 무기 특화
| 타입 | 설명 | target_id | v1 | v2 | v3~v4 |
|---|---|---|---|---|---|
| ModWeaponEffectiveRange(20) | 유효사거리 | WeaponID (-1=전체) | 슬롯타입 | 사거리 증감 | -1 |
| ModMagCapacity(22) | 탄창용량 | WeaponID (-1=전체) | 고정값 | 비율% | -1 |
| ModRateWeaponDamage(42) | 무기공격력 | WeaponID (-1=전체) | 고정값 | 비율% | -1 |
| SwapWeaponOnHitExecuteID(63) | 무기 OnHit Execute 교체 | WeaponID | on_hit_execute_id1 | on_hit_execute_id2 | -1 |
| SwapProjectileOnHitExecuteID(64) | 투사체 OnHit Execute 교체 | ProjectileID | on_hit_execute_id 교체값 | -1 | -1 |

### 사격 관련 (target_id=-1, v2~v4=-1)
| 타입 | 설명 | v1 |
|---|---|---|
| NoWeaponAmmoConsume | 탄약 소모 없음 | -1 |
| ModRateChargeSpeed | 차징 속도 증감(%) | 증감율 |
