# Skill System Code Guide
> Auto-generated: 2026-02-25 13:31 | 151 files

## `Aegis.NetworkShared/`

### `RecvBuffer.cs`
Path: `Aegis.NetworkShared/RecvBuffer.cs`
**Class**: RecvBuffer
**NS**: Aegis.NetworkShared
**Methods**: Clean, OnRead, OnWrite, RecvBuffer

## `NetworkClient/NetPlay/AI/`

### `AIActionBrainV2_SkillDecision.cs`
Path: `NetworkClient/NetPlay/AI/AIActionBrainV2_SkillDecision.cs`
**Class**: ESkillTargetResultType, AIActionBrainV2, SkillDecisionState
**NS**: ProjectAegis.NetPlay
**Methods**: ResetOnSuccess, OnFailed, UpdateSkillDecision, TryStartIncorrectSkillPrepare, StartSkillPrepareForIncorrectUsage, UpdateSkillPrepareTime, StartSkillPrepare, ClearSkillPrepareState, ReserveSkillDecision, TryEvaluateSkillDecision, IsSkillCooldownReady, IsSkillDisabled, CalculateBonusRate, RollSkillDecisionRate, TryGetSkillTarget, TryGetNearestAlly, TryGetAllyHpLowestNearBy, TryGetNearestAllyByClass, TryGetMainTarget, TryGetNearestEnemyTarget, TryGetEnemyHpLowestNearBy, TryGetMainTargetPosition, TryGetDirectionToEnemyNearest, TryGetDirectionFromEnemyNearest, TryGetDirectionToAllyNearest (+ 13 more)

## `NetworkClient/NetPlay/AI/Actions/`

### `AIActionActiveSkill.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionActiveSkill.cs`
**Class**: AIActionActiveSkill
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, OnActionEnd, Update, AIActionActiveSkill

### `AIActionSkillDamage.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionSkillDamage.cs`
**Class**: AIActionSkillDamage
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, OnActionEnd, Update, AIActionSkillDamage

## `NetworkClient/NetPlay/Character/`

### `CharacterPassiveInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterPassiveInterface.cs`
**Class**: Character
**NS**: ProjectAegis.NetPlay
**Methods**: GetPassiveDefrredDamageRate, AddPassiveSkill, RemovePassiveSkill, RemoveAllPassiveSkills, ResetPassiveSkills

### `CharacterSkillInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterSkillInterface.cs`
**Class**: SkillCooldownData, ECharacterStateTagType, Character
**NS**: ProjectAegis.NetPlay
**Methods**: OnSkillStart, OnSkillEnd, StartSkillCoolTime, ModifySkillCoolTime, ModifyAllSkillCoolTime, ResetAllSkillWeapons, SkillCooldownData

## `NetworkClient/NetPlay/Character/FSM/Layers/`

### `SkillStateLayer.cs`
Path: `NetworkClient/NetPlay/Character/FSM/Layers/SkillStateLayer.cs`
**Class**: SkillStateLayer
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: SetDefaultState, IsDefaultState, GetState, Init, ChangeState, ChangeStateForce, ChangeToDefaultState, Update, SkillStateLayer

## `NetworkClient/NetPlay/Character/Passive/`

### `PassiveSkill.cs`
Path: `NetworkClient/NetPlay/Character/Passive/PassiveSkill.cs`
**Class**: PassiveSkill, EPassiveSkillState
**NS**: ProjectAegis.NetPlay
**Methods**: Init, GetPassiveInvoker, GetPassiveExecutor, OnRecieveExecutorActivateEvent, OnReceiveTerminateEvent, OnStartGame, SetCooldown, SetPassiveSkillState, ActivateExectutor, ClientActivate, Enabled, CheckActivateCountLimit, Update, Terminate, ClientTerminate, OnRemove, OnDestroy, PassiveSkill

### `PassiveSkillSystem.cs`
Path: `NetworkClient/NetPlay/Character/Passive/PassiveSkillSystem.cs`
**Class**: PassiveSkillSync, PassiveSkillSystem
**NS**: ProjectAegis.NetPlay
**Methods**: Awake, GetNextInstanceID, OnStartServer, InitPassiveSkillSync, OnStartClient, FixedUpdate, OnPassiveSkillSync, ApplyPassiveSkillSync, AddPassiveSkill, ClientAddPassiveSkill, RemovePassiveSkill, RemoveAllPassiveSkills, ClientRemovePassiveSkill, HasPassiveSkill, OnStartGamePassive, OnPassiveSkillActivateStateChanged, UpdatePassiveSkills, DisalbeOnDestroy, DebugGUI

### `SkillModification.cs`
Path: `NetworkClient/NetPlay/Character/Passive/SkillModification.cs`
**Class**: SkillModifier, SwapExecuteRangeId_Modifier, SwapExecuteRangeValue_Modifier, ModExecuteRangeValue_Modifier, ModEnergyValue_Modifier, SwapNextLinkID_Modifier, SwapChargeLinkID_Modifier, ModSkillMaxDuration_Modifier, SwapExecuteResultDisplayId_Modifier, SwapExecuteValue_Modifier, SwapCasterResultExecuteEffect_Modifier, ModExecuteEffectValue_Modifier, SwapExecuteEffectValue_Modifier, SwapExecuteEffectPartHitId_Modifier, SwapStatusEffectValue_Modifier, ModStatusEffectFunctionValue_Modifier, ModStatusEffectStack_Modifier, RevisionList, ModifierSet, SkillModifierCollection
**NS**: ProjectAegis.NetPlay
**Methods**: GetModifierOwner, Add, Insert, Remove, RemoveAt, FindIndex, AddModifier, GetModifierRevision, RemoveModifier, GetModifiers, GenerateInstanceID

## `NetworkClient/NetPlay/Character/Passive/Editor/`

### `CharacterDetailInfo.cs`
Path: `NetworkClient/NetPlay/Character/Passive/Editor/CharacterDetailInfo.cs`
**Class**: CharacterDetailInfo
**NS**: ProjectAegis.Tool
**Methods**: DrawName, DrawView, CharacterDetailInfo

### `CharacterDetailMark.cs`
Path: `NetworkClient/NetPlay/Character/Passive/Editor/CharacterDetailMark.cs`
**Class**: CharacterDetailMark
**NS**: ProjectAegis.Tool
**Methods**: DrawTitle, DrawName, DrawView, CharacterDetailMark

### `CharacterDetailPassive.cs`
Path: `NetworkClient/NetPlay/Character/Passive/Editor/CharacterDetailPassive.cs`
**Class**: CharacterDetailPassive
**NS**: ProjectAegis.Tool
**Methods**: DrawName, DrawView, CharacterDetailPassive

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

### `CharacterDetailWindow.cs`
Path: `NetworkClient/NetPlay/Character/Passive/Editor/CharacterDetailWindow.cs`
**Class**: CharacterDetailWindow, CharacterDetailBase
**NS**: ProjectAegis.Tool
**Methods**: ShowWindow, Awake, Update, OnGUI, DrawTarget, InitStatic, Draw, DrawTitle, DrawName, DrawView, DrawLabelName, DrawLabelValue, DrawObjectField, DrawUILine, CharacterDetailBase

## `NetworkClient/NetPlay/Character/Passive/PassiveExecutor/`

### `PassiveExecutor.cs`
Path: `NetworkClient/NetPlay/Character/Passive/PassiveExecutor/PassiveExecutor.cs`
**Class**: PassiveExecutorLib, PassiveExecutorRegisterAttribute, PassiveExecuteArgument, PassiveExecutor, EActivateState, PassiveExecutor_GetStatusEffect, PassiveExecutor_GetStatusEffectConditionSource, PassiveExecutor_DeferDamageTaken, PassiveExecutor_ModSkillCool, PassiveExecutor_ModExecuteRangeDivideCount, PassiveExecutor_StatusEffectAura, PassiveExecutor_ModExecuteRangeRepeatDuration, PassiveExecutor_GetStatusEffectCurrentHitTarget, PassiveExecutor_ModSkillStackMax, PassiveExecutor_RunExecute, PassiveExecutor_RunExcuteConditionSource, PassiveState, ExcuteConditionSourceDetector, PassiveExecutor_ModRateSpreadRange, PassiveExecutor_ModPostureTriggerCount
**NS**: ProjectAegis.NetPlay
**Methods**: InitStatic, Register, CreatePassiveExecutor, Initialize, Init, Activate, Update, Terminate, Disabled, SetTakenDamage, SetAttacker, GetCharacterByNetID, ApplyStatusEffects, RemoveStatusEffects, RemoveAllStatusEffects, MakePassiveState, EnterState, UpdateState, ExitState, GetResults, PassiveExecutorRegisterAttribute, PassiveState

### `PassiveExecutor_Mark.cs`
Path: `NetworkClient/NetPlay/Character/Passive/PassiveExecutor/PassiveExecutor_Mark.cs`
**Class**: PassiveExecutor_GetMark, PassiveExecutor_GetMarkCurrentHit, PassiveExecutor_RemoveMark, PassiveExecutor_RemoveMarkCurrentHitTarget
**NS**: ProjectAegis.NetPlay
**Methods**: Init, Activate, Terminate

### `PassiveExecutor_SkillMod.cs`
Path: `NetworkClient/NetPlay/Character/Passive/PassiveExecutor/PassiveExecutor_SkillMod.cs`
**Class**: PassiveExecutor_SwapExecuteRangeId, PassiveExecutor_SwapExecuteRangeValue, PassiveExecutor_ModExecuteRangeValue, PassiveExecutor_ModEnergyValue, PassiveExecutor_SwapExecuteResultDisplayId, PassiveExecutor_SwapExecuteValue, PassiveExecutor_SwapCasterResultExecuteEffect, PassiveExecutor_SwapExecuteEffectValue, PassiveExecutor_ModExecuteEffectValue, PassiveExecutor_SwapStatusEffectValue, PassiveExecutor_ModStatusEffectFunctionValue, PassiveExecutor_ModStatusEffectStack, PassiveExecutor_SwapExecuteEffectPartHitId, PassiveExecutor_SwapNextLinkID, PassiveExecutor_SwapChargeLinkID, PassiveExecutor_ModSkillMaxDuration
**NS**: ProjectAegis.NetPlay
**Methods**: Init, Activate, Terminate

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

## `NetworkClient/NetPlay/Character/Passive/PassiveInvoker/`

### `PassiveInvoker.cs`
Path: `NetworkClient/NetPlay/Character/Passive/PassiveInvoker/PassiveInvoker.cs`
**Class**: CachedTargets, CachedList, PassiveInvokerLib, PassiveInvokerRegisterAttribute, PassiveInvoker, ECompareCondition, PassiveInvoker_ExistEnemyInRange, PassiveInvoker_ExistEnemyInRangeUnder, PassiveInvoker_AttackHitby, PassiveInvoker_Respawned, PassiveInvoker_AllyDeath, PassiveInvoker_GetAssist, PassiveInvoker_StageStart, PassiveInvoker_KillTarget, PassiveInvoker_KillTargetNearby, PassiveInvoker_AttackHit, EAttackHitType, PassiveInvoker_ExistAllyInRange, PassiveInvoker_ExistAllyInRangeUnder, PassiveInvoker_DamageTakenHPPercentCompareForDefer, PassiveInvoker_EnemyActionInRange, EActionType, PassiveInvoker_ApplyPassiveEffect, PassiveInvoker_OwnDeath, PassiveInvoker_OwnHPPercentCompare, PassiveInvoker_AttackCriticalHit, PassiveInvoker_ComboCountOverOnce, PassiveInvoker_AttackCriticalHitby, PassiveInvoker_UseItem, PassiveInvoker_TrapActivateOwner, PassiveInvoker_BackAttack, PassiveInvoker_OwnAggroValueCompare, PassiveInvoker_SkillTargetHPPercentCompare, PassiveInvoker_SwapWeapon, PassiveInvoker_OwnStaminaZero, PassiveInvoker_CastDebuffHit, PassiveInvoker_CastBuffHit, PassiveInvoker_GetDebuff, PassiveInvoker_DebuffOwnerHit, PassiveInvoker_BuffOwnerHit, PassiveInvoker_OwnArmorTypeGuardChk, PassiveInvoker_OverlapEnemy, PassiveInvoker_SkillArmorHitby, PassiveInvoker_SetColliderHitby
**NS**: ProjectAegis.NetPlay
**Methods**: ClearCached, HelperGetDistance, InitStatic, Register, CreateInvoker, Initialize, GetCompareCondition, Init, GetEventReceiverPairs, CacheEventReceivers, Enabled, Disabled, CheckProbability, OnUpdate, AllyInShortRange, AllyInMiddleRange, AllyInLongRange, CollectAllyInRange, EnemyInShortRange, EnemyInMiddleRange, EnemyInLongRange, CollectEnemyInRange, IsDeferredDamagePassive, CanInvokeTrigger, InvokeTrigger (+ 25 more)

## `NetworkClient/NetPlay/Character/Skill/`

### `NormalState.cs`
Path: `NetworkClient/NetPlay/Character/Skill/NormalState.cs`
**Class**: NormalState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, UpdateState, ExitState, NormalState

### `PlayerSkillSystem.cs`
Path: `NetworkClient/NetPlay/Character/Skill/PlayerSkillSystem.cs`
**Class**: SkillButtonPair, PlayerSkillSystem
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Awake, ResetSkillSlots, OnDestroy, Update, LateUpdate, OnStartServer, OnStartClient, SetupSkillSlots, GetSkillSlot, GetSkillSlotBySkillID, InitUISkillButton, RefreshUISkillButtons, UpdateUISkillButtons, PlayUISkillCooldown, OnPressedSkillButton, CanUseSkill, CheckStaminaCondition, CheckAvailableTags, OnSkillStart, OnSkillEnd, RefreshSkillButton, OnReleasedSkillButton, OnEndedSkillCoolTime, CalculateCoolTime, OnChangedCooldowns (+ 22 more)

### `PlayerSkillSystem.SkillUsage.cs`
Path: `NetworkClient/NetPlay/Character/Skill/PlayerSkillSystem.SkillUsage.cs`
**Class**: SkillUsageData, PlayerSkillSystem
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: IsValidTransSkill, InitSkillUsage, GetSkillUsageData, OnChangedUsages, GetTransSkillUsage, ApplyTransSkillUsage, RemoveTransSkillUsage, CheckTransSkillUsage

### `PlayerSkillSystem.SkillWeapon.cs`
Path: `NetworkClient/NetPlay/Character/Skill/PlayerSkillSystem.SkillWeapon.cs`
**Class**: SkillWeaponData, PlayerSkillSystem
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: InitSkillWeapon, OnChangedSkillWeaponDatas, GetSkillWeaponEquipIndex, ChangeSkillWeapon, GetSkillWeaponData, ShatterSkillWeapon, ResetAllSkillWeapons, TerminateSkillWeapon, UpdateSkillWeaponDatas

### `SkillAction.cs`
Path: `NetworkClient/NetPlay/Character/Skill/SkillAction.cs`
**Class**: SkillAction, ESkillActionType
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: OnEnter, OnUpdate, OnExit, OnExitState, ActivateNode, Expired

### `SkillBuilder.cs`
Path: `NetworkClient/NetPlay/Character/Skill/SkillBuilder.cs`
**Class**: SkillBuilder
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: IsExistSkill, IsAimSkill, IsEnableRes, BuildSkillState, BuildSkillExecute, BuildSkillExecuteEffect, SetupExecuteResultDisplay, LoadActionRes, SetActionResNode, LoadTrackData, CollectAllLinkedSkills, RequireDamageRecord

### `SkillSlot.cs`
Path: `NetworkClient/NetPlay/Character/Skill/SkillSlot.cs`
**Class**: SkillPriority, TransSkillInfo, SkillSlot
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: HasAvailableTag, Clear, AddSkill, SetPostureCoolTime, AddPostureTransSkill, IsValidPostureSkill, IsTransAimSkill, AddStatusEffectTransSkill, GetStatusEffectTransSkills, SetSkillWeaponSkillInfo, StartSkill, RefreshSkillButton, OnStartSkill, GetSkillPriority, OnEndSkill, SetSkillTerminate, IsButtonOnSkill, IsStickerOnSkill, SetButtonOn, SetButtonTrans, SetButtonIcon, SetButtonStickerOn, SetButtonFocus, UpdateFocusGauge, SetIgnoreCooldown (+ 15 more)

### `SkillState.cs`
Path: `NetworkClient/NetPlay/Character/Skill/SkillState.cs`
**Class**: SkillWeaponInfo, SkillDisplayResult, SkillState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: IsAbleCancel, IsBlockedCancel, IsAbleSkip, Init, ActionNodePostLoad, EnterState, ActivateActionOnZeroTime, RemoveNode, ExitState, ProcessNextAction, ChangeAction, UpdateState, ActivateNode, SetAnimLayerUsingFlag, IsMoveAllow, BindSkillButton, SetExecutionTargets, ClearExecutionTargets, GetNextExecutionTarget, IsTriggeringActivate, IsTriggeringTerminate, SetArmorStack, RemoveArmorStack, HasArmor, CurrentArmorType (+ 4 more)

## `NetworkClient/NetPlay/Character/Skill/ActionData/`

### `Track.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionData/Track.cs`
**Class**: TrackType, Track, EmptyTrack, AnimTrack, FxTrack, SoundTrack, CameraShakeTrack, WeaponControlTrack, MonComboControlTrack, SetMovementModeTrack, SetHiddenMeshTrack, CameraControlTrack, CapsuleControlTrack, TrackComparer, ShowTrajectoryTrack
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: ToString, ToStringFormatFrame, IsEmptyResource, Init, RelocateTime, RefreshFrame, IsValidTime, GetNormalizedTime, GetRelativeTime, SetAnimatorState, GetAnimStateName, SetFxInfo, SetSoundInfo, SetMonComboInfo, Compare

### `TrackData.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionData/TrackData.cs`
**Class**: TrackData, TrackBuilder, ExecuteResultRes
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: GetAllTracks, SyncAllTrack, GetTotalTrackTime, Clear, LoadTrackData, SaveTrackData, ApplyAddressable

## `NetworkClient/NetPlay/Character/Skill/ActionNode/`

### `ActionNodeBase.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/ActionNodeBase.cs`
**Class**: EActionNodeExecuteType, EActionNodeLifeType, ETickScope, ActionNodeBase
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, OnUpdate, OnReset, Terminated, IsSkipOnPureServer, NeedUpdate, OnDestroy, OnStateStarted, OnStateEnded, PostLoad, ActionNodeBase

### `InvokeOutput.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/InvokeOutput.cs`
**Class**: InvokeOutPuts
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, InvokeOutputs, InvokeOutPuts

## `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/`

### `ActionChange.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/ActionChange.cs`
**Class**: ActionChange
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, ActionChange

### `AimCorrection.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/AimCorrection.cs`
**Class**: AimCorrection
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, AimCorrection

### `AnimationSpeed.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/AnimationSpeed.cs`
**Class**: AnimationSpeed
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, AnimationSpeed

### `ApplyMark.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/ApplyMark.cs`
**Class**: ApplyMark
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, ApplyMark

### `AutoLockOn.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/AutoLockOn.cs`
**Class**: AutoLockOn
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: AutoLockOn

### `BlockAutoFire.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/BlockAutoFire.cs`
**Class**: BlockAutoFire
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, BlockAutoFire

### `BlockCancelSkill.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/BlockCancelSkill.cs`
**Class**: BlockCancelSkill
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, BlockCancelSkill

### `BodyAnimLayerControl.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/BodyAnimLayerControl.cs`
**Class**: BodyAnimLayerControl
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, BodyAnimLayerControl

### `CameraControl.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/CameraControl.cs`
**Class**: CameraControl
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, LoadCameraSettings, CameraControl

### `CameraShake.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/CameraShake.cs`
**Class**: CameraShake
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: CameraShake

### `CancelWeaponControl.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/CancelWeaponControl.cs`
**Class**: CancelWeaponControl
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, CancelWeaponControl

### `CapsuleControl.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/CapsuleControl.cs`
**Class**: CapsuleControl
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: CapsuleControl

### `ChainChargeSkill.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/ChainChargeSkill.cs`
**Class**: ChainChargeSkill
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: NeedUpdate, OnUpdate, StartChargeChain, ChainChargeSkill

### `ChainSkill.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/ChainSkill.cs`
**Class**: ChainSkill
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: PostLoad, SetSkillTransInfo, GetTransSkillByStatusEffect, Activated, ChainSkill

### `ChaseTarget.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/ChaseTarget.cs`
**Class**: ChaseTarget
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, NeedUpdate, OnUpdate, Terminated, FindTarget, IsValidTarget, ChaseTarget

### `CrossHairShow.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/CrossHairShow.cs`
**Class**: CrossHairShow
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: CrossHairShow

### `DodgeAction.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/DodgeAction.cs`
**Class**: DodgeAction
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: DodgeAction

### `EnableSkillCancel.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/EnableSkillCancel.cs`
**Class**: EnableSkillCancel
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, EnableSkillCancel

### `EnergyConsume.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/EnergyConsume.cs`
**Class**: EnergyConsume
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: IsReloadNode, Activated, NeedUpdate, OnUpdate, Terminated, ConsumeEnergy, EnergyConsume

### `ExecuteFireWeapon.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/ExecuteFireWeapon.cs`
**Class**: ExecuteFireWeapon
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, ExecuteFireWeapon

### `FixRotation.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/FixRotation.cs`
**Class**: FixRotation
**Methods**: Start, Restore

### `InputRecord.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/InputRecord.cs`
**Class**: InputRecord
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, OnUpdate, Terminated, NeedUpdate, InputRecord

### `LockInput.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/LockInput.cs`
**Class**: LockInput
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, LockInput

### `LockRotation.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/LockRotation.cs`
**Class**: LockRotation
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, LockRotation

### `LockWeaponControl.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/LockWeaponControl.cs`
**Class**: LockWeaponControl
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, LockWeaponControl

### `PlayAnimation.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/PlayAnimation.cs`
**Class**: EAnimationVarType, AnimatorVariable, PlayAnimation
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, SetAnimatorVariables, OnUpdate, Terminated, OnAnimationEnd, NeedUpdate, IsFinishAnimation, ApplyLookDirection, PlayAnimation

### `PlaySound.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/PlaySound.cs`
**Class**: PlaySound
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, PlaySound

### `PlayWeaponDraw.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/PlayWeaponDraw.cs`
**Class**: PlayWeaponDraw
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, PlayWeaponDraw

### `RendererFader.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/RendererFader.cs`
**Class**: RendererFader, FadeTargetInfo
**Methods**: Awake, OnDestroy, LateUpdate, ResetPropertyBlock, StartFade, StopFade

### `SetHiddenMesh.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/SetHiddenMesh.cs`
**Class**: SetHiddenMesh
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, SetHiddenMesh

### `SetMovementMode.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/SetMovementMode.cs`
**Class**: EMovementMode, SetMovementMode
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, SetMovementMode

### `ShowTrajectory.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/ShowTrajectory.cs`
**Class**: ShowTrajectory
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, NeedUpdate, OnUpdate, IsSkipOnPureServer, ShowTrajectory

### `SkillArmor.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/SkillArmor.cs`
**Class**: SkillArmor
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, SkillArmor

### `SkillExit.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/SkillExit.cs`
**Class**: SkillExit
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, SkillExit

### `SpawnFX.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/SpawnFX.cs`
**Class**: EFXAttached, SpawnFX
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: IsSkipOnPureServer, Activated, RestartFx, StopFX, FadeOutAndStopFX, OnOwnerHiddenChanged, FindOwnerBoneTransform, SpawnEffect, Terminated, OnDestroy, PostLoad, SpawnFX

### `StaminaConsume.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/StaminaConsume.cs`
**Class**: StaminaConsume
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, NeedUpdate, OnUpdate, StaminaConsume

### `StartCoolTime.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/StartCoolTime.cs`
**Class**: StartCoolTime
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, StartCoolTime

### `WeaponControl.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/WeaponControl.cs`
**Class**: WeaponControl
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, SetVisible, WeaponControl

## `NetworkClient/NetPlay/Character/Skill/ActionNode/Conditional/`

### `ConditionEnergy.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Conditional/ConditionEnergy.cs`
**Class**: ConditionEnergy
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: CheckCondition, ConditionEnergy

### `ConditionEnergyStage.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Conditional/ConditionEnergyStage.cs`
**Class**: ConditionEnergyStage
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: CheckCondition, ConditionEnergyStage

### `ConditionNodeBase.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Conditional/ConditionNodeBase.cs`
**Class**: EConditionCheckType, ConditionNodeBase
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, NeedUpdate, OnUpdate, OnLoopActionEnd, CheckCondition, ConditionNodeBase

### `ConditionStamina.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Conditional/ConditionStamina.cs`
**Class**: ConditionStamina
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: CheckCondition, ConditionStamina

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

### `RecInputCheck.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Conditional/RecInputCheck.cs`
**Class**: RecInputCheck
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, OnUpdate, NeedUpdate, RecInputCheck

### `SkillSkipCheck.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Conditional/SkillSkipCheck.cs`
**Class**: SkillSkipCheck
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, CheckCondition, Terminated, SkillSkipCheck

## `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/`

### `ExecuteAttack.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteAttack.cs`
**Class**: SkillExecuteDamageFunction
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Execute

### `ExecuteBlockInteraction.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteBlockInteraction.cs`
**Class**: SkillExecuteBlockInteraction
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Execute

### `ExecuteChangeSkillWeapon.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteChangeSkillWeapon.cs`
**Class**: ExecuteChangeSkillWeapon
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, SetSkillWeaponInfo, ExecuteChangeSkillWeapon

### `ExecuteDetonation.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteDetonation.cs`
**Class**: ExecuteDetonation
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, Execute, ExecuteDetonation

### `ExecuteFunction.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteFunction.cs`
**Class**: SkillExecuteFunction
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Execute, GainEnergy, OnStateStarted, OnStateEnded, SkillModifierOwner

### `ExecuteFunctionManager.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteFunctionManager.cs`
**Class**: ExecuteFunctionManager
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: IsValid, BuildExecuteEffect, Execute, OnStateStarted, OnStateEnded

### `ExecuteHeal.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteHeal.cs`
**Class**: SkillExecuteHeal
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Execute

### `ExecuteKill.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteKill.cs`
**Class**: SkillExecuteKillFunction
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Execute

### `ExecuteLaunchProjectile.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteLaunchProjectile.cs`
**Class**: ExecuteLaunchProjectile, Setting
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, GetProjectileStartPosition, GetProjectileDirection, TryGetThrowingDirection, TryCalculateThrowVelocity, ExecuteLaunchProjectile

### `ExecuteMoveCaster.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteMoveCaster.cs`
**Class**: SkillExecuteMoveCasterFunction
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Execute

### `ExecuteMultiTargeting.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteMultiTargeting.cs`
**Class**: ExecuteMultiTargeting
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, ExecuteMultiTargeting

### `ExecuteNode.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteNode.cs`
**Class**: RecordDealDamage, ExecuteNode
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, NeedUpdate, OnUpdate, Terminated, BuildExecuteEffect, BuildExecuteFunction, BuildCasterExecuteFunction, Execute, GetExecuteTargets, OnStateStarted, OnStateEnded, CreateFromTable, SetHitContext, RecordDealDamage, ExecuteNode

### `ExecutePosture.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecutePosture.cs`
**Class**: ExecutePosture
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, SetPostureInfo, Execute, ExecutePosture

### `ExecuteSetCollider.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteSetCollider.cs`
**Class**: SkillExecuteSetColliderFunction
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Execute, OnStateStarted

### `ExecuteStatusEffect.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteStatusEffect.cs`
**Class**: SkillExecuteStatusEffectFunction, Setting
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Execute

### `ExecuteSummon.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteSummon.cs`
**Class**: SkillExecuteSummonFunction
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Execute, OnStateStarted, OnStateEnded

### `ExecuteSummonActive.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteSummonActive.cs`
**Class**: ExecuteSummonActive
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, SetSummonActiveInfo, ExecuteSummonActive

### `RangeDetector.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/RangeDetector.cs`
**Class**: RangeDetector, Settings
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: SetFrom, CopyFrom, ResetModValue, IsRepeatable, CheckAndApplySkillModification, Setup, BuildShapes, ClearAttacked, Activated, IsRepeated, GetResults, SetShapeCurrentTarget, IsValidExecTargetType

### `Shape.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/Shape.cs`
**Class**: Shape, BoxShape, ArcShape, TargetShape
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: CollectOverlapped, Contains

### `TargetComparer.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/TargetComparer.cs`
**Class**: TargetFilter, TargetComparer, EntityTargetComparer, ExecuteTargetComparer
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: IsFiltered, Compare, GetPriority

## `NetworkClient/NetPlay/Character/Skill/Summon/`

### `EMPGrenade.cs`
Path: `NetworkClient/NetPlay/Character/Skill/Summon/EMPGrenade.cs`
**Class**: EMPGrenade
**NS**: ProjectAegis.NetPlay

### `SmokeArea.cs`
Path: `NetworkClient/NetPlay/Character/Skill/Summon/SmokeArea.cs`
**Class**: SmokeArea
**NS**: ProjectAegis.NetPlay

### `SummonObject.cs`
Path: `NetworkClient/NetPlay/Character/Skill/Summon/SummonObject.cs`
**Class**: SummonObject, skill
**NS**: ProjectAegis.NetPlay
**Methods**: Awake, SetSummonOwner, OnDestroy, Init, OnStartClient, OnStopClient, OnStartServer, OnStopServer, OnMasterIdChanged, TryAutocastSkill, OnLifeTimeEnd, SetLifeDuration, FixedUpdate, UseSkillBySlot, Die

## `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/`

### `StatusEffect_RunPassive.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_RunPassive.cs`
**Class**: StatusEffect_RunPassive
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffect_SkillTransCondition.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_SkillTransCondition.cs`
**Class**: StatusEffect_SkillTransCondition
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

## `NetworkClient/NetPlay/Controller/`

### `SkillButtonState.cs`
Path: `NetworkClient/NetPlay/Controller/SkillButtonState.cs`
**Class**: SkillButtonState
**NS**: ProjectAegis.NetPlay
**Methods**: SetButtonClick, SetButtonRelease

## `NetworkClient/NetPlay/Helper/`

### `SkillValueUtil.cs`
Path: `NetworkClient/NetPlay/Helper/SkillValueUtil.cs`
**Class**: TimeUtils, RefValueHelper
**NS**: ProjectAegis.NetPlay
**Methods**: SecondsToMS, MSToSeconds, SnapToFixedFrame, SecToFixedFrame, SecondsToMilSec, MilSecToFixedFrame, SnapValueToFixedFrameTime, ConvertTableValueToTime, ConvertTableValueToDistance, ConvertTableValueToPercent, StringToVector3, StringToQuaternion, IsNullOrEmpty

## `NetworkClient/NetPlay/Interaction/Handlers/Character/`

### `AddPassiveHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Character/AddPassiveHandler.cs`
**Class**: AddPassiveHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

### `RemovePassiveHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Character/RemovePassiveHandler.cs`
**Class**: RemovePassiveHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

## `NetworkClient/NetPlay/TacticalSkill/`

### `TacticalCardsSystem.cs`
Path: `NetworkClient/NetPlay/TacticalSkill/TacticalCardsSystem.cs`
**Class**: ETacticalCardSlot, TacticalCardsSystem, SelectalbeCardInfo, CardCandidateList, SynergyGradeCard
**NS**: ProjectAegis.NetPlay
**Methods**: GetCandidateCards, AddSynergySkill, AddSynergyGrade, TacticalCardSlotToSynergyType, SynergyEnumToTacticalCardSlot

## `NetworkDev/03.ReferenceManager/02.ReferenceTable/`

### `RefBotSkillDecision.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBotSkillDecision.cs`
**Class**: CRefBotSkillDecision, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotSkillDecision, RegisterRefBotSkillDecisionBinary, FindRefBotSkillDecision, GetRefBotSkillDecisions

### `RefCharacterPassiveSet.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCharacterPassiveSet.cs`
**Class**: CRefCharacterPassiveSet, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterPassiveSet, RegisterRefCharacterPassiveSetBinary, FindRefCharacterPassiveSet, GetRefCharacterPassiveSets

### `RefPassive.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefPassive.cs`
**Class**: CRefPassive, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefPassive, RegisterRefPassiveBinary, FindRefPassive, GetRefPassives

### `RefPassiveEffect.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefPassiveEffect.cs`
**Class**: CRefPassiveEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefPassiveEffect, RegisterRefPassiveEffectBinary, FindRefPassiveEffect, GetRefPassiveEffects

### `RefPassiveProperty.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefPassiveProperty.cs`
**Class**: CRefPassiveProperty, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefPassiveProperty, RegisterRefPassivePropertyBinary, FindRefPassiveProperty, GetRefPassivePropertys

### `RefSkill.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefSkill.cs`
**Class**: CRefSkill, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkill, RegisterRefSkillBinary, FindRefSkill, GetRefSkills

### `RefSkillCondition.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefSkillCondition.cs`
**Class**: CRefSkillCondition, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillCondition, RegisterRefSkillConditionBinary, FindRefSkillCondition, GetRefSkillConditions

### `RefSkillExecute.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefSkillExecute.cs`
**Class**: CRefSkillExecute, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillExecute, RegisterRefSkillExecuteBinary, FindRefSkillExecute, GetRefSkillExecutes

### `RefSkillExecuteEffect.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefSkillExecuteEffect.cs`
**Class**: CRefSkillExecuteEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillExecuteEffect, RegisterRefSkillExecuteEffectBinary, FindRefSkillExecuteEffect, GetRefSkillExecuteEffects

### `RefSkillExecuteRange.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefSkillExecuteRange.cs`
**Class**: CRefSkillExecuteRange, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillExecuteRange, RegisterRefSkillExecuteRangeBinary, FindRefSkillExecuteRange, GetRefSkillExecuteRanges

### `RefSkillExecuteResultDisplay.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefSkillExecuteResultDisplay.cs`
**Class**: CRefSkillExecuteResultDisplay, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillExecuteResultDisplay, RegisterRefSkillExecuteResultDisplayBinary, FindRefSkillExecuteResultDisplay, GetRefSkillExecuteResultDisplays

### `RefSkillSet.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefSkillSet.cs`
**Class**: CRefSkillSet, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillSet, RegisterRefSkillSetBinary, FindRefSkillSet, GetRefSkillSets

### `RefSkillSummon.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefSkillSummon.cs`
**Class**: CRefSkillSummon, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillSummon, RegisterRefSkillSummonBinary, FindRefSkillSummon, GetRefSkillSummons

### `RefSkillTrans.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefSkillTrans.cs`
**Class**: CRefSkillTrans, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillTrans, RegisterRefSkillTransBinary, FindRefSkillTrans, GetRefSkillTranss

### `RefSkillUI.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefSkillUI.cs`
**Class**: CRefSkillUI, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillUI, RegisterRefSkillUIBinary, FindRefSkillUI, GetRefSkillUIs

## `ReferenceTable/`

### `RefBotSkillDecision.cs`
Path: `ReferenceTable/RefBotSkillDecision.cs`
**Class**: CRefBotSkillDecision, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotSkillDecision, RegisterRefBotSkillDecisionBinary, FindRefBotSkillDecision, GetRefBotSkillDecisions

### `RefCharacterPassiveSet.cs`
Path: `ReferenceTable/RefCharacterPassiveSet.cs`
**Class**: CRefCharacterPassiveSet, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterPassiveSet, RegisterRefCharacterPassiveSetBinary, FindRefCharacterPassiveSet, GetRefCharacterPassiveSets

### `RefPassive.cs`
Path: `ReferenceTable/RefPassive.cs`
**Class**: CRefPassive, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefPassive, RegisterRefPassiveBinary, FindRefPassive, GetRefPassives

### `RefPassiveEffect.cs`
Path: `ReferenceTable/RefPassiveEffect.cs`
**Class**: CRefPassiveEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefPassiveEffect, RegisterRefPassiveEffectBinary, FindRefPassiveEffect, GetRefPassiveEffects

### `RefPassiveProperty.cs`
Path: `ReferenceTable/RefPassiveProperty.cs`
**Class**: CRefPassiveProperty, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefPassiveProperty, RegisterRefPassivePropertyBinary, FindRefPassiveProperty, GetRefPassivePropertys

### `RefSkill.cs`
Path: `ReferenceTable/RefSkill.cs`
**Class**: CRefSkill, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkill, RegisterRefSkillBinary, FindRefSkill, GetRefSkills

### `RefSkillCondition.cs`
Path: `ReferenceTable/RefSkillCondition.cs`
**Class**: CRefSkillCondition, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillCondition, RegisterRefSkillConditionBinary, FindRefSkillCondition, GetRefSkillConditions

### `RefSkillExecute.cs`
Path: `ReferenceTable/RefSkillExecute.cs`
**Class**: CRefSkillExecute, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillExecute, RegisterRefSkillExecuteBinary, FindRefSkillExecute, GetRefSkillExecutes

### `RefSkillExecuteEffect.cs`
Path: `ReferenceTable/RefSkillExecuteEffect.cs`
**Class**: CRefSkillExecuteEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillExecuteEffect, RegisterRefSkillExecuteEffectBinary, FindRefSkillExecuteEffect, GetRefSkillExecuteEffects

### `RefSkillExecuteRange.cs`
Path: `ReferenceTable/RefSkillExecuteRange.cs`
**Class**: CRefSkillExecuteRange, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillExecuteRange, RegisterRefSkillExecuteRangeBinary, FindRefSkillExecuteRange, GetRefSkillExecuteRanges

### `RefSkillExecuteResultDisplay.cs`
Path: `ReferenceTable/RefSkillExecuteResultDisplay.cs`
**Class**: CRefSkillExecuteResultDisplay, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillExecuteResultDisplay, RegisterRefSkillExecuteResultDisplayBinary, FindRefSkillExecuteResultDisplay, GetRefSkillExecuteResultDisplays

### `RefSkillSet.cs`
Path: `ReferenceTable/RefSkillSet.cs`
**Class**: CRefSkillSet, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillSet, RegisterRefSkillSetBinary, FindRefSkillSet, GetRefSkillSets

### `RefSkillSummon.cs`
Path: `ReferenceTable/RefSkillSummon.cs`
**Class**: CRefSkillSummon, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillSummon, RegisterRefSkillSummonBinary, FindRefSkillSummon, GetRefSkillSummons

### `RefSkillTrans.cs`
Path: `ReferenceTable/RefSkillTrans.cs`
**Class**: CRefSkillTrans, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillTrans, RegisterRefSkillTransBinary, FindRefSkillTrans, GetRefSkillTranss

### `RefSkillUI.cs`
Path: `ReferenceTable/RefSkillUI.cs`
**Class**: CRefSkillUI, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillUI, RegisterRefSkillUIBinary, FindRefSkillUI, GetRefSkillUIs

## `ScriptDev/Manager/UserDatas/Characters/`

### `UserDataManager_Skill.cs`
Path: `ScriptDev/Manager/UserDatas/Characters/UserDataManager_Skill.cs`
**Class**: UserCharacters
**NS**: ProjectAegis.UserDatas
**Methods**: InitializeSkills, InitializePassiveSkillsFromCharacterInfo, GetPassiveIdFromItemUID, SendEquipPassiveSkillRequest, SendUnequipPassiveSkillRequest, ConvertFromPassiveSkillSlotType, IsUniversalPassive, IsUniquePassive, IsPassiveEquippableByCharacter, UnlockSkill, EquipPassive, UnequipPassive, DebugPrintSkills, DebugForceUnlockSkill, DebugForceEquipPassive

## `ScriptDev/UI/`

### `CUIButtonSkill.cs`
Path: `ScriptDev/UI/CUIButtonSkill.cs`
**Class**: CUIButtonSkill
**Methods**: GetCooltimeText, Awake, SetIcon, SetIconAlphaByCooldown, SetSticker, SetCooltimeProgress, SetCooltimeText, SetStackCooltimeProgress, SetStackCount, SetActiveCooltime, SetActiveStack, SetActiveStackCooltime, PlayAnimCooldown

## `ScriptDev/UI/Lobby/Chraracter/`

### `CUICharacterSkill.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/CUICharacterSkill.cs`
**Class**: ESkillSlotState, ESkillPanelMode, CUIActiveSkillSlot, CUIPassiveSlot, CUIActiveSkillInfo, CUIPassiveSkillTooltip, CUIPassiveInventory, PassiveInventoryItem, CUICharacterSkill
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, OnClick, SetSkillData, SetSelected, UpdateVisualState, Clear, SetActive, SetSlotData, TryLoadPendingIcon, OnClickViewDetail, SetActiveSkillData, SetCallbacks, OnClickUnequip, OnClickChange, OnClickEquip, SetPassiveData, UpdateButtonState, SetButtonStateForEmptySlot, SetUnequipButtonEnabled, SetButtonStateForEquippedInInventory, HideAllButtons, SetPassiveList, InitializeScrollIfNeeded, SetSelectedPassive, SetData (+ 35 more)

## `ScriptDev/UI/Lobby/Chraracter/Elements/`

### `CUICharacterSkillPopup.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/Elements/CUICharacterSkillPopup.cs`
**Class**: CUICharacterSkillPopup
**NS**: ProjectAegis.UI
**Methods**: Awake, SetActiveSkillData, SetPassiveSkillData, OnShow, Clear, SetTitle, SetSkillName, SetUltimateVisible, SetSkillOptions, SetDescription, SetPreviewImage, AdjustImageAspectRatio, OnClickClose

### `CUIPassiveInventoryCell.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/Elements/CUIPassiveInventoryCell.cs`
**Class**: CUIPassiveInventoryCell
**NS**: ProjectAegis.UI
**Methods**: BindUI, SetClickCallback, OnClick, SetData, SetSelected, UpdateEquipState, SetIcon

## `ScriptDev/UI/ReferenceTable/`

### `RefSkillExtension.cs`
Path: `ScriptDev/UI/ReferenceTable/RefSkillExtension.cs`
**Class**: CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: GetPassiveName, GetPassiveDescription, BuildSkillOptionsList

## `ScriptTools/Editor/x64/Bakery/scripts/`

### `ftUVGBufferGen.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftUVGBufferGen.cs`
**Class**: ftUVGBufferGen
**Methods**: UpdateMatrix, GenerateVertexBakeSamples, StartUVGBuffer, InitAlphaBuffer, OverrideColor, OverrideVector, OverrideFloat, OverrideTexture, DrawWithOverrides, RenderUVGBuffer, EndUVGBuffer, DecodeFromRGBM, Dilate, Multiply

## `ScriptTools/ZString/`

### `IResettableBufferWriter.cs`
Path: `ScriptTools/ZString/IResettableBufferWriter.cs`
**Class**: IResettableBufferWriter
**NS**: Cysharp.Text

## `ScriptTools/ZString/Number/`

### `BufferEx.cs`
Path: `ScriptTools/ZString/Number/BufferEx.cs`
**Class**: BufferEx
**NS**: System
**Methods**: ZeroMemory, Memcpy

### `Number.NumberBuffer.cs`
Path: `ScriptTools/ZString/Number/Number.NumberBuffer.cs`
**Class**: Number, NumberBuffer, return, NumberBufferKind
**NS**: System
**Methods**: CheckConsistency, ToString, NumberBuffer


