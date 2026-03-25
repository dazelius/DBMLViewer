# Combat System Code Guide
> Auto-generated: 2026-02-25 13:31 | 155 files

## `Aegis.OrleansSilo/Grains/Player/`

### `PlayerGrainState.cs`
Path: `Aegis.OrleansSilo/Grains/Player/PlayerGrainState.cs`
**Class**: PlayerGrainState
**NS**: Aegis.OrleansSilo.Grains.Player

## `NetworkClient/NetPlay/AI/`

### `AIActionBrainV2_ActionStat.cs`
Path: `NetworkClient/NetPlay/AI/AIActionBrainV2_ActionStat.cs`
**Class**: EShotResultType, EBotMoveState, AIActionBrainV2
**NS**: ProjectAegis.NetPlay
**Methods**: EnterBlindState, ExitBlindState, GetCurrentActionStat, CalculateAccuracy, CalculateHeadshotRate, DetermineShotResult, CalculatePrepareTime, GetShotFollowRotateSpeed, GetSkillInitialTime, GetSkillIncorrectRate, RollSkillCorrectUsage, GetReloadFailRate, RollReloadSuccess, HasValidActionStat, IsBlindState, GetCachedAccuracy, GetCachedHeadshotRate, GetCachedPrepareTime, GetLastShotResult, GetCurrentActionStatId

## `NetworkClient/NetPlay/AI/Actions/`

### `AIActionSkillDamage.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionSkillDamage.cs`
**Class**: AIActionSkillDamage
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, OnActionEnd, Update, AIActionSkillDamage

## `NetworkClient/NetPlay/Character/`

### `CharacterHealthInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterHealthInterface.cs`
**Class**: EDeathAnimType, ShieldInstance, Character
**NS**: ProjectAegis.NetPlay
**Methods**: SetHealth, OnChangedhealth, SetDownedHealth, OnChangedDownedhealth, Heal, DealDamage, DealShield, EvaluateDeferredDamage, TakeDamage, RecordReceiveDamage, TargetAttacked, OnTakeDamage, RpcOnTakeDamage, PlayDamageVibration, TakeHeal, RpcOnTakeHeal, ChangeLifeState, UpdateLifeState, OnChangedLifeState, Resurrect, Revive, Downed, Die, ForceDie, Respawn (+ 26 more)

### `CharacterStatInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterStatInterface.cs`
**Class**: Character
**NS**: ProjectAegis.NetPlay
**Methods**: GetStat, GetStatValue, GetStatValueAsRatio, GetStatValueAsPercent, GetSkillPropertyStat, InitStats, RebuildStats, AddBuffStat, RemoveBuffStat, RemoveBuffStats, AddBuffRateStat, RemoveBuffRateStat, RemoveBuffRateStats, AddWeaponSpecificBuffStat, RemoveWeaponSpecificBuffStat, AddWeaponSpecificBuffRateStat, RemoveWeaponSpecificBuffRateStat, AddWeaponStats, RemoveWeaponStats, UpdateWeaponStats, AddAdditionalBuffStat, RemoveAdditionalBuffStat, GetAdditionalBuffStatValue, GetAdditionalBuffStatValueAsRatio, AddSkillPropertyStat

### `CharacterStatusEffectInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterStatusEffectInterface.cs`
**Class**: EStatusEffectResult, DamageDealRecord, Character
**NS**: ProjectAegis.NetPlay
**Methods**: InitStatusEffectSystem, InitStateTagSync, UpdateStatusEffect, CanApplyStatusEffect, GetApplyStatusEffectStackCount, ApplyStatusEffect, AddStatusEffect, ClientApplyStatusEffect, Editor_ApplyStatusEffect, RemoveStatusEffectByInstanceID, RemoveAllStatusEffects, ModifySkillStackMax, SyncStatusEffects, ApplySyncStatusEffects, ClientRemoveStatusEffectByInstanceID, RecordDamageDeal, GetDamageRecord, BeginDamageDealRecord, EndDamageDealRecord, ClearDamageDealRecord, AddStateTag, RemoveStateTag, HasStateTag, HasInputBlockingStateTag, HasInputAttackBlockingStateTag (+ 11 more)

## `NetworkClient/NetPlay/Character/FSM/`

### `CharState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/CharState.cs`
**Class**: EStateUpdateResult, CharState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Init, EnterState, UpdateState, ExitState, IsTriggeringActivate, IsTriggeringTerminate, CharState

### `StateParameter.cs`
Path: `NetworkClient/NetPlay/Character/FSM/StateParameter.cs`
**Class**: StateParameter, StateParamPack
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: ResetStatics, ResetStaticsOnEnterPlayMode, Clear, CopyFrom, Setup, MakeParam, StateParamPack

## `NetworkClient/NetPlay/Character/FSM/Layers/`

### `ExclusiveStateLayer.cs`
Path: `NetworkClient/NetPlay/Character/FSM/Layers/ExclusiveStateLayer.cs`
**Class**: ExclusiveStateLayer
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: SetDefaultState, IsDefaultState, Init, ChangeState, ChangeStateForce, ChangeToDefaultState, Update, ExclusiveStateLayer

### `SkillStateLayer.cs`
Path: `NetworkClient/NetPlay/Character/FSM/Layers/SkillStateLayer.cs`
**Class**: SkillStateLayer
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: SetDefaultState, IsDefaultState, GetState, Init, ChangeState, ChangeStateForce, ChangeToDefaultState, Update, SkillStateLayer

### `StatusEffectLayer.cs`
Path: `NetworkClient/NetPlay/Character/FSM/Layers/StatusEffectLayer.cs`
**Class**: StatusEffectLayer, ActiveStateInfo
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Increment, Decrement, Update, AddState, GetState, Activate, Deactivate, ActiveStateInfo, StatusEffectLayer

## `NetworkClient/NetPlay/Character/FSM/States/`

### `AdsState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/AdsState.cs`
**Class**: AdsState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, AdsState

### `AimState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/AimState.cs`
**Class**: AimState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, AimState

### `CheckFireNoneState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/CheckFireNoneState.cs`
**Class**: CheckFireNoneState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, CheckFireNoneState

### `EquipState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/EquipState.cs`
**Class**: EquipState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, EquipState

### `FireState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/FireState.cs`
**Class**: FireState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, PlayFireAnimation, StopFireAnimation, SetupIK, RestoreIK, UpdateIKByGroundedState, FireState

### `HipState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/HipState.cs`
**Class**: HipState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, HipState

### `HolsterState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/HolsterState.cs`
**Class**: HolsterState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, HolsterState

### `NoneState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/NoneState.cs`
**Class**: NoneState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, NoneState

### `ParkourState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/ParkourState.cs`
**Class**: ParkourState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, CalcRootMotionScale, ParkourState

### `ReloadState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/ReloadState.cs`
**Class**: ReloadState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, ReloadState

### `ShatterState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/ShatterState.cs`
**Class**: ShatterState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, ShatterState

### `StatusEffectState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/StatusEffectState.cs`
**Class**: StatusEffectState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, StatusEffectState

### `ThrowState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/ThrowState.cs`
**Class**: ThrowState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, ThrowState

## `NetworkClient/NetPlay/Character/FSM/States/Fire/`

### `FiringState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/Fire/FiringState.cs`
**Class**: FiringState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, FiringState

## `NetworkClient/NetPlay/Character/FSM/States/HitResult/`

### `HitResultState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/HitResult/HitResultState.cs`
**Class**: HitResultState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, UpdateState, ExitState, StartHitReuslt, UpdateHitResult, DebugGUI, HitResultState

## `NetworkClient/NetPlay/Character/FSM/States/Life/`

### `AliveState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/Life/AliveState.cs`
**Class**: AliveState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, AliveState

### `DeadState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/Life/DeadState.cs`
**Class**: DeadState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, TryPlayPendingDeathAnim, DeadState

### `DownedState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/Life/DownedState.cs`
**Class**: DownedState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, DownedState

## `NetworkClient/NetPlay/Character/Passive/Editor/`

### `CharacterDetailStat.cs`
Path: `NetworkClient/NetPlay/Character/Passive/Editor/CharacterDetailStat.cs`
**Class**: CharacterDetailStat
**NS**: ProjectAegis.Tool
**Methods**: DrawTitle, DrawName, DrawView, CharacterDetailStat

### `CharacterDetailStatusEffect.cs`
Path: `NetworkClient/NetPlay/Character/Passive/Editor/CharacterDetailStatusEffect.cs`
**Class**: CharacterDetailStatusEffect
**NS**: ProjectAegis.Tool
**Methods**: DrawName, DrawView, CharacterDetailStatusEffect

## `NetworkClient/NetPlay/Character/Passive/PassiveExecutor/`

### `PassiveExecutor_StatMod.cs`
Path: `NetworkClient/NetPlay/Character/Passive/PassiveExecutor/PassiveExecutor_StatMod.cs`
**Class**: PassiveModeToStatAttribute, PassiveExecutor_StatMod, PassiveExecutor_ModRateMoveSpeed, PassiveExecutor_ModRateMaxHealth, PassiveExecutor_ModRateHeal, PassiveExecutor_ModRateHealBy, PassiveExecutor_ModRateFireRate, PassiveExecutor_ModRateAttack, PassiveExecutor_ModRateDamageHeadModifier, PassiveExecutor_ModRateMoa, PassiveExecutor_ModRateReloadTime, PassiveExecutor_ModRateNormalAttackSpeed, PassiveExecutor_ModCooldownHaste
**NS**: ProjectAegis.NetPlay
**Methods**: TryGetStatTypes, InitilizeStatMode, Init, Activate, Terminate, PassiveModeToStatAttribute, PassiveExecutor_StatMod, PassiveExecutor_ModRateMoveSpeed, PassiveExecutor_ModRateMaxHealth, PassiveExecutor_ModRateHeal, PassiveExecutor_ModRateHealBy, PassiveExecutor_ModRateFireRate, PassiveExecutor_ModRateAttack, PassiveExecutor_ModRateDamageHeadModifier, PassiveExecutor_ModRateMoa, PassiveExecutor_ModRateReloadTime, PassiveExecutor_ModRateNormalAttackSpeed, PassiveExecutor_ModCooldownHaste

### `PassiveExecutor_StatModeWeapon.cs`
Path: `NetworkClient/NetPlay/Character/Passive/PassiveExecutor/PassiveExecutor_StatModeWeapon.cs`
**Class**: PassiveExecutor_ModWeaponEffectiveRange, PassiveExecutor_ModMagCapacity
**NS**: ProjectAegis.NetPlay
**Methods**: Activate, AddWeaponIDFromSlot, Terminate, ApplyBuff

## `NetworkClient/NetPlay/Character/Skill/`

### `NormalState.cs`
Path: `NetworkClient/NetPlay/Character/Skill/NormalState.cs`
**Class**: NormalState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, UpdateState, ExitState, NormalState

### `SkillState.cs`
Path: `NetworkClient/NetPlay/Character/Skill/SkillState.cs`
**Class**: SkillWeaponInfo, SkillDisplayResult, SkillState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: IsAbleCancel, IsBlockedCancel, IsAbleSkip, Init, ActionNodePostLoad, EnterState, ActivateActionOnZeroTime, RemoveNode, ExitState, ProcessNextAction, ChangeAction, UpdateState, ActivateNode, SetAnimLayerUsingFlag, IsMoveAllow, BindSkillButton, SetExecutionTargets, ClearExecutionTargets, GetNextExecutionTarget, IsTriggeringActivate, IsTriggeringTerminate, SetArmorStack, RemoveArmorStack, HasArmor, CurrentArmorType (+ 4 more)

## `NetworkClient/NetPlay/Character/Skill/ActionNode/Conditional/`

### `EnemyHitCheck.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Conditional/EnemyHitCheck.cs`
**Class**: EnemyHitCheck
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, OnUpdate, OnEnemyHit, NeedUpdate, EnemyHitCheck

### `EventDamage.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Conditional/EventDamage.cs`
**Class**: DamageEvent
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, OnDamageEvent, DamageEvent

### `InputStateCheck.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Conditional/InputStateCheck.cs`
**Class**: EInputStateCheckType, InputStateCheck
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, ButtonEvent, OnUpdate, NeedUpdate, InputStateCheck

## `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/`

### `ExecuteAttack.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteAttack.cs`
**Class**: SkillExecuteDamageFunction
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Execute

### `ExecuteLaunchProjectile.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteLaunchProjectile.cs`
**Class**: ExecuteLaunchProjectile, Setting
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, GetProjectileStartPosition, GetProjectileDirection, TryGetThrowingDirection, TryCalculateThrowVelocity, ExecuteLaunchProjectile

### `ExecuteStatusEffect.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteStatusEffect.cs`
**Class**: SkillExecuteStatusEffectFunction, Setting
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Execute

## `NetworkClient/NetPlay/Character/StatusEffect/`

### `StatusEffectCondition.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectCondition.cs`
**Class**: StatusEffectConditionLib, StatusEffectConditionAttribute, StatusEffectCondition, StatusEffectCondition_UseSkillButtonType, StatusEffectCondition_UseDodgeAction, StatusEffectCondition_UseNormalAttack, StatusEffectCondition_UseSpecialAction, StatusEffectCondition_UseSkillActive, StatusEffectCondition_UseSkill, StatusEffectCondition_GetStatusEffect, StatusEffectCondition_AttackHit, StatusEffectCondition_AttackHitby, StatusEffectCondition_DamagedToDeath, StatusEffectCondition_StackGreaterEqual
**NS**: ProjectAegis.NetPlay
**Methods**: InitStatic, Register, CreateCondition, Initialize, Setup, Enable, Disable, OnStartSkill, OnReceiveStatusEffect, OnAttack, OnAttacked, OnTakeDeathDamage, StatusEffectConditionAttribute, StatusEffectCondition_UseSkillButtonType, StatusEffectCondition_UseDodgeAction, StatusEffectCondition_UseNormalAttack, StatusEffectCondition_UseSpecialAction

### `StatusEffectImmune.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectImmune.cs`
**Class**: StatusEffectImmune
**NS**: ProjectAegis.NetPlay
**Methods**: AddStatusEffectImmune, RemoveStatusEffectImmune, HasStatusEffectImmune, StatusEffectImmune

### `StatusEffectInstance.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectInstance.cs`
**Class**: StatusEffectInstance
**NS**: ProjectAegis.NetPlay
**Methods**: Setup, Update, SetEnable, SetDisable, OnAdd, OnBeforeRemove, OnRemove, RemoveOnDestroy, StatusEffectInstance

### `StatusEffectSystem.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectSystem.cs`
**Class**: StatusEffectSyncInfo, StatusEffectGroup, StatusEffectSystem
**NS**: ProjectAegis.NetPlay
**Methods**: CanApply, AddStatusEffect, RemovStatusEffect, Update, GetStatusEffectInstanceWithID, GetStatusEffectInstanceFirst, OnStackDownEvent, OnDestroy, Init, Editor_AddStatusEffect, RemoveStatusEffect, RemoveStatusEffectOnDestroy, RemoveBuffStatusEffect, RemoveDebuffStatusEffect, RemoveStatusEffectsOnDestroy, RemoveAllStatusEffects, SetArmor, RemoveArmor, HasArmor, GetStatusEffectGroup, CheckProbability, GetRemoveList, HasStatusEffect, HasStatusEffectByTableID, GetStatusEffectInstance (+ 1 more)

### `StatusEffectTooltipHelper.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectTooltipHelper.cs`
**Class**: StatusEffectDescBuilder, ParamInfo, StatusEffectDescAutoTooltip
**Methods**: GetValue, BuildStatusEffectGroupDesc, ProcessAndAggregateParam, AggregateIntValue, AggregateFloatValue, GetDescStringStatusEffectGroupName, IsShowAutoToolipCondition, AddToolipCondition, CheckLoadShowEffectIDs, SaveShowEffectIDs

## `NetworkClient/NetPlay/Character/StatusEffect/Editor/`

### `StatusEffectTool.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/Editor/StatusEffectTool.cs`
**Class**: StatusEffectTool, StatusEffectInfo, GUIStatusEffectGroup, GUIStatusEffectInstance, GUIStatusEffectFunction
**NS**: ProjectAegis.NetPlay
**Methods**: ShowWindow, OnEnable, OnDisable, OnDestroy, OnEditorUpdate, RefreshRefData, OnGUI, DrawCharacterSelect, DrawStatusEffectList, DrawCharacterStatusEffectState, DrawStat, RefreshStatusEffect, ApplyStatusEffect, GetPlayerCharacter, PrepareEditor, GetStyleTexture

## `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/`

### `StatusEffect_CC.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_CC.cs`
**Class**: StatusEffect_Freeze, StatusEffect_Stun, StatusEffect_Taunt, StatusEffect_Sleep, StatusEffect_BlockInteraction
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, OnBeforeDeactive, Deactivate, DeactivateOnEnd, OnTakeDamage

### `StatusEffect_ChangeAmmo.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_ChangeAmmo.cs`
**Class**: StatusEffect_ChangeAmmo
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffect_ChangeStamina.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_ChangeStamina.cs`
**Class**: StatusEffect_ChangeStamina
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffect_CollisionSwitch.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_CollisionSwitch.cs`
**Class**: StatusEffect_CollisionSwitch
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffect_Damage.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_Damage.cs`
**Class**: StatusEffect_DamageStealHP, StatusEffect_DamageAbsorb, StatusEffect_ReflectDamage
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate, DeactivateOnEnd, OnDealDamage, OnTakeDamage

### `StatusEffect_DetonationTarget.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_DetonationTarget.cs`
**Class**: StatusEffect_DetonationTarget
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate, DeactivateOnEnd, AddDetonationTarget, RemoveDetonationTarget

### `StatusEffect_DotEffect.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_DotEffect.cs`
**Class**: StatusEffect_DotEffect, StatusEffect_HotEffect, StatusEffect_DotEffectHPFixed, StatusEffect_DotEffectHPMaxRate, StatusEffect_DotEffectSTMaxRate, StatusEffect_DeferDamageDotEffect
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate, Update, Apply

### `StatusEffect_Energy.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_Energy.cs`
**Class**: StatusEffect_ModMaxEnergy, StatusEffect_ChangeEnergy, StatusEffect_ChangeEnergyRate, StatusEffect_ChangeEnergyOverTime, StatusEffect_StaffEnergyResetBlock, StatusEffect_InfiniteEnergy, ERestoreMode, StatusEffect_EnergyBlock, StatusEffect_ChangeEnergyOnHitby
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate, DeactivateOnEnd, OnTakeDamage

### `StatusEffect_GetArmor.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_GetArmor.cs`
**Class**: StatusEffect_GetArmor
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffect_IgnoreLockOn.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_IgnoreLockOn.cs`
**Class**: StatusEffect_IgnoreLockOn
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffect_Immune.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_Immune.cs`
**Class**: StatusEffect_Immune
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffect_IncreaseArmorLowHp.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_IncreaseArmorLowHp.cs`
**Class**: StatusEffect_IncreaseArmorLowHp
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate, DeactivateOnEnd, OnChangedHealth

### `StatusEffect_IncreaseAttackLowHp.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_IncreaseAttackLowHp.cs`
**Class**: StatusEffect_IncreaseAttackLowHp
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate, DeactivateOnEnd, OnChangedHealth

### `StatusEffect_InstantDeath.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_InstantDeath.cs`
**Class**: StatusEffect_InstantDeath
**NS**: ProjectAegis.NetPlay
**Methods**: Activate, Deactivate

### `StatusEffect_ModEnemyCriticalHit.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_ModEnemyCriticalHit.cs`
**Class**: StatusEffect_ModEnemyCriticalHit
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffect_ModRateDamage.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_ModRateDamage.cs`
**Class**: StatusEffect_ModRateDamage, StatusEffect_ModDamageReductionRate, StatusEffect_ModRateFireDamageBarrierPassed, StatusEffect_ModRateHitOptionDelay
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffect_ModRateMoa.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_ModRateMoa.cs`
**Class**: StatusEffect_ModRateMoa, ETargetMoaStat
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffect_ModRunningCool.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_ModRunningCool.cs`
**Class**: StatusEffect_ModRunningCool
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffect_OverHeal.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_OverHeal.cs`
**Class**: StatusEffect_OverHeal
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate, Apply

### `StatusEffect_RecoverExhaustion.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_RecoverExhaustion.cs`
**Class**: StatusEffect_RecoverExhaustion
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffect_RemoveStatusEffect.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_RemoveStatusEffect.cs`
**Class**: StatusEffect_RemoveBuff, StatusEffect_RemoveDebuff
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffect_RunPassive.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_RunPassive.cs`
**Class**: StatusEffect_RunPassive
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffect_RunStatusEffectEnemyInAllySight.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_RunStatusEffectEnemyInAllySight.cs`
**Class**: StatusEffect_RunStatusEffectEnemyInAllySight, SightHitComparer
**NS**: ProjectAegis.NetPlay
**Methods**: Activate, Deactivate, Update, UpdateTrackedEnemies, IsCharacterInSight, Compare

### `StatusEffect_Shield.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_Shield.cs`
**Class**: StatusEffect_Shield, StatusEffect_ShieldExecuteDamageToHP
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffect_SkillTransCondition.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_SkillTransCondition.cs`
**Class**: StatusEffect_SkillTransCondition
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffect_StackCheck.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_StackCheck.cs`
**Class**: StatusEffect_StackMaxRunStatusEffect, StatusEffect_StackZeroRunStatusEffect
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffect_StateTag.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_StateTag.cs`
**Class**: StatusEffect_StateTag, StatusEffect_BlockHeal, StatusEffect_DeathEndure, StatusEffect_Silence
**NS**: ProjectAegis.NetPlay
**Methods**: Activate, Deactivate, StatusEffect_StateTag, StatusEffect_BlockHeal, StatusEffect_DeathEndure, StatusEffect_Silence

### `StatusEffect_StatModFunctions.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_StatModFunctions.cs`
**Class**: StatusEffect_StatModFunctionBase, StatusEffect_ModRateNormalAttackSpeed, StatusEffect_ModRateSkillSpeed, StatusEffect_ModRateNormalAttackDamage, StatusEffect_ModRateSkillDamage, StatusEffect_ModRateArmorPenetration, StatusEffect_ModRateIncreaseShield, StatusEffect_ModRateShieldFromSpell, StatusEffect_ModRateIncreaseEnergyGain, StatusEffect_ModRateStaminaRecovery, StatusEffect_ModRateOffence, StatusEffect_ModRateMoveSpeed, StatusEffect_ModReloadSpeed, StatusEffect_ModCooldownHaste, StatusEffect_ModCriticalStrike, StatusEffect_ModCriticalStrikeDamage, StatusEffect_ModRateAttackSpeed, StatusEffect_ModRateFireRate, StatusEffect_ModRateDefence, StatusEffect_ModRateHealBy, StatusEffect_ModRateInteractionSpeed
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, GetBaseStatValue, Activate, Deactivate, StatusEffect_StatModFunctionBase, StatusEffect_ModRateNormalAttackSpeed, StatusEffect_ModRateSkillSpeed, StatusEffect_ModRateNormalAttackDamage, StatusEffect_ModRateSkillDamage, StatusEffect_ModRateArmorPenetration, StatusEffect_ModRateIncreaseShield, StatusEffect_ModRateShieldFromSpell, StatusEffect_ModRateIncreaseEnergyGain, StatusEffect_ModRateStaminaRecovery, StatusEffect_ModRateOffence, StatusEffect_ModRateMoveSpeed, StatusEffect_ModReloadSpeed, StatusEffect_ModCooldownHaste, StatusEffect_ModCriticalStrike, StatusEffect_ModCriticalStrikeDamage, StatusEffect_ModRateAttackSpeed, StatusEffect_ModRateFireRate, StatusEffect_ModRateDefence, StatusEffect_ModRateHealBy, StatusEffect_ModRateInteractionSpeed

### `StatusEffect_Track.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_Track.cs`
**Class**: ETrackType, StatusEffect_Track
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffectFunction.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffectFunction.cs`
**Class**: ClassEnumerator, StatusEffectFunctionLib, StatusEffectFunctionTypeRegisterationAttribute, StatusEffectApplyParam, StatusEffectFunctionOverrideParam, StatusEffectFunction
**NS**: ProjectAegis.NetPlay
**Methods**: InitStatic, Register, CreateFunction, Initialize, SetValue, Activate, Deactivate, DeactivateOnEnd, OnBeforeDeactive, Update, StatusEffectFunctionTypeRegisterationAttribute

### `StatusEffectFunction_Weapon.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffectFunction_Weapon.cs`
**Class**: StatusEffectFunction_RemoveSkillWeapon
**NS**: ProjectAegis.NetPlay
**Methods**: Activate, Deactivate

## `NetworkClient/NetPlay/Controller/`

### `SkillButtonState.cs`
Path: `NetworkClient/NetPlay/Controller/SkillButtonState.cs`
**Class**: SkillButtonState
**NS**: ProjectAegis.NetPlay
**Methods**: SetButtonClick, SetButtonRelease

## `NetworkClient/NetPlay/Damage/`

### `DamageCalculator.cs`
Path: `NetworkClient/NetPlay/Damage/DamageCalculator.cs`
**Class**: DamageCalculator
**NS**: ProjectAegis.NetPlay
**Methods**: CalculateDamage, CalculateWeaponBaseDamage, CalculateSkillBaseDamage, CalculateRatioDamage, CalculateShieldDamage, CalculateSkillDamage, CalculateElementalDamage, CalculateFinalDamageRate, CalculatePointDamage, GetStatValueAsRatio, GetStatValue, CalculateRadialDamage, CalculateWeaponDamage, CalculateFallDamage, CalculateHeal

### `DamageEvent.cs`
Path: `NetworkClient/NetPlay/Damage/DamageEvent.cs`
**Class**: EDamageSource, DamageEvent, AnyDamageEvent, FallOffDamageEvent, WeaponDamageEvent, PointDamageEvent, RadialDamageEvent, SkillDamageEvent, StatusEffectDamageEvent
**NS**: ProjectAegis.NetPlay

### `DamageHelper.cs`
Path: `NetworkClient/NetPlay/Damage/DamageHelper.cs`
**Class**: HitResult, HitDistanceComparer, WeaponHelper
**Methods**: Compare, FindValidHit, PerformRaycastAll, FindValidHitSphere, ClosestPointOnCameraLine, HitResult

### `DamageResult.cs`
Path: `NetworkClient/NetPlay/Damage/DamageResult.cs`
**Class**: DamageResult, NetRpcDamageResult, TakeDamageInfo
**NS**: ProjectAegis.NetPlay
**Methods**: MakeDamageResult, NetRpcDamageResult, DamageResult, GetField, SetField

### `IDamageable.cs`
Path: `NetworkClient/NetPlay/Damage/IDamageable.cs`
**Class**: IDamageable
**NS**: ProjectAegis.NetPlay
**Methods**: TakeDamage

## `NetworkClient/NetPlay/HitBox/`

### `HitBox.cs`
Path: `NetworkClient/NetPlay/HitBox/HitBox.cs`
**Class**: EBodyPart, EBodyGroup, BodyPartExtentions, HitBox
**NS**: ProjectAegis.NetPlay
**Methods**: ToGroup, SetOwner, SetPart, OnHit

## `NetworkClient/NetPlay/Interaction/Handlers/Character/`

### `AddStatusEffectHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Character/AddStatusEffectHandler.cs`
**Class**: AddStatusEffectHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

### `ModifyStatHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Character/ModifyStatHandler.cs`
**Class**: ModifyStatHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

### `RemoveStatusEffectHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Character/RemoveStatusEffectHandler.cs`
**Class**: RemoveStatusEffectHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

## `NetworkClient/NetPlay/Interaction/Handlers/Object/`

### `SetStateHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Object/SetStateHandler.cs`
**Class**: SetStateHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

### `ToggleStateHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Object/ToggleStateHandler.cs`
**Class**: ToggleStateHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

## `NetworkClient/NetPlay/MapObject/Description/`

### `TriggerVolumeStatusEffectDescriptionComp.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/TriggerVolumeStatusEffectDescriptionComp.cs`
**Class**: TriggerVolumeStatusEffectDescription, TriggerVolumeStatusEffectDescriptionComp
**NS**: ProjectAegis.NetPlay

### `TriggerVolumeStatusEffectDescriptionComp.Editor.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/TriggerVolumeStatusEffectDescriptionComp.Editor.cs`
**Class**: TriggerVolumeStatusEffectDescriptionComp
**NS**: ProjectAegis.NetPlay

## `NetworkClient/NetPlay/MapObject/Function/`

### `StatusEffectZone.cs`
Path: `NetworkClient/NetPlay/MapObject/Function/StatusEffectZone.cs`
**Class**: StatusEffectZone
**NS**: ProjectAegis.NetPlay
**Methods**: OnTriggerEnter, OnTriggerExit

## `NetworkClient/NetPlay/MapObject/Object/`

### `TriggerVolumeStatusEffect.cs`
Path: `NetworkClient/NetPlay/MapObject/Object/TriggerVolumeStatusEffect.cs`
**Class**: TriggerVolumeStatusEffect, VolumeState
**NS**: ProjectAegis.NetPlay
**Methods**: SetupByDescription, OnStartServer, OnStartClient, OnStateChange, OnSetState, PostSetupModel, Update, OnTriggerEnter, EnableCollide

## `NetworkClient/NetPlay/Stat/`

### `Stat.cs`
Path: `NetworkClient/NetPlay/Stat/Stat.cs`
**Class**: StatPair, Stat, BuffStat, WeaponBuffStat, ESkillPropertyStat, EAdditionalBuffStat
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, SetCurrentWeaponID, Rebuild, AddBuffValue, RemoveBuffValue, RefreshTotalValue, ClearValues, StatPair, Stat

### `StatContainer.cs`
Path: `NetworkClient/NetPlay/Stat/StatContainer.cs`
**Class**: StatContainer, DebugStat
**NS**: ProjectAegis.NetPlay
**Methods**: GenerateBuffTicket, Init, GetStat, TryGetStat, GetValue, SetCurrentWeaponID, Rebuild, AddBuffStat, RemoveBuffStat, RemoveBuffStats, AddBuffRateStat, RemoveBuffRateStat, RemoveBuffRateStats, AddSkillPropertyStat, GetSkillPropertyStat, AddWeaponStat, RemoveWeaponStat, AddAdditionalBuffStat, RemoveAdditionalBuffStat, GetAdditionalBuffStatValue, GetAdditionalBuffStat, AddWeaponSpecificBuffStat, RemoveWeaponSpecificBuffStat, AddWeaponSpecificBuffRateStat, RemoveWeaponSpecificBuffRateStat

### `StatMapper.cs`
Path: `NetworkClient/NetPlay/Stat/StatMapper.cs`
**Class**: StatMapper
**NS**: ProjectAegis.NetPlay
**Methods**: From, TryMapFieldNameToEStatType, SnakeToPascal, IsNumeric, ConvertToInt

### `StatModifier.cs`
Path: `NetworkClient/NetPlay/Stat/StatModifier.cs`
**Class**: EStatModOp, StatModifier
**NS**: ProjectAegis.NetPlay
**Methods**: StatModifier

### `StatUtils.cs`
Path: `NetworkClient/NetPlay/Stat/StatUtils.cs`
**Class**: StatUtils
**NS**: ProjectAegis.NetPlay
**Methods**: CreateStat

## `NetworkDev/03.ReferenceManager/02.ReferenceTable/`

### `RefBotActionStat.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBotActionStat.cs`
**Class**: CRefBotActionStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotActionStat, RegisterRefBotActionStatBinary, FindRefBotActionStat, GetRefBotActionStats

### `RefCharacterStat.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCharacterStat.cs`
**Class**: CRefCharacterStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterStat, RegisterRefCharacterStatBinary, FindRefCharacterStat, GetRefCharacterStats

### `RefMapObjectStat.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefMapObjectStat.cs`
**Class**: CRefMapObjectStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefMapObjectStat, RegisterRefMapObjectStatBinary, FindRefMapObjectStat, GetRefMapObjectStats

### `RefStat.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefStat.cs`
**Class**: CRefStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefStat, RegisterRefStatBinary, FindRefStat, GetRefStats

### `RefStatusEffect.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefStatusEffect.cs`
**Class**: CRefStatusEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefStatusEffect, RegisterRefStatusEffectBinary, FindRefStatusEffect, GetRefStatusEffects

### `RefStatusEffectFunction.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefStatusEffectFunction.cs`
**Class**: CRefStatusEffectFunction, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefStatusEffectFunction, RegisterRefStatusEffectFunctionBinary, FindRefStatusEffectFunction, GetRefStatusEffectFunctions

### `RefStatusEffectGroup.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefStatusEffectGroup.cs`
**Class**: CRefStatusEffectGroup, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefStatusEffectGroup, RegisterRefStatusEffectGroupBinary, FindRefStatusEffectGroup, GetRefStatusEffectGroups

### `RefWeaponSelfStat.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefWeaponSelfStat.cs`
**Class**: CRefWeaponSelfStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefWeaponSelfStat, RegisterRefWeaponSelfStatBinary, FindRefWeaponSelfStat, GetRefWeaponSelfStats

### `RefWeaponStat.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefWeaponStat.cs`
**Class**: CRefWeaponStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefWeaponStat, RegisterRefWeaponStatBinary, FindRefWeaponStat, GetRefWeaponStats

### `RefWeaponStatDisplay.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefWeaponStatDisplay.cs`
**Class**: CRefWeaponStatDisplay, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefWeaponStatDisplay, RegisterRefWeaponStatDisplayBinary, FindRefWeaponStatDisplay, GetRefWeaponStatDisplays

## `OrleansX.Grains/`

### `StatefulGrainBase.cs`
Path: `OrleansX.Grains/StatefulGrainBase.cs`
**Class**: StatefulGrainBase
**NS**: OrleansX.Grains
**Methods**: SaveStateAsync, ReadStateAsync, ClearStateAsync, UpdateStateAsync, OnActivateAsync, OnDeactivateAsync, StatefulGrainBase

### `StatelessGrainBase.cs`
Path: `OrleansX.Grains/StatelessGrainBase.cs`
**Class**: StatelessGrainBase
**NS**: OrleansX.Grains
**Methods**: OnActivateAsync, OnDeactivateAsync, StatelessGrainBase

## `ReferenceTable/`

### `RefBotActionStat.cs`
Path: `ReferenceTable/RefBotActionStat.cs`
**Class**: CRefBotActionStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotActionStat, RegisterRefBotActionStatBinary, FindRefBotActionStat, GetRefBotActionStats

### `RefCharacterStat.cs`
Path: `ReferenceTable/RefCharacterStat.cs`
**Class**: CRefCharacterStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterStat, RegisterRefCharacterStatBinary, FindRefCharacterStat, GetRefCharacterStats

### `RefMapObjectStat.cs`
Path: `ReferenceTable/RefMapObjectStat.cs`
**Class**: CRefMapObjectStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefMapObjectStat, RegisterRefMapObjectStatBinary, FindRefMapObjectStat, GetRefMapObjectStats

### `RefStat.cs`
Path: `ReferenceTable/RefStat.cs`
**Class**: CRefStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefStat, RegisterRefStatBinary, FindRefStat, GetRefStats

### `RefStatusEffect.cs`
Path: `ReferenceTable/RefStatusEffect.cs`
**Class**: CRefStatusEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefStatusEffect, RegisterRefStatusEffectBinary, FindRefStatusEffect, GetRefStatusEffects

### `RefStatusEffectFunction.cs`
Path: `ReferenceTable/RefStatusEffectFunction.cs`
**Class**: CRefStatusEffectFunction, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefStatusEffectFunction, RegisterRefStatusEffectFunctionBinary, FindRefStatusEffectFunction, GetRefStatusEffectFunctions

### `RefStatusEffectGroup.cs`
Path: `ReferenceTable/RefStatusEffectGroup.cs`
**Class**: CRefStatusEffectGroup, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefStatusEffectGroup, RegisterRefStatusEffectGroupBinary, FindRefStatusEffectGroup, GetRefStatusEffectGroups

### `RefWeaponSelfStat.cs`
Path: `ReferenceTable/RefWeaponSelfStat.cs`
**Class**: CRefWeaponSelfStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefWeaponSelfStat, RegisterRefWeaponSelfStatBinary, FindRefWeaponSelfStat, GetRefWeaponSelfStats

### `RefWeaponStat.cs`
Path: `ReferenceTable/RefWeaponStat.cs`
**Class**: CRefWeaponStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefWeaponStat, RegisterRefWeaponStatBinary, FindRefWeaponStat, GetRefWeaponStats

### `RefWeaponStatDisplay.cs`
Path: `ReferenceTable/RefWeaponStatDisplay.cs`
**Class**: CRefWeaponStatDisplay, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefWeaponStatDisplay, RegisterRefWeaponStatDisplayBinary, FindRefWeaponStatDisplay, GetRefWeaponStatDisplays

## `ScriptDev/Contents/Core/AimAssistSystem/`

### `AimAssistState.cs`
Path: `ScriptDev/Contents/Core/AimAssistSystem/AimAssistState.cs`
**Class**: AimAssistState, EAimAssistState
**NS**: ProjectAegis.NetPlay
**Methods**: Enter, Update, Exit, AimAssistState

### `AimAssistStateCooldown.cs`
Path: `ScriptDev/Contents/Core/AimAssistSystem/AimAssistStateCooldown.cs`
**Class**: AimAssistStateCooldown
**NS**: ProjectAegis.NetPlay
**Methods**: Update, AimAssistStateCooldown

### `AimAssistStateFirstShot.cs`
Path: `ScriptDev/Contents/Core/AimAssistSystem/AimAssistStateFirstShot.cs`
**Class**: AimAssistStateFirstShot
**NS**: ProjectAegis.NetPlay
**Methods**: Update, AimAssistStateFirstShot

### `AimAssistStateNone.cs`
Path: `ScriptDev/Contents/Core/AimAssistSystem/AimAssistStateNone.cs`
**Class**: AimAssistStateNone
**NS**: ProjectAegis.NetPlay
**Methods**: Update, AimAssistStateNone

### `AimAssistStateSustained.cs`
Path: `ScriptDev/Contents/Core/AimAssistSystem/AimAssistStateSustained.cs`
**Class**: AimAssistStateSustained
**NS**: ProjectAegis.NetPlay
**Methods**: Update, AimAssistStateSustained

## `ScriptDev/Contents/Core/AutoFireSystem/`

### `AutoFireState.cs`
Path: `ScriptDev/Contents/Core/AutoFireSystem/AutoFireState.cs`
**Class**: AutoFireState, EAutoFireState
**NS**: ProjectAegis.NetPlay
**Methods**: Enter, Update, Exit, AutoFireState

### `AutoFireStateAcquire.cs`
Path: `ScriptDev/Contents/Core/AutoFireSystem/AutoFireStateAcquire.cs`
**Class**: AutoFireStateAcquire
**Methods**: Enter, Update, AutoFireStateAcquire

### `AutoFireStateFire.cs`
Path: `ScriptDev/Contents/Core/AutoFireSystem/AutoFireStateFire.cs`
**Class**: AutoFireStateFire
**Methods**: Enter, Exit, Update, AutoFireStateFire

### `AutoFireStateSearch.cs`
Path: `ScriptDev/Contents/Core/AutoFireSystem/AutoFireStateSearch.cs`
**Class**: AutoFireStateSearch
**Methods**: Enter, Update, AutoFireStateSearch

### `AutoFireStateWait.cs`
Path: `ScriptDev/Contents/Core/AutoFireSystem/AutoFireStateWait.cs`
**Class**: AutoFireStateWait
**Methods**: Enter, Update, AutoFireStateWait

## `ScriptDev/Manager/`

### `CCombatManager.cs`
Path: `ScriptDev/Manager/CCombatManager.cs`
**Class**: CCombatManager, ECombatCategory, ECombatType, CombatData
**Methods**: Init, Disabled, Release, GetCombatCategory, IsTargetAlly, IsActivatedCategory, SetCombatDataMaxCount, GetCombatDataMaxCount, AddCombatData, IsValidCombatData, RemoveCombatData, IsTargetInCameraView, IsInViewport, GetOverlapIndex, OnTakeDamage, OnTakeDamageByStatusEffect, OnTakeDamageByCurse, OnTakeHeal, OnStatusEffectImmune

## `ScriptDev/UI/`

### `CUICombatDisplay.cs`
Path: `ScriptDev/UI/CUICombatDisplay.cs`
**Class**: CUICombatDisplay
**Methods**: Awake, GetCombatText, ShowCombatText, OverrideCambatText, HideCombatText

### `CUICombatText.cs`
Path: `ScriptDev/UI/CUICombatText.cs`
**Class**: CUICombatText
**Methods**: Awake, Update, SetData, Hide, GetCombatValueString, SetGradientColor, GetWidgetPosition, UpdateCombatText, OnCompleteAnimation

### `CUIHitDirection.cs`
Path: `ScriptDev/UI/CUIHitDirection.cs`
**Class**: CUIHitDirection, HitInstance
**Methods**: Refresh, Awake, SetPlayer, Update, OnTakeDamage, GetCameraForward, CalculateAngle, GetSignedAngle, GetHitInstance, ReturnToPool

### `CUIHitFeedbackComponent.cs`
Path: `ScriptDev/UI/CUIHitFeedbackComponent.cs`
**Class**: CUIHitFeedbackComponent
**Methods**: Initialize, PlayFeedback, UpdateLogic, StopFeedback

## `ScriptDev/UI/InGame/`

### `CUIHUDCaptureState.cs`
Path: `ScriptDev/UI/InGame/CUIHUDCaptureState.cs`
**Class**: CUIHUDCaptureState, ECaputreProgessTendency
**NS**: ProjectAegis.UI
**Methods**: BindUI, Init, ConnectToCaptureSystem, SyncState, DelayedShowSystemMessage, ShowStateMessage, ShowCaptureProgressMessage, OnDestroy, SetProgress, SetMemberCount, OnChangeState, SetActiveStateExclusive, OnChangeCaptureProgress, OnChangeMemberCount

### `CUIHUDCaptureStateColor.cs`
Path: `ScriptDev/UI/InGame/CUIHUDCaptureStateColor.cs`
**Class**: CUIHUDCaptureStateColor

### `CUIHUDGameState.cs`
Path: `ScriptDev/UI/InGame/CUIHUDGameState.cs`
**Class**: CUIHUDGameState
**NS**: ProjectAegis.UI
**Methods**: BindUI, Init, ConnectToCaptureSystem, UpdateProgress, UpdateScore, Reset, UpdateControlModeChangedCaptureProgress

### `CUIIngameRoundStatus.cs`
Path: `ScriptDev/UI/InGame/CUIIngameRoundStatus.cs`
**Class**: EUIIngameRoundStatusRoundResult, CUIIngameRoundStatus, RoundResultUI
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, PrepareContent, Setup, Show, Setcontents

## `ScriptDev/UI/Lobby/Party/`

### `CUIPartyStateInfoBtn.cs`
Path: `ScriptDev/UI/Lobby/Party/CUIPartyStateInfoBtn.cs`
**Class**: CUIPartyStateInfoBtn, LobbyBtnState, ReadyInfoSlot
**NS**: ProjectAegis.UI
**Methods**: RegisterEvents, UnregisterEvents, RefreshUI, SetActive, UpdateMemberSlots, ResolveState, ApplyState, ClearAllSlots, OnPartyInfoChanged, OnMatchMakingChanged, UpdateMatchingTime, OnButtonMatchStart, OnButtonReadyOn, OnButtonReadyCancel, OnButtonMatchCancel, Dispose, SetAssigned, SetReadyState, Clear, CUIPartyStateInfoBtn, ReadyInfoSlot

## `ScriptDev/UI/Profile/Elements/`

### `UIEditProfilePageStatistics.cs`
Path: `ScriptDev/UI/Profile/Elements/UIEditProfilePageStatistics.cs`
**Class**: UIEditProfilePageStatistics, SelectSlot
**NS**: ProjectAegis.UI.Profile
**Methods**: SetSelection, SetValueData, OnBtnToggleButton, BindUI, OnPageActived, OnPageDeactived, RefreshSelectCount, RefreeshSelectionDatas, RefreshUISelection, OnTrySelectChange, OnGS2C_SetSelectedStatisticsAck, SelectSlot, UIEditProfilePageStatistics

### `UIProfilePageStatistics.cs`
Path: `ScriptDev/UI/Profile/Elements/UIProfilePageStatistics.cs`
**Class**: UIProfilePageStatistics, CharcterSlot
**NS**: ProjectAegis.UI.Profile
**Methods**: SetSelect, SetActive, OnClickSlot, BindUI, RefreshContent, Setup, UpdateStaticContent, OnSelectCharacter, OnSelectBattleTypeEvent, CharcterSlot, UIProfilePageStatistics

## `ScriptDev/UI/ReferenceTable/`

### `RefStatExtension.cs`
Path: `ScriptDev/UI/ReferenceTable/RefStatExtension.cs`
**Class**: CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: GetStatLocalizationKey, GetStatDisplayValue, GetDetailStats, GetWeaponDetailStats, GetMoaMaxDisplayValue

## `ScriptDev/UI/Utilities/`

### `OutGameStatContainer.cs`
Path: `ScriptDev/UI/Utilities/OutGameStatContainer.cs`
**Class**: EStatQueryType, EStatBuildDirtyFlag, StatDifference, OutGameStatSnapshot, WeaponStatSnapshot, CharacterStatLayer, WeaponStatLayer, PassiveStatLayer, OutGameStatContainer
**NS**: ProjectAegis.Data
**Methods**: GetDifference, GetDifferencePercent, GetBeforeValue, GetAfterValue, GetChangedStats, GetIncreasedStats, GetDecreasedStats, GetValue, Init, GetBaseValue, GetAllBaseStats, GetStatTypes, SetDirty, FindCharacterStatByLevel, InitWeaponOnly, LoadWeaponStats, LoadModuleStats, LoadPerkStats, ApplyPerkEffect, LoadPassiveModuleStats, ApplyPassiveEffectToDict, GetWeaponOnlyStat, GetWeaponWithModuleStat, GetModuleOnlyStat, GetWeaponOnlyStats (+ 35 more)

## `ScriptDev/Utilities/`

### `CStateRunner.cs`
Path: `ScriptDev/Utilities/CStateRunner.cs`
**Class**: StateRunner
**NS**: ProjectAegis.Utility
**Methods**: Register, Start, Update, EnterState, MoveNext

## `ScriptDev/Utilities/StateTag/`

### `StateTag.cs`
Path: `ScriptDev/Utilities/StateTag/StateTag.cs`
**Class**: StateTag, StateTagSet, 기반이
**NS**: ProjectAegis.Utility
**Methods**: Add, Set, Remove, Clear, ToIndex, AddTag, RemoveTag, ClearAll, HasTag, SetTagValue, MakeSync, StateTagSet

### `StateTagMap.cs`
Path: `ScriptDev/Utilities/StateTag/StateTagMap.cs`
**Class**: StateTagMap
**NS**: ProjectAegis.Utility
**Methods**: AddTag, RemoveTag, Clear, ClearAll, HasTag, GetTagCount, SetTagValue, GetAllKeys

## `ScriptTools/Editor/`

### `OutGameStatViewer.cs`
Path: `ScriptTools/Editor/OutGameStatViewer.cs`
**Class**: OutGameStatViewer, CharacterInfo, WeaponOption, PassiveOption, ModuleOption, CodeSample
**Methods**: Open, OpenWithCharacter, OpenWithCharacterAndEquipment, SelectCharacterWithEquipment, SelectCharacterByID, OnEnable, OnGUI, DrawCopyNotification, InitStyles, TryLoadRefData, LoadRefData, DrawBackground, DrawHeader, DrawToolbar, DrawWarningBox, DrawInfoBox, DrawCharacterSelector, DrawCharacterInfoPanel, DrawTabs, DrawTabContent, DrawStatsTab, DrawEquipmentTab, DrawWeaponSlot, DrawModuleSlots, GetModuleStatSummary (+ 35 more)

## `ScriptTools/Editor/CharacterSetupTools/Modules/`

### `HitReactionModule.cs`
Path: `ScriptTools/Editor/CharacterSetupTools/Modules/HitReactionModule.cs`
**Class**: HitPointData, BoneLinkData, BoneHitPointData, HitReactionModule
**NS**: ProjectAegis.EditorTools
**Methods**: Reset, Collect, Apply, HitPointData, BoneHitPointData, HitReactionModule

## `ScriptTools/LevelTools/`

### `CombatSectorChecker.cs`
Path: `ScriptTools/LevelTools/CombatSectorChecker.cs`
**Class**: CombatSectorChecker, SectorData, CellData, RayData, VertexData, CombatSectorCheckerEditor
**Methods**: OnEnable, Update, OnDestroy, ClearMeshes, UpdateSectors, CalculateSectorData, CreateSectorMesh, CreateGroundCircleMesh, GetDirectionFromAngles, GetSectors, GetSectorIndexForPosition, IsCombatZone, GetMeshMaterial, OnDrawGizmos, OnDrawGizmosSelected, DrawVerticalArc, DrawBoundaries, DrawGridPoints, OnInspectorGUI

### `CombatSimulationWindow.cs`
Path: `ScriptTools/LevelTools/CombatSimulationWindow.cs`
**Class**: CombatSimulationWindow
**NS**: ProjectAegis.NetPlay
**Methods**: ShowWindow, OnEnable, OnDisable, OnPlayModeStateChanged, FindSimulationManager, InitStyles, OnGUI, DrawHeader, DrawNotPlayingMode, DrawNoManagerFound, DrawSettings, DrawControls, DrawStatus, DrawResults, CreateSimulationManager, CreateSimulationManagerRuntime, OpenHeatmapFolder, OpenHeatmapViewer

## `ScriptTools/LevelTools/Editor/`

### `ReplaceWithPrefab.cs`
Path: `ScriptTools/LevelTools/Editor/ReplaceWithPrefab.cs`
**Class**: ReplaceWithPrefab
**Methods**: CreateReplaceWithPrefab, OnGUI

## `ScriptTools/ZString/Unity/`

### `TextMeshProExtensions.cs`
Path: `ScriptTools/ZString/Unity/TextMeshProExtensions.cs`
**Class**: TextMeshProExtensions
**NS**: Cysharp.Text

### `TextMeshProExtensions.SetStringBuilder.cs`
Path: `ScriptTools/ZString/Unity/TextMeshProExtensions.SetStringBuilder.cs`
**Class**: TextMeshProExtensions
**NS**: Cysharp.Text
**Methods**: SetText


