# AI System Code Guide
> Auto-generated: 2026-02-25 13:31 | 147 files

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

## `Aegis.OrleansSilo/Grains/SqsPolling/`

### `ISqsPollingGrain.cs`
Path: `Aegis.OrleansSilo/Grains/SqsPolling/ISqsPollingGrain.cs`
**Class**: ISqsPollingGrain
**NS**: Aegis.OrleansSilo.Grains.SqsPolling

### `SqsPollingGrain.cs`
Path: `Aegis.OrleansSilo/Grains/SqsPolling/SqsPollingGrain.cs`
**Class**: SqsPollingGrain
**NS**: Aegis.OrleansSilo.Grains.SqsPolling
**Methods**: OnActivateAsync, ReceiveReminder, ProcessSqsMessageAsync, StartPollingAsync, StopPollingAsync, OnDeactivateAsync, SqsPollingGrain

## `NetworkClient/NetPlay/AI/`

### `AIActionBrainBase.cs`
Path: `NetworkClient/NetPlay/AI/AIActionBrainBase.cs`
**Class**: AIActionBrainBase
**NS**: ProjectAegis.NetPlay
**Methods**: GetAIController, GetAIMoveManager, GetAIActionManager, IsReservedResetAction, ReserveResetAction, GetReservedPresetKind, Update, FixedUpdate, ChangeTarget, ChangeBrainMode, ChangeBotMainState, ResetActionDirectly, ReserveNextPresetKind, AIActionBrainBase

### `AIActionBrainV1.cs`
Path: `NetworkClient/NetPlay/AI/AIActionBrainV1.cs`
**Class**: AIActionBrainV1
**NS**: ProjectAegis.NetPlay
**Methods**: Update, FixedUpdate, ChangeTarget, ChangeBrainMode, ResetActionDirectly, ReserveNextPresetKind, CheckCanSkill_TacticalMove, CheckCanSkill_Dash, CheckCanSkill_DeployShield, AIActionBrainV1

### `AIActionBrainV2.cs`
Path: `NetworkClient/NetPlay/AI/AIActionBrainV2.cs`
**Class**: AIActionBrainV2
**NS**: ProjectAegis.NetPlay
**Methods**: FirstInit, Update, FixedUpdate, ChangeTarget, ChangeBrainMode, ResetActionDirectly, ReserveNextPresetKind, OnMoveReached, GetBotMoveState, AIActionBrainV2

### `AIActionBrainV2_ActionStat.cs`
Path: `NetworkClient/NetPlay/AI/AIActionBrainV2_ActionStat.cs`
**Class**: EShotResultType, EBotMoveState, AIActionBrainV2
**NS**: ProjectAegis.NetPlay
**Methods**: EnterBlindState, ExitBlindState, GetCurrentActionStat, CalculateAccuracy, CalculateHeadshotRate, DetermineShotResult, CalculatePrepareTime, GetShotFollowRotateSpeed, GetSkillInitialTime, GetSkillIncorrectRate, RollSkillCorrectUsage, GetReloadFailRate, RollReloadSuccess, HasValidActionStat, IsBlindState, GetCachedAccuracy, GetCachedHeadshotRate, GetCachedPrepareTime, GetLastShotResult, GetCurrentActionStatId

### `AIActionBrainV2_BattleMovement.cs`
Path: `NetworkClient/NetPlay/AI/AIActionBrainV2_BattleMovement.cs`
**Class**: EBattleMovementType, AIActionBrainV2
**NS**: ProjectAegis.NetPlay
**Methods**: UpdateBattleMovement, AccumulateMovementWeights, TryReserveBattleMovement, ReserveBattleMovement, ResetMovementWeights, EndBattleMovement, ReserveTakeCover, ReserveRushEnemy, ReserveEscape, ReserveMoveDecision, GetEscapeTargetPosition, GetEscapeTarget, GetTargetPosition, HasReservedBattleMovementAction, GetReservedBattleMovementType, GetReservedBattleMovementTargetPosition, ConfirmBattleMovement, ClearReservedBattleMovement, GetCurrentBattleMovementType, IsBattleMovementActive, GetBattleMovementTargetPosition, ResetBattleMovementState, ClearSensoredEnemies

### `AIActionBrainV2_Condition.cs`
Path: `NetworkClient/NetPlay/AI/AIActionBrainV2_Condition.cs`
**Class**: AIActionBrainV2, 확인
**NS**: ProjectAegis.NetPlay
**Methods**: CheckCondition, GetConditionValue, CompareValue, GetOwnAmmoPercent, GetOwnFullMagCount, CountAllyAtBase, CountAllyInCombat, CountAllyInDist, CountAllyInDistInDirection, GetAllyHpPercentInDist, GetTargetLostHpPercent, GetAllyLostHpPercentInDist, GetAllyHitCountInDist, CountAllyByClassInDist, CountAllyCoveredInDist, CountAllyInjuredInDist, CountAllAlly, CountEnemyAtBase, CountEnemySighted, CountSensoredEnemyExact, CountSensoredEnemyInRange, GetNearestEnemyHpPercent, IsEnemyInDistMostFront, GetDistToNearestEnemy, GetDistToEnemyDeltaNearest (+ 14 more)

### `AIActionBrainV2_Debug.cs`
Path: `NetworkClient/NetPlay/AI/AIActionBrainV2_Debug.cs`
**Class**: AIBrainV2StackFrameInfo, AIBrainV2DebugLogEntry, AIBrainV2DebugState, AIBrainV2GradeActionInfo, AIBrainV2SkillSlotInfo, AIBrainV2SkillDecisionStateInfo, AIBrainV2SensoredEnemyInfo, AIBrainV2DebugLogger, AIActionBrainV2, ChangeAimModeSkipInfo, AIActionDebugLogger
**NS**: ProjectAegis.NetPlay
**Methods**: GetFormattedTime, ToString, Log, GetAllLogs, GetLogsByObjectId, GetLogsByCategory, ClearLogs, GetDebugState, GetSensoredEnemiesDebugInfo, GetSightedEnemyCount, LogMoveDecisionCheck, LogActionPresetDecision, LogBattleMovementReserve, LogBattleMovementWeightAccumulate, LogBattleMovementStart, LogBattleMovementEnd, LogBattleMovementReserveFailed, GetCurrentAmmoInfo, GetSkillSlotDebugInfos, LogMoveDecisionSelectStart, LogMoveDecisionEvaluateStart, LogMoveDecisionConditionCheck, LogMoveDecisionRateCheck, LogMoveDecisionSelectResult, LogTargetSelectStart (+ 35 more)

### `AIActionBrainV2_MoveDecision.cs`
Path: `NetworkClient/NetPlay/AI/AIActionBrainV2_MoveDecision.cs`
**Class**: AIActionBrainV2
**NS**: ProjectAegis.NetPlay
**Methods**: InitWaypoints, TryGetPositionFromMoveDecision, UpdateMoveDecision, TryConsumeReservedMoveDecision, TrySelectMoveDecisionFromFullList, TrySelectMoveDecisionFromList, TryEvaluateMoveDecisionFromList, OnMoveDecisionReached, ResetMoveDecisionState, CheckMoveDecisionConditionsWithLog, RollDecisionRateWithLog, GetCurrentBattleType, GetCurrentFaction, TryGetMoveTargetPosition, TryGetBasePosition, TryGetNearestWayPoint, TryGetNearestConditionalAllyPosition, GetForwardDirectionToObjective

### `AIActionBrainV2_Sensor.cs`
Path: `NetworkClient/NetPlay/AI/AIActionBrainV2_Sensor.cs`
**Class**: ESensorState, ESensorChangeType, ESensorKind, EnemySensorInfo, AIActionBrainV2
**NS**: ProjectAegis.NetPlay
**Methods**: OnSensorStateChanged, StartSensorBlind, GetEnemySensorState, CanShootEnemy, UpdateSensor, UpdateEnemySensor, UpdateSensorDecay, EvaluateSensorDetection, CheckSightDetection, CheckMapDetection, CheckHearingDetection, CheckReactionSightDetection, CheckHallucinationShoot, CheckEnemyLocationAccuracy, IsSensorBlind, GetSensoredEnemyCount, ClearAllSensors, RemoveSensoredEnemy, RemoveDeadEnemiesFromSensor, TryGetLastKnownPosition, GetShootableEnemies, RecordSensorToBrain, GetRecentAttackerCount, TryGetSensorConfig

### `AIActionBrainV2_ShotSelector.cs`
Path: `NetworkClient/NetPlay/AI/AIActionBrainV2_ShotSelector.cs`
**Class**: EShotAction, AIActionBrainV2
**NS**: ProjectAegis.NetPlay
**Methods**: UpdateShotSelector, UpdatePrepareTime, ClearPrepareState, EvaluateAndReserveShotAction, StartPrepareForFire, ReserveShotAction, CalculateShotCount, CalculateActualShotCount, HasReservedShotAction, GetReservedShotAction, GetReservedShotCount, ConfirmShotAction, ClearReservedShotAction, ResetShotSelectorState, IsPreparingShotAction, GetPrepareProgress, GetCurrentAmmoRatio

### `AIActionBrainV2_SkillDecision.cs`
Path: `NetworkClient/NetPlay/AI/AIActionBrainV2_SkillDecision.cs`
**Class**: ESkillTargetResultType, AIActionBrainV2, SkillDecisionState
**NS**: ProjectAegis.NetPlay
**Methods**: ResetOnSuccess, OnFailed, UpdateSkillDecision, TryStartIncorrectSkillPrepare, StartSkillPrepareForIncorrectUsage, UpdateSkillPrepareTime, StartSkillPrepare, ClearSkillPrepareState, ReserveSkillDecision, TryEvaluateSkillDecision, IsSkillCooldownReady, IsSkillDisabled, CalculateBonusRate, RollSkillDecisionRate, TryGetSkillTarget, TryGetNearestAlly, TryGetAllyHpLowestNearBy, TryGetNearestAllyByClass, TryGetMainTarget, TryGetNearestEnemyTarget, TryGetEnemyHpLowestNearBy, TryGetMainTargetPosition, TryGetDirectionToEnemyNearest, TryGetDirectionFromEnemyNearest, TryGetDirectionToAllyNearest (+ 13 more)

### `AIActionBrainV2_TargetSelect.cs`
Path: `NetworkClient/NetPlay/AI/AIActionBrainV2_TargetSelect.cs`
**Class**: AIActionBrainV2
**NS**: ProjectAegis.NetPlay
**Methods**: UpdateTargetSelect, TryEvaluateMainTarget, CalculateTargetScore, GetSightedEnemies, CheckTargetSelectCondition, GetTargetSelectConditionValue, IsTargetEnemyMostFrontInDist, IsTargetEnemyNearest, CountCoverBetweenTargetEnemy, SetMainTarget, ClearMainTarget, GetMainTarget, HasValidMainTarget, IsMainTargetValid, CanChangeMainTarget, OnAttackTried, ForceTargetReselect, ResetTargetSelectState

### `AIActionManager.cs`
Path: `NetworkClient/NetPlay/AI/AIActionManager.cs`
**Class**: AIActionManager
**NS**: ProjectAegis.NetPlay
**Methods**: GetAIController, GetAIMoveManager, GetCurActionKind, GetCurAction, GetLastTargetId, Update, FixedUpdate, GetNewUniqueId, PresetReady, ActionPoolReturn, ClearAllCurrentActions, InsertActionAtHead, AddActionToEnd, GetParameter, SetParameterValue, GetTargetCharacter, SetLastTargetId, GetAttackDistCur, GetAttackDistCurWithTarget, SetAttackDistCur, IsHPZero, GetBrain, ReserveResetAction, IsBywayProcessing, AIActionManager

### `AIClientManager.cs`
Path: `NetworkClient/NetPlay/AI/AIClientManager.cs`
**Class**: AIClientManager
**NS**: ProjectAegis.NetPlay
**Methods**: GetAIController, Update, FixedUpdate, SetMoveSpeedForClient, GetMoveSpeedForClient, MoveStartClient, MoveEndClient, Client_AnimationChangeToWalk, Client_AnimationChangeToStop, SetForceTransform, OnRespawn, ForceStand, SetGoalRotY, IsMoving, IsMovingForAnimation, SyncRotationY, GoalRotationY, MovementOn, MovementOff, JumpStart, JumpEnd, AIClientManager

### `AIData.cs`
Path: `NetworkClient/NetPlay/AI/AIData.cs`
**Class**: EAIBrainVersion, EAIBrainMode, EAIActionKind, EAIActionPresetKind, EAIActionResult, EAIBotMainState, EAITargetKind, EAIGrade, EAIMovementType, EAIMoveDirectionKind, EOverlapStepMain, EOverlapStepSub, EDirection, EMonSpreaded_History, EAIOverlapStep, EOverlapExceptionKind, EAITendencyType, EAIBywayType, EAIPatrolKind, EAIRotateBody, EAIMoveAttrib, EAIReloadKind, EAIGoalRotateGrade, EAIActionEndKind, EAIStandMode, EAITryStep, EAIReasonForAction, EAIWorldActionKind, EAIWorldActionAreaType, EAIDamageKind, EAISkillKind, HitResultM, CForbidMoveInfo, OverlapDecideData, SpreadedTargetData, MoveCheckData, AIActionConfig, AIParameter, AIData, AIBrainData, AIBrainPersonality, AIBrainEnvironment, CombatEventRecordInfo
**NS**: ProjectAegis.NetPlay
**Methods**: Clear, Set, GetAccumHitCount, GetAccumHpChangeRate, GetEnemyApproachDistance, HitResultM, AIParameter

### `AIHelper.cs`
Path: `NetworkClient/NetPlay/AI/AIHelper.cs`
**Class**: AIHelper
**NS**: ProjectAegis.NetPlay
**Methods**: Initialize, UpdateManager, LateUpdateManager, DoStop, CheckInTargetDistance, GetTargetPosByType, SingleCapsuleCast_OnlyChar

### `AIHelperComponent.cs`
Path: `NetworkClient/NetPlay/AI/AIHelperComponent.cs`
**Class**: AIHelperComponent
**NS**: ProjectAegis.NetPlay
**Methods**: InitDebugStyles

### `AIMoveManager.cs`
Path: `NetworkClient/NetPlay/AI/AIMoveManager.cs`
**Class**: AIMoveManager
**NS**: ProjectAegis.NetPlay
**Methods**: GetMovementType, GetAIController, Update, FixedUpdate, GetMoveSpeedCur, SetMoveSpeedCur, SetMoveDestination, SetMoveDir, SetMoveDirFromPos, GetMoveDestination, GetMoveDir, DecideMoveSpeedAndMoveAni, MoveStart, MoveEnd, SetGoalRotY, GoalRotYProc, SetRotationY, GetMoveNow, GetMoveArrivedPos, OverlapMoveInfoInit, Temp_ReadyPatrolPointList, Temp_ReadyPatrolPointList2, OnBywayStart, SetMoveDirectionKind, AIMoveManager

### `AIWorldActionComponent.cs`
Path: `NetworkClient/NetPlay/AI/AIWorldActionComponent.cs`
**Class**: AIWorldActionComponent, AIWorldActionComponent_Editor
**NS**: ProjectAegis.NetPlay
**Methods**: OnDrawGizmos, OnInspectorGUI

## `NetworkClient/NetPlay/AI/Actions/`

### `AIActionActiveSkill.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionActiveSkill.cs`
**Class**: AIActionActiveSkill
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, OnActionEnd, Update, AIActionActiveSkill

### `AIActionBase.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionBase.cs`
**Class**: AIActionBase
**NS**: ProjectAegis.NetPlay
**Methods**: GetActionStarted, GetAIActionKind, GetAIController, GetAIMoveManager, GetAIActionBrain, GetCharacter, SetAIGrade, GetAIGrade, GetAIOtherGrade, InitForCreate, ReadyWithConfig, CheckAndStart, OnActionStart, Update, OnActionEnd, OnActionEnd_NeedNext, OnActionEnd_NeedAgain, SetParameterFromConfig, AIActionBase

### `AIActionChangeAimMode.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionChangeAimMode.cs`
**Class**: AIActionChangeAimMode
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, OnActionEnd, Update, AIActionChangeAimMode

### `AIActionChangeStandMode.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionChangeStandMode.cs`
**Class**: AIActionChangeStandMode
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, OnActionEnd, Update, AIActionChangeStandMode

### `AIActionChangeWeapon.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionChangeWeapon.cs`
**Class**: AIActionChangeWeapon
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, Update, AIActionChangeWeapon

### `AIActionDeath.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionDeath.cs`
**Class**: AIActionDeath
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, Update, AIActionDeath

### `AIActionFireOnAim.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionFireOnAim.cs`
**Class**: AIActionFireOnAim
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, OnActionEnd, Update, AIActionFireOnAim

### `AIActionJump.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionJump.cs`
**Class**: AIActionJump
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, OnActionEnd, Update, AIActionJump

### `AIActionMolaCustom.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionMolaCustom.cs`
**Class**: AIActionMolaCustom
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, OnActionEnd, Update, AIActionMolaCustom

### `AIActionMove.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionMove.cs`
**Class**: AIActionMove
**NS**: ProjectAegis.NetPlay
**Methods**: GetMoveAttrib, GetLimitTime, GetLimitTimePast, ReadyWithConfig, OnActionStart, OnActionEnd, Update, OnActionEnd_NeedNext, ExecuteJump, AIActionMove

### `AIActionMuzzleUpDownToTarget.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionMuzzleUpDownToTarget.cs`
**Class**: AIActionMuzzleUpDownToTarget
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, Update, DrawDebugElements, AIActionMuzzleUpDownToTarget

### `AIActionOverlapMove.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionOverlapMove.cs`
**Class**: AIActionOverlapMove
**NS**: ProjectAegis.NetPlay
**Methods**: GetMoveAttrib, GetLimitTime, GetLimitTimePast, ReadyWithConfig, OnActionStart, OnActionEnd, Update, OnActionEnd_NeedNext, AIActionOverlapMove

### `AIActionParkour.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionParkour.cs`
**Class**: AIActionParkour
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, OnActionEnd, Update, AIActionParkour

### `AIActionPlayPreset.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionPlayPreset.cs`
**Class**: AIActionPlayPreset
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, Update, AIActionPlayPreset

### `AIActionReadyByway.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionReadyByway.cs`
**Class**: AIActionReadyByway
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, OnActionEnd, Update, AIActionReadyByway

### `AIActionReadyRunaway.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionReadyRunaway.cs`
**Class**: AIActionReadyRunaway
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, OnActionEnd, Update, AIActionReadyRunaway

### `AIActionReload.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionReload.cs`
**Class**: AIActionReload
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, Update, AIActionReload

### `AIActionRotateToTarget.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionRotateToTarget.cs`
**Class**: AIActionRotateToTarget
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, Update, AIActionRotateToTarget

### `AIActionSelectPatrolPoint.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionSelectPatrolPoint.cs`
**Class**: AIActionSelectPatrolPoint
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, Update, AIActionSelectPatrolPoint

### `AIActionSelectWayPoint.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionSelectWayPoint.cs`
**Class**: AIActionSelectWayPoint
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, OnActionEnd, Update, AIActionSelectWayPoint

### `AIActionSelectWorldActionPoint.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionSelectWorldActionPoint.cs`
**Class**: AIActionSelectWorldActionPoint
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, Update, AIActionSelectWorldActionPoint

### `AIActionSkillDamage.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionSkillDamage.cs`
**Class**: AIActionSkillDamage
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, OnActionEnd, Update, AIActionSkillDamage

### `AIActionTeleportToValidNavPoint.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionTeleportToValidNavPoint.cs`
**Class**: AIActionTeleportToValidNavPoint
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, Update, AIActionTeleportToValidNavPoint

### `AIActionWaitForDeployShieldEnd.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionWaitForDeployShieldEnd.cs`
**Class**: AIActionWaitForDeployShieldEnd
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, Update, AIActionWaitForDeployShieldEnd

### `AIActionWaitForDeployShieldEndV2.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionWaitForDeployShieldEndV2.cs`
**Class**: AIActionWaitForDeployShieldEndV2
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, Update, AIActionWaitForDeployShieldEndV2

### `AIActionWaitForOtherGradeEnd.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionWaitForOtherGradeEnd.cs`
**Class**: AIActionWaitForOtherGradeEnd
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, Update, AIActionWaitForOtherGradeEnd

### `AIActionWaitTick.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionWaitTick.cs`
**Class**: AIActionWaitTick
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, OnActionEnd, Update, AIActionWaitTick

## `NetworkClient/NetPlay/Character/`

### `CharacterFSMInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterFSMInterface.cs`
**Class**: Character
**NS**: ProjectAegis.NetPlay
**Methods**: ResetWasFiringBeforeState, InitFSM, UpdateFSM, AddParkourState, ChangeParkourState, StartParkour, ServerRpcStartParkour, ObserverStartParkour, GetAimMode, GetForcedAimMode, TrySetAimMode, ServerRpcSetAimMode, SetAimMode, OnChangedAimMode, IsAimModeBlocked, SetForcedAimMode, ClearForcedAimMode, ChangeFiringState, ServerChangeFiringState, ObserverChangeFiringState, CancelFiringState, OnFiringStateChanged, GetCurrentFiringStateID, IsFiring, CheckStartPressedFire (+ 16 more)

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

## `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/`

### `AimCorrection.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/AimCorrection.cs`
**Class**: AimCorrection
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, AimCorrection

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

### `CrossHairShow.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/CrossHairShow.cs`
**Class**: CrossHairShow
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: CrossHairShow

## `NetworkClient/NetPlay/Controller/`

### `AIController.cs`
Path: `NetworkClient/NetPlay/Controller/AIController.cs`
**Class**: AIController
**NS**: ProjectAegis.NetPlay
**Methods**: GetSV_LastTarget, GetSV_AimTargetPosition, GetSV_MoveDirectionKind, GetSV_IsMoving, GetCharacter, Awake, Start, OnDestroy, Possess, Update, FixedUpdate, GetStartAimPosition, ChangeTargetCauseDamage, OnMyLifeStateChanged, OnMyDowned, OnMyDeath, SetAimTagetPosition, UpdateAnimator, GetVelocity, GetMovementDirection, IsGrounded, IsFalling, IsJumping, IsFlying, IsMovementOnAir (+ 35 more)

## `NetworkClient/NetPlay/Stat/`

### `StatContainer.cs`
Path: `NetworkClient/NetPlay/Stat/StatContainer.cs`
**Class**: StatContainer, DebugStat
**NS**: ProjectAegis.NetPlay
**Methods**: GenerateBuffTicket, Init, GetStat, TryGetStat, GetValue, SetCurrentWeaponID, Rebuild, AddBuffStat, RemoveBuffStat, RemoveBuffStats, AddBuffRateStat, RemoveBuffRateStat, RemoveBuffRateStats, AddSkillPropertyStat, GetSkillPropertyStat, AddWeaponStat, RemoveWeaponStat, AddAdditionalBuffStat, RemoveAdditionalBuffStat, GetAdditionalBuffStatValue, GetAdditionalBuffStat, AddWeaponSpecificBuffStat, RemoveWeaponSpecificBuffStat, AddWeaponSpecificBuffRateStat, RemoveWeaponSpecificBuffRateStat

## `NetworkDev/03.ReferenceManager/02.ReferenceTable/`

### `RefBotActionDecision.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBotActionDecision.cs`
**Class**: CRefBotActionDecision, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotActionDecision, RegisterRefBotActionDecisionBinary, FindRefBotActionDecision, GetRefBotActionDecisions

### `RefBotActionStat.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBotActionStat.cs`
**Class**: CRefBotActionStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotActionStat, RegisterRefBotActionStatBinary, FindRefBotActionStat, GetRefBotActionStats

### `RefBotAi.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBotAi.cs`
**Class**: CRefBotAi, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotAi, RegisterRefBotAiBinary, FindRefBotAi, GetRefBotAis

### `RefBotBattleMovement.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBotBattleMovement.cs`
**Class**: CRefBotBattleMovement, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotBattleMovement, RegisterRefBotBattleMovementBinary, FindRefBotBattleMovement, GetRefBotBattleMovements

### `RefBotCondition.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBotCondition.cs`
**Class**: CRefBotCondition, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotCondition, RegisterRefBotConditionBinary, FindRefBotCondition, GetRefBotConditions

### `RefBotData.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBotData.cs`
**Class**: CRefBotData, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotData, RegisterRefBotDataBinary, FindRefBotData, GetRefBotDatas

### `RefBotEnemySelector.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBotEnemySelector.cs`
**Class**: CRefBotEnemySelector, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotEnemySelector, RegisterRefBotEnemySelectorBinary, FindRefBotEnemySelector, GetRefBotEnemySelectors

### `RefBotEscapeTarget.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBotEscapeTarget.cs`
**Class**: CRefBotEscapeTarget, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotEscapeTarget, RegisterRefBotEscapeTargetBinary, FindRefBotEscapeTarget, GetRefBotEscapeTargets

### `RefBotMoveDecision.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBotMoveDecision.cs`
**Class**: CRefBotMoveDecision, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotMoveDecision, RegisterRefBotMoveDecisionBinary, FindRefBotMoveDecision, GetRefBotMoveDecisions

### `RefBotSensor.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBotSensor.cs`
**Class**: CRefBotSensor, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotSensor, RegisterRefBotSensorBinary, FindRefBotSensor, GetRefBotSensors

### `RefBotShotAmount.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBotShotAmount.cs`
**Class**: CRefBotShotAmount, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotShotAmount, RegisterRefBotShotAmountBinary, FindRefBotShotAmount, GetRefBotShotAmounts

### `RefBotShotSelector.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBotShotSelector.cs`
**Class**: CRefBotShotSelector, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotShotSelector, RegisterRefBotShotSelectorBinary, FindRefBotShotSelector, GetRefBotShotSelectors

### `RefBotSkillDecision.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBotSkillDecision.cs`
**Class**: CRefBotSkillDecision, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotSkillDecision, RegisterRefBotSkillDecisionBinary, FindRefBotSkillDecision, GetRefBotSkillDecisions

### `RefBotTargetSelector.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBotTargetSelector.cs`
**Class**: CRefBotTargetSelector, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotTargetSelector, RegisterRefBotTargetSelectorBinary, FindRefBotTargetSelector, GetRefBotTargetSelectors

## `OrleansX.Abstractions/`

### `IGrainInvoker.cs`
Path: `OrleansX.Abstractions/IGrainInvoker.cs`
**Class**: IGrainInvoker
**NS**: OrleansX.Abstractions

## `OrleansX.Abstractions/Events/`

### `GrainEvent.cs`
Path: `OrleansX.Abstractions/Events/GrainEvent.cs`
**Class**: GrainEvent
**NS**: OrleansX.Abstractions.Events

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

### `TransactionalGrainBase.cs`
Path: `OrleansX.Grains/TransactionalGrainBase.cs`
**Class**: TransactionalGrainBase
**NS**: OrleansX.Grains
**Methods**: GetStateAsync, UpdateStateAsync, OnActivateAsync, OnDeactivateAsync, TransactionalGrainBase

## `OrleansX.Grains/Utilities/`

### `StreamHelper.cs`
Path: `OrleansX.Grains/Utilities/StreamHelper.cs`
**Class**: StreamHelper, StreamObserver
**NS**: OrleansX.Grains.Utilities
**Methods**: GetStreamProvider, OnNextAsync, OnCompletedAsync, OnErrorAsync, StreamHelper, StreamObserver

## `ReferenceTable/`

### `RefBotActionDecision.cs`
Path: `ReferenceTable/RefBotActionDecision.cs`
**Class**: CRefBotActionDecision, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotActionDecision, RegisterRefBotActionDecisionBinary, FindRefBotActionDecision, GetRefBotActionDecisions

### `RefBotActionStat.cs`
Path: `ReferenceTable/RefBotActionStat.cs`
**Class**: CRefBotActionStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotActionStat, RegisterRefBotActionStatBinary, FindRefBotActionStat, GetRefBotActionStats

### `RefBotAi.cs`
Path: `ReferenceTable/RefBotAi.cs`
**Class**: CRefBotAi, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotAi, RegisterRefBotAiBinary, FindRefBotAi, GetRefBotAis

### `RefBotBattleMovement.cs`
Path: `ReferenceTable/RefBotBattleMovement.cs`
**Class**: CRefBotBattleMovement, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotBattleMovement, RegisterRefBotBattleMovementBinary, FindRefBotBattleMovement, GetRefBotBattleMovements

### `RefBotCondition.cs`
Path: `ReferenceTable/RefBotCondition.cs`
**Class**: CRefBotCondition, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotCondition, RegisterRefBotConditionBinary, FindRefBotCondition, GetRefBotConditions

### `RefBotData.cs`
Path: `ReferenceTable/RefBotData.cs`
**Class**: CRefBotData, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotData, RegisterRefBotDataBinary, FindRefBotData, GetRefBotDatas

### `RefBotEnemySelector.cs`
Path: `ReferenceTable/RefBotEnemySelector.cs`
**Class**: CRefBotEnemySelector, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotEnemySelector, RegisterRefBotEnemySelectorBinary, FindRefBotEnemySelector, GetRefBotEnemySelectors

### `RefBotEscapeTarget.cs`
Path: `ReferenceTable/RefBotEscapeTarget.cs`
**Class**: CRefBotEscapeTarget, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotEscapeTarget, RegisterRefBotEscapeTargetBinary, FindRefBotEscapeTarget, GetRefBotEscapeTargets

### `RefBotMoveDecision.cs`
Path: `ReferenceTable/RefBotMoveDecision.cs`
**Class**: CRefBotMoveDecision, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotMoveDecision, RegisterRefBotMoveDecisionBinary, FindRefBotMoveDecision, GetRefBotMoveDecisions

### `RefBotSensor.cs`
Path: `ReferenceTable/RefBotSensor.cs`
**Class**: CRefBotSensor, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotSensor, RegisterRefBotSensorBinary, FindRefBotSensor, GetRefBotSensors

### `RefBotShotAmount.cs`
Path: `ReferenceTable/RefBotShotAmount.cs`
**Class**: CRefBotShotAmount, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotShotAmount, RegisterRefBotShotAmountBinary, FindRefBotShotAmount, GetRefBotShotAmounts

### `RefBotShotSelector.cs`
Path: `ReferenceTable/RefBotShotSelector.cs`
**Class**: CRefBotShotSelector, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotShotSelector, RegisterRefBotShotSelectorBinary, FindRefBotShotSelector, GetRefBotShotSelectors

### `RefBotSkillDecision.cs`
Path: `ReferenceTable/RefBotSkillDecision.cs`
**Class**: CRefBotSkillDecision, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotSkillDecision, RegisterRefBotSkillDecisionBinary, FindRefBotSkillDecision, GetRefBotSkillDecisions

### `RefBotTargetSelector.cs`
Path: `ReferenceTable/RefBotTargetSelector.cs`
**Class**: CRefBotTargetSelector, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBotTargetSelector, RegisterRefBotTargetSelectorBinary, FindRefBotTargetSelector, GetRefBotTargetSelectors

## `ScriptDev/Contents/`

### `CMain.cs`
Path: `ScriptDev/Contents/CMain.cs`
**Class**: CMain
**NS**: ProjectAegis.Contents
**Methods**: InitializeSingleton, Awake, InitializeApplicationSettings, InitializeDebugSettings, InitializeDefaultSettings, InitializeFramework, InitializeNetworkMonitoring, InitializeSystemSettings, InitializePerformanceMonitoring, Update, UpdateFramework, UpdateClientTimer, UpdatePerformanceMonitoring, UpdateNetworkMonitoring, HandleGarbageCollection, HandleEditorInput, DisableDebugRuntimeUI, StartClientContentsTimer, GetClientContentsPlaySeconds, GetLastLoginTime, LateUpdate, OnDestroy, CleanupFramework, OnApplicationPause, HandleApplicationResume (+ 9 more)

## `ScriptDev/Contents/Core/`

### `CAimAssistSystem.cs`
Path: `ScriptDev/Contents/Core/CAimAssistSystem.cs`
**Class**: CAimAssistSystem, ELineOfSightOrigin
**Methods**: SetAutoFireToggle, SetAimAssistToggle, AddRecoilOffset, FixedUpdate, BindPlayerInput, UnbindPlayerInput, OnManualFire, InitializeAutoFireStates, ChangeState, UpdateAutoFire, LoadAutoFireState, ToggleAutoFire, ToggleAimAssist, IsAutoFireConditionMet, IsAimAssistConditionMet, InitializeAimAssistStates, ChangeAimAssistState, IsApplyFireAimAssist, UpdateAimAssist, StartAimAssist, StopAimAssist, StartFireAimAssistCooldown, OnLookInput, UpdateTargetPart, ApplySustainedRotation (+ 26 more)

### `CameraImpulse.cs`
Path: `ScriptDev/Contents/Core/CameraImpulse.cs`
**Class**: CameraImpulse, ImpulseData
**Methods**: SetData, StartCameraImpulse, IsValid

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

### `AutoFireStateWait.cs`
Path: `ScriptDev/Contents/Core/AutoFireSystem/AutoFireStateWait.cs`
**Class**: AutoFireStateWait
**Methods**: Enter, Update, AutoFireStateWait

## `ScriptDev/UI/`

### `CUICrosshair.cs`
Path: `ScriptDev/UI/CUICrosshair.cs`
**Class**: CUICrosshair, ECrosshairType, EHitFeedbackType, ECrosshairColorType
**Methods**: Awake, OnDestroy, Update, LateUpdate, SetPlayer, OnWeaponChanged, OnSkillStarted, OnSkillEnded, OnAimModeChanged, OnPlayerDealDamage, UpdateAmmoUI, UpdateMuzzleBlockUI, UpdateShieldUI, UpdateCrosshairWidgets, GetSpreadData, UpdateCrosshairType, GetCurrentCrosshairType, GetCrosshairType, GetCrosshairSpreadLineType, CheckCrosshairHit, GetTargetCrosshairColorType, IsCrosshairActionBlocked, GetSpreadRadiusPixel

### `UIMainOverlayMenu.cs`
Path: `ScriptDev/UI/UIMainOverlayMenu.cs`
**Class**: UIMainOverlayMenu
**NS**: ProjectAegis.UI
**Methods**: BindTop, BindButtom, SetActive, SetTitle, SetCoinIcon, SetCoinText, SetGemIcon, SetGemText, SetCurrencyVisible, SetChatTab, OnSelectChattingTab, SetChatChannelText, SetChatNickNameText, SetChatMessageText, SetChatFieldVisible, SetButtomVisible, SetBackButtonAction, SetHomeButtonAction, SetAllData, Clear, Release, UIMainOverlayMenu

## `ScriptDev/UI/Crosshair/`

### `CUICrosshairComponent.cs`
Path: `ScriptDev/UI/Crosshair/CUICrosshairComponent.cs`
**Class**: CUICrosshairComponent
**Methods**: BindComponents, SetColor, Initialize, OnCrosshairUpdate, SetSpread, Reset

### `CUICrosshairSpreadLines.cs`
Path: `ScriptDev/UI/Crosshair/CUICrosshairSpreadLines.cs`
**Class**: CUICrosshairSpreadLines, SpreadLine
**Methods**: UpdateAimMode, OnEnable, BindComponents, OnCrosshairUpdate, SetSpread, UpdateSpreadLineType, UpdateRenderSpreadMultiplier

## `ScriptDev/UI/InGame/`

### `InGameMainHUD.cs`
Path: `ScriptDev/UI/InGame/InGameMainHUD.cs`
**Class**: InGameMainHUD
**NS**: GameSources.ScriptDev.UI.InGame

## `ScriptDev/UI/Lobby/`

### `CUILobbyMainPanel.cs`
Path: `ScriptDev/UI/Lobby/CUILobbyMainPanel.cs`
**Class**: LobbyM2DefineEditor, CUILobbyMainPanel, ELobbyBtnState
**NS**: ProjectAegis.UI
**Methods**: ToggleLobbyM2, ToggleLobbyM2Validate, InitUIBind, InitializeControllers, OnPanelEnabled, OnPanelDisabed, ShowInviteTestWindow, HideInviteTestWindow, ToggleInviteTestWindow, RegisterEditorInstance, UnregisterEditorInstance, OnGUI, SendTestInvite, EditorUpdate, Update, OnPanelRelase, OnShow, UpdateButtonStates, UpdateInviteListButton, ResolvePartyButtonState, ApplyButtonState, OnButtonQuickInvite, OnFriendListReceivedForInvite, OnButtonStartMatch, OnButtonMatchCancel (+ 9 more)

## `ScriptDev/UI/Lobby/Chraracter/Elements/`

### `CUICharacterSkinDetailInfo.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/Elements/CUICharacterSkinDetailInfo.cs`
**Class**: CUICharacterSkinDetailInfo, SkinGrowthSlotItem, RewardSlotItem
**NS**: ProjectAegis.UI
**Methods**: SetData, SetActive, Release, SetRedDot, OnClickSlot, InitUIBind, BindGrowthSlots, BindRewardSlots, SetRewardClickCallback, SetGrowthSkinData, HideGrowthSkin, SetAcquireBonusData, HideAcquireBonus, HideAll, UpdateRewardRedDot, OnRewardSlotClick, OnDestroy, SkinGrowthSlotItem, RewardSlotItem

### `CUIModuleDetailPopup.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/Elements/CUIModuleDetailPopup.cs`
**Class**: CUIModuleDetailPopup
**NS**: ProjectAegis.UI
**Methods**: BindUI, SetData, UpdateBadges, UpdateButtons, Show, Hide, IsVisible, Clear, SetIcon

## `ScriptDev/UI/Lobby/Clan/`

### `CUIClanMainView.cs`
Path: `ScriptDev/UI/Lobby/Clan/CUIClanMainView.cs`
**Class**: CUIClan, EMemberSortState, EMemberSortType, EMainViewSubType
**NS**: ProjectAegis.UI
**Methods**: BindMainView, BindMainBadgeAndLayout, BindPrimaryTab, BindMemberListTooltip, BindSortHeader, BindMemberListView, BindRecruitView, OnPrimaryTabSelected, ShowClanMainView, ShowMainViewSubView, UpdateRightMenuButtonColorsForClanSetting, UpdateRecruitTabButtonColors, RefreshMainView, ApplyMemberCountAndOnlineTexts, UpdateMemberCountAndOnlineTexts, LoadMainEmblemSprite, LoadMainFrameSprite, RefreshMemberList, RefreshSlotMeManually, UpdateMemberListEmptyState, EnsureMemberItemPool, ClearMemberList, OnMemberItemClick, BindRecruitTabEvents, BindRecruitBottomEvents (+ 35 more)

## `ScriptDev/UI/Map/`

### `MapPortraitIcon.cs`
Path: `ScriptDev/UI/Map/MapPortraitIcon.cs`
**Class**: MapPortraitIcon
**NS**: ProjectAegis.UI
**Methods**: UpdatePortraitIcon

## `ScriptDev/UI/Utilities/`

### `OutGameStatContainer.cs`
Path: `ScriptDev/UI/Utilities/OutGameStatContainer.cs`
**Class**: EStatQueryType, EStatBuildDirtyFlag, StatDifference, OutGameStatSnapshot, WeaponStatSnapshot, CharacterStatLayer, WeaponStatLayer, PassiveStatLayer, OutGameStatContainer
**NS**: ProjectAegis.Data
**Methods**: GetDifference, GetDifferencePercent, GetBeforeValue, GetAfterValue, GetChangedStats, GetIncreasedStats, GetDecreasedStats, GetValue, Init, GetBaseValue, GetAllBaseStats, GetStatTypes, SetDirty, FindCharacterStatByLevel, InitWeaponOnly, LoadWeaponStats, LoadModuleStats, LoadPerkStats, ApplyPerkEffect, LoadPassiveModuleStats, ApplyPassiveEffectToDict, GetWeaponOnlyStat, GetWeaponWithModuleStat, GetModuleOnlyStat, GetWeaponOnlyStats (+ 35 more)

## `ScriptDev/Utilities/`

### `CCachedMonoBehaviour.cs`
Path: `ScriptDev/Utilities/CCachedMonoBehaviour.cs`
**Class**: CCachedMonoBehaviour
**NS**: ProjectAegis.Utility
**Methods**: SetActive

## `ScriptTools/Editor/CharacterSetupTools/Modules/`

### `AimIKModule.cs`
Path: `ScriptTools/Editor/CharacterSetupTools/Modules/AimIKModule.cs`
**Class**: AimIKBoneData, AimIKModule
**NS**: ProjectAegis.EditorTools
**Methods**: Reset, Collect, Apply, AimIKBoneData, AimIKModule

## `ScriptTools/Editor/UILayoutBuilder/`

### `UGUILayoutBuilder.AIPrompt.cs`
Path: `ScriptTools/Editor/UILayoutBuilder/UGUILayoutBuilder.AIPrompt.cs`
**Class**: UGUILayoutBuilder
**NS**: ProjectAegis.EditorTools.UILayoutBuilder


