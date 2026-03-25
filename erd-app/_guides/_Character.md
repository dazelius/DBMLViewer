# Character System Code Guide
> Auto-generated: 2026-02-25 13:31 | 286 files

## `Aegis.GameServer/GameLogic/`

### `Player.cs`
Path: `Aegis.GameServer/GameLogic/Player.cs`
**Class**: Player
**NS**: Aegis.GameServer
**Methods**: InitializeGrainAsync, LoadGrainAsync, GetGrain, UpdatePlayerInfoAsync, OnDisconnected, Player

## `Aegis.GameServer/GameLogic/GameLift/`

### `PlayerSessionManager.cs`
Path: `Aegis.GameServer/GameLogic/GameLift/PlayerSessionManager.cs`
**Class**: PlayerSessionManager, PlayerSessionInfo
**NS**: Aegis.GameServer.GameLift
**Methods**: CreatePlayerSessionAsync, CreatePlayerSessionsAsync, GetPlayerSession, GetPlayerSessionById, RemovePlayerSession, GetPlayerSessionsByGameSessionAsync, GetActivePlayerSessions, ClearCache, PlayerSessionManager

## `Aegis.GameServer/Migrations/`

### `20251001072426_Player.cs`
Path: `Aegis.GameServer/Migrations/20251001072426_Player.cs`
**Class**: Player
**NS**: Aegis.GameServer.Migrations
**Methods**: Up, Down

### `20251001072426_Player.Designer.cs`
Path: `Aegis.GameServer/Migrations/20251001072426_Player.Designer.cs`
**Class**: Player
**NS**: Aegis.GameServer.Migrations
**Methods**: BuildTargetModel

## `Aegis.OrleansSilo/Grains/Player/`

### `IPlayerGrain.cs`
Path: `Aegis.OrleansSilo/Grains/Player/IPlayerGrain.cs`
**Class**: IPlayerGrain
**NS**: Aegis.OrleansSilo.Grains.Player

### `PlayerGrain.cs`
Path: `Aegis.OrleansSilo/Grains/Player/PlayerGrain.cs`
**Class**: PlayerGrain
**NS**: Aegis.OrleansSilo.Grains.Player
**Methods**: InitializeAsync, GetPlayerInfoAsync, UpdateNicknameAsync, SetPartyReadyAsync, GetPartyReadyAsync, SetCurrentPartyIdAsync, GetCurrentPartyIdAsync, SetMatchingStatusAsync, GetMatchingStatusAsync, UpdateLastActivityAsync, GetSiloAddress, OnDeactivateAsync, PlayerGrain

### `PlayerGrainState.cs`
Path: `Aegis.OrleansSilo/Grains/Player/PlayerGrainState.cs`
**Class**: PlayerGrainState
**NS**: Aegis.OrleansSilo.Grains.Player

## `NetworkClient/NetPlay/Character/`

### `Character.cs`
Path: `NetworkClient/NetPlay/Character/Character.cs`
**Class**: EFiringState, EUpperState, ELifeState, CanFireState, Character
**NS**: ProjectAegis.NetPlay
**Methods**: Awake, Start, OnDestroy, OnReloadCanceled, Update, EnableUpdatePlaying, FixedUpdate, OnStartNetwork, OnStopNetwork, OnStartServer, OnStartClient, OnStopClient, ShowOutline, HideOutline, ShowOccludedSilhouette, HideOccludedSilhouette, ApplyMaterialEffect, RemoveMaterialEffect, GetCenterOffset, GetColliderSize, Init, SetupAppearance, SetupGearSet, SetupArmors, SetupWeapons (+ 35 more)

### `Character.Debug.cs`
Path: `NetworkClient/NetPlay/Character/Character.Debug.cs`
**Class**: Character, Row
**NS**: ProjectAegis.NetPlay
**Methods**: ResetDebugStatics, ResetDebugStaticsOnEnterPlayMode, DebugGUI, BuildRows

### `Character.Energy.cs`
Path: `NetworkClient/NetPlay/Character/Character.Energy.cs`
**Class**: Character
**NS**: ProjectAegis.NetPlay
**Methods**: OnChangedEnergy, InitEnergy, ChangeEnergyGain, RestoreEnergyGain, UpdateEnergy, SyncEnergyValue, SetEnergyValue, AddEnergyValue, AddFireGainEnergy, GetEnergy, GetEnergyValue, GetMaxEnergyValue, GetEnergyPercent, GenerateEnergyBuffID, AddMaxEnergyModifier, RemoveMaxEnergyModifier, AddEnergyRecoveryModifier, RemoveEnergyRecoveryModifier, AddInfiniteEnergyModifier, RemoveInfiniteEnergyModifier, AddEnergyBlock, RemoveEnergyBlock

### `Character.IK.cs`
Path: `NetworkClient/NetPlay/Character/Character.IK.cs`
**Class**: Character
**NS**: ProjectAegis.NetPlay
**Methods**: SetupIK, UpdateIK, SetAimIKMuzzle, SetAimIKTarget, SetArmIKTarget, SetLookAtIKTarget, SetAimIKWeight, SetArmIKWeight, SetLookAtIKWeight, FadeAimIK, FadeArmIK, FadeLookIK, FadeAimingIK, IsRequiredAimingIK, IsBlockedAimingIK, UpdateAimingIK, SetEnabledAimingIK, PlayHitReaction, StopHitReaction, SetHitReactionTime

### `Character.Log.cs`
Path: `NetworkClient/NetPlay/Character/Character.Log.cs`
**Class**: Character
**NS**: ProjectAegis.NetPlay
**Methods**: ServerRpcLog, UpdateBenchmark

### `Character.Mark.cs`
Path: `NetworkClient/NetPlay/Character/Character.Mark.cs`
**Class**: Character
**NS**: ProjectAegis.NetPlay
**Methods**: ApplyMark, RemoveMark, ForceRemoveMark, HasMark, UpdateMark, OnMarkApplied, OnMarkRemoved, GetActiveMarkIDs, GetMarkInstances

### `Character.Trajectory.cs`
Path: `NetworkClient/NetPlay/Character/Character.Trajectory.cs`
**Class**: Character
**NS**: ProjectAegis.NetPlay
**Methods**: InitTrajectoryIndicator, SetTrajectoryVisible, UpdateTrajectory, ApplyTrajectoryVisual

### `CharacterAnimationInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterAnimationInterface.cs`
**Class**: BlendWeightControl, ECharacterAnimLayerType, AnimHash, Character
**NS**: ProjectAegis.NetPlay
**Methods**: Update, SetValue, SetTarget, SetFadeIn, SetFadeOut, SetAutoBlendOff, PostSetupModel, SetAnimParameter, CacheSocketTransforms, GetSocketTransform, FadeInAnimLayer, FadeOutAnimLayer, SetAutoBlendOffAnimLayer, UpdateAnimLayerWeight, SetAnimInteger, SetAnimBool, SetAnimFloat, SetAnimTrigger, SetAnimResetTrigger, SetAnimLayerWeight, GetAnimLayer, GetAnimInteger, GetAnimBool, GetAnimFloat, GetAnimLayerWeight (+ 20 more)

### `CharacterDetonationInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterDetonationInterface.cs`
**Class**: DetonationTarget, Character
**NS**: ProjectAegis.NetPlay
**Methods**: Equals, GetHashCode, AddDetonationTarget, RemoveDetonationTarget, GetDetonationTarget, CleanUpDetonationTargets, DetonationTarget

### `CharacterFSMInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterFSMInterface.cs`
**Class**: Character
**NS**: ProjectAegis.NetPlay
**Methods**: ResetWasFiringBeforeState, InitFSM, UpdateFSM, AddParkourState, ChangeParkourState, StartParkour, ServerRpcStartParkour, ObserverStartParkour, GetAimMode, GetForcedAimMode, TrySetAimMode, ServerRpcSetAimMode, SetAimMode, OnChangedAimMode, IsAimModeBlocked, SetForcedAimMode, ClearForcedAimMode, ChangeFiringState, ServerChangeFiringState, ObserverChangeFiringState, CancelFiringState, OnFiringStateChanged, GetCurrentFiringStateID, IsFiring, CheckStartPressedFire (+ 16 more)

### `CharacterHealthInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterHealthInterface.cs`
**Class**: EDeathAnimType, ShieldInstance, Character
**NS**: ProjectAegis.NetPlay
**Methods**: SetHealth, OnChangedhealth, SetDownedHealth, OnChangedDownedhealth, Heal, DealDamage, DealShield, EvaluateDeferredDamage, TakeDamage, RecordReceiveDamage, TargetAttacked, OnTakeDamage, RpcOnTakeDamage, PlayDamageVibration, TakeHeal, RpcOnTakeHeal, ChangeLifeState, UpdateLifeState, OnChangedLifeState, Resurrect, Revive, Downed, Die, ForceDie, Respawn (+ 26 more)

### `CharacterMovementInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterMovementInterface.cs`
**Class**: SmoothRotationParams, AnimationDampTime, Character
**NS**: ProjectAegis.NetPlay
**Methods**: GetForcedRotationMode, GetBaseStandMoveSpeed, IsInAir, GetCapsuleCollider, GetCapsuleRadius, GetCapsuleHeight, GetMoveSpeedRate, GetMovementDirection, IsGrounded, IsFalling, IsJumping, IsFlying, GetMaxMoveSpeed, GetBaseMoveSpeedRate, GetSkillMoveSpeedRate, GetIdleToMoveDampTime, GetMoveToIdleDampTime, GetMoveFactor, GetRotationMode, GetVelocity, OnLanded, SetEnabledCharacterMovement, SetRotationMode, SetPositionAndRotation, SetPosition (+ 32 more)

### `CharacterParkourInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterParkourInterface.cs`
**Class**: Character
**NS**: ProjectAegis.NetPlay
**Methods**: InitParkour, IsPlayingParkour, CanParkour, TryParkour

### `CharacterPassiveInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterPassiveInterface.cs`
**Class**: Character
**NS**: ProjectAegis.NetPlay
**Methods**: GetPassiveDefrredDamageRate, AddPassiveSkill, RemovePassiveSkill, RemoveAllPassiveSkills, ResetPassiveSkills

### `CharacterPingInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterPingInterface.cs`
**Class**: PingRpcData, Character
**NS**: ProjectAegis.NetPlay
**Methods**: TargetRpcCreatePing

### `CharacterSkillInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterSkillInterface.cs`
**Class**: SkillCooldownData, ECharacterStateTagType, Character
**NS**: ProjectAegis.NetPlay
**Methods**: OnSkillStart, OnSkillEnd, StartSkillCoolTime, ModifySkillCoolTime, ModifyAllSkillCoolTime, ResetAllSkillWeapons, SkillCooldownData

### `CharacterSpectateInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterSpectateInterface.cs`
**Class**: ESpectateMode, SpectateData, Character
**NS**: ProjectAegis.NetPlay
**Methods**: InitSpectate, OnChangeSpectateData, StartSpectateOnDeath, StartSpectateProcess, IsValidKillerSpectatingTarget, ServerRpcKillerSpectate, ServerRpcAllySpectate, ServerRpcStopSpectating, ServerSetAllySpectatePIDs, GetSpectateTarget, ServerSetSpectateTarget, ServerClearSpectateTarget, StartSpectateMode, SpectateData

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

### `EntityTrack.cs`
Path: `NetworkClient/NetPlay/Character/EntityTrack.cs`
**Class**: EntityTracking, EntityTrackSetting
**NS**: ProjectAegis.NetPlay
**Methods**: AddTrackedBy, ValidEntity, RemoveTrackedBy, IsTrackedBy, ClearAll, ClearAllTracking

### `Player.cs`
Path: `NetworkClient/NetPlay/Character/Player.cs`
**Class**: Player
**NS**: ProjectAegis.NetPlay
**Methods**: InitStatics, OnStartNetwork, SetNickName, OnStopNetwork, OnStartClient, OnOwnershipClient, Init, SetupWeapons, GetMovementInput, GetRawMovementInput, Update, RequestChangeMainWeapon, OnStartRound, OnEndRound, TargetAttacked, Die

### `PlayerScore.cs`
Path: `NetworkClient/NetPlay/Character/PlayerScore.cs`
**Class**: EScoreType, PlayerScore, PlayerScoreByWeapon, RoundScore, DamageRecord, EPlayerCaptureState, PlayerTier, Player
**NS**: ProjectAegis.NetPlay
**Methods**: GetValue, GetValueToString, SetLevel, SetTier, InitScoreData, SetCaptureState, RecordScore, SetKillStreak, CheckUpdateKillStreak, RecordReceiveDamage, UpdateKillStreak, TargetRpcKillFeedback, SetupPlayStatisticsData, SetResultReward

### `PlayerTacticalCards.cs`
Path: `NetworkClient/NetPlay/Character/PlayerTacticalCards.cs`
**Class**: Player
**NS**: ProjectAegis.NetPlay
**Methods**: InitTacticalCardParams, ResetPassiveSkills, ReadyForTacticalSelect, RequestTacticalCardSelect, OnChangeTacticalCardInfo, OnChangeSelectTacticalCardSlot, CurrentSelectedTacticalCard, SetupTacticalSkills, SetupTeamSynergySkills, SetTeamSynergyGrades

## `NetworkClient/NetPlay/Character/Component/`

### `TrajectoryIndicator.cs`
Path: `NetworkClient/NetPlay/Character/Component/TrajectoryIndicator.cs`
**Class**: IndicatorVisualInfo, TrajectoryIndicator
**NS**: ProjectAegis.NetPlay
**Methods**: Awake, EnsureInitialized, ApplyVisualConfig, SetVisible, UpdateTrajectory

## `NetworkClient/NetPlay/Character/FSM/`

### `CharFSM.cs`
Path: `NetworkClient/NetPlay/Character/FSM/CharFSM.cs`
**Class**: CharFSM
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Init, InitLifeState, Update

### `CharFSMDefine.cs`
Path: `NetworkClient/NetPlay/Character/FSM/CharFSMDefine.cs`
**Class**: EEightDirection, EDamageInvokeSource, EMoveCasterDir
**NS**: ProjectAegis.NetPlay.FSM

### `CharFSMLayer.cs`
Path: `NetworkClient/NetPlay/Character/FSM/CharFSMLayer.cs`
**Class**: CharFSMLayer, EAuthoriyType
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: ChangeAuthoriyType, AddState, ChangeState, ChangeStateForce, SetPreventDuplicateState, Update, GetState, HasState, Init, CharFSMLayer

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

## `NetworkClient/NetPlay/CharacterMovement/`

### `AegisCharacterMovement.cs`
Path: `NetworkClient/NetPlay/CharacterMovement/AegisCharacterMovement.cs`
**Class**: AegisCharacterMovement
**NS**: ProjectAegis.NetPlay
**Methods**: Awake, OnCollisionFilterCallback, OnLanded, CanJump, GetMaxSpeed, GetBackwardSpeedMultiplier, GetAirborneSpeedMultiplier, SlideAlongSurface, ComputeSlideSpeedFactor

## `NetworkClient/NetPlay/Controller/`

### `PlayerController.cs`
Path: `NetworkClient/NetPlay/Controller/PlayerController.cs`
**Class**: PlayerController
**NS**: ProjectAegis.NetPlay
**Methods**: Awake, Update, OnStartServer, OnStartClient, OnStopClient, OnOwnershipClient, OnStartLocalPlayer, OnStopLocalPlayer, Possess, Unpossess, SetEnabledCharacterMovement, SetupInputComponent, BindPlayerInput, UnbindPlayerInput, ToggleOverlayMap, ToggleLargeMap, OpenPingWheel, ClosePingWheel, SetYawInput, SetPitchInput, Move, Look, ToggleCursorVisible, SetCursorVisible, UpdateSkillButtonState (+ 21 more)

### `PlayerController_FishNet.cs`
Path: `NetworkClient/NetPlay/Controller/PlayerController_FishNet.cs`
**Class**: PlayerController_FishNet, OneTimeInput, ReplicateData, ReconcileData
**NS**: ProjectAegis.NetPlay
**Methods**: ResetState, Dispose, GetTick, SetTick, Update, UpdateSyncRotation, CmdSetControlRotation, Look, Move, JumpDown, JumpUp, FireDown, FireUp, Reload, FireMode, ToggleAim, TimeManager_OnTick, BuildMoveData, PerformReplicate, PerformReconcile, CreateReconcile, OnOwnershipClient, OnStartClient, OnStartNetwork

## `NetworkClient/NetPlay/GameMode/`

### `PlayerReplicationData.cs`
Path: `NetworkClient/NetPlay/GameMode/PlayerReplicationData.cs`
**Class**: RepPlayerInfo, RepPlayStatus, RepTotalScore, RepRoundScore, RepTeamSynergyLevel, RepReward
**NS**: ProjectAegis.NetPlay
**Methods**: Clone, ResetLevel, IncreaseLevel

## `NetworkClient/NetPlay/Input/`

### `IPlayerInput.cs`
Path: `NetworkClient/NetPlay/Input/IPlayerInput.cs`
**Class**: IPlayerInput
**NS**: ProjectAegis.NetPlay

### `PlayerInputReader.cs`
Path: `NetworkClient/NetPlay/Input/PlayerInputReader.cs`
**Class**: PlayerInputReader
**NS**: ProjectAegis.NetPlay
**Methods**: Init, OnDestroy, Update, TryGetInputAction, BindInputAction, UnbindInputAction, OnMove, OnLook, OnMoveStarted, OnMoveCanceled, OnJumpStarted, OnJumpCanceled, OnFireStarted, OnFireCanceled, OnReloadStarted, OnAimStarted, OnCrouchStarted, OnFireModeStarted, OnWeaponSwitch1, OnWeaponSwitch2, OnWeaponSwitch3, OnWeaponSwitch4, OnWeaponUnequipStarted, OnToggleCursorVisibleStarted, OnActiveSkill1Started (+ 10 more)

## `NetworkClient/NetPlay/Interaction/`

### `InteractionPlayerModule.cs`
Path: `NetworkClient/NetPlay/Interaction/InteractionPlayerModule.cs`
**Class**: InteractionPlayerModule, RaycastHitDistanceComparer
**NS**: ProjectAegis.NetPlay.Interaction
**Methods**: ResetStatics, Awake, OnEnable, OnDisable, OnDestroy, Update, TrySetAsLocalPlayer, SetAsLocalInstance, SetAsLocalPlayer, DetectInteractables, CollectProximityTargets, SelectBestTarget, DetectByRaycast, IsBlockedByWall, Compare, HandleKeyboardInput, StartInteraction, UpdateCasting, CompleteCasting, CancelInteraction, ResetCasting, TriggerInteract, CancelIfCasting, ClearCache, ForceDetect (+ 3 more)

## `NetworkClient/NetPlay/Interaction/Handlers/Character/`

### `AddItemHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Character/AddItemHandler.cs`
**Class**: AddItemHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

### `AddPassiveHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Character/AddPassiveHandler.cs`
**Class**: AddPassiveHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

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

### `RemoveItemHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Character/RemoveItemHandler.cs`
**Class**: RemoveItemHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

### `RemovePassiveHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Character/RemovePassiveHandler.cs`
**Class**: RemovePassiveHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

### `RemoveStatusEffectHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Character/RemoveStatusEffectHandler.cs`
**Class**: RemoveStatusEffectHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

### `TeleportHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Character/TeleportHandler.cs`
**Class**: TeleportHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

## `NetworkDev/`

### `ServerPlayerSpawner_Aegis.cs`
Path: `NetworkDev/ServerPlayerSpawner_Aegis.cs`
**Class**: ServerPlayerSpawner_Aegis
**Methods**: Awake, OnDestroy, Spawn_Internally, SpawnAICharacter_Internally2, SpawnAICharacter_Internally, InitializeOnce

## `NetworkDev/03.ReferenceManager/02.ReferenceTable/`

### `RefBotEnemySelector.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBotEnemySelector.cs`
**Class**: CRefBotEnemySelector, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotEnemySelector, RegisterRefBotEnemySelectorBinary, FindRefBotEnemySelector, GetRefBotEnemySelectors

### `RefCharacter.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCharacter.cs`
**Class**: CRefCharacter, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacter, RegisterRefCharacterBinary, FindRefCharacter, GetRefCharacters

### `RefCharacterAppearance.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCharacterAppearance.cs`
**Class**: CRefCharacterAppearance, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterAppearance, RegisterRefCharacterAppearanceBinary, FindRefCharacterAppearance, GetRefCharacterAppearances

### `RefCharacterClass.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCharacterClass.cs`
**Class**: CRefCharacterClass, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterClass, RegisterRefCharacterClassBinary, FindRefCharacterClass, GetRefCharacterClasss

### `RefCharacterGearSet.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCharacterGearSet.cs`
**Class**: CRefCharacterGearSet, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterGearSet, RegisterRefCharacterGearSetBinary, FindRefCharacterGearSet, GetRefCharacterGearSets

### `RefCharacterLevel.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCharacterLevel.cs`
**Class**: CRefCharacterLevel, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterLevel, RegisterRefCharacterLevelBinary, FindRefCharacterLevel, GetRefCharacterLevels

### `RefCharacterPassiveSet.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCharacterPassiveSet.cs`
**Class**: CRefCharacterPassiveSet, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterPassiveSet, RegisterRefCharacterPassiveSetBinary, FindRefCharacterPassiveSet, GetRefCharacterPassiveSets

### `RefCharacterPingSound.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCharacterPingSound.cs`
**Class**: CRefCharacterPingSound, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterPingSound, RegisterRefCharacterPingSoundBinary, FindRefCharacterPingSound, GetRefCharacterPingSounds

### `RefCharacterSkin.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCharacterSkin.cs`
**Class**: CRefCharacterSkin, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterSkin, RegisterRefCharacterSkinBinary, FindRefCharacterSkin, GetRefCharacterSkins

### `RefCharacterStat.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCharacterStat.cs`
**Class**: CRefCharacterStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterStat, RegisterRefCharacterStatBinary, FindRefCharacterStat, GetRefCharacterStats

## `NetworkDev/DedicateLoadManager/`

### `DedicateLoadManager_Player.cs`
Path: `NetworkDev/DedicateLoadManager/DedicateLoadManager_Player.cs`
**Class**: NetworkManager_Aegis
**NS**: FishNet.Managing
**Methods**: LoadPlayer, UpdatePlayer, PlayerSpawner, ALLRemoveOwnership

## `ReferenceTable/`

### `RefBotEnemySelector.cs`
Path: `ReferenceTable/RefBotEnemySelector.cs`
**Class**: CRefBotEnemySelector, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotEnemySelector, RegisterRefBotEnemySelectorBinary, FindRefBotEnemySelector, GetRefBotEnemySelectors

### `RefCharacter.cs`
Path: `ReferenceTable/RefCharacter.cs`
**Class**: CRefCharacter, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacter, RegisterRefCharacterBinary, FindRefCharacter, GetRefCharacters

### `RefCharacterAppearance.cs`
Path: `ReferenceTable/RefCharacterAppearance.cs`
**Class**: CRefCharacterAppearance, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterAppearance, RegisterRefCharacterAppearanceBinary, FindRefCharacterAppearance, GetRefCharacterAppearances

### `RefCharacterClass.cs`
Path: `ReferenceTable/RefCharacterClass.cs`
**Class**: CRefCharacterClass, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterClass, RegisterRefCharacterClassBinary, FindRefCharacterClass, GetRefCharacterClasss

### `RefCharacterGearSet.cs`
Path: `ReferenceTable/RefCharacterGearSet.cs`
**Class**: CRefCharacterGearSet, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterGearSet, RegisterRefCharacterGearSetBinary, FindRefCharacterGearSet, GetRefCharacterGearSets

### `RefCharacterLevel.cs`
Path: `ReferenceTable/RefCharacterLevel.cs`
**Class**: CRefCharacterLevel, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterLevel, RegisterRefCharacterLevelBinary, FindRefCharacterLevel, GetRefCharacterLevels

### `RefCharacterPassiveSet.cs`
Path: `ReferenceTable/RefCharacterPassiveSet.cs`
**Class**: CRefCharacterPassiveSet, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterPassiveSet, RegisterRefCharacterPassiveSetBinary, FindRefCharacterPassiveSet, GetRefCharacterPassiveSets

### `RefCharacterPingSound.cs`
Path: `ReferenceTable/RefCharacterPingSound.cs`
**Class**: CRefCharacterPingSound, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterPingSound, RegisterRefCharacterPingSoundBinary, FindRefCharacterPingSound, GetRefCharacterPingSounds

### `RefCharacterSkin.cs`
Path: `ReferenceTable/RefCharacterSkin.cs`
**Class**: CRefCharacterSkin, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterSkin, RegisterRefCharacterSkinBinary, FindRefCharacterSkin, GetRefCharacterSkins

### `RefCharacterStat.cs`
Path: `ReferenceTable/RefCharacterStat.cs`
**Class**: CRefCharacterStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterStat, RegisterRefCharacterStatBinary, FindRefCharacterStat, GetRefCharacterStats

## `ScriptDev/Data/`

### `CharacterData.cs`
Path: `ScriptDev/Data/CharacterData.cs`
**Class**: ESkillSlotType, EWeaponSlotType, ECharacterResult, CharacterConstants, SkillSlotData, PassiveSlotData, ModuleSlotData, WeaponSlotData, CharacterData, CharacterSaveData, CharacterResultMessages
**NS**: ProjectAegis.Data
**Methods**: GetRequiredExperience, GetTotalExperienceForLevel, GetModule, SetModule, GetEquippedModuleCount, GetActiveSkill, SetActiveSkill, GetActiveSkillCount, GetOwnedPassive, SetOwnedPassive, GetPassiveSlot, SetPassiveSlot, GetWeaponSlot, SetWeaponSlot, GetExperienceInCurrentLevel, GetExperienceRequiredForCurrentLevel, CanLevelUp, IsPassiveEquipped, FindOwnedPassiveIndex, GetMessage, CharacterSaveData

## `ScriptDev/Manager/`

### `CharacterManager.cs`
Path: `ScriptDev/Manager/CharacterManager.cs`
**Class**: CharacterManager

### `PlayerManager.cs`
Path: `ScriptDev/Manager/PlayerManager.cs`
**Class**: PlayerManager
**NS**: GameSources.ScriptDev.Manager
**Methods**: Register, Unregister, GetByObjectId, GetBySessionId, GetMembers, GetOtherTeamMembers, GetTeamIDs, ClearAllTeams

## `ScriptDev/Manager/UserDatas/Characters/`

### `UserDataManager_Character.cs`
Path: `ScriptDev/Manager/UserDatas/Characters/UserDataManager_Character.cs`
**Class**: UserCharacters, UserDataManager
**NS**: ProjectAegis.UserDatas
**Methods**: RegisterNetHandler, InitUserData, ResetData, InitializeFromServer, InitializeModulesFromCharacterInfo, InitializeFromRefTable, EnsureCapacity, CreateCharacterInternal, TryGetOrCreateCharacter, TryGetCharacter, IsCharacterOwned, TryGetCharacterByIndex, GetCharacterIndex, GetCharacterDataRef, GetCharacterData, GetFilteredCharacters, GetFilteredIndex, SortFilteredCharacters, SetDeployedCharacter, SetDeployedCharacterByIndex, ClearDeployment, TryGetDeployedCharacter, UnlockCharacter, LockCharacter, SetLevel (+ 22 more)

### `UserDataManager_Module.cs`
Path: `ScriptDev/Manager/UserDatas/Characters/UserDataManager_Module.cs`
**Class**: UserCharacters
**NS**: ProjectAegis.UserDatas
**Methods**: InitializeWeapons, EquipWeaponInternal, InitializeModulesFromServer, InitializeModuleSlot, GetWeaponSlotTypeByWeaponId, GetModuleRefIdFromItemUID, SendEquipModuleRequest, SendUnequipModuleRequest, EquipModule, UnequipModule, ClearModuleSlotData, IsModuleEquippableByCharacter

### `UserDataManager_Skill.cs`
Path: `ScriptDev/Manager/UserDatas/Characters/UserDataManager_Skill.cs`
**Class**: UserCharacters
**NS**: ProjectAegis.UserDatas
**Methods**: InitializeSkills, InitializePassiveSkillsFromCharacterInfo, GetPassiveIdFromItemUID, SendEquipPassiveSkillRequest, SendUnequipPassiveSkillRequest, ConvertFromPassiveSkillSlotType, IsUniversalPassive, IsUniquePassive, IsPassiveEquippableByCharacter, UnlockSkill, EquipPassive, UnequipPassive, DebugPrintSkills, DebugForceUnlockSkill, DebugForceEquipPassive

### `UserDataManager_Skin.cs`
Path: `ScriptDev/Manager/UserDatas/Characters/UserDataManager_Skin.cs`
**Class**: UserDataManager, UserCharacters
**NS**: ProjectAegis.UserDatas
**Methods**: InitializeSkins, RegisterSkinNetHandler, IsCharacterSkinOwned, IsWeaponSkinOwned, SetCharacterSkin, SetWeaponSkin, ResetWeaponSkinToDefault, GetWeaponSkinId, InvokeWeaponSkinChanged, InvokeCharacterSkinChanged, ResetSkinToDefaultInternal, SendSkinEquipReq, OnGS2C_EquipSkinAck, OnGS2C_SkinInfoNotify, InitializeOwnedSkins, DebugPrintSkins, DebugForceSetSkin, DebugResetAllSkins

### `WeaponEquipData.cs`
Path: `ScriptDev/Manager/UserDatas/Characters/WeaponEquipData.cs`
**Class**: WeaponEquipData
**NS**: ProjectAegis.UserDatas

## `ScriptDev/Pulse/Runtime/`

### `UnityPulse.cs`
Path: `ScriptDev/Pulse/Runtime/UnityPulse.cs`
**Class**: UnityPulse
**NS**: Pulse.Unity
**Methods**: SetUserPID, SetDevice, SetPlatform, SetVersion, SetIdentifier, SetInterval, SetSendBufferSize, SetReceiveBufferSize, SetErrorThreshold, SetLogHandler, SetDefaultLogger, Start, Stop, Collect, StartSession, StopSession, StartRecorders, StopRecorders, SendData, FillRecordValues, GetFps, CanCollect, parseData, UnityPulse

### `UnityPulseByteArrayPool.cs`
Path: `ScriptDev/Pulse/Runtime/UnityPulseByteArrayPool.cs`
**Class**: UnityPulseByteArrayPool
**NS**: Pulse.Unity
**Methods**: Get, Return, UnityPulseByteArrayPool

### `UnityPulseData.cs`
Path: `ScriptDev/Pulse/Runtime/UnityPulseData.cs`
**Class**: UnityPulseData, UnityPulseData_json, UnityPulseCustomData
**NS**: Pulse.Unity
**Methods**: Write, ToJson, UnityPulseData, UnityPulseCustomData

### `UnityPulseInitializer.cs`
Path: `ScriptDev/Pulse/Runtime/UnityPulseInitializer.cs`
**Class**: UnityPulseInitializer
**NS**: Pulse.Unity
**Methods**: Init

### `UnityPulseLogger.cs`
Path: `ScriptDev/Pulse/Runtime/UnityPulseLogger.cs`
**Class**: IUnityPulseLogger, UnityPulseLogHandler, DefaultUnityPulseLogger
**NS**: Pulse.Unity
**Methods**: LogInfo, LogWarning, LogError, UnityPulseLogHandler

### `UnityPulseSession.cs`
Path: `ScriptDev/Pulse/Runtime/UnityPulseSession.cs`
**Class**: UnityPulseSessionStart, UnityPulseSessionStart_json, UnityPulseSessionStop, UnityPulseSessionStop_json
**NS**: Pulse.Unity
**Methods**: Write, ToJson, UnityPulseSessionStart, UnityPulseSessionStop

## `ScriptDev/Pulse/Tests/Runtime/`

### `UnityPulsePackageTests.cs`
Path: `ScriptDev/Pulse/Tests/Runtime/UnityPulsePackageTests.cs`
**Class**: UnityPulsePackageTests
**NS**: Pulse.Tests.Runtime
**Methods**: UnityPulseData_Write_ShouldWriteCorrectDataToBuffer, UnityPulseSessionStart_Write_ShouldWriteCorrectDataToBuffer, UnityPulseSessionStop_Write_ShouldWriteCorrectDataToBuffer

## `ScriptDev/Sort/`

### `CharacterComparer.cs`
Path: `ScriptDev/Sort/CharacterComparer.cs`
**Class**: CharacterComparer
**NS**: ProjectAegis.Sort
**Methods**: Setup, Compare

## `ScriptDev/UI/`

### `UITeamCharacterSelect.cs`
Path: `ScriptDev/UI/UITeamCharacterSelect.cs`
**Class**: UITeamCharacterSelect
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, PrepareContent, OnPanelEnabled, OnPanelDisabed, OnPanelRelase, LateUpdate, OnChangeMatchingState, OnFocusCharacterChanged, InitTooltipGear, ShowGearTooltip, InitTooltipSkill, ShowSkillTooltip, OnTouchDetected, OnSelectEquipSlotEvent

## `ScriptDev/UI/InGame/`

### `CUIIngamePlayerResult.cs`
Path: `ScriptDev/UI/InGame/CUIIngamePlayerResult.cs`
**Class**: CUIIngamePlayerResult
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, PrepareContent, HelperSetTextValue, OnClinkExit

## `ScriptDev/UI/Lobby/`

### `CUICharacterModelRotator.cs`
Path: `ScriptDev/UI/Lobby/CUICharacterModelRotator.cs`
**Class**: ERotationMode, ERotationZone, CUICharacterModelRotator
**NS**: ProjectAegis.UI
**Methods**: Awake, Update, OnDestroy, OnPointerDown, OnDrag, OnPointerUp, DetermineZone, CalculateDeltaRotation, CalculateZoneBasedRotation, UpdateSmoothRotation, UpdateReturnToInitialRotation, SetRotationTarget, SetPosition, SetRotationEnabled, SetRotationSpeed, SetSmoothSpeed, SetUseSmoothRotation, SetRotationMode, SetInnerCircleRatio, Clear, SetReturnToInitialRotation, SetReturnSpeed, SaveCurrentAsInitialRotation, ReturnToInitialRotationImmediate, ReturnToInitialRotationSmooth

### `CUILobbyCharacterModelController.cs`
Path: `ScriptDev/UI/Lobby/CUILobbyCharacterModelController.cs`
**Class**: CUILobbyModelInfo, CUILobbyCharacterModelController, LobbyModelUserStatusInfo
**NS**: ProjectAegis.UI
**Methods**: Dispose, RefreshAll, UpdatePositions, Remove, HideAll, SetupModelInfo, CreateModelInfo, UpdatePosition, UpdateReadyMark, SetReadyAndChangeCharBtn, OnShowHeroSelect, UpdateUIData, SetKickBtn, OnLeavePartyCallback, OnKickMemberCallback, CUILobbyCharacterModelController, LobbyModelUserStatusInfo

### `CUILobbyHeroSelectComp.cs`
Path: `ScriptDev/UI/Lobby/CUILobbyHeroSelectComp.cs`
**Class**: CUILobbyHeroSelectComp, HeroSlotItem, HeroData
**NS**: ProjectAegis.UI
**Methods**: SetData, OnButtonSelect, SetSelected, SetDim, IsSelected, Dispose, OnHide, OnShow, OnPartyInfoChanged, UpdateMemberSelected, UpdateUI, LoadHeroData, ClearAllSlots, OnSelectHeroTab, OnSelectHero, OnGS2C_ChangePartyCharacterAck, GetCellCount, HeroSlotItem, CUILobbyHeroSelectComp, HeroData

## `ScriptDev/UI/Lobby/Chraracter/`

### `CUICharacterInformation.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/CUICharacterInformation.cs`
**Class**: CUIInformationDetails, CUIBattlePowerDetails, StatusItemData, CUIStatusDetails_Popup, CUISeasonDetails, CUICharacterInformation
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, SetClassIcon, SetClassName, SetHeroName, SetLevel, SetTrophy, SetHeroDetail, SetAllData, Clear, OnClickDetailButton, SetBattlePower, SetHeart, SetShield, Open, Close, OnClickCloseButton, AddStatus, ClearStatusList, RefreshScroll, SetData, GetCellCount, SetSeasonNumber, SetRankTime, SetTotalRank, SetClassRank (+ 23 more)

### `CUICharacterList.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/CUICharacterList.cs`
**Class**: CUICharacterList, ECharacterTabType
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, OnPanelEnabled, OnPanelDisabed, SetParentPanel, OnTabSelected, RefreshList, BuildFilteredCharacterList, ClearSlots, GetClassFilterFromTab, OnButtonClose, SetData, GetCellCount, OnSelectSlot, OnCharacterSelected

### `CUICharacterPanel.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/CUICharacterPanel.cs`
**Class**: EChattingTabType, ECharacterTabType, CUIChatting, ICharacterChildPanel, CUICharacterPanel
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, SetChatText, SetChatRangeText, OnSelectChattingTab, SetAllData, Clear, SelectCharacter, SetInitialTab, PrepareContent, OnShow, OnPanelDisabed, SetCoinNumber, SetGemNumber, OnClickHome, OnClickBack, SetTabMenuVisible, SetTitleText, UpdateLobbyBackgroundCharacter, RefreshSelectedCharacter, RefreshSelectedWeapon, RefreshSelectedWeaponByModelId, GetCurrentWeaponTransform, GetCurrentWeaponSkinTransform, SetWeaponUIRectTransform, SetWeaponSkinUIRectTransform (+ 3 more)

### `CUICharacterSkill.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/CUICharacterSkill.cs`
**Class**: ESkillSlotState, ESkillPanelMode, CUIActiveSkillSlot, CUIPassiveSlot, CUIActiveSkillInfo, CUIPassiveSkillTooltip, CUIPassiveInventory, PassiveInventoryItem, CUICharacterSkill
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, OnClick, SetSkillData, SetSelected, UpdateVisualState, Clear, SetActive, SetSlotData, TryLoadPendingIcon, OnClickViewDetail, SetActiveSkillData, SetCallbacks, OnClickUnequip, OnClickChange, OnClickEquip, SetPassiveData, UpdateButtonState, SetButtonStateForEmptySlot, SetUnequipButtonEnabled, SetButtonStateForEquippedInInventory, HideAllButtons, SetPassiveList, InitializeScrollIfNeeded, SetSelectedPassive, SetData (+ 35 more)

### `CUICharacterSkin.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/CUICharacterSkin.cs`
**Class**: ESkinViewMode, ESkinCategoryType, CUICharacterSkin, SkinListSlot, SkinData
**NS**: ProjectAegis.UI
**Methods**: Awake, SetData, OnButtonSelect, SetSelect, OnDestroy, SetParentPanel, InitUIBind, OnPanelEnabled, OnPanelDisabed, OnPanelRelase, OnShow, UpdateUI, HasUnsavedChanges, UpdateResetButtonState, UpdateSaveButtonState, IsSkinOwned, LoadSkinData, GetWeaponGearModelId, UpdateSkinModel, UpdateSkinInfo, ClearSkinInfo, SelectSkin, SetRotateTarget, ClearAllSlots, OnSelectSkinCategory (+ 16 more)

### `CUICharacterWeapon.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/CUICharacterWeapon.cs`
**Class**: CUICharacterWeaponInfo, CUICharacterWeaponSlot, CUICharacterModuleSlot, CUICharacterModuleListPopup, CUIModuleDetailPopupManager, CUIModuleChangePopup, CUICharacterWeaponStatusList, CUICharacterWeapon
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, SetCharacterIcon, SetCharacterName, SetWeaponIcon, SetWeaponName, SetAllData, Clear, OnClickSlot, SetWeapon, SetModule, SetSelected, SetActive, SetState, Open, SetInitialSelectedUID, TriggerInitialSelection, Close, LoadModulesFromInventory, SetModuleList, ClearModuleList, RefreshScroll, SetData, GetOrCreateCell, OnClickModuleItem, GetCellCount (+ 35 more)

## `ScriptDev/UI/Lobby/Chraracter/Elements/`

### `CUICharacterSkillPopup.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/Elements/CUICharacterSkillPopup.cs`
**Class**: CUICharacterSkillPopup
**NS**: ProjectAegis.UI
**Methods**: Awake, SetActiveSkillData, SetPassiveSkillData, OnShow, Clear, SetTitle, SetSkillName, SetUltimateVisible, SetSkillOptions, SetDescription, SetPreviewImage, AdjustImageAspectRatio, OnClickClose

### `CUICharacterSkinDetailInfo.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/Elements/CUICharacterSkinDetailInfo.cs`
**Class**: CUICharacterSkinDetailInfo, SkinGrowthSlotItem, RewardSlotItem
**NS**: ProjectAegis.UI
**Methods**: SetData, SetActive, Release, SetRedDot, OnClickSlot, InitUIBind, BindGrowthSlots, BindRewardSlots, SetRewardClickCallback, SetGrowthSkinData, HideGrowthSkin, SetAcquireBonusData, HideAcquireBonus, HideAll, UpdateRewardRedDot, OnRewardSlotClick, OnDestroy, SkinGrowthSlotItem, RewardSlotItem

### `CUICharacterSlot.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/Elements/CUICharacterSlot.cs`
**Class**: CUICharacterSlot
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, SetSelectCallback, SetData, SetDataByCharacterId, SetSelect, OnButtonClick, UpdateUI, SetCharacterName, SetLevel, SetRankPointText, SetTierGauge, SetDimd, SetDeployed, SetCharacterPortrait, SetJobIcon, SetTierIcon, OnDisable, OnDestroy

## `ScriptDev/UI/Lobby/OldLobby/`

### `CUILobbyHeroSelect.cs`
Path: `ScriptDev/UI/Lobby/OldLobby/CUILobbyHeroSelect.cs`
**Class**: CUILobbyHeroSelect, HeroBandSlot, HeroSlotItem, HeroData
**NS**: ProjectAegis.UI
**Methods**: SetData, IsSelected, Dispose, OnButtonSelect, InitUIBind, OnPanelEnabled, OnPanelDisabed, OnPanelRelase, OnShow, UpdateUI, LoadHeroData, ConvertToBandData, ClearAllSlots, OnSelectHeroTab, OnSelectHero, ClickCloseBtn, GetCellCount, HeroBandSlot, HeroSlotItem

## `ScriptDev/UI/Option/`

### `OptionSlotFactory.cs`
Path: `ScriptDev/UI/Option/OptionSlotFactory.cs`
**Class**: OptionSlotFactory
**NS**: ProjectAegis.UserDatas
**Methods**: Create, CreateSlotByUIType

## `ScriptDev/UI/ReferenceTable/`

### `RefCharacterExtension.cs`
Path: `ScriptDev/UI/ReferenceTable/RefCharacterExtension.cs`
**Class**: CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: GetCharacterIconName, GetCharacterModelID, GetClassIconName, GetHeroName, GetHeroDetail, GetClassName, GetCharacterSkins, GetWeaponSkins, GetWeaponSkinsToWeaponID

## `ScriptDev/UI/UITeamMemberCharacterSelect/`

### `UISelectableHeroSlot.cs`
Path: `ScriptDev/UI/UITeamMemberCharacterSelect/UISelectableHeroSlot.cs`
**Class**: UISelectableHeroSlot
**NS**: ProjectAegis.UI
**Methods**: Awake, ResetData, SetupData, SetEmpty, OnBtnFocusSlot, OnBtnSelectSlot, OnBtnCancelSlot

### `UISelectCharacterMemberSlot.cs`
Path: `ScriptDev/UI/UITeamMemberCharacterSelect/UISelectCharacterMemberSlot.cs`
**Class**: UISelectCharacterMemberSlot
**NS**: ProjectAegis.UI
**Methods**: RefreshMemberCharacterIcon, Awake, Setup, SetupEmpty, ResetData, OnMemberDataChanged

### `UITeamSelectCharacterList.cs`
Path: `ScriptDev/UI/UITeamMemberCharacterSelect/UITeamSelectCharacterList.cs`
**Class**: UITeamSelectCharacterList
**NS**: ProjectAegis.UI
**Methods**: Dispose, SetupCharacterList, OnFocusCharacterSlot, UITeamSelectCharacterList

### `UITeamSelectCharacterMembers.cs`
Path: `ScriptDev/UI/UITeamMemberCharacterSelect/UITeamSelectCharacterMembers.cs`
**Class**: UITeamSelectCharacterMembers
**NS**: ProjectAegis.UI
**Methods**: Dispose, SetupTeamMembers, UITeamSelectCharacterMembers

### `UITeamSelectChracterInfo.cs`
Path: `ScriptDev/UI/UITeamMemberCharacterSelect/UITeamSelectChracterInfo.cs`
**Class**: UITeamSelectChracterInfo, ESlotType, MajorStat, EquipSlot
**NS**: ProjectAegis.UI
**Methods**: Setup, OnClickSelect, SetFocusedCharacter, RefreshSelectUI, UpdateStatSlots, UpdateWeaponslots, UpdateSkillSlots, UpdateContentData, SetActive, Dispose, MajorStat, EquipSlot, UITeamSelectChracterInfo

## `ScriptDev/UI/Utilities/`

### `UIHeroSelectBar.cs`
Path: `ScriptDev/UI/Utilities/UIHeroSelectBar.cs`
**Class**: UIHeroSelectBar
**NS**: ProjectAegis.UI
**Methods**: Dispose, OnTouchDetected, SetTabWithoutNotify, SetSelectHeroWithoutNotify, Initalize, OnSelectedHeroType, OnSelectChangeCharacter, SetData, GetCellCount, UIHeroSelectBar

### `UIHeroSelectSlot.cs`
Path: `ScriptDev/UI/Utilities/UIHeroSelectSlot.cs`
**Class**: UIHeroSelectSlot
**NS**: ProjectAegis.UI
**Methods**: Awake, SetupSlot, OnButtonSelect

## `ScriptTools/Editor/`

### `OutGameCharacterDataViewer.cs`
Path: `ScriptTools/Editor/OutGameCharacterDataViewer.cs`
**Class**: OutGameCharacterDataViewer
**Methods**: Open, OpenWithCharacter, OnEnable, OnGUI, OnInspectorUpdate, InitStyles, CheckManager, DrawBackground, DrawHeader, DrawToolbar, DrawWarningBox, DrawCharacterList, DrawCharacterListItem, DrawCharacterDetail, DrawTabs, DrawBasicInfoTab, DrawSkillsTab, DrawSkillSlot, DrawPassiveSlot, DrawEquipmentTab, DrawWeaponSlot, DrawActionsTab, ShowResultNotification, DrawCodeTab, DrawCodeSection (+ 5 more)

### `PlayerTrackerEditor.cs`
Path: `ScriptTools/Editor/PlayerTrackerEditor.cs`
**Class**: PlayerTrackerEditor
**NS**: ProjectAegis.Tools
**Methods**: OnEnable, OnInspectorGUI, DrawRuntimeStatus, OnSceneGUI

## `ScriptTools/Editor/CharacterSetupTools/`

### `CharacterModuleBase.cs`
Path: `ScriptTools/Editor/CharacterSetupTools/CharacterModuleBase.cs`
**Class**: CharacterModuleBase, GameObjectExt, SectionContext
**NS**: ProjectAegis.EditorTools
**Methods**: Reset, Collect, Apply, FindChildRecursively, GetPath, FindByPath, CharacterModuleBase, SectionContext

### `CharacterSetupData.cs`
Path: `ScriptTools/Editor/CharacterSetupTools/CharacterSetupData.cs`
**Class**: CharacterSetupData
**NS**: ProjectAegis.EditorTools
**Methods**: EnsureDefaultModules, OverwriteFrom

### `CharacterSetupWindow.cs`
Path: `ScriptTools/Editor/CharacterSetupTools/CharacterSetupWindow.cs`
**Class**: CharacterSetupWindow
**NS**: ProjectAegis.EditorTools
**Methods**: Open, OnGUI, CollectFromPrefab, SaveToAsset, ApplyToPrefab

## `ScriptTools/Editor/CharacterSetupTools/Modules/`

### `AimIKModule.cs`
Path: `ScriptTools/Editor/CharacterSetupTools/Modules/AimIKModule.cs`
**Class**: AimIKBoneData, AimIKModule
**NS**: ProjectAegis.EditorTools
**Methods**: Reset, Collect, Apply, AimIKBoneData, AimIKModule

### `ArmIKModule.cs`
Path: `ScriptTools/Editor/CharacterSetupTools/Modules/ArmIKModule.cs`
**Class**: ArmIKModule
**NS**: ProjectAegis.EditorTools
**Methods**: Reset, Collect, Apply, ArmIKModule

### `ColliderModule.cs`
Path: `ScriptTools/Editor/CharacterSetupTools/Modules/ColliderModule.cs`
**Class**: EColliderType, ColliderData, ColliderModule
**NS**: ProjectAegis.EditorTools
**Methods**: Reset, Collect, Apply, ColliderModule

### `FootstepModule.cs`
Path: `ScriptTools/Editor/CharacterSetupTools/Modules/FootstepModule.cs`
**Class**: FootstepModule
**NS**: ProjectAegis.EditorTools
**Methods**: Apply, Collect, Reset, FootstepModule

### `HitReactionModule.cs`
Path: `ScriptTools/Editor/CharacterSetupTools/Modules/HitReactionModule.cs`
**Class**: HitPointData, BoneLinkData, BoneHitPointData, HitReactionModule
**NS**: ProjectAegis.EditorTools
**Methods**: Reset, Collect, Apply, HitPointData, BoneHitPointData, HitReactionModule

### `LookIKModule.cs`
Path: `ScriptTools/Editor/CharacterSetupTools/Modules/LookIKModule.cs`
**Class**: LookIKModule
**NS**: ProjectAegis.EditorTools
**Methods**: Reset, Collect, Apply, LookIKModule

## `ScriptTools/Editor/DataExportTool/ToolCore/`

### `DynamicEnumFactory.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/DynamicEnumFactory.cs`
**Class**: DynamicEnumFactory, Ÿ, EArmorSlot
**NS**: DataExportTool
**Methods**: SetEnumSchema, GetOrCreateEnum

### `DynamicTypeFactory.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/DynamicTypeFactory.cs`
**Class**: DynamicTypeFactory
**NS**: DataExportTool
**Methods**: CreateType, BuildType, ResolvePropertyType, FindType

## `ScriptTools/Editor/UILayoutBuilder/`

### `UIElementFactory.cs`
Path: `ScriptTools/Editor/UILayoutBuilder/UIElementFactory.cs`
**Class**: UIElementFactory
**NS**: ProjectAegis.EditorTools.UILayoutBuilder
**Methods**: SetDefaultFont, SetDefaultTMPFont, SetDefaultSprite, CreateUIElement, CreatePanel, CreateText, CreateTMPText, CreateButton, CreateTMPButton, CreateImage, CreateRawImage, CreateInputField, CreateTMPInputField, CreateToggle, CreateTMPToggle, CreateSlider, CreateDropdown, CreateTMPDropdown, CreateScrollView, SetupLayoutGroup, AddLayoutElement, SetupRectTransform, SetAnchorPreset, ParseTextAnchor, ParseFontStyle (+ 2 more)

## `ScriptTools/Editor/WeaponTools/Preview/`

### `WeaponPreviewEditor.Character.cs`
Path: `ScriptTools/Editor/WeaponTools/Preview/WeaponPreviewEditor.Character.cs`
**Class**: WeaponPreviewEditor
**NS**: Aegis.EditorTools
**Methods**: SafeInvoke, InitCharacter, DrawPreviewEquip, ResetEquipPageObjects, RefreshPageEquip, SetupIKTarget, CharacterUpdate, DrawAnimState, CheckDisableCurrentState, ChangeAimState, ChangeCrouchState, ChangeReloadState, PlayCharge, SetWeight, PlayFire, ChangeCharacterMeshEnable

## `ScriptTools/LevelTools/`

### `PlayerTracker.cs`
Path: `ScriptTools/LevelTools/PlayerTracker.cs`
**Class**: PlayerTracker, RayInfo
**NS**: ProjectAegis.Tools
**Methods**: Start, Update, FindPlayer, CheckPlayerInRange, TrackPlayerHead, GetRayInfo, SetupGameViewVisualization, UpdateGameViewVisualization, OnDrawGizmos, OnDrawGizmosSelected, OnDestroy, PrintStatus

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


