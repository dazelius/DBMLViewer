# Effect System Code Guide
> Auto-generated: 2026-02-25 13:31 | 89 files

## `Components/`

### `EffectEventKey.cs`
Path: `Components/EffectEventKey.cs`
**Class**: EffectEventKey
**Methods**: OnParticleSystemStopped

## `NetworkClient/NetPlay/Character/`

### `CharacterStatusEffectInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterStatusEffectInterface.cs`
**Class**: EStatusEffectResult, DamageDealRecord, Character
**NS**: ProjectAegis.NetPlay
**Methods**: InitStatusEffectSystem, InitStateTagSync, UpdateStatusEffect, CanApplyStatusEffect, GetApplyStatusEffectStackCount, ApplyStatusEffect, AddStatusEffect, ClientApplyStatusEffect, Editor_ApplyStatusEffect, RemoveStatusEffectByInstanceID, RemoveAllStatusEffects, ModifySkillStackMax, SyncStatusEffects, ApplySyncStatusEffects, ClientRemoveStatusEffectByInstanceID, RecordDamageDeal, GetDamageRecord, BeginDamageDealRecord, EndDamageDealRecord, ClearDamageDealRecord, AddStateTag, RemoveStateTag, HasStateTag, HasInputBlockingStateTag, HasInputAttackBlockingStateTag (+ 11 more)

## `NetworkClient/NetPlay/Character/FSM/Layers/`

### `StatusEffectLayer.cs`
Path: `NetworkClient/NetPlay/Character/FSM/Layers/StatusEffectLayer.cs`
**Class**: StatusEffectLayer, ActiveStateInfo
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Increment, Decrement, Update, AddState, GetState, Activate, Deactivate, ActiveStateInfo, StatusEffectLayer

## `NetworkClient/NetPlay/Character/FSM/States/`

### `StatusEffectState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/StatusEffectState.cs`
**Class**: StatusEffectState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, StatusEffectState

## `NetworkClient/NetPlay/Character/Passive/Editor/`

### `CharacterDetailStatusEffect.cs`
Path: `NetworkClient/NetPlay/Character/Passive/Editor/CharacterDetailStatusEffect.cs`
**Class**: CharacterDetailStatusEffect
**NS**: ProjectAegis.Tool
**Methods**: DrawName, DrawView, CharacterDetailStatusEffect

## `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/`

### `SpawnFX.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/SpawnFX.cs`
**Class**: EFXAttached, SpawnFX
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: IsSkipOnPureServer, Activated, RestartFx, StopFX, FadeOutAndStopFX, OnOwnerHiddenChanged, FindOwnerBoneTransform, SpawnEffect, Terminated, OnDestroy, PostLoad, SpawnFX

## `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/`

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

## `NetworkClient/NetPlay/Interaction/Handlers/Character/`

### `AddStatusEffectHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Character/AddStatusEffectHandler.cs`
**Class**: AddStatusEffectHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

### `RemoveStatusEffectHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Character/RemoveStatusEffectHandler.cs`
**Class**: RemoveStatusEffectHandler
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

## `NetworkDev/03.ReferenceManager/02.ReferenceTable/`

### `RefEffect.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefEffect.cs`
**Class**: CRefEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefEffect, RegisterRefEffectBinary, FindRefEffect, GetRefEffects

### `RefPassiveEffect.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefPassiveEffect.cs`
**Class**: CRefPassiveEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefPassiveEffect, RegisterRefPassiveEffectBinary, FindRefPassiveEffect, GetRefPassiveEffects

### `RefPerkEffect.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefPerkEffect.cs`
**Class**: CRefPerkEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefPerkEffect, RegisterRefPerkEffectBinary, FindRefPerkEffect, GetRefPerkEffects

### `RefSkillExecuteEffect.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefSkillExecuteEffect.cs`
**Class**: CRefSkillExecuteEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillExecuteEffect, RegisterRefSkillExecuteEffectBinary, FindRefSkillExecuteEffect, GetRefSkillExecuteEffects

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

## `ReferenceTable/`

### `RefEffect.cs`
Path: `ReferenceTable/RefEffect.cs`
**Class**: CRefEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefEffect, RegisterRefEffectBinary, FindRefEffect, GetRefEffects

### `RefPassiveEffect.cs`
Path: `ReferenceTable/RefPassiveEffect.cs`
**Class**: CRefPassiveEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefPassiveEffect, RegisterRefPassiveEffectBinary, FindRefPassiveEffect, GetRefPassiveEffects

### `RefPerkEffect.cs`
Path: `ReferenceTable/RefPerkEffect.cs`
**Class**: CRefPerkEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefPerkEffect, RegisterRefPerkEffectBinary, FindRefPerkEffect, GetRefPerkEffects

### `RefSkillExecuteEffect.cs`
Path: `ReferenceTable/RefSkillExecuteEffect.cs`
**Class**: CRefSkillExecuteEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillExecuteEffect, RegisterRefSkillExecuteEffectBinary, FindRefSkillExecuteEffect, GetRefSkillExecuteEffects

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

## `ScriptDev/EffectTest/`

### `EffectTestManager.cs`
Path: `ScriptDev/EffectTest/EffectTestManager.cs`
**Class**: EffectTestManager, EnvMode
**NS**: Aegis.EffectTools
**Methods**: Awake, Start, LoadAssets, CoStartLocalHost, CoWaitForLocalCharacter, PreloadWeaponEffects, SpawnTestCharacter, SpawnAndEquipSequence, ReuseCharacter, CleanupInvalidCharacter, SpawnNewCharacter, SpawnDummyTarget, SetDummyDistance, SpawnAllyTarget, SetAllyDistance, SetDummyRotation, SetAllyRotation, SetCharacterRotation, SpawnDummyTargetInternal, TriggerAllySkill, TriggerEnemySkill, EquipWeapon, CoEquipWeapon, FireWeapon, SetAutoFire (+ 32 more)

## `ScriptDev/Manager/`

### `EffectManager.cs`
Path: `ScriptDev/Manager/EffectManager.cs`
**Class**: EffectManager
**Methods**: SpawnEffect, DespawnEffect, CheckEffecEvent

## `ScriptDev/Rendering/MaterialEffect/`

### `MaterialEffect.cs`
Path: `ScriptDev/Rendering/MaterialEffect/MaterialEffect.cs`
**Class**: MaterialEffect
**NS**: Aegis.Rendering
**Methods**: Apply, Remove, GetCurrentType, GetCurrentMaterial, ResetCurrentMaterial, LoadMaterials, ClearAll, AddMaterialEffectController

### `MaterialEffectController.cs`
Path: `ScriptDev/Rendering/MaterialEffect/MaterialEffectController.cs`
**Class**: MaterialEffectController, Target
**NS**: Aegis.Rendering
**Methods**: GetAllEffectControllers, GetCurrentType, GetCurrentMaterial, OnDestroy, RefreshTargets, IsWeaponMesh, SetEffect, ClearEffect, ResetEffect, _EnsureEffectMaterial, _EnsureTransitionMaterial, _SetEffect, _Transition, _StopTransition, _UpdateTransitionOverlayFade, _TransitionCoroutine, IsNeedCombineSubmesh, HasCombinedSubmesh, CombineSubmesh

### `MaterialEffectLibrary.cs`
Path: `ScriptDev/Rendering/MaterialEffect/MaterialEffectLibrary.cs`
**Class**: MaterialEffectType, MaterialEffectLibrary
**NS**: Aegis.Rendering
**Methods**: Init, LoadMaterials, UnloadMaterials, GetMaterial, GetPath

### `MaterialEffectRenderFeature.cs`
Path: `ScriptDev/Rendering/MaterialEffect/MaterialEffectRenderFeature.cs`
**Class**: MaterialEffectRenderFeature
**NS**: Aegis.Rendering
**Methods**: Create, AddRenderPasses

### `MaterialEffectTransitionRenderPass.cs`
Path: `ScriptDev/Rendering/MaterialEffect/MaterialEffectTransitionRenderPass.cs`
**Class**: MaterialEffectTransitionRenderPass, PassData
**NS**: Aegis.Rendering
**Methods**: RecordRenderGraph, Dispose, MaterialEffectTransitionRenderPass

## `ScriptDev/Scripts_fx/`

### `FxLineDraw.cs`
Path: `ScriptDev/Scripts_fx/FxLineDraw.cs`
**Class**: FxLineDraw
**Methods**: Awake, OnDisable, Start, Draw, Update, SetParticleOptions, SetAdditiveLineRenderer, SetPositions, ClearPosition

## `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/`

### `AnimatableProperty.cs`
Path: `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/AnimatableProperty.cs`
**Class**: AnimatableProperty, ShaderPropertyType
**NS**: Coffee.UIExtensions
**Methods**: UpdateMaterialProperties, OnBeforeSerialize, OnAfterDeserialize

### `BakingCamera.cs`
Path: `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/BakingCamera.cs`
**Class**: BakingCamera
**NS**: Coffee.UIParticleExtensions
**Methods**: Create, Awake, GetCamera

### `CombineInstanceEx.cs`
Path: `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/CombineInstanceEx.cs`
**Class**: CombineInstanceEx
**NS**: Coffee.UIParticleExtensions
**Methods**: Combine, Clear, Push

### `MeshHelper.cs`
Path: `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/MeshHelper.cs`
**Class**: MeshHelper
**NS**: Coffee.UIParticleExtensions
**Methods**: Init, Get, GetTemporaryMesh, Push, Clear, CombineMesh, DiscardTemporaryMesh

### `ModifiedMaterial.cs`
Path: `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/ModifiedMaterial.cs`
**Class**: ModifiedMaterial, MatEntry
**NS**: Coffee.UIParticleExtensions
**Methods**: Add, Remove, DestroyImmediate

### `UIParticle.cs`
Path: `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/UIParticle.cs`
**Class**: UIParticle
**NS**: Coffee.UIExtensions
**Methods**: Play, Pause, Stop, Clear, SetParticleSystemInstance, SetParticleSystemPrefab, RefreshParticles, UpdateMaterial, ClearPreviousMaterials, GetModifiedMaterial, UpdateMaterialProperties, OnEnable, Start, OnDisable, UpdateGeometry, OnDidApplyAnimationProperties, InitializeIfNeeded, OnValidate

### `UIParticleUpdater.cs`
Path: `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/UIParticleUpdater.cs`
**Class**: UIParticleUpdater
**NS**: Coffee.UIExtensions
**Methods**: Register, Unregister, InitializeOnLoad, Refresh, ModifyScale, GetScaledMatrix, BakeMesh, CanBakeMesh

### `Utils.cs`
Path: `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/Utils.cs`
**Class**: SpriteExtensions, ListExtensions, MeshExtensions, MeshPool, CombineInstanceArrayPool, ParticleSystemExtensions
**NS**: Coffee.UIParticleExtensions
**Methods**: GetActualTexture, SequenceEqualFast, CountFast, Clear, Init, Rent, Return, Get, SortForRendering, GetIndex, GetMaterialHash, GetTextureForSprite, Exec

## `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/Editor/`

### `AnimatedPropertiesEditor.cs`
Path: `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/Editor/AnimatedPropertiesEditor.cs`
**Class**: AnimatedPropertiesEditor
**NS**: Coffee.UIExtensions
**Methods**: CollectActiveNames, DrawAnimatableProperties, AddMenu

### `ImportSampleMenu.cs`
Path: `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/Editor/ImportSampleMenu.cs`
**Class**: ImportSampleMenu_UIParticle
**NS**: Coffee.UIExtensions
**Methods**: ImportSample, ImportSample_CFX, GetPreviousSamplePath

### `UIParticleEditor.cs`
Path: `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/Editor/UIParticleEditor.cs`
**Class**: UIParticleEditor
**NS**: Coffee.UIExtensions
**Methods**: OnEnable, MaterialField, OnInspectorGUI, DrawFloatOrVector3Field

### `UIParticleMenu.cs`
Path: `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/Editor/UIParticleMenu.cs`
**Class**: UIParticleMenu
**NS**: Coffee.UIExtensions
**Methods**: AddParticleEmpty, AddParticle

## `ScriptDev/Sound/`

### `CEffectSound.cs`
Path: `ScriptDev/Sound/CEffectSound.cs`
**Class**: CEffectSound, CEffectSoundEditor
**Methods**: OnEnable, OnDisable, PlaySound, StopSound, Reset, FilterList, OnInspectorGUI

## `ScriptTools/Editor/WeaponTools/Effect/`

### `EffectTestWindow.cs`
Path: `ScriptTools/Editor/WeaponTools/Effect/EffectTestWindow.cs`
**Class**: EffectTestWindow, RowData, CameraViewType
**NS**: Aegis.EditorTools
**Methods**: ShowWindow, OpenManual, OnEnable, OnDisable, OnDestroy, OnPlayModeStateChanged, OnGUI, DrawTargetSection, UpdateAutoFireIntervalRange, DrawDistanceButtons, DrawRotationButtons, DrawSkillButtons, DrawInvincibilityToggle, SetCameraPOV, CheckNRefreshRefData, DrawCharacterDropdown, OpenOrCreateScene

### `EffectTestWindow.SceneBuilder.cs`
Path: `ScriptTools/Editor/WeaponTools/Effect/EffectTestWindow.SceneBuilder.cs`
**Class**: EffectTestWindow
**NS**: Aegis.EditorTools
**Methods**: OpenOrCreateTestScene, CreateNewScene, EnsureEnvironmentSetup, SetupManagers

## `ScriptTools/Editor/WeaponTools/Preview/`

### `WeaponPreviewEditor.Effect.cs`
Path: `ScriptTools/Editor/WeaponTools/Preview/WeaponPreviewEditor.Effect.cs`
**Class**: WeaponPreviewEditor, ActiveEffect
**NS**: Aegis.EditorTools
**Methods**: RegisterWeaponParticles, InitEffectData, ResetEffectData, RefreshEffectData, RefreshEffectFoldOut, MakeEffectSetting, DrawEffectNSoundSetting, DrawEffect, DrawEffectInfo, PlayEffect, ResetPlayEffect, EffectUpdate, DrawWeaponEffect, GetTotalDuration

## `ScriptTools/Editor/WeaponTools/PropertyDrawer/`

### `CWeaponEffect_PropertyDrawer.cs`
Path: `ScriptTools/Editor/WeaponTools/PropertyDrawer/CWeaponEffect_PropertyDrawer.cs`
**Class**: CWeaponEffect_PropertyDrawer
**NS**: Aegis.EditorTools
**Methods**: OnGUI, DrawEffectTypeOfSubType, DrawEffectID, GetPropertyHeight


