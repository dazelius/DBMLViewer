# Network System Code Guide
> Auto-generated: 2026-02-25 13:31 | 565 files

## `Aegis.Client/Packet/`

### `PacketHandler.cs`
Path: `Aegis.Client/Packet/PacketHandler.cs`
**Class**: PacketHandler
**Methods**: GS2C_KeyExchangeAckHandler, GS2C_LoginAckHandler, GS2C_PingNotifyHandler, GS2C_CreatePartyAckHandler, GS2C_GetPartyListAckHandler, GS2C_JoinPartyAckHandler, GS2C_LeavePartyAckHandler, GS2C_PartyMembersNotifyHandler, GS2C_InviteToPartyAckHandler, GS2C_PartyInviteNotifyHandler, GS2C_AcceptPartyInviteAckHandler, GS2C_RejectPartyInviteAckHandler, GS2C_SetPartyReadyAckHandler, GS2C_StartMatchAckHandler, GS2C_CancelMatchAckHandler, GS2C_MatchCancelledNotifyHandler, GS2C_MatchStatusNotifyHandler, GS2C_MatchCompletedNotifyHandler, GS2C_EnterRoomNotifyHandler, GS2C_SelectCharacterAckHandler, GS2C_RoomSelectionStatusNotifyHandler

### `PacketQueue.cs`
Path: `Aegis.Client/Packet/PacketQueue.cs`
**Class**: PacketMessage, PacketQueue
**Methods**: Push, PopAll, Clear, Pop

### `PacketSessionExtensions.cs`
Path: `Aegis.Client/Packet/PacketSessionExtensions.cs`
**Class**: PacketSessionExtensions
**Methods**: LogHandler, LogPacket, LogPacketJson, CreateDetailedJson, FormatFieldValue, GetDefaultValueForField

### `ServerSession.cs`
Path: `Aegis.Client/Packet/ServerSession.cs`
**Class**: ServerSession
**Methods**: Send, OnConnected, StartKeyExchange, HandleKeyExchangeAck, OnKeyExchangeCompleted, OnDisconnected, OnRecvPacket, OnSend, OnDecryptionFailed, ServerSession

## `Aegis.GameServer/GameLogic/GameLift/`

### `GameSessionManager.cs`
Path: `Aegis.GameServer/GameLogic/GameLift/GameSessionManager.cs`
**Class**: GameSessionManager, GameSessionInfo
**NS**: Aegis.GameServer.GameLift
**Methods**: CreateGameSessionAsync, UpdateGamePropertiesAsync, UpdateGameSessionAsync, WaitForGameSessionActiveAsync, GetGameSessionAsync, TerminateGameSessionAsync, GetActiveSessions, ClearCache, GameSessionManager

### `PlayerSessionManager.cs`
Path: `Aegis.GameServer/GameLogic/GameLift/PlayerSessionManager.cs`
**Class**: PlayerSessionManager, PlayerSessionInfo
**NS**: Aegis.GameServer.GameLift
**Methods**: CreatePlayerSessionAsync, CreatePlayerSessionsAsync, GetPlayerSession, GetPlayerSessionById, RemovePlayerSession, GetPlayerSessionsByGameSessionAsync, GetActivePlayerSessions, ClearCache, PlayerSessionManager

## `Aegis.GameServer/GameLogic/Matching/`

### `MatchmakingService.cs`
Path: `Aegis.GameServer/GameLogic/Matching/MatchmakingService.cs`
**Class**: MatchmakingService
**NS**: Aegis.GameServer.Matching
**Methods**: Start, Stop, ProcessStartMatchRequestAsync, ProcessCancelMatchRequestAsync, ProcessMatchmaking, CreateRoomForMatchAsync, NotifyMatchingPlayersAsync, CreateGameSessionForMatchAsync, TestCreateGameSessionForMatchAsync, SendStartMatchResponse, SendCancelMatchResponse

## `Aegis.GameServer/GameLogic/Room/`

### `Room.cs`
Path: `Aegis.GameServer/GameLogic/Room/Room.cs`
**Class**: CharacterSelection, RoomState, Room
**NS**: Aegis.GameServer.Room
**Methods**: StartCharacterSelection, SelectCharacter, IsAllPlayersSelected, IsSelectionTimeExpired, GetRemainingTime, AssignRandomCharactersToUnselected, SetStarting, SetCompleted, GetAllSelections, GetSelection, GetAllPlayerIds, GetSelectedCount, Room

### `RoomManager.cs`
Path: `Aegis.GameServer/GameLogic/Room/RoomManager.cs`
**Class**: RoomManager
**NS**: Aegis.GameServer.Room
**Methods**: StartRoomTimer, ProcessRoomsCallback, CreateRoom, GetRoom, GetPlayerRoom, RemoveRoom, GetAllRooms, ProcessRooms, StartGameForRoomAsync, Clear, RoomManager

## `Aegis.GameServer/Packet/`

### `PacketHandler.cs`
Path: `Aegis.GameServer/Packet/PacketHandler.cs`
**Class**: PacketHandler
**Methods**: C2GS_KeyExchangeReqHandler, C2GS_LoginReqHandler, C2GS_PongNotifyHandler, C2GS_TestCreateGameSessionReqHandler, C2GS_CreatePartyReqHandler, C2GS_GetPartyListReqHandler, C2GS_JoinPartyReqHandler, C2GS_LeavePartyReqHandler, C2GS_InviteToPartyReqHandler, C2GS_AcceptPartyInviteReqHandler, C2GS_RejectPartyInviteReqHandler, C2GS_SetPartyReadyReqHandler, C2GS_StartMatchReqHandler, C2GS_CancelMatchReqHandler, C2GS_SelectCharacterReqHandler

### `RoomPacketHandler.cs`
Path: `Aegis.GameServer/Packet/RoomPacketHandler.cs`
**Class**: RoomPacketHandler
**NS**: Aegis.GameServer.Packet
**Methods**: HandleSelectCharacter, NotifyRoomSelectionStatus

## `Aegis.GameServer/Session/`

### `ClientSession.cs`
Path: `Aegis.GameServer/Session/ClientSession.cs`
**Class**: ClientSession
**NS**: Aegis.GameServer.Session
**Methods**: HandleKeyExchangeReq, HandleLoginReq, HandlePong, SendPing, DisconnectByPing, GetPingStats, HandleTestCreateGameSessionAsync, Send, OnConnected, OnRecvPacket, OnDisconnected, OnSend, OnDecryptionFailed, ClientSession

### `SessionManager.cs`
Path: `Aegis.GameServer/Session/SessionManager.cs`
**Class**: SessionManager
**NS**: Aegis.GameServer.Session
**Methods**: Generate, RegisterPlayer, UnregisterPlayer, FindByPid, Find, Remove, GetSessions, HasSession, Clear

## `Aegis.GameServer/Session/Components/`

### `PingManager.cs`
Path: `Aegis.GameServer/Session/Components/PingManager.cs`
**Class**: IPingTarget, PingManager, PingStats
**NS**: Aegis.GameServer.Session
**Methods**: Start, Stop, ScheduleNextPing, ExecutePing, OnPongReceived, GetStats, PingManager

## `Aegis.NetworkShared/`

### `Connector.cs`
Path: `Aegis.NetworkShared/Connector.cs`
**Class**: Connector
**NS**: Aegis.NetworkShared
**Methods**: Connect, RegisterConnect, OnConnectCompleted

### `PacketSession.cs`
Path: `Aegis.NetworkShared/PacketSession.cs`
**Class**: PacketSession
**NS**: Aegis.NetworkShared
**Methods**: SetSessionKey, GetSessionKey, MakeSendBuffer, MakeSendBufferEncrypted, OnRecv, OnRecvPacket, OnDecryptionFailed

### `RecvBuffer.cs`
Path: `Aegis.NetworkShared/RecvBuffer.cs`
**Class**: RecvBuffer
**NS**: Aegis.NetworkShared
**Methods**: Clean, OnRead, OnWrite, RecvBuffer

### `Session.cs`
Path: `Aegis.NetworkShared/Session.cs`
**Class**: Session
**NS**: Aegis.NetworkShared
**Methods**: OnConnected, OnRecv, OnSend, OnDisconnected, Start, Send, Disconnect, IsConnected, RegisterSend, OnSendCompleted, RegisterRecv, OnRecvCompleted

## `Aegis.NetworkShared/Encryption/`

### `AesGcmEncryption.cs`
Path: `Aegis.NetworkShared/Encryption/AesGcmEncryption.cs`
**Class**: AesGcmEncryption
**NS**: Aegis.NetworkShared
**Methods**: Encrypt, Decrypt

### `X25519KeyExchange.cs`
Path: `Aegis.NetworkShared/Encryption/X25519KeyExchange.cs`
**Class**: X25519KeyExchange
**NS**: Aegis.NetworkShared
**Methods**: DeriveSharedSecret, DeriveAesKey, X25519KeyExchange

## `Aegis.PacketGenerator/`

### `PacketFormat.cs`
Path: `Aegis.PacketGenerator/PacketFormat.cs`
**Class**: PacketFormat, MsgId, PacketManager
**NS**: Aegis.PacketGenerator
**Methods**: Register, RegisterEncryptedPackets, RequiresEncryption, OnRecvPacket, GetPacketHandler

### `Program.cs`
Path: `Aegis.PacketGenerator/Program.cs`
**Class**: ProgramType, Options, Program
**NS**: PacketGenerator
**Methods**: RunOptions, Main, ParsePacket

## `Gen_Client/`

### `ClientPacketManager.cs`
Path: `Gen_Client/ClientPacketManager.cs`
**Class**: MsgId, PacketManager
**Methods**: Register, RegisterEncryptedPackets, RequiresEncryption, OnRecvPacket, GetPacketHandler

## `Gen_Server/`

### `GameServerPacketManager.cs`
Path: `Gen_Server/GameServerPacketManager.cs`
**Class**: MsgId, PacketManager
**Methods**: Register, RegisterEncryptedPackets, RequiresEncryption, OnRecvPacket, GetPacketHandler

## `NetworkClient/NetPlay/`

### `Entity.cs`
Path: `NetworkClient/NetPlay/Entity.cs`
**Class**: Entity
**NS**: ProjectAegis.NetPlay
**Methods**: GetObjectId, Awake, Start, OnDestroy, Update, FixedUpdate, OnStartNetwork, TakeDamage, IsAlly, GetCenterPosition, GetCenterOffset, GetColliderSize, Init, SetupModel, PostSetupModel, GetOwner, SpawnSummonObject, DestroyAllSummonObjects, RemoveSummonObject, RegisterSummonObject, GetSummonObject, GetSummonObjects, SetSummonOwner

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

### `AIController.cs`
Path: `NetworkClient/NetPlay/Controller/AIController.cs`
**Class**: AIController
**NS**: ProjectAegis.NetPlay
**Methods**: GetSV_LastTarget, GetSV_AimTargetPosition, GetSV_MoveDirectionKind, GetSV_IsMoving, GetCharacter, Awake, Start, OnDestroy, Possess, Update, FixedUpdate, GetStartAimPosition, ChangeTargetCauseDamage, OnMyLifeStateChanged, OnMyDowned, OnMyDeath, SetAimTagetPosition, UpdateAnimator, GetVelocity, GetMovementDirection, IsGrounded, IsFalling, IsJumping, IsFlying, IsMovementOnAir (+ 35 more)

### `Controller.cs`
Path: `NetworkClient/NetPlay/Controller/Controller.cs`
**Class**: EInputBlock, Controller
**NS**: ProjectAegis.NetPlay
**Methods**: InvokeOnManualFire, Awake, Start, OnDestroy, Update, FixedUpdate, LateUpdate, Possess, Unpossess, SetControlRotation, SetControlRotationPitch, SetControlRotationYaw, Move, Look, JumpDown, JumpUp, FireDown, FireUp, Reload, FireMode, ToggleAim, ToggleCrouch, Interact, SwitchWeapon, ToggleUnequipWeapon (+ 9 more)

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

## `NetworkClient/NetPlay/Energy/`

### `Energy.cs`
Path: `NetworkClient/NetPlay/Energy/Energy.cs`
**Class**: Energy, EnergyProcessor
**NS**: ProjectAegis.NetPlay
**Methods**: Update, SetValue, AddValue, UpdateRecovery, ResetRecoveryTimer, GetActualMaxValue, GetActualRecovery, IsInfinite, ChangeRecovery, Energy

### `EnergyModifier.cs`
Path: `NetworkClient/NetPlay/Energy/EnergyModifier.cs`
**Class**: EnergyModifier
**NS**: ProjectAegis.NetPlay
**Methods**: AddModifier, RemoveModifier, Clear

## `NetworkClient/NetPlay/Equipment/`

### `EquipmentManager.Armor.cs`
Path: `NetworkClient/NetPlay/Equipment/EquipmentManager.Armor.cs`
**Class**: EquipmentManager
**NS**: ProjectAegis.NetPlay
**Methods**: AddSyncVarChanedArmor, RemoveSyncVarChanedArmor, OnChangeSlotArmorID, EquipArmor, SetupClientArmorObject, SetReserveClientArmor, DespawnAllArmor

### `EquipmentManager.cs`
Path: `NetworkClient/NetPlay/Equipment/EquipmentManager.cs`
**Class**: EquipmentManager
**NS**: ProjectAegis.NetPlay
**Methods**: GetWeaponRuntimeAnimatorController, AddSyncVarChanedWeapon, RemoveSyncVarChanedWeapon, OnChangeSlotWeaponID, OnEquipmentWeaponChanged, OnLastWeaponIndexChanged, OnChangeIsChangeWeapon, OnStartReload, OnCompleteReload, OnCancelReload, OnCompleteChangeWeapon, Awake, OnDestroy, OnStartServer, OnStartClient, checkInitOwner, SetupHandle, CheckSetReserveItem, Update, CheckPendingSwap, FixedUpdate, Respawn, SetReserveClientWeapon, EquipWeapon, EquipSkillWeapon (+ 35 more)

### `EquipmentManager.Shield.cs`
Path: `NetworkClient/NetPlay/Equipment/EquipmentManager.Shield.cs`
**Class**: EquipmentManager
**NS**: ProjectAegis.NetPlay
**Methods**: IsEquippedShield, GetCurrentShield

## `NetworkClient/NetPlay/Equipment/Armor/Core/`

### `ArmorBase.cs`
Path: `NetworkClient/NetPlay/Equipment/Armor/Core/ArmorBase.cs`
**Class**: ArmorBase
**NS**: ProjectAegis.NetPlay
**Methods**: TakeDamage, Init

## `NetworkClient/NetPlay/Equipment/Weapon/Bullet/`

### `Projectile.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Bullet/Projectile.cs`
**Class**: Projectile, WeaponData, ProjectileResultData
**NS**: ProjectAegis.NetPlay
**Methods**: Awake, OnDestroy, AddSyncValueOnChanged, RemoveSyncValueOnChanged, OnChangedOwnerObjectID, OnChangedVelocity, GetIgnoredEntities, AddIgnoredEntity, IsIgnoredEntity, Init, LoadGameData, InitProjectileData, GetShooterRoot, OnStartServer, OnStartClient, InitCollider, InitComponent, CheckNInitOwner, Update, FixedUpdate, Launch, CreateDamageData, Observers_CheckSpawnHitEffect, Observers_CheckSpawnLifeEndEffect, DespawnProjectile (+ 26 more)

## `NetworkClient/NetPlay/Equipment/Weapon/Bullet/Movement/`

### `CollisionRelay.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Bullet/Movement/CollisionRelay.cs`
**Class**: CollisionRelay
**NS**: ProjectAegis.NetPlay
**Methods**: OnCollisionEnter, OnTriggerEnter

### `ProjectileMovement.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Bullet/Movement/ProjectileMovement.cs`
**Class**: ProjectileMovement
**NS**: ProjectAegis.NetPlay
**Methods**: Initialize, Execute, SetVelocity, OnImpact, RecalcVelocity, OnCollisionEnter, OnTriggerEnter

### `ProjectileMovementBallistic.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Bullet/Movement/ProjectileMovementBallistic.cs`
**Class**: ProjectileMovementBallistic

## `NetworkClient/NetPlay/Equipment/Weapon/Core/`

### `EquippableBase.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Core/EquippableBase.cs`
**Class**: EWeaponState, EquippableBase
**NS**: ProjectAegis.NetPlay
**Methods**: AddSyncValueOnChanged, RemoveSyncValueOnChanged, SetupOwner, Awake, OnDestroy, LateUpdate, OnSelect, OnDeselect, OnDropItem, SetActive, CanUse, CanSwap, Respawn, PostSetupModel, SetHiddenModel, SetWeaponState, GetDataStatInt, GetDataStatFloat, GetDataStatValueAsRatio, GetDataStatValueAsPercent, GetStatInt, GetStatFloat, GetStatValueAsRatio, GetStatValueAsPercent, AnimPlay (+ 4 more)

### `GunBase.AttachSystem.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Core/GunBase.AttachSystem.cs`
**Class**: GunBase
**NS**: ProjectAegis.NetPlay
**Methods**: IsOverheat, UpdateOverhit, HandleOverHeat_Logic, HandleOverHeat_Visuals, GetHeatPercentage, CoolDown

### `GunBase.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Core/GunBase.cs`
**Class**: GunBase
**NS**: ProjectAegis.NetPlay
**Methods**: SetupHandle, RemoveHandle, Init, Respawn, SetupOwner, RebuildWeaponStat, InitializeWeapon, PostSetupModel, OnDropItem, InitializeServerData, Update, OnCinemachineUpdated, FixedUpdate, StartFire, StopFire, CancelFire, Observer_CancelFire, HandleReload_Logic, HandleReload_Visuals, Reload, HandleFiringLogic, CanFire, CanFireNotCheckTime, IsFireTimeReady, CanReload (+ 35 more)

### `GunBase.Debug.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Core/GunBase.Debug.cs`
**Class**: GunBase
**NS**: ProjectAegis.NetPlay
**Methods**: GetDebugString, UpdateFireRateStats, Debug_InvokeTestHitPoint

### `GunBase.Value.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Core/GunBase.Value.cs`
**Class**: GunBase, HitEffectData
**NS**: ProjectAegis.NetPlay
**Methods**: AddSyncValueOnChanged, RemoveSyncValueOnChanged, OnChangedCurrentAmmo, OnChangedReserveAmmo, OnChangedReloadingState

### `MeleeWeaponBase.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Core/MeleeWeaponBase.cs`
**Class**: MeleeWeaponBase
**NS**: ProjectAegis.NetPlay
**Methods**: SetupHandle, RemoveHandle, InitializeWeapon, Update, HandleAttack, CanAttack, TryAttack, RefreshNextAttackTime, ServerRpc_Attack, Attack_Internal, PerformAttackHitCheck, ApplyDamage, Observers_PlayAttackEffects, Observers_CheckSpawnHitEffect, OnPrimaryActionDown, OnPrimaryActionUp, OnSecondaryActionDown, OnSecondaryActionUp, OnStartReload, GetMuzzleTransform, GetGripTransform, GetBendTransform

### `PhysicsConstants.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Core/PhysicsConstants.cs`
**Class**: PhysicsConstants, Ballistics, DispersionModel, TimeHelper
**NS**: ProjectAegis.NetPlay
**Methods**: GetGravityAtAltitude, GetSpeedOfSound, GetStandardTemperature, GetDragCoefficientForMach, MoaToRadians, GameMoaToDegrees, GetBulletDirection, GetBulletDirectionFromDegrees, GetBulletDirectionFromGameMoa, GetBulletRay, GetCurrentTimeMS, TimeMSToSec, TimeSecToMS

### `ShieldBase.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Core/ShieldBase.cs`
**Class**: ShieldBase, EShieldState
**NS**: ProjectAegis.NetPlay
**Methods**: GetStatInt, GetStatFloat, GetStatValueAsRatio, GetStatValueAsPercent, OnPrimaryActionDown, OnPrimaryActionUp, OnSecondaryActionDown, OnSecondaryActionUp, OnStartReload, GetMuzzleTransform, GetGripTransform, GetBendTransform, AddSyncValueOnChanged, RemoveSyncValueOnChanged, Init, SetupOwner, PostSetupModel, SetHiddenModel, SetWeaponState, GetShieldState, SetShieldEffect, UpdateShieldEffect, CanUse, TakeDamage, DealShield (+ 10 more)

### `WeaponBase.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Core/WeaponBase.cs`
**Class**: WeaponBase, EWeaponSoundType, EWeaponEffectType, EHitEffectTarget, EChargeEffectType, WeaponDummyState
**NS**: ProjectAegis.NetPlay
**Methods**: OnPrimaryActionDown, OnPrimaryActionUp, OnSecondaryActionDown, OnSecondaryActionUp, OnStartReload, GetMuzzleTransform, GetGripTransform, GetBendTransform, CancelReload, CancelFire, ResetSkillWeapon, ExecuteOnHitNodes, AddOnHitExecuteNode, RemoveOnHitExecuteNode, RebuildWeaponStat, SetupOwner, Init, InitializeWeapon, GetRefProjectile, GetRefEffect, GetPlaySoundId, IsForceDelayActive, CanSwap, SetupHandle, RemoveHandle (+ 13 more)

### `WeaponData.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Core/WeaponData.cs`
**Class**: GunConfiguration
**NS**: ProjectAegis.NetPlay

## `NetworkClient/NetPlay/Equipment/Weapon/Gun/`

### `ChargeWeapon.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Gun/ChargeWeapon.cs`
**Class**: ChargeWeapon, is, DelayCreateProjectileInfo
**NS**: ProjectAegis.NetPlay
**Methods**: AddSyncValueOnChanged, RemoveSyncValueOnChanged, OnChangedChargingState, Init, InitializeWeapon, FixedUpdate, Update, UpdatePreCharge, PlayStepEffect, SpawnLoopEffect, SetupHandle, RemoveHandle, OnSelect, OnDeselect, Fire, ConsumeAmmo, CheckSpawnHitEffect, CancelCharge, RemoveChargeEffect, ServerRpc_StartCharging, StartCharging_Internal, ServerRpc_EndCharging, EndCharging_Internal, ServerRpc_CancelCharging, CancelCharging_Internal (+ 11 more)

### `LaserWeapon.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Gun/LaserWeapon.cs`
**Class**: LaserWeapon

### `LockOnChargeWeapon.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Gun/LockOnChargeWeapon.cs`
**Class**: LockOnChargeWeapon, ELockOnState
**NS**: ProjectAegis.NetPlay
**Methods**: Init, InitializeWeapon, Respawn, OnSelect, OnDeselect, Update, CanFireNotCheckTime, ResetLockOnState, UpdateLockOnState, SearchForTarget, UpdateAcquiring, FindAimTarget, ServerValidateLockedTarget, OnPrimaryActionDown, UpdateFireDelay, Fire, SetLockOnTarget, ServerRpc_SetLockOnTarget, UpdateAutoTracking, GetHitResult, PostFire, UpdateCooldown

### `ShotgunWeapon.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Gun/ShotgunWeapon.cs`
**Class**: ShotgunWeapon

### `ShotgunWeaponRC.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Gun/ShotgunWeaponRC.cs`
**Class**: ShotgunWeaponRC

## `NetworkClient/NetPlay/Equipment/Weapon/Throwables/`

### `FragGrenade.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Throwables/FragGrenade.cs`
**Class**: FragGrenade

### `SmokeGrenade.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Throwables/SmokeGrenade.cs`
**Class**: SmokeGrenade, IAIVision, ILaserSight, LaserSight, VisionEffect

### `ThrowableBase.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Throwables/ThrowableBase.cs`
**Class**: ThrowableBase

## `NetworkClient/NetPlay/GameEvent/`

### `InGameEventSystem.cs`
Path: `NetworkClient/NetPlay/GameEvent/InGameEventSystem.cs`
**Class**: EGameEventType, EventReceiverPair, IGameEventReceiver, GameEventHandlerAttribute, InGameEvent, EventHandlerGroup, Entry
**NS**: ProjectAegis.NetPlay
**Methods**: InGameEventHandler, AddHandler, RemoveHandler, Invoke, Register, HelperRetrieveReceivers, IsMethodSuitable, Unregister, OnReceiveEvent, RaiseEvent, Release, GameEventHandlerAttribute

## `NetworkClient/NetPlay/GameMode/`

### `GameMode.cs`
Path: `NetworkClient/NetPlay/GameMode/GameMode.cs`
**Class**: EGameResult, GameMode
**NS**: ProjectAegis.NetPlay
**Methods**: InitStatic, Awake, OnDestroy, OnStartNetwork, OnStartServer, OnStartClient, OnStopClient, OnStopServer, OnStopNetwork, LocalServerInit, CreateClientHandler, StartPlayTimeCoroutine, UpdatePlayTimeCoroutine, StopPlayTimeCoroutine, OnPlayerDead, EnterPlayer, OnServerPlayerSpawned, OnServerPlayerDespawn, OnClientPlayerSpawned, OnClientPlayerDespawn, AreAllPlayersSpawned, OnCharacterDeath, OnChangePlayTime, GetPlayTime, StartRespawnCoroutine (+ 33 more)

### `GameModeClash.cs`
Path: `NetworkClient/NetPlay/GameMode/GameModeClash.cs`
**Class**: GameModeClash
**NS**: ProjectAegis.NetPlay
**Methods**: OnStartNetwork, OnMapObjectSpawned, OnStartClient, OnStopClient, OnStopServer, SetupRoundStateMessages, ServerChangeRoundState, ClientChangeRoundState, OnFinishedCapture, ProcessTimeout, GetCurrentCaptureEarnTeamID, IncreaseCaptureScore, OnRoundStart, IsReachWinScore, PlayTimeFinished, OnChangeCaptureScore, SendToActiveGuidePoint, RpcToActiveGuidePoint

### `GameModeClientHandler.cs`
Path: `NetworkClient/NetPlay/GameMode/GameModeClientHandler.cs`
**Class**: GameModeClientHandler
**NS**: ProjectAegis.NetPlay
**Methods**: SetMaxRoundNumber, AddClientEvent, RemoveClientEvent, OnPlayerHealthChanged

### `GameModeClientRoundHandler.cs`
Path: `NetworkClient/NetPlay/GameMode/GameModeClientRoundHandler.cs`
**Class**: GameModeClientRoundHandler
**NS**: ProjectAegis.NetPlay
**Methods**: ChangePlayTime, ChangeRoundState, SetRoundStateMessage, ShowRoundStateMessage, ChangeRoundReadyState, ShowRoundStatus, ChangeRoundReadyState_PopupMap, ChangeRoundReadyState_Tactical, ChangeRoundReadyState_RoundStart, ChangeRoundReadyState_Intro, ClearUIPanels, StopUIProc, ChangeRoundNumber, RoundStateTime, ClearAllUIPanels

### `GameModeClientTDMHandler.cs`
Path: `NetworkClient/NetPlay/GameMode/GameModeClientTDMHandler.cs`
**Class**: GameModeClientTDMHandler
**NS**: ProjectAegis.NetPlay

### `GameModeClintPointCaptureHandler.cs`
Path: `NetworkClient/NetPlay/GameMode/GameModeClintPointCaptureHandler.cs`
**Class**: GameModeClintPointCaptureHandler

### `GameModePointCapture.cs`
Path: `NetworkClient/NetPlay/GameMode/GameModePointCapture.cs`
**Class**: GameModePointCapture
**NS**: ProjectAegis.NetPlay
**Methods**: OnStartNetwork, OnStopServer, OnFinishedCapture, PlayTimeFinished, ServerChangeRoundState, ClientChangeRoundState, OnRoundStart, ServerCheckSwapTeam, ClientCheckSwapTeam, ReadyInit, SendToActiveGuidePoint, RpcToActiveGuidePoint, ClearMapData, ServerFinishMapChange, InitializePointCaptureSystem, ClientFinishMapChange

### `GameModeRespawnSystem.cs`
Path: `NetworkClient/NetPlay/GameMode/GameModeRespawnSystem.cs`
**Class**: GameModeRespawnSystem
**NS**: ProjectAegis.NetPlay
**Methods**: InitBattleModeinfo, InitRespawnCount, IsInfiniteRespawn, GetRespawnCount, GetRespawnTime

### `GameModeRound.cs`
Path: `NetworkClient/NetPlay/GameMode/GameModeRound.cs`
**Class**: RoundState, RoundReadyState, TeamType, ERoundResult, GameModeRound, GameModeRoundSyncData, EDecideRoundWinScore
**NS**: ProjectAegis.NetPlay
**Methods**: OnStartNetwork, OnStartServer, OnStartClient, InitSafetyZones, OnStopClient, OnStopServer, OnStopNetwork, LocalServerInit, EnterPlayer, CreateClientHandler, SetupRoundStateMessages, GetPlayTime, OnChangePlayTime, StartRoundStateTimeCoroutine, UpdateRoundStateTimeCoroutine, StopRoundStateTimeCoroutine, OnChangeRoundSyncData, ChangeRoundState, ServerChangeRoundState, ClientChangeRoundState, StartRoundReadyStateTimeCoroutine, UpdateRoundReadyStateTimeCoroutine, StopRoundReadyStateTimeCoroutine, PlayTimeFinished, GameFinished (+ 27 more)

### `GameModeTDM.cs`
Path: `NetworkClient/NetPlay/GameMode/GameModeTDM.cs`
**Class**: GameModeTDM
**NS**: ProjectAegis.NetPlay
**Methods**: CreateClientHandler, ServerChangeRoundState

### `GameReward.cs`
Path: `NetworkClient/NetPlay/GameMode/GameReward.cs`
**Class**: GameMode
**NS**: ProjectAegis.NetPlay
**Methods**: SetReward

### `PlayerReplicationData.cs`
Path: `NetworkClient/NetPlay/GameMode/PlayerReplicationData.cs`
**Class**: RepPlayerInfo, RepPlayStatus, RepTotalScore, RepRoundScore, RepTeamSynergyLevel, RepReward
**NS**: ProjectAegis.NetPlay
**Methods**: Clone, ResetLevel, IncreaseLevel

## `NetworkClient/NetPlay/Helper/`

### `ComponentExtention.cs`
Path: `NetworkClient/NetPlay/Helper/ComponentExtention.cs`
**Class**: ComponentExtention
**NS**: ProjectAegis.NetPlay

### `SkillValueUtil.cs`
Path: `NetworkClient/NetPlay/Helper/SkillValueUtil.cs`
**Class**: TimeUtils, RefValueHelper
**NS**: ProjectAegis.NetPlay
**Methods**: SecondsToMS, MSToSeconds, SnapToFixedFrame, SecToFixedFrame, SecondsToMilSec, MilSecToFixedFrame, SnapValueToFixedFrameTime, ConvertTableValueToTime, ConvertTableValueToDistance, ConvertTableValueToPercent, StringToVector3, StringToQuaternion, IsNullOrEmpty

### `ValueExtention.cs`
Path: `NetworkClient/NetPlay/Helper/ValueExtention.cs`
**Class**: ValueExtention
**NS**: ProjectAegis.Utility
**Methods**: IsNullOrEmpty

## `NetworkClient/NetPlay/HitBox/`

### `HitBox.cs`
Path: `NetworkClient/NetPlay/HitBox/HitBox.cs`
**Class**: EBodyPart, EBodyGroup, BodyPartExtentions, HitBox
**NS**: ProjectAegis.NetPlay
**Methods**: ToGroup, SetOwner, SetPart, OnHit

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

### `IInteractable.cs`
Path: `NetworkClient/NetPlay/Interaction/IInteractable.cs`
**Class**: EInteractionDetectMode, IInteractable
**NS**: ProjectAegis.NetPlay.Interaction

### `InteractableObject.cs`
Path: `NetworkClient/NetPlay/Interaction/InteractableObject.cs`
**Class**: InteractableObject
**NS**: ProjectAegis.NetPlay.Interaction
**Methods**: Awake, Start, OnDestroy, Initialize, GenerateUniqueId, CanInteract, OnInteractStart, OnInteract, OnInteractCancel, OnEnterRange, OnExitRange, ApplyState, ToggleActivated, SetActivated, OnStateChanged, RequestSetInteractable, ApplyInteractableState, OnInteractableStateChanged, OnDespawn, OnInteractionComplete, ResetState, GetRemainingCooldown, PlayCompleteFeedback, PlayStartFeedback, PlayCancelFeedback (+ 3 more)

### `InteractableRegistry.cs`
Path: `NetworkClient/NetPlay/Interaction/InteractableRegistry.cs`
**Class**: InteractableRegistry
**NS**: ProjectAegis.NetPlay.Interaction
**Methods**: ResetStatics, Register, Unregister, Get, TryGet, Clear, DebugLogAll

### `InteractableVisual.cs`
Path: `NetworkClient/NetPlay/Interaction/InteractableVisual.cs`
**Class**: InteractableVisual
**NS**: ProjectAegis.NetPlay.Interaction
**Methods**: Awake, Initialize, Show, Hide, OnDestroy, SetOutline, ShowIndicator, HideIndicator, ParseOutlineColor

### `InteractionBroadcasts.cs`
Path: `NetworkClient/NetPlay/Interaction/InteractionBroadcasts.cs`
**Class**: InteractRequestBroadcast, InteractResultBroadcast, InteractableStateRequestBroadcast, InteractableStateResultBroadcast
**NS**: ProjectAegis.NetPlay.Interaction

### `InteractionNetworkManager.cs`
Path: `NetworkClient/NetPlay/Interaction/InteractionNetworkManager.cs`
**Class**: InteractionNetworkManager
**NS**: ProjectAegis.NetPlay.Interaction
**Methods**: ResetStatics, Awake, OnEnable, OnDisable, OnDestroy, OnClientLoadedStartScenes, OnRemoteConnectionState, RequestInteract, RequestInteractStart, RequestInteractCancel, RequestSetInteractable, ServerSetInteractable, RequestDespawn, OnInteractRequest, HandleInteractComplete, HandleInteractStart, HandleInteractCancel, OnInteractResult, HandleStateChangeResult, HandleInteractStartResult, HandleInteractCancelResult, HandleDespawnResult, OnInteractableStateRequest, OnInteractableStateResult, GetCharacterFromConnection (+ 4 more)

### `InteractionPlayerModule.cs`
Path: `NetworkClient/NetPlay/Interaction/InteractionPlayerModule.cs`
**Class**: InteractionPlayerModule, RaycastHitDistanceComparer
**NS**: ProjectAegis.NetPlay.Interaction
**Methods**: ResetStatics, Awake, OnEnable, OnDisable, OnDestroy, Update, TrySetAsLocalPlayer, SetAsLocalInstance, SetAsLocalPlayer, DetectInteractables, CollectProximityTargets, SelectBestTarget, DetectByRaycast, IsBlockedByWall, Compare, HandleKeyboardInput, StartInteraction, UpdateCasting, CompleteCasting, CancelInteraction, ResetCasting, TriggerInteract, CancelIfCasting, ClearCache, ForceDetect (+ 3 more)

### `LRUCache.cs`
Path: `NetworkClient/NetPlay/Interaction/LRUCache.cs`
**Class**: LRUCache
**NS**: ProjectAegis.NetPlay.Interaction
**Methods**: TryGetValue, Set, ContainsKey, Clear, LRUCache

### `RefInteractableSelectorAttribute.cs`
Path: `NetworkClient/NetPlay/Interaction/RefInteractableSelectorAttribute.cs`
**Class**: RefInteractableSelectorAttribute
**NS**: ProjectAegis.NetPlay.Interaction

## `NetworkClient/NetPlay/Interaction/Editor/`

### `RefInteractableSelectorDrawer.cs`
Path: `NetworkClient/NetPlay/Interaction/Editor/RefInteractableSelectorDrawer.cs`
**Class**: RefInteractableSelectorDrawer, InteractableEntry, InteractableJsonEntry
**NS**: ProjectAegis.NetPlay.Interaction.Editor
**Methods**: OnGUI, DrawPopup, DrawFilteredPopup, LoadInteractableObject, LoadFromJson, ReloadData

## `NetworkClient/NetPlay/Interaction/Handlers/`

### `IInteractionHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/IInteractionHandler.cs`
**Class**: IInteractionHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers

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

## `NetworkClient/NetPlay/Interaction/Handlers/Object/`

### `DespawnHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Object/DespawnHandler.cs`
**Class**: DespawnHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

### `SetStateHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Object/SetStateHandler.cs`
**Class**: SetStateHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

### `SpawnObjectHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Object/SpawnObjectHandler.cs`
**Class**: SpawnObjectHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

### `ToggleStateHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Object/ToggleStateHandler.cs`
**Class**: ToggleStateHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

## `NetworkClient/NetPlay/Interaction/Handlers/System/`

### `PlayTimelineHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/System/PlayTimelineHandler.cs`
**Class**: PlayTimelineHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

### `StartDialogueHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/System/StartDialogueHandler.cs`
**Class**: StartDialogueHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

### `TriggerEventHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/System/TriggerEventHandler.cs`
**Class**: TriggerEventHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

### `UnlockContentHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/System/UnlockContentHandler.cs`
**Class**: UnlockContentHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

## `NetworkClient/NetPlay/Interaction/Test/`

### `DynamicInteractableTest.cs`
Path: `NetworkClient/NetPlay/Interaction/Test/DynamicInteractableTest.cs`
**Class**: DynamicInteractableTest
**NS**: ProjectAegis.NetPlay.Interaction.Test
**Methods**: Update, MakeInteractable, RemoveInteractable, OnGUI

### `SimpleInteractionUI.cs`
Path: `NetworkClient/NetPlay/Interaction/Test/SimpleInteractionUI.cs`
**Class**: SimpleInteractionUI
**NS**: ProjectAegis.NetPlay.Interaction.Test
**Methods**: Start, Update, UpdateCastingProgress, RefreshPrompt, TryBindModule, OnDestroy, OnLocalInstanceReady, OnLocalInstanceDestroyed, BindToModule, UnbindFromModule, OnTargetLost, OnTargetAcquired, CreateSimpleUI, CreateWhiteSprite, OnTargetChanged, OnGUI

### `TestInteractionHelper.cs`
Path: `NetworkClient/NetPlay/Interaction/Test/TestInteractionHelper.cs`
**Class**: TestInteractionHelper
**NS**: ProjectAegis.NetPlay.Interaction.Test
**Methods**: Start, TryBindModule, TryInteract, ExecuteInteractionLocally, OnGUI

### `TestReferenceInitializer.cs`
Path: `NetworkClient/NetPlay/Interaction/Test/TestReferenceInitializer.cs`
**Class**: TestReferenceInitializer
**NS**: ProjectAegis.NetPlay.Interaction.Test
**Methods**: Awake, InitializeReferenceManager, OnValidate

## `NetworkClient/NetPlay/MapObject/`

### `MapObjectAttribute.cs`
Path: `NetworkClient/NetPlay/MapObject/MapObjectAttribute.cs`
**Class**: MapObjectAttribute
**NS**: ProjectAegis.NetPlay
**Methods**: MapObjectAttribute

### `MapObjectDefine.cs`
Path: `NetworkClient/NetPlay/MapObject/MapObjectDefine.cs`
**Class**: EMapObjectNetworkObjectID, EMapObjectTriggerConditionType, EMapObjectTriggerFunctionType, EMapObjectTriggerTarget, EComparisonOperator, EMapObjectTriggerColliderShape
**NS**: ProjectAegis.NetPlay

### `MapObjectManager.cs`
Path: `NetworkClient/NetPlay/MapObject/MapObjectManager.cs`
**Class**: MapObjectManager
**NS**: ProjectAegis.NetPlay
**Methods**: Init, OnMapObjectSpawned, Clear, TryGetMapObjects, TryGetMapObject

### `MapObjectTypeRegistry.cs`
Path: `NetworkClient/NetPlay/MapObject/MapObjectTypeRegistry.cs`
**Class**: MapObjectTypeRegistry
**NS**: ProjectAegis.NetPlay
**Methods**: InitializeStatics, BuildTypeMap, NetworkObjectIDToMapObjectType, NetworkObjectIDToDescriptionComponentType, NetworkObjectIDToDescriptionType, NetworkObjectIDToSpawnerType, TypeToNetworkObjectID, TypeToMapObjectType, TypeToDescriptionType, TypeToDescriptionComponentType, MapObjectDescriptionCompTypes, MapObjectDescriptionTypes

### `SafetyZone.cs`
Path: `NetworkClient/NetPlay/MapObject/SafetyZone.cs`
**Class**: SafetyZone
**NS**: ProjectAegis.NetPlay
**Methods**: SetTeamType, OnTriggerEnter, OnTriggerExit

## `NetworkClient/NetPlay/MapObject/Description/`

### `MapObjectDescriptionComp.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/MapObjectDescriptionComp.cs`
**Class**: MapObjectDescription, MapObjectDescriptionComp
**NS**: ProjectAegis.NetPlay
**Methods**: Dump, Init, OnDestroy, OnEnable

### `MapObjectDescriptionComp.Editor.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/MapObjectDescriptionComp.Editor.cs`
**Class**: MapObjectDescriptionComp
**NS**: ProjectAegis.NetPlay
**Methods**: InitializeStatics, OnValidate, OnDrawGizmos, OnDrawGizmosSelected, OnEnableEditor, OnDestroyEditor, DrawGizmos, DrawGizmosSelected, OnImport, OnValidateDescription, LoadModelEditor, LoadModelEditorInternal, FindModelEditor, LoadModelPrefabEditor, EnsureDelayCallRegistered, ProcessPendingOperations, AddPendingLoadModelEditor, DestroyModelEditor, DrawBaseGizmos

### `MapObjectDescriptionRoot.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/MapObjectDescriptionRoot.cs`
**Class**: MapObjectDescriptionRoot
**NS**: ProjectAegis.NetPlay
**Methods**: OnEnable, OnDisable, AssignUniqueIDs, Find, GatherDescriptionComponents, GatherDescriptions

### `MapObjectDescriptionRoot.Editor.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/MapObjectDescriptionRoot.Editor.cs`
**Class**: MapObjectDescriptionRoot
**NS**: ProjectAegis.NetPlay
**Methods**: OnEnableEditor, OnDisableEditor, OnSceneSaving, OnSceneSaved, ClearModelsEditor, LoadModelsEditor, InitializeChildrenEditor, InstantiateEditor

### `NeutralPointCaptureDescriptionComp.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/NeutralPointCaptureDescriptionComp.cs`
**Class**: NeutralPointCaptureDescription, NeutralPointCaptureDescriptionComp
**NS**: ProjectAegis.NetPlay

### `NeutralPointCaptureDescriptionComp.Editor.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/NeutralPointCaptureDescriptionComp.Editor.cs`
**Class**: NeutralPointCaptureDescriptionComp
**NS**: ProjectAegis.NetPlay
**Methods**: OnValidate, DrawGizmos, DrawGizmosSelected

### `PointCaptureDescriptionComp.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/PointCaptureDescriptionComp.cs`
**Class**: PointCaptureDescription, PointCaptureDescriptionComp
**NS**: ProjectAegis.NetPlay

### `PointCaptureDescriptionComp.Editor.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/PointCaptureDescriptionComp.Editor.cs`
**Class**: PointCaptureDescriptionComp
**NS**: ProjectAegis.NetPlay
**Methods**: OnValidate, DrawGizmos, DrawGizmosSelected, LoadModelEditorInternal

### `TriggerMapObjectDescriptionComp.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/TriggerMapObjectDescriptionComp.cs`
**Class**: MapObjectTriggerConditionDescription, MapObjectTriggerFunctionDescription, MapObjectTriggerGroupDescription, MapObjectColliderDescription, TriggerMapObjectDescription, TriggerMapObjectDescriptionComp
**NS**: ProjectAegis.NetPlay

### `TriggerMapObjectDescriptionComp.Editor.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/TriggerMapObjectDescriptionComp.Editor.cs`
**Class**: TriggerMapObjectDescriptionComp
**NS**: ProjectAegis.NetPlay
**Methods**: OnValidate, DrawGizmosSelected, DrawColliderGizmos, DrawBoxColliderGizmo, EnsureTriggerReferences

### `TriggerVolumeStatusEffectDescriptionComp.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/TriggerVolumeStatusEffectDescriptionComp.cs`
**Class**: TriggerVolumeStatusEffectDescription, TriggerVolumeStatusEffectDescriptionComp
**NS**: ProjectAegis.NetPlay

### `TriggerVolumeStatusEffectDescriptionComp.Editor.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/TriggerVolumeStatusEffectDescriptionComp.Editor.cs`
**Class**: TriggerVolumeStatusEffectDescriptionComp
**NS**: ProjectAegis.NetPlay

## `NetworkClient/NetPlay/MapObject/Description/Editor/`

### `MapObjectDescriptionEditor.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/Editor/MapObjectDescriptionEditor.cs`
**Class**: MapObjectDescriptionEditor
**NS**: ProjectAegis.NetPlay
**Methods**: OnInspectorGUI, DrawInspectorProperties

### `TriggerMapObjectDescriptionEditor.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/Editor/TriggerMapObjectDescriptionEditor.cs`
**Class**: TriggerMapObjectDescriptionEditor, StatPair
**NS**: ProjectAegis.NetPlay
**Methods**: OnInspectorGUI, DrawStatPreview, ExtractStatPairs, StatPair

## `NetworkClient/NetPlay/MapObject/Function/`

### `StatusEffectZone.cs`
Path: `NetworkClient/NetPlay/MapObject/Function/StatusEffectZone.cs`
**Class**: StatusEffectZone
**NS**: ProjectAegis.NetPlay
**Methods**: OnTriggerEnter, OnTriggerExit

## `NetworkClient/NetPlay/MapObject/Object/`

### `MapObject.cs`
Path: `NetworkClient/NetPlay/MapObject/Object/MapObject.cs`
**Class**: MapObject
**NS**: ProjectAegis.NetPlay
**Methods**: Init, TryInit, SetupByDescription, TakeDamage, ConvertUniqueIDToPID, ConvertPIDToUniqueID

### `NeutralPointCaptureSystem.cs`
Path: `NetworkClient/NetPlay/MapObject/Object/NeutralPointCaptureSystem.cs`
**Class**: NeutralPointCaptureSystem
**NS**: ProjectAegis.NetPlay
**Methods**: SetupByDescription, OnStartServer, OnEnterAttackingReady, HandleDefendingState, HandleEmptyState

### `PointCaptureSystem.cs`
Path: `NetworkClient/NetPlay/MapObject/Object/PointCaptureSystem.cs`
**Class**: CaptureState, AreaShape, CaptureStateInfo, PointCaptureSystem, Faction
**NS**: ProjectAegis.NetPlay
**Methods**: SetupByDescription, OnStartServer, StartServerLoop, OnStartClient, Init, OnStopServer, DestroyServerLoop, OnStopClient, Clear, OnDestroy, StartActiveReady, DestroyActiveReadyCoroutine, CoActiveReady, StartCaptureMessage, UpdateCaptureMessage, DestroyCaptureMessageCoroutine, SetActive, GetAreaShapeScale, CreateAreaShapeMeshs, InitPathGuide, ChangeCaptureStateMaterial, ChangeCaptureStateMessage, DestroyCapturedFx, DestroyCaptureStateMaterial, CoCaptureStateMaterial_Empty (+ 18 more)

### `TriggerMapObject.cs`
Path: `NetworkClient/NetPlay/MapObject/Object/TriggerMapObject.cs`
**Class**: TriggerMapObject
**NS**: ProjectAegis.NetPlay
**Methods**: SetupByDescription

### `TriggerVolumeStatusEffect.cs`
Path: `NetworkClient/NetPlay/MapObject/Object/TriggerVolumeStatusEffect.cs`
**Class**: TriggerVolumeStatusEffect, VolumeState
**NS**: ProjectAegis.NetPlay
**Methods**: SetupByDescription, OnStartServer, OnStartClient, OnStateChange, OnSetState, PostSetupModel, Update, OnTriggerEnter, EnableCollide

## `NetworkClient/NetPlay/MapObject/Spawn/`

### `MapObjectSpawner.cs`
Path: `NetworkClient/NetPlay/MapObject/Spawn/MapObjectSpawner.cs`
**Class**: EMapObjectSpawnerState, MapObjectSpawner
**NS**: ProjectAegis.NetPlay.Spawn
**Methods**: LoadAssetsAsync, CollectLoadAssetsTask, Spawn, OnSpawned, Despawn, UnloadAssets, Clear, MapObjectSpawner

### `MapObjectSpawnManager.cs`
Path: `NetworkClient/NetPlay/MapObject/Spawn/MapObjectSpawnManager.cs`
**Class**: MapObjectSpawnManager
**NS**: ProjectAegis.NetPlay.Spawn
**Methods**: Init, TryGetSpawner, LoadAssetsAsync, IsAssetsLoading, SpawnInitially, OnSpawned, DespawnAll, UnloadAssets, Clear

## `NetworkClient/NetPlay/Mark/`

### `MarkInstance.cs`
Path: `NetworkClient/NetPlay/Mark/MarkInstance.cs`
**Class**: EMarkSourceType, MarkSource, MarkInstance
**NS**: ProjectAegis.NetPlay
**Methods**: UpdateTimer, MarkSource, MarkInstance

### `MarkSystem.cs`
Path: `NetworkClient/NetPlay/Mark/MarkSystem.cs`
**Class**: MarkSystem
**NS**: ProjectAegis.NetPlay
**Methods**: ApplyMark, RemoveMark, ForceRemoveMark, HasMark, HasAnyMark, GetMarkInstanceCount, GetMarkInstance, Update, OnDestroy, GetActiveMarkIDs, GetMarkInstances

## `NetworkClient/NetPlay/Parkour/`

### `ParkourAction.cs`
Path: `NetworkClient/NetPlay/Parkour/ParkourAction.cs`
**Class**: ParkourAction
**Methods**: CheckIfPossible

### `ParkourDetector.cs`
Path: `NetworkClient/NetPlay/Parkour/ParkourDetector.cs`
**Class**: EParkourType, ParkourHit, ParkourDetector
**NS**: ProjectAegis.NetPlay
**Methods**: Awake, TryDetect, OverlapSphere, SphereCast, Raycast

### `ParkourDetector.Debug.cs`
Path: `NetworkClient/NetPlay/Parkour/ParkourDetector.Debug.cs`
**Class**: ParkourDetector
**NS**: ProjectAegis.NetPlay
**Methods**: Reset, OnDrawGizmos, DebugShowText, DebugRaycast, DebugSphereCast, DebugOverlapSphere, DebugSphereCastWithDisc

### `ParkourSettings.cs`
Path: `NetworkClient/NetPlay/Parkour/ParkourSettings.cs`
**Class**: ParkourSettings

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

## `NetworkClient/NetPlay/TacticalSkill/`

### `TacticalCardsSystem.cs`
Path: `NetworkClient/NetPlay/TacticalSkill/TacticalCardsSystem.cs`
**Class**: ETacticalCardSlot, TacticalCardsSystem, SelectalbeCardInfo, CardCandidateList, SynergyGradeCard
**NS**: ProjectAegis.NetPlay
**Methods**: GetCandidateCards, AddSynergySkill, AddSynergyGrade, TacticalCardSlotToSynergyType, SynergyEnumToTacticalCardSlot

## `NetworkClient/NetPlay/Team/`

### `ITeam.cs`
Path: `NetworkClient/NetPlay/Team/ITeam.cs`
**Class**: ITeam
**NS**: ProjectAegis.NetPlay
**Methods**: IsAlly

## `NetworkDev/`

### `CloudWatchLogger.cs`
Path: `NetworkDev/CloudWatchLogger.cs`
**Class**: CloudWatchLogger, LogWatchData
**Methods**: EnsureLogGroupExists, EnsureLogStreamExists, LogMessage, LogWatchData

### `GameEventMessage.cs`
Path: `NetworkDev/GameEventMessage.cs`
**Class**: GameEventType, GameEventMessage, PlayerJoinedGameMessage, PlayerDisconnectedMessage, PlayerReconnectedMessage, GameEndedMessage, PlayerGameResult, PlayerWriteWeaponStat, PlayerWeaponBattleStats, InGameStatus, SQSMegManager
**NS**: Aegis.GameServer.GameLift
**Methods**: Init, SendPlayerJoinedGameMessage, SendPlayerDisconnectedMessage, SendPlayerReconnectedMessage, SendGameEndedMessage, SendSQSMessage, PlayerJoinedGameMessage, PlayerDisconnectedMessage, PlayerReconnectedMessage, GameEndedMessage, PlayerWriteWeaponStat

### `NetworkManager_Aegis.cs`
Path: `NetworkDev/NetworkManager_Aegis.cs`
**Class**: NetworkManager_Aegis, eDediState
**NS**: FishNet.Managing
**Methods**: Awake, InitializeManager, DestroyManager, OnServerSentEmptyStartScenes, CompleteLoadClient, OnClientSentEmptyStartScenes, LocalNetworkConnections, CompleteLoadServer, GiveOwnership, ServerManager_OnRemoteConnectionState, ComplateReadyServer, ClientManager_ConnectedPlayerClients, OnClientMapLoadComplete

### `NetworkManagerClient_Aegis.cs`
Path: `NetworkDev/NetworkManagerClient_Aegis.cs`
**Class**: NetworkManager_Aegis
**NS**: FishNet.Managing
**Methods**: GetNetworkObjectName

### `NetworkManagerExtention.cs`
Path: `NetworkDev/NetworkManagerExtention.cs`
**Class**: NetworkManagerExtention
**NS**: FishNet.Managing
**Methods**: FindNetworkObject, FindNetworkObjectCharacters, FindClientNetworkObject, FindServerNetworkObject

### `NetworkManagerGameLift_Aegis.cs`
Path: `NetworkDev/NetworkManagerGameLift_Aegis.cs`
**Class**: AWSIntegrationOptions, NetworkManager_Aegis
**NS**: FishNet.Managing
**Methods**: SetConsoleTitle, InitGameLift, OnStartGameSession, OnUpdateGameSession, InitData, LoadData, EndGame, OnTerminateGameSession, OnHealthCheck, OnApplicationQuit, Update, ServerManager_OnServerConnectionState

### `NetworkManagerServer_Aegis.cs`
Path: `NetworkDev/NetworkManagerServer_Aegis.cs`
**Class**: ServerPlayerData, NetworkManager_Aegis
**NS**: FishNet.Managing
**Methods**: ServerPlayerData

### `NetworkObject_Aegis.cs`
Path: `NetworkDev/NetworkObject_Aegis.cs`
**Class**: NetworkObject_Aegis

### `ServerPlayerSpawner_Aegis.cs`
Path: `NetworkDev/ServerPlayerSpawner_Aegis.cs`
**Class**: ServerPlayerSpawner_Aegis
**Methods**: Awake, OnDestroy, Spawn_Internally, SpawnAICharacter_Internally2, SpawnAICharacter_Internally, InitializeOnce

### `TestLoadScene.cs`
Path: `NetworkDev/TestLoadScene.cs`
**Class**: TestLoadScene
**Methods**: LoadScene, Update, OnClientChangeMap, OnDestroy

### `TestLocalDedi_Client.cs`
Path: `NetworkDev/TestLocalDedi_Client.cs`
**Class**: TestLocalDedi_Client
**Methods**: OnDestroy, ConnectionClient, ClientManager_OnClientConnectionState

### `TestLocalDedi_Host.cs`
Path: `NetworkDev/TestLocalDedi_Host.cs`
**Class**: TestLocalDedi_Host, LocalDedicated_JsonData, UserData
**Methods**: OnDestroy, ConnectionServer, ServerManager_OnServerConnectionState, CreateListSpawn, ConnectionClient, ClientManager_OnClientConnectionState

### `TestLocalDedi_SceneLoader.cs`
Path: `NetworkDev/TestLocalDedi_SceneLoader.cs`
**Class**: TestLocalDedi_SceneLoader
**Methods**: SetOfflineScene, GetOfflineScene, SetOnlineScene, GetOnlineScene, OnEnable, StartSceneLoad, OnDestroy, Initialize, Deinitialize, SceneManager_OnLoadEnd, ServerManager_OnServerConnectionState, ClientManager_OnClientConnectionState, ServerManager_OnAuthenticationResult, LoadOfflineScene, UnloadOfflineScene, GetSceneName

### `TestLocalDedi_Server.cs`
Path: `NetworkDev/TestLocalDedi_Server.cs`
**Class**: TestLocalDedi_Server, LocalDedicated_JsonData, UserData, ServerPlayerData
**Methods**: Update, OnDestroy, ConnectionServer, ServerManager_OnServerConnectionState, CreateServerWorld, CreateListSpawn, CreateServerPlayerDataList

## `NetworkDev/03.ReferenceManager/`

### `FileCompressor.cs`
Path: `NetworkDev/03.ReferenceManager/FileCompressor.cs`
**Class**: CFileCompressor
**Methods**: CompressFiles, ExtractToDataStrings, ExtractToDataBinary, _GetFiles

### `ReferenceDataExetention.cs`
Path: `NetworkDev/03.ReferenceManager/ReferenceDataExetention.cs`
**Class**: ReferenceDataExetention
**NS**: Aegis.ReferenceTable
**Methods**: GetCommonConfigFloatValue, GetCommonConfigIntValue, GetRefNetworkObject, GetRefModelIDByWeapon, GetRefModelByWeapon

### `ReferenceFormatter.cs`
Path: `NetworkDev/03.ReferenceManager/ReferenceFormatter.cs`
**Class**: ReferenceFormatter
**Methods**: Serialize, Deserialize, IsSupportedType, WritePrimitive, ReadPrimitive

### `ReferenceManager.cs`
Path: `NetworkDev/03.ReferenceManager/ReferenceManager.cs`
**Class**: IReferenceTable, CReferenceManager, MsgPackInit, RefMpOptions, ReferenceManagerMenu
**NS**: Aegis.ReferenceTable
**Methods**: GetCacheData, LoadData, ReferenceManagerLoad, ReferenceManagerLoadDedi, LoadJsonData, LoadBinaryData, DownloadRefFileFromS3, DownloadRefFileFromS3Dedi, Init, ToggleUseLocalJsonData, ToggleUseLocalJsonDataValidate

### `ReferenceResolver.cs`
Path: `NetworkDev/03.ReferenceManager/ReferenceResolver.cs`
**Class**: ReferenceResolver
**Methods**: IsPrimitiveOnlyType, ReferenceResolver

### `ResourceNetworkManager.cs`
Path: `NetworkDev/03.ReferenceManager/ResourceNetworkManager.cs`
**Class**: EResourceErrorCode, CResultResourceServer, CResourceRequestInfo, EStoreType, CBuildVersion, ResourceNetworkManager
**NS**: Aegis.ReferenceTable
**Methods**: Create, CBuildVersion, ToString, ToDetailString, ToInt32, ToInt64, Init, ServerCheckResourceServer, ServerCheckResourceServerAsync

## `NetworkDev/03.ReferenceManager/02.ReferenceTable/`

### `RefAccountLevel.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefAccountLevel.cs`
**Class**: CRefAccountLevel, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefAccountLevel, RegisterRefAccountLevelBinary, FindRefAccountLevel, GetRefAccountLevels

### `RefAchievement.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefAchievement.cs`
**Class**: CRefAchievement, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefAchievement, RegisterRefAchievementBinary, FindRefAchievement, GetRefAchievements

### `RefAchievementLevel.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefAchievementLevel.cs`
**Class**: CRefAchievementLevel, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefAchievementLevel, RegisterRefAchievementLevelBinary, FindRefAchievementLevel, GetRefAchievementLevels

### `RefArmor.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefArmor.cs`
**Class**: CRefArmor, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefArmor, RegisterRefArmorBinary, FindRefArmor, GetRefArmors

### `RefBattleModeInfo.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefBattleModeInfo.cs`
**Class**: CRefBattleModeInfo, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBattleModeInfo, RegisterRefBattleModeInfoBinary, FindRefBattleModeInfo, GetRefBattleModeInfos

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

### `RefCard.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCard.cs`
**Class**: CRefCard, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCard, RegisterRefCardBinary, FindRefCard, GetRefCards

### `RefCardPreset.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCardPreset.cs`
**Class**: CRefCardPreset, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCardPreset, RegisterRefCardPresetBinary, FindRefCardPreset, GetRefCardPresets

### `RefCardPresetEnhance.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCardPresetEnhance.cs`
**Class**: CRefCardPresetEnhance, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCardPresetEnhance, RegisterRefCardPresetEnhanceBinary, FindRefCardPresetEnhance, GetRefCardPresetEnhances

### `RefCardPresetTactical.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCardPresetTactical.cs`
**Class**: CRefCardPresetTactical, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCardPresetTactical, RegisterRefCardPresetTacticalBinary, FindRefCardPresetTactical, GetRefCardPresetTacticals

### `RefCardSynergy.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCardSynergy.cs`
**Class**: CRefCardSynergy, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCardSynergy, RegisterRefCardSynergyBinary, FindRefCardSynergy, GetRefCardSynergys

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

### `RefClanPermissionGroup.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefClanPermissionGroup.cs`
**Class**: CRefClanPermissionGroup, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefClanPermissionGroup, RegisterRefClanPermissionGroupBinary, FindRefClanPermissionGroup, GetRefClanPermissionGroups

### `RefClanRole.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefClanRole.cs`
**Class**: CRefClanRole, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefClanRole, RegisterRefClanRoleBinary, FindRefClanRole, GetRefClanRoles

### `RefCommonConfig.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCommonConfig.cs`
**Class**: CRefCommonConfig, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCommonConfig, RegisterRefCommonConfigBinary, FindRefCommonConfig, GetRefCommonConfigs

### `RefConsumableItem.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefConsumableItem.cs`
**Class**: CRefConsumableItem, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefConsumableItem, RegisterRefConsumableItemBinary, FindRefConsumableItem, GetRefConsumableItems

### `RefContentUnlock.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefContentUnlock.cs`
**Class**: CRefContentUnlock, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefContentUnlock, RegisterRefContentUnlockBinary, FindRefContentUnlock, GetRefContentUnlocks

### `RefEffect.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefEffect.cs`
**Class**: CRefEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefEffect, RegisterRefEffectBinary, FindRefEffect, GetRefEffects

### `RefEnum.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefEnum.cs`
**Class**: CRefEnum, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefEnum, RegisterRefEnumBinary, FindRefEnum, GetRefEnums

### `RefGear.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefGear.cs`
**Class**: CRefGear, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefGear, RegisterRefGearBinary, FindRefGear, GetRefGears

### `RefImmune.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefImmune.cs`
**Class**: CRefImmune, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefImmune, RegisterRefImmuneBinary, FindRefImmune, GetRefImmunes

### `RefInteractable.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefInteractable.cs`
**Class**: CRefInteractable, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefInteractable, RegisterRefInteractableBinary, FindRefInteractable, GetRefInteractables

### `RefItemDataName.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefItemDataName.cs`
**Class**: CRefItemDataName, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefItemDataName, RegisterRefItemDataNameBinary, FindRefItemDataName, GetRefItemDataNames

### `RefLobbyUI.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefLobbyUI.cs`
**Class**: CRefLobbyUI, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefLobbyUI, RegisterRefLobbyUIBinary, FindRefLobbyUI, GetRefLobbyUIs

### `RefMapInfo.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefMapInfo.cs`
**Class**: CRefMapInfo, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefMapInfo, RegisterRefMapInfoBinary, FindRefMapInfo, GetRefMapInfos

### `RefMapObject.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefMapObject.cs`
**Class**: CRefMapObject, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefMapObject, RegisterRefMapObjectBinary, FindRefMapObject, GetRefMapObjects

### `RefMapObjectStat.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefMapObjectStat.cs`
**Class**: CRefMapObjectStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefMapObjectStat, RegisterRefMapObjectStatBinary, FindRefMapObjectStat, GetRefMapObjectStats

### `RefMark.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefMark.cs`
**Class**: CRefMark, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefMark, RegisterRefMarkBinary, FindRefMark, GetRefMarks

### `RefMissionSet.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefMissionSet.cs`
**Class**: CRefMissionSet, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefMissionSet, RegisterRefMissionSetBinary, FindRefMissionSet, GetRefMissionSets

### `RefModel.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefModel.cs`
**Class**: CRefModel, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefModel, RegisterRefModelBinary, FindRefModel, GetRefModels

### `RefModuleItem.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefModuleItem.cs`
**Class**: CRefModuleItem, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefModuleItem, RegisterRefModuleItemBinary, FindRefModuleItem, GetRefModuleItems

### `RefNetworkObject.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefNetworkObject.cs`
**Class**: CRefNetworkObject, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefNetworkObject, RegisterRefNetworkObjectBinary, FindRefNetworkObject, GetRefNetworkObjects

### `RefOption.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefOption.cs`
**Class**: CRefOption, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefOption, RegisterRefOptionBinary, FindRefOption, GetRefOptions

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

### `RefPerk.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefPerk.cs`
**Class**: CRefPerk, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefPerk, RegisterRefPerkBinary, FindRefPerk, GetRefPerks

### `RefPerkEffect.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefPerkEffect.cs`
**Class**: CRefPerkEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefPerkEffect, RegisterRefPerkEffectBinary, FindRefPerkEffect, GetRefPerkEffects

### `RefPing.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefPing.cs`
**Class**: CRefPing, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefPing, RegisterRefPingBinary, FindRefPing, GetRefPings

### `RefProfileBanner.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefProfileBanner.cs`
**Class**: CRefProfileBanner, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefProfileBanner, RegisterRefProfileBannerBinary, FindRefProfileBanner, GetRefProfileBanners

### `RefProfileFrame.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefProfileFrame.cs`
**Class**: CRefProfileFrame, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefProfileFrame, RegisterRefProfileFrameBinary, FindRefProfileFrame, GetRefProfileFrames

### `RefProfileIcon.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefProfileIcon.cs`
**Class**: CRefProfileIcon, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefProfileIcon, RegisterRefProfileIconBinary, FindRefProfileIcon, GetRefProfileIcons

### `RefProjectile.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefProjectile.cs`
**Class**: CRefProjectile, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefProjectile, RegisterRefProjectileBinary, FindRefProjectile, GetRefProjectiles

### `RefProjectileSkin.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefProjectileSkin.cs`
**Class**: CRefProjectileSkin, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefProjectileSkin, RegisterRefProjectileSkinBinary, FindRefProjectileSkin, GetRefProjectileSkins

### `RefRanking.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefRanking.cs`
**Class**: CRefRanking, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefRanking, RegisterRefRankingBinary, FindRefRanking, GetRefRankings

### `RefReward.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefReward.cs`
**Class**: CRefReward, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefReward, RegisterRefRewardBinary, FindRefReward, GetRefRewards

### `RefSharedEnum.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefSharedEnum.cs`
**Class**: EAchievementType, EAimAssistTargetType, EAimMode, EAmmoType, EArmorSlot, EAutoFireConditionType, EAutoFireTargetType, EAvailableTag, EBattleType, EBotActionType, EBotCheckPointType, EBotConditionType, EBotMoveDecisionTarget, EBotSkillDecisionCondType, EBotTargetType, EBotType, ECardEffectType, ECardPositionType, ECardSynergyType, ECardType, ECharacterClass, ECharacterRotationMode, ECharacterSkinPart, ECharacterStance, ECharacterType, ECheckCondition, ECheckPoint, ECheckTransType, EClanPermissionType, EClanRoleType, EClearConditionType, EComparisonOp, EConsumableType, EContentType, EContentUnlockType, ECrosshairAimType, ECrosshairSpreadLineType, EDamageType, EElementalType, EEnergyType, EExecuteCheckType, EExecuteChkType, EExecuteOption, EExecuteShapeType, EExecuteTarget, EExecuteTargetCompare, EFaction, EGearClass, EGearRarity, EHitOption, EHitType, EInteractionDetectMode, EInteractionExecutionType, EInteractionFunction, EInteractionType, EItemType, ELevelObjectFunctionType, ELevelObjectTarget, ELogicalOp, ELookDirection, EMapObjectTriggerType, EMissionType, EModuleType, EMovePointType, ENormVec3, EOptionCategory, EOptionContent, EOptionUIType, EPassiveConditionType, EPassiveEffectType, EPassiveType, EPerkType, EPingTrigger, EPromitionType, ERangeType, ERankingType, ESTATISTICS, ESkillArmorType, ESkillCategory, ESkillEffectType, ESkillSetSlot, ESkillType, ESkillUIType, ESkillWeapon, ESkinCharacterType, ESkinResourceParts, ESkinResourceType, ESkinWeaponType, ESpawnPosType, ESpawnPositionType, EStackType, EStatType, EStatusEffectCategory, EStatusEffectCondition, EStatusEffectDescValueType, EStatusEffectFunctionType, ESynergyEffectType, ETierType, ETransCondition, EWarningDisplayType, EWeaponFireDamageType, EWeaponFireType, EWeaponSourceType, EWeaponType, ECurrencyType
**NS**: Aegis.ReferenceTable

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

### `RefSkinResource.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefSkinResource.cs`
**Class**: CRefSkinResource, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkinResource, RegisterRefSkinResourceBinary, FindRefSkinResource, GetRefSkinResources

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

### `RefTier.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefTier.cs`
**Class**: CRefTier, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefTier, RegisterRefTierBinary, FindRefTier, GetRefTiers

### `RefTitle.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefTitle.cs`
**Class**: CRefTitle, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefTitle, RegisterRefTitleBinary, FindRefTitle, GetRefTitles

### `RefWeapon.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefWeapon.cs`
**Class**: CRefWeapon, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefWeapon, RegisterRefWeaponBinary, FindRefWeapon, GetRefWeapons

### `RefWeaponSelfStat.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefWeaponSelfStat.cs`
**Class**: CRefWeaponSelfStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefWeaponSelfStat, RegisterRefWeaponSelfStatBinary, FindRefWeaponSelfStat, GetRefWeaponSelfStats

### `RefWeaponSkin.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefWeaponSkin.cs`
**Class**: CRefWeaponSkin, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefWeaponSkin, RegisterRefWeaponSkinBinary, FindRefWeaponSkin, GetRefWeaponSkins

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

## `NetworkDev/DedicateLoadManager/`

### `DedicateLoadManager_Assetbundle.cs`
Path: `NetworkDev/DedicateLoadManager/DedicateLoadManager_Assetbundle.cs`
**Class**: NetworkManager_Aegis
**NS**: FishNet.Managing
**Methods**: LoadAssetbundle, UpdateAssetbundle

### `DedicateLoadManager_GameMode.cs`
Path: `NetworkDev/DedicateLoadManager/DedicateLoadManager_GameMode.cs`
**Class**: NetworkManager_Aegis
**NS**: FishNet.Managing
**Methods**: LoadGameMode, UpdateGameMode

### `DedicateLoadManager_MapObject.cs`
Path: `NetworkDev/DedicateLoadManager/DedicateLoadManager_MapObject.cs`
**Class**: NetworkManager_Aegis
**NS**: FishNet.Managing
**Methods**: LoadMapObject, UpdateMapObject

### `DedicateLoadManager_Player.cs`
Path: `NetworkDev/DedicateLoadManager/DedicateLoadManager_Player.cs`
**Class**: NetworkManager_Aegis
**NS**: FishNet.Managing
**Methods**: LoadPlayer, UpdatePlayer, PlayerSpawner, ALLRemoveOwnership

### `DedicateLoadManager_Scene.cs`
Path: `NetworkDev/DedicateLoadManager/DedicateLoadManager_Scene.cs`
**Class**: NetworkManager_Aegis
**NS**: FishNet.Managing
**Methods**: Initialized_Scene_Client, Initialized_Scene_Server, LoadScene, UpdateScene, IsUnLoadSuccess, UnLoadScene, ChangeMap, Update

## `ReferenceTable/`

### `RefLobbyUI.cs`
Path: `ReferenceTable/RefLobbyUI.cs`
**Class**: CRefLobbyUI, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefLobbyUI, RegisterRefLobbyUIBinary, FindRefLobbyUI, GetRefLobbyUIs

### `RefNetworkObject.cs`
Path: `ReferenceTable/RefNetworkObject.cs`
**Class**: CRefNetworkObject, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefNetworkObject, RegisterRefNetworkObjectBinary, FindRefNetworkObject, GetRefNetworkObjects

## `ScriptDev/AutoTest/`

### `GameLoopScenario_LoginLobby.cs`
Path: `ScriptDev/AutoTest/GameLoopScenario_LoginLobby.cs`
**Class**: IGameLoopScenario, Scenario_01_LoginAndLobby
**Methods**: Run

## `ScriptDev/Contents/02.TitleScene/`

### `CSceneTitle.cs`
Path: `ScriptDev/Contents/02.TitleScene/CSceneTitle.cs`
**Class**: CSceneTitle, eServerConnectState
**NS**: ProjectAegis.Contents
**Methods**: Load, LoadResourceAsync, IsLoaded, Init, Update, LateUpdate, Release, GetFlowUIType, GameServerConnect, OnMatchCompleteNotifyEvent, OnGS2C_PartyMembersNotify

## `ScriptDev/Data/`

### `VignetteData.cs`
Path: `ScriptDev/Data/VignetteData.cs`
**Class**: VignetteData
**Methods**: GetData

## `ScriptDev/Manager/`

### `CPacketAckManager.cs`
Path: `ScriptDev/Manager/CPacketAckManager.cs`
**Class**: CPacketAckManager, PendingAckRequest
**NS**: ProjectAegis.Utility
**Methods**: LaunchPacketAckManager, ClearAndStopPacketAckManager, Dispose, Shutdown, OnDestroy

## `ScriptDev/Manager/UserDatas/UserParty/`

### `CMatchMaking.cs`
Path: `ScriptDev/Manager/UserDatas/UserParty/CMatchMaking.cs`
**Class**: EMatchingState, CMatchMaking, SelectedMapInfo, MatchRoomInfo, TeamMember
**NS**: ProjectAegis.UserDatas
**Methods**: SetMapInfo, Reset, GetMyTeamMembers, RegisterNetHandler, InitUserData, ResetData, ResetMatchingStartTime, SetBattleInfo, RequestBattleInfo, OnGS2C_SetPartyBattleTypeAck, OnGS2C_PartyBattleTypeNotify, StartMatchmaking, StartQuickMatchmaking, OnGS2C_StartMatchAck, CancelMatchmaking, OnGS2C_CancelMatchAck, OnGS2C_MatchStatusNotify, OnGS2C_MatchCompletedNotify, OnGS2C_MatchCancelledNotify, Dispose, SendSelectCharacter, onGS2C_ChangePartyCharacterAckEvent, TeamMember

## `ScriptDev/Pulse/Runtime/`

### `UnityPulseSession.cs`
Path: `ScriptDev/Pulse/Runtime/UnityPulseSession.cs`
**Class**: UnityPulseSessionStart, UnityPulseSessionStart_json, UnityPulseSessionStop, UnityPulseSessionStop_json
**NS**: Pulse.Unity
**Methods**: Write, ToJson, UnityPulseSessionStart, UnityPulseSessionStop

## `ScriptDev/UI/`

### `CLobbyBackGround.cs`
Path: `ScriptDev/UI/CLobbyBackGround.cs`
**Class**: CLobbyBackGround, CLobbyCharacterInfo, CLobby2DBGOverrideInfo, OverrideFlag
**NS**: ProjectAegis.UI
**Methods**: Awake, Update, SetTestMode, InitializeBackground, InitializeCameraPivots, LoadViewSettingsAsset, ApplyViewSettingsToAllPivots, ApplyViewSettingsToPivot, GetViewSettingsAsset, Start, LoadTestCharacters, ReloadFromSceneSlots, OnDestroy, SetupBackground, SetUIRectTransform, SetCharacterAt, MoveCharacterTo, MoveAllCharactersTo, DisableFinalIKComponents, InitializeSlotShadow, ClearCharacterAt, ClearAllCharacters, HideCharacterAt, ShowCharacterAt, HideAllCharacters (+ 32 more)

### `CLobbyCameraPivot.cs`
Path: `ScriptDev/UI/CLobbyCameraPivot.cs`
**Class**: CLobbyCameraPivot
**NS**: ProjectAegis.UI
**Methods**: InstallCamera, GetSlotTransform, SetSlotTransform, GetAllSlots, ApplySettings, ApplySettingsFromAsset, ApplySetUISlot, SetViewMode, ToCameraSpaceWorldPosition

### `CUIVignette.cs`
Path: `ScriptDev/UI/CUIVignette.cs`
**Class**: CUIVignette, VignetteEffect
**NS**: ProjectAegis.UI
**Methods**: Awake, Update, OnDestroy, SetPlayer, SetVignettes, ClearVignettes, ShowVignette, HideVignette, OnResolutionChanged, Destroy, SetAlpha, GetAlpha, SetActive, SetLocalScale, StartFade, EndFade, Create

## `ScriptDev/UI/Editor/`

### `CLobbyBackGroundEditor.cs`
Path: `ScriptDev/UI/Editor/CLobbyBackGroundEditor.cs`
**Class**: CLobbyBackGroundEditor
**NS**: ProjectAegis.UI
**Methods**: OnEnable, OnInspectorGUI, DrawCaptureSection, DrawPlayModeButtons, ReloadFromSceneSlots, CaptureCurrentViewMode, CaptureAllViewModes

### `LobbyViewSettingsAssetEditor.cs`
Path: `ScriptDev/UI/Editor/LobbyViewSettingsAssetEditor.cs`
**Class**: LobbyViewSettingsAssetEditor, Styles, 값, 값들을, 이름, 값인지, 블록, 구조를, 값을
**NS**: ProjectAegis.UI
**Methods**: OnEnable, OnInspectorGUI, DrawSaveSection, DrawHeader, DrawActionButtons, DrawAddNewViewModeSection, DrawCurrentEnumValuesFoldout, IsValidEnumName, EnumNameExists, AddNewViewModeToEnum, DrawViewModeSettings, DrawViewModeEntry, DrawViewModeContent, DrawSlotData, OpenTestScene, CaptureAllFromScene, CaptureViewModeFromScene, CopyViewModeSettings, PasteViewModeSettings, ShowAddViewModeMenu

## `ScriptDev/UI/Lobby/`

### `CUIAlertButton.cs`
Path: `ScriptDev/UI/Lobby/CUIAlertButton.cs`
**Class**: CUIAlertButton
**NS**: ProjectAegis.UI
**Methods**: SetReddotCount, CUIAlertButton

### `CUICharacterModelRotator.cs`
Path: `ScriptDev/UI/Lobby/CUICharacterModelRotator.cs`
**Class**: ERotationMode, ERotationZone, CUICharacterModelRotator
**NS**: ProjectAegis.UI
**Methods**: Awake, Update, OnDestroy, OnPointerDown, OnDrag, OnPointerUp, DetermineZone, CalculateDeltaRotation, CalculateZoneBasedRotation, UpdateSmoothRotation, UpdateReturnToInitialRotation, SetRotationTarget, SetPosition, SetRotationEnabled, SetRotationSpeed, SetSmoothSpeed, SetUseSmoothRotation, SetRotationMode, SetInnerCircleRatio, Clear, SetReturnToInitialRotation, SetReturnSpeed, SaveCurrentAsInitialRotation, ReturnToInitialRotationImmediate, ReturnToInitialRotationSmooth

### `CUIInviteListComp.cs`
Path: `ScriptDev/UI/Lobby/CUIInviteListComp.cs`
**Class**: EInviteListTabType, CUIInviteListComp, FriendSlot
**NS**: ProjectAegis.UI
**Methods**: Awake, SetData, OnButtonInvite, OnDestroy, OnButtonClose, OnListEnabled, OnListDisabled, Dispose, OnHide, OnShow, SetCloseCallback, UpdateUI, LoadFriendData, OnSelectInviteListTab, OnInviteFriend, OnInviteToPartyAck, GetCellCount, GenerateTestFriendList, CUIInviteListComp

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

### `CUILobbyHUDArea.cs`
Path: `ScriptDev/UI/Lobby/CUILobbyHUDArea.cs`
**Class**: CUILobbyHUDArea
**NS**: ProjectAegis.UI
**Methods**: ConvertRangeTypeToSlideDirection, SetContentTypes, ExistsSlot, FinalizeLayout, SortIconSlots, Dispose, CUILobbyHUDArea

### `CUILobbyHUDAreaController.cs`
Path: `ScriptDev/UI/Lobby/CUILobbyHUDAreaController.cs`
**Class**: CUILobbyHUDAreaController
**NS**: ProjectAegis.UI
**Methods**: Initialize, Show, Hide, ShowImmediate, HideImmediate, Dispose, CUILobbyHUDAreaController

### `CUILobbyInviteInfoBtn.cs`
Path: `ScriptDev/UI/Lobby/CUILobbyInviteInfoBtn.cs`
**Class**: CUILobbyInviteInfoBtn
**NS**: ProjectAegis.UI
**Methods**: RegisterEvents, RemoveEvents, OnButtonClick, OnInviteCountChanged, SetActive, ShouldHide, Dispose, CUILobbyInviteInfoBtn

### `CUILobbyMainPanel.cs`
Path: `ScriptDev/UI/Lobby/CUILobbyMainPanel.cs`
**Class**: LobbyM2DefineEditor, CUILobbyMainPanel, ELobbyBtnState
**NS**: ProjectAegis.UI
**Methods**: ToggleLobbyM2, ToggleLobbyM2Validate, InitUIBind, InitializeControllers, OnPanelEnabled, OnPanelDisabed, ShowInviteTestWindow, HideInviteTestWindow, ToggleInviteTestWindow, RegisterEditorInstance, UnregisterEditorInstance, OnGUI, SendTestInvite, EditorUpdate, Update, OnPanelRelase, OnShow, UpdateButtonStates, UpdateInviteListButton, ResolvePartyButtonState, ApplyButtonState, OnButtonQuickInvite, OnFriendListReceivedForInvite, OnButtonStartMatch, OnButtonMatchCancel (+ 9 more)

### `CUILobbyOverlayInviteBtn.cs`
Path: `ScriptDev/UI/Lobby/CUILobbyOverlayInviteBtn.cs`
**Class**: CUILobbyOverlayInviteBtn
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, OnPanelEnabled, OnPanelDisabed, OnShow, OnButtonClick, OnInviteCountChanged, OnShouldHide, OnPanelRelase

### `CUILobbyUIBtnSlot.cs`
Path: `ScriptDev/UI/Lobby/CUILobbyUIBtnSlot.cs`
**Class**: CUILobbyUIBtnSlot
**NS**: ProjectAegis.UI
**Methods**: OnButtonClick, Dispose, CUILobbyUIBtnSlot

### `CUIOverlayReadyInfoBtn.cs`
Path: `ScriptDev/UI/Lobby/CUIOverlayReadyInfoBtn.cs`
**Class**: CUIOverlayReadyInfoBtn, ReadyInfoSlot, LobbyBtnState
**NS**: ProjectAegis.UI
**Methods**: SetAssigned, SetReadyState, SetData, Clear, InitUIBind, OnPanelEnabled, OnPanelDisabed, OnPanelRelase, OnShow, UpdateUI, UpdateMemberSlots, UpdateMemberReadyState, SetMemberDataList, ClearAllSlots, OnPartyInfoChanged, OnMatchMakingChanged, OnButtonReady, OnButtonReadyCancel, OnButtonMatchStart, ApplyState, ReadyInfoSlot

### `Dev_BuildInfo.cs`
Path: `ScriptDev/UI/Lobby/Dev_BuildInfo.cs`
**Class**: Dev_BuildInfo, CIBuildInfo, BuildInfo
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, RefreshBuildInfo, LoadCIBuildInfo, OnShow

### `LobbyIdleRandomAnimation.cs`
Path: `ScriptDev/UI/Lobby/LobbyIdleRandomAnimation.cs`
**Class**: IdleAnimationEntry, LobbyIdleRandomAnimation
**NS**: ProjectAegis.UI
**Methods**: OnStateEnter, OnStateUpdate, SelectRandomIdleTrigger

### `LobbyMapUIController.cs`
Path: `ScriptDev/UI/Lobby/LobbyMapUIController.cs`
**Class**: LobbyMapUIController
**NS**: ProjectAegis.UI
**Methods**: Initialize, RefreshUI, SyncWithServer, OnButtonClickMapSelectPrev, OnButtonClickMapSelectNext, OnButtonClickModeSelect, UpdateModeSelect, UpdateMapUI, Dispose

### `LobbyMatchHandler.cs`
Path: `ScriptDev/UI/Lobby/LobbyMatchHandler.cs`
**Class**: LobbyMatchHandler
**NS**: ProjectAegis.UI
**Methods**: RegisterEvents, UnregisterEvents, StartMatch, CancelMatch, SetReady, GetMatchingTimeText, OnMatchEventCallback, UpdateMatchingTime, Dispose, LobbyMatchHandler

### `LobbyPartyHandler.cs`
Path: `ScriptDev/UI/Lobby/LobbyPartyHandler.cs`
**Class**: LobbyPartyHandler, EPartyCreationType
**NS**: ProjectAegis.UI
**Methods**: RegisterEvents, UnregisterEvents, CreateParty, StartQuickMatch, ResetPartyType, SetPartyJoined, HandleQuickMatchCancelled, OnGS2C_CreatePartyAck, OnChangePartyInviteEvent, OnPartyInfoChanged, Dispose, LobbyPartyHandler

### `LobbyViewSettingsAsset.cs`
Path: `ScriptDev/UI/Lobby/LobbyViewSettingsAsset.cs`
**Class**: EViewMode, ESlotPositionType, LobbyViewSettingsAsset, SlotData, ViewModeSettings, ViewModeSettingsEntry
**NS**: ProjectAegis.UI
**Methods**: OpenLobbyViewSettingsAsset, ApplyTo, GetSettings, HasSettings, GetAllViewModes, SetSettings, InvalidateCache, Load, EnsureCacheInitialized, OnEnable, OnValidate, CaptureFromScene, InitializeAllViewModes, SlotData, ViewModeSettings, ViewModeSettingsEntry

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

### `CUIModuleDetailPopup.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/Elements/CUIModuleDetailPopup.cs`
**Class**: CUIModuleDetailPopup
**NS**: ProjectAegis.UI
**Methods**: BindUI, SetData, UpdateBadges, UpdateButtons, Show, Hide, IsVisible, Clear, SetIcon

### `CUIModuleListCell.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/Elements/CUIModuleListCell.cs`
**Class**: CUIModuleListCell, EEquipState, ModuleListItemData
**NS**: ProjectAegis.UI
**Methods**: BindUI, SetData, SetSelected, UpdateEquipState, SetIcon

### `CUIPassiveInventoryCell.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/Elements/CUIPassiveInventoryCell.cs`
**Class**: CUIPassiveInventoryCell
**NS**: ProjectAegis.UI
**Methods**: BindUI, SetClickCallback, OnClick, SetData, SetSelected, UpdateEquipState, SetIcon

## `ScriptDev/UI/Lobby/Clan/`

### `CUIClan.cs`
Path: `ScriptDev/UI/Lobby/Clan/CUIClan.cs`
**Class**: EClanCreateMode, EClanJoinViewTab, EClanPrimaryTab, EClanMemberTab, ERecruitTab, EBadgeEditTab, CUIClan
**NS**: ProjectAegis.UI
**Methods**: SetTabSelectedColor, SetTabSelectedActiveInactive, InitUIBind, PrepareContent, OnShow, OnPanelEnabled, OnPanelRelase, RefreshUI, OnClanStateChanged, OnClanInfoUpdated, OnErrorReceived, OnSuccessReceived, BindOverlayMenu, HidePanelHeaderIfOverlayUsed, BindHeaderButtonEvents, OnClickBack, OnClickHome, ShowClanJoinView, ShowClanListView, ShowClanCreateView, RefreshClanCurrency

### `CUIClanBadgeEdit.cs`
Path: `ScriptDev/UI/Lobby/Clan/CUIClanBadgeEdit.cs`
**Class**: CUIClanBadgeEdit
**NS**: ProjectAegis.UI
**Methods**: Setup, InitUIBind, BindButtons, OnClickClose, OnClickApply, BuildGridItems, BuildTabGrid, OnBadgeItemClicked, RefreshPreview, RefreshAllItemSelection, RefreshEquippedState, ColorsEqual, ShowTab, UpdateBadgeEditTabButtonColors

### `CUIClanBadgeItem.cs`
Path: `ScriptDev/UI/Lobby/Clan/CUIClanBadgeItem.cs`
**Class**: CUIClanBadgeItem
**NS**: ProjectAegis.UI
**Methods**: Initialize, SetEmblem, SetFrame, SetColor, SetSelected, SetEquipped

### `CUIClanCreateView.cs`
Path: `ScriptDev/UI/Lobby/Clan/CUIClanCreateView.cs`
**Class**: CUIClan
**NS**: ProjectAegis.UI
**Methods**: BindCreateView, BindCreateFormFromRoot, SetupInputFields, OnClanDescChanged, BindCreateViewButtonEvents, OnConditionTabOff, OnConditionTabOn, SetConditionTabTextColors, AnimateConditionTabSliderTo, OnClickSetting, InitCreateViewForMode, InitCreateMode, InitEditMode, ApplyEditModePermissions, IsClanSettingsChanged, UpdateChangeButtonState, RefreshEditModeFromCurrentClanInfoIfActive, SetAutoApprove, UpdateAutoApproveUI, UpdateCreateViewEmblem, UpdateCreateButtonState, ValidateClanName, ValidateClanDescription, OnClanNameChanged, OnClickEditEmblem (+ 3 more)

### `CUIClanJoinView.cs`
Path: `ScriptDev/UI/Lobby/Clan/CUIClanJoinView.cs`
**Class**: CUIClan, ESortState, ESortType
**NS**: ProjectAegis.UI
**Methods**: BindJoinView, BindJoinViewButtonEvents, OnPrimaryTabSelected, RequestCurrentJoinViewTabProtocol, ClearJoinViewTabRequestedState, RefreshJoinViewListFromCache, OnSelectJoinViewTab, UpdateJoinViewRightMenuButtonColors, SyncSecondaryTabSelection, UpdateTabButtonStates, UpdateLeftPanelButtons, UpdateLeftPanelButtonsForSelectedClan, RefreshClanList, ClearClanListItems, CreateClanListItems, OnClanListItemClicked, RefreshInvitationList, SelectClan, UpdateSelectedClanInfo, ClearSelectedClanInfo, UpdateApplyButtonState, RefreshCounts, SetSearchMode, UpdateSearchButtonState, ResetSortState (+ 22 more)

### `CUIClanListItem.cs`
Path: `ScriptDev/UI/Lobby/Clan/CUIClanListItem.cs`
**Class**: CUIClanListItem
**NS**: ProjectAegis.UI
**Methods**: Awake, OnEnable, AutoBindComponents, SetData, SetSelected, OnClick, GetMasterNameFromClanInfo, LoadBadgeTextures

### `CUIClanMainView.cs`
Path: `ScriptDev/UI/Lobby/Clan/CUIClanMainView.cs`
**Class**: CUIClan, EMemberSortState, EMemberSortType, EMainViewSubType
**NS**: ProjectAegis.UI
**Methods**: BindMainView, BindMainBadgeAndLayout, BindPrimaryTab, BindMemberListTooltip, BindSortHeader, BindMemberListView, BindRecruitView, OnPrimaryTabSelected, ShowClanMainView, ShowMainViewSubView, UpdateRightMenuButtonColorsForClanSetting, UpdateRecruitTabButtonColors, RefreshMainView, ApplyMemberCountAndOnlineTexts, UpdateMemberCountAndOnlineTexts, LoadMainEmblemSprite, LoadMainFrameSprite, RefreshMemberList, RefreshSlotMeManually, UpdateMemberListEmptyState, EnsureMemberItemPool, ClearMemberList, OnMemberItemClick, BindRecruitTabEvents, BindRecruitBottomEvents (+ 35 more)

### `CUIClanManager.cs`
Path: `ScriptDev/UI/Lobby/Clan/CUIClanManager.cs`
**Class**: ClanState, ClanJoinMethod, ClanCreateData, ClanBadgeParsed, CUIClanManager
**NS**: ProjectAegis.UI
**Methods**: GetEmblemFromBadge, GetFrameFromBadge, GetColorFromBadge, InitializeConfig, ShowError, ShowSuccess, GetRefreshCooldownRemainingSeconds, GetRefreshCooldownErrorMessage, InitializeInst, OnLoginAckHandler, InitializeFromLoginAck, Reset, SetState, HasPermission, CanKick, CanChangeRole, RequestCreateClan, RequestUpdateClanInfo, RequestJoinClan, RequestAcceptInvitation, RequestDeclineInvitation, RequestLeaveClan, RequestKickMember, RequestChangeRole, RequestSetAdmin (+ 35 more)

### `CUIClanMemberItem.cs`
Path: `ScriptDev/UI/Lobby/Clan/CUIClanMemberItem.cs`
**Class**: CUIClanMemberItem
**NS**: ProjectAegis.UI
**Methods**: Awake, OnEnable, AutoBindComponents, SetDataForMember, SetDataForRecruit, ApplyData, SetButtonVisibility, SetInviteButtonInteractable, SetSelected, GetData, RefreshUI, SetProfileImages, UpdateLastAccessText, FormatLastAccessAt, GetRoleIconColor, OnClickItem, OnClickInvite, OnClickMore, OnClickLeave, OnClickAccept, OnClickReject

## `ScriptDev/UI/Lobby/OldLobby/`

### `CUIInviteListPopup.cs`
Path: `ScriptDev/UI/Lobby/OldLobby/CUIInviteListPopup.cs`
**Class**: EFriendTabType, CUIInviteListPopup, FriendSlot
**NS**: ProjectAegis.UI
**Methods**: SetData, OnButtonInvite, Dispose, InitUIBind, OnButtonClose, OnPanelEnabled, OnPanelDisabed, OnPanelRelase, OnShow, SetCloseCallback, UpdateUI, LoadFriendData, ClearAllSlots, OnSelectFriendTab, OnInviteFriend, GetCellCount, GenerateTestFriendList, FriendSlot

### `CUILobbyHeroSelect.cs`
Path: `ScriptDev/UI/Lobby/OldLobby/CUILobbyHeroSelect.cs`
**Class**: CUILobbyHeroSelect, HeroBandSlot, HeroSlotItem, HeroData
**NS**: ProjectAegis.UI
**Methods**: SetData, IsSelected, Dispose, OnButtonSelect, InitUIBind, OnPanelEnabled, OnPanelDisabed, OnPanelRelase, OnShow, UpdateUI, LoadHeroData, ConvertToBandData, ClearAllSlots, OnSelectHeroTab, OnSelectHero, ClickCloseBtn, GetCellCount, HeroBandSlot, HeroSlotItem

### `CUILobbyModeTabSlot.cs`
Path: `ScriptDev/UI/Lobby/OldLobby/CUILobbyModeTabSlot.cs`
**Class**: CUILobbyModeTabSlot
**Methods**: SetSelected, SetButtonEnable, Dispose, OnButtonClick, CUILobbyModeTabSlot

### `CUILobbyPanel.cs`
Path: `ScriptDev/UI/Lobby/OldLobby/CUILobbyPanel.cs`
**Class**: CUILobbyPanel, ELobbyUIMode, EPartyCreationType
**NS**: ProjectAegis.UI
**Methods**: OnPanelEnabled, OnPanelDisabed, OnPanelRelase, InitUIBind, OnShow, Update, OnGUI, SendTestInvite, OnPartyRoomFindCallback, OnPartyRoomCreateCallback, OnQuickMatchCallback, OnButtonClose, onQuickMatchEventCallback, OnEvent, OnChangePartyEvent, OnGS2C_GetPartyListAck, OnGS2C_CreatePartyAck, OnBtnShowProfile, OnGS2C_GetProfileAck

### `CUILobbyPartyRoom.cs`
Path: `ScriptDev/UI/Lobby/OldLobby/CUILobbyPartyRoom.cs`
**Class**: CUILobbyPartyRoom, LobbyBtnState
**Methods**: InitUIBind, OnEnable, OnDisable, OnDestroy, SetPartyInfo, UpdateUI, UpdatePartyName, UpdateMemberList, SyncMapSelectionUI, UpdateMapUI, UpdateMatchingTime, OnPartyInfoChanged, OnMatchMakingChanged, OnButtonGameStart, OnButtonReadyOn, OnButtonReadyOff, OnButtonMatchCancel, OnModeTabSelected, UpdateButtonStates, ApplyState, SetData, GetCellCount, OnButtonMapPrev, OnButtonMapNext, SelectMapPrev (+ 1 more)

### `CUILobbyRoomlist.cs`
Path: `ScriptDev/UI/Lobby/OldLobby/CUILobbyRoomlist.cs`
**Class**: CUILobbyRoomlist, CUIRoomSlot
**Methods**: btnClickCallback, SetData, SetSelect, UpdateUI, Dispose, InitUIBind, InitializeScrollView, InitializeButtons, SetPartyList, UpdateList, SetBackButtonCallback, GetCellCount, OnDisable, ClearSelection, OnSelectSlotRoom, OnButtonJoinRoom, OnButtonBack, CUIRoomSlot

### `CUILobbyTeamMenu.cs`
Path: `ScriptDev/UI/Lobby/OldLobby/CUILobbyTeamMenu.cs`
**Class**: CUILobbyTeamMenu
**Methods**: InitUIBind, OnPartyModeSelected, SetMatchingData, OnEnable, OnDisable, OnDestroy, OnMatchMakingChanged, UpdateMatchingTime, SetPartyButtonEnable, SetCallback, OnButtonClickMapSelectPrev, OnButtonClickMapSelectNext, OnButtonClickMapSelect, UpdateMapUI

### `CUIPartyMemberSlot.cs`
Path: `ScriptDev/UI/Lobby/OldLobby/CUIPartyMemberSlot.cs`
**Class**: CUIPartyMemberSlot
**Methods**: SetData, Dispose, BindUIComponents, UpdateUI, RegisterEvents, UnregisterEvents, OnMemberDataChanged, OnButtonClick, CUIPartyMemberSlot

## `ScriptDev/UI/Lobby/Party/`

### `CUIInviteMultiPopup.cs`
Path: `ScriptDev/UI/Lobby/Party/CUIInviteMultiPopup.cs`
**Class**: CUIInviteMultiPopup, PartyInviteInfoSlot
**NS**: ProjectAegis.UI
**Methods**: Awake, SetData, OnDestroy, UpdateProgressTimer, OnProgressTimerComplete, OnButtonAccept, OnButtonReject, InitUIBind, OnPanelEnabled, OnPanelDisabed, OnPanelRelase, LateUpdate, SetInviteType, RebuildPartyInviteData, OnChangePartyEvent, OnGS2C_RespondFriendRequestAck, GetCellCount

### `CUIPartyStateInfoBtn.cs`
Path: `ScriptDev/UI/Lobby/Party/CUIPartyStateInfoBtn.cs`
**Class**: CUIPartyStateInfoBtn, LobbyBtnState, ReadyInfoSlot
**NS**: ProjectAegis.UI
**Methods**: RegisterEvents, UnregisterEvents, RefreshUI, SetActive, UpdateMemberSlots, ResolveState, ApplyState, ClearAllSlots, OnPartyInfoChanged, OnMatchMakingChanged, UpdateMatchingTime, OnButtonMatchStart, OnButtonReadyOn, OnButtonReadyCancel, OnButtonMatchCancel, Dispose, SetAssigned, SetReadyState, Clear, CUIPartyStateInfoBtn, ReadyInfoSlot

### `PartyInviteButtonHandler.cs`
Path: `ScriptDev/UI/Lobby/Party/PartyInviteButtonHandler.cs`
**Class**: PartyInviteButtonHandler
**NS**: ProjectAegis.UI
**Methods**: RegisterEvents, UnregisterEvents, RefreshInviteCount, HandleButtonClick, ShowSingleInvitePopup, OnChangePartyEvent, OnAcceptPartyInviteCallback, OnRejectPartyInviteCallback, Dispose, PartyInviteButtonHandler

## `ScriptTools/NetworkTools/`

### `NetworkEventRecorder.cs`
Path: `ScriptTools/NetworkTools/NetworkEventRecorder.cs`
**Class**: NetworkLog, NetworkEventType, NetworkSide, NetworkEvent, NetworkEventRecorder, NetworkStats
**NS**: ProjectAegis.Tools.Network
**Methods**: Send, Receive, Predict, Correct, Clear, GetCurrentTimeMs, BootstrapRecorder, Awake, OnDestroy, HookUnityLogs, UnhookUnityLogs, OnUnityLogMessageReceived, GeneratePacketId, RecordEvent, RecordSend, RecordReceive, RecordPrediction, RecordCorrection, RecordDisconnect, GetEventsInRange, GetStats, NetworkEvent

### `NetworkTimelineDebugger.cs`
Path: `ScriptTools/NetworkTools/NetworkTimelineDebugger.cs`
**Class**: NetworkTimelineDebugger
**Methods**: Open, OnEnable, OnDisable, OnPlayModeStateChanged, OnEditorUpdate, OnGUI, DrawToolbar, DrawTimeline, DrawOverviewTimeline, HandleOverviewInput, DrawTimeRuler, DrawLane, DrawGridLines, DrawEvent, DrawConnections, DrawDetailPanel, DrawDetailRow, HandleInput, TimeToX, IsEventInView, FormatTime, FormatWallClock, GetEventColor, EnsureStyles, GetEvents (+ 4 more)

### `RttTracker.cs`
Path: `ScriptTools/NetworkTools/RttTracker.cs`
**Class**: RttTracker
**NS**: ProjectAegis.Tools.Network
**Methods**: RecordSend, CalculateRtt, ExtractBaseName, Clear


