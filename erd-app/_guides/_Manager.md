# Manager System Code Guide
> Auto-generated: 2026-02-25 13:31 | 273 files

## `Aegis.Client/`

### `Managers.cs`
Path: `Aegis.Client/Managers.cs`
**Class**: Managers
**Methods**: Init, Update

## `Aegis.Client/Packet/`

### `PacketHandler.cs`
Path: `Aegis.Client/Packet/PacketHandler.cs`
**Class**: PacketHandler
**Methods**: GS2C_KeyExchangeAckHandler, GS2C_LoginAckHandler, GS2C_PingNotifyHandler, GS2C_CreatePartyAckHandler, GS2C_GetPartyListAckHandler, GS2C_JoinPartyAckHandler, GS2C_LeavePartyAckHandler, GS2C_PartyMembersNotifyHandler, GS2C_InviteToPartyAckHandler, GS2C_PartyInviteNotifyHandler, GS2C_AcceptPartyInviteAckHandler, GS2C_RejectPartyInviteAckHandler, GS2C_SetPartyReadyAckHandler, GS2C_StartMatchAckHandler, GS2C_CancelMatchAckHandler, GS2C_MatchCancelledNotifyHandler, GS2C_MatchStatusNotifyHandler, GS2C_MatchCompletedNotifyHandler, GS2C_EnterRoomNotifyHandler, GS2C_SelectCharacterAckHandler, GS2C_RoomSelectionStatusNotifyHandler

## `Aegis.GameServer/DB/`

### `DBManager.cs`
Path: `Aegis.GameServer/DB/DBManager.cs`
**Class**: DbManager
**NS**: Aegis.GameServer
**Methods**: Init, GetPlayerByPidAsync, GetPlayerByNicknameAsync

## `Aegis.GameServer/GameLogic/`

### `LoginService.cs`
Path: `Aegis.GameServer/GameLogic/LoginService.cs`
**Class**: LoginService
**NS**: Aegis.GameServer
**Methods**: ProcessLoginRequestAsync, KickSessionByNewConnection, ClearPlayerSession

## `Aegis.GameServer/GameLogic/GameLift/`

### `GameLiftManager.cs`
Path: `Aegis.GameServer/GameLogic/GameLift/GameLiftManager.cs`
**Class**: GameLiftManager
**NS**: Aegis.GameServer.GameLift
**Methods**: Initialize, Shutdown, CheckFleetStatusAsync

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

### `SQSManager.cs`
Path: `Aegis.GameServer/GameLogic/GameLift/SQSManager.cs`
**Class**: SQSManager
**NS**: Aegis.GameServer.GameLift
**Methods**: Initialize, Shutdown

## `Aegis.GameServer/GameLogic/Matching/`

### `MatchmakingService.cs`
Path: `Aegis.GameServer/GameLogic/Matching/MatchmakingService.cs`
**Class**: MatchmakingService
**NS**: Aegis.GameServer.Matching
**Methods**: Start, Stop, ProcessStartMatchRequestAsync, ProcessCancelMatchRequestAsync, ProcessMatchmaking, CreateRoomForMatchAsync, NotifyMatchingPlayersAsync, CreateGameSessionForMatchAsync, TestCreateGameSessionForMatchAsync, SendStartMatchResponse, SendCancelMatchResponse

## `Aegis.GameServer/GameLogic/Party/`

### `PartyManager.cs`
Path: `Aegis.GameServer/GameLogic/Party/PartyManager.cs`
**Class**: PartyManager
**NS**: Aegis.GameServer.Party
**Methods**: GetParty, GetAllParties, GetAllPartiesWithoutFilter, RemoveParty, GetPlayerParty, AddPlayerToParty, RemovePlayerFromParty, IsPlayerInParty, InviteToParty, AcceptPartyInvite, RejectPartyInvite, GetInvitation, CleanupExpiredInvitations, GetInviteKey, Clear

### `PartyService.cs`
Path: `Aegis.GameServer/GameLogic/Party/PartyService.cs`
**Class**: PartyService
**NS**: Aegis.GameServer.Party
**Methods**: ProcessCreatePartyRequestAsync, ProcessGetPartyListRequestAsync, ProcessJoinPartyRequestAsync, ProcessLeavePartyRequestAsync, ProcessInviteToPartyRequestAsync, ProcessAcceptPartyInviteRequestAsync, ProcessRejectPartyInviteRequestAsync, ProcessSetPartyReadyRequestAsync, CreatePartyDetailInfo, NotifyPartyMembersAsync, SendCreatePartyResponse, SendGetPartyListResponse, SendJoinPartyResponse, SendLeavePartyResponse, SendInviteToPartyResponse, SendAcceptPartyInviteResponse, SendRejectPartyInviteResponse, SendSetPartyReadyResponse

## `Aegis.GameServer/GameLogic/Room/`

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

## `Aegis.ServerFramework/Configuration/`

### `ConfigManager.cs`
Path: `Aegis.ServerFramework/Configuration/ConfigManager.cs`
**Class**: ConfigManager
**NS**: Aegis.ServerFramework
**Methods**: LoadConfig

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

## `NetworkClient/NetPlay/AI/`

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

### `AIMoveManager.cs`
Path: `NetworkClient/NetPlay/AI/AIMoveManager.cs`
**Class**: AIMoveManager
**NS**: ProjectAegis.NetPlay
**Methods**: GetMovementType, GetAIController, Update, FixedUpdate, GetMoveSpeedCur, SetMoveSpeedCur, SetMoveDestination, SetMoveDir, SetMoveDirFromPos, GetMoveDestination, GetMoveDir, DecideMoveSpeedAndMoveAni, MoveStart, MoveEnd, SetGoalRotY, GoalRotYProc, SetRotationY, GetMoveNow, GetMoveArrivedPos, OverlapMoveInfoInit, Temp_ReadyPatrolPointList, Temp_ReadyPatrolPointList2, OnBywayStart, SetMoveDirectionKind, AIMoveManager

## `NetworkClient/NetPlay/Character/Passive/`

### `PassiveSkillSystem.cs`
Path: `NetworkClient/NetPlay/Character/Passive/PassiveSkillSystem.cs`
**Class**: PassiveSkillSync, PassiveSkillSystem
**NS**: ProjectAegis.NetPlay
**Methods**: Awake, GetNextInstanceID, OnStartServer, InitPassiveSkillSync, OnStartClient, FixedUpdate, OnPassiveSkillSync, ApplyPassiveSkillSync, AddPassiveSkill, ClientAddPassiveSkill, RemovePassiveSkill, RemoveAllPassiveSkills, ClientRemovePassiveSkill, HasPassiveSkill, OnStartGamePassive, OnPassiveSkillActivateStateChanged, UpdatePassiveSkills, DisalbeOnDestroy, DebugGUI

## `NetworkClient/NetPlay/Character/Skill/`

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

## `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/`

### `ExecuteFunctionManager.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteFunctionManager.cs`
**Class**: ExecuteFunctionManager
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: IsValid, BuildExecuteEffect, Execute, OnStateStarted, OnStateEnded

## `NetworkClient/NetPlay/Character/StatusEffect/`

### `StatusEffectSystem.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectSystem.cs`
**Class**: StatusEffectSyncInfo, StatusEffectGroup, StatusEffectSystem
**NS**: ProjectAegis.NetPlay
**Methods**: CanApply, AddStatusEffect, RemovStatusEffect, Update, GetStatusEffectInstanceWithID, GetStatusEffectInstanceFirst, OnStackDownEvent, OnDestroy, Init, Editor_AddStatusEffect, RemoveStatusEffect, RemoveStatusEffectOnDestroy, RemoveBuffStatusEffect, RemoveDebuffStatusEffect, RemoveStatusEffectsOnDestroy, RemoveAllStatusEffects, SetArmor, RemoveArmor, HasArmor, GetStatusEffectGroup, CheckProbability, GetRemoveList, HasStatusEffect, HasStatusEffectByTableID, GetStatusEffectInstance (+ 1 more)

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

## `NetworkClient/NetPlay/Equipment/Weapon/Core/`

### `GunBase.AttachSystem.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Core/GunBase.AttachSystem.cs`
**Class**: GunBase
**NS**: ProjectAegis.NetPlay
**Methods**: IsOverheat, UpdateOverhit, HandleOverHeat_Logic, HandleOverHeat_Visuals, GetHeatPercentage, CoolDown

## `NetworkClient/NetPlay/GameEvent/`

### `InGameEventSystem.cs`
Path: `NetworkClient/NetPlay/GameEvent/InGameEventSystem.cs`
**Class**: EGameEventType, EventReceiverPair, IGameEventReceiver, GameEventHandlerAttribute, InGameEvent, EventHandlerGroup, Entry
**NS**: ProjectAegis.NetPlay
**Methods**: InGameEventHandler, AddHandler, RemoveHandler, Invoke, Register, HelperRetrieveReceivers, IsMethodSuitable, Unregister, OnReceiveEvent, RaiseEvent, Release, GameEventHandlerAttribute

## `NetworkClient/NetPlay/GameMode/`

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

### `GameModeRespawnSystem.cs`
Path: `NetworkClient/NetPlay/GameMode/GameModeRespawnSystem.cs`
**Class**: GameModeRespawnSystem
**NS**: ProjectAegis.NetPlay
**Methods**: InitBattleModeinfo, InitRespawnCount, IsInfiniteRespawn, GetRespawnCount, GetRespawnTime

## `NetworkClient/NetPlay/Interaction/`

### `InteractableRegistry.cs`
Path: `NetworkClient/NetPlay/Interaction/InteractableRegistry.cs`
**Class**: InteractableRegistry
**NS**: ProjectAegis.NetPlay.Interaction
**Methods**: ResetStatics, Register, Unregister, Get, TryGet, Clear, DebugLogAll

### `InteractionNetworkManager.cs`
Path: `NetworkClient/NetPlay/Interaction/InteractionNetworkManager.cs`
**Class**: InteractionNetworkManager
**NS**: ProjectAegis.NetPlay.Interaction
**Methods**: ResetStatics, Awake, OnEnable, OnDisable, OnDestroy, OnClientLoadedStartScenes, OnRemoteConnectionState, RequestInteract, RequestInteractStart, RequestInteractCancel, RequestSetInteractable, ServerSetInteractable, RequestDespawn, OnInteractRequest, HandleInteractComplete, HandleInteractStart, HandleInteractCancel, OnInteractResult, HandleStateChangeResult, HandleInteractStartResult, HandleInteractCancelResult, HandleDespawnResult, OnInteractableStateRequest, OnInteractableStateResult, GetCharacterFromConnection (+ 4 more)

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

## `NetworkClient/NetPlay/MapObject/`

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

## `NetworkClient/NetPlay/MapObject/Object/`

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

### `MarkSystem.cs`
Path: `NetworkClient/NetPlay/Mark/MarkSystem.cs`
**Class**: MarkSystem
**NS**: ProjectAegis.NetPlay
**Methods**: ApplyMark, RemoveMark, ForceRemoveMark, HasMark, HasAnyMark, GetMarkInstanceCount, GetMarkInstance, Update, OnDestroy, GetActiveMarkIDs, GetMarkInstances

## `NetworkClient/NetPlay/TacticalSkill/`

### `TacticalCardsSystem.cs`
Path: `NetworkClient/NetPlay/TacticalSkill/TacticalCardsSystem.cs`
**Class**: ETacticalCardSlot, TacticalCardsSystem, SelectalbeCardInfo, CardCandidateList, SynergyGradeCard
**NS**: ProjectAegis.NetPlay
**Methods**: GetCandidateCards, AddSynergySkill, AddSynergyGrade, TacticalCardSlotToSynergyType, SynergyEnumToTacticalCardSlot

## `NetworkDev/`

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

### `ServerPlayerSpawner_Aegis.cs`
Path: `NetworkDev/ServerPlayerSpawner_Aegis.cs`
**Class**: ServerPlayerSpawner_Aegis
**Methods**: Awake, OnDestroy, Spawn_Internally, SpawnAICharacter_Internally2, SpawnAICharacter_Internally, InitializeOnce

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

## `ScriptDev/AutoTest/`

### `GameLoopManager.cs`
Path: `ScriptDev/AutoTest/GameLoopManager.cs`
**Class**: GameLoopManager
**Methods**: Awake, InitializeScenarios, StartScenarioFromEditor, StartScenario, RunScenarioCoroutine, ReadScenarioFromAndroidIntent

## `ScriptDev/Contents/Core/`

### `CAimAssistSystem.cs`
Path: `ScriptDev/Contents/Core/CAimAssistSystem.cs`
**Class**: CAimAssistSystem, ELineOfSightOrigin
**Methods**: SetAutoFireToggle, SetAimAssistToggle, AddRecoilOffset, FixedUpdate, BindPlayerInput, UnbindPlayerInput, OnManualFire, InitializeAutoFireStates, ChangeState, UpdateAutoFire, LoadAutoFireState, ToggleAutoFire, ToggleAimAssist, IsAutoFireConditionMet, IsAimAssistConditionMet, InitializeAimAssistStates, ChangeAimAssistState, IsApplyFireAimAssist, UpdateAimAssist, StartAimAssist, StopAimAssist, StartFireAimAssistCooldown, OnLookInput, UpdateTargetPart, ApplySustainedRotation (+ 26 more)

### `CCameraController.cs`
Path: `ScriptDev/Contents/Core/CCameraController.cs`
**Class**: CameraOverride, CCameraController
**Methods**: LateUpdate, OnDestroy, SetupPlayerCamera, OnChangedWeapon, OnFiredWeapon, GetLerpValue, AddCameraRotation, UpdateCameraPosition, GetPredictedCameraPosition, UpdateCameraRotation, UpdateCameraFOV, SetCameraFOV, SetRotation, StartCameraRecoil, UpdateCameraRecoil, AddCameraRecoilRotation, AddCameraRecoilFOV, SetupCameraImpulse, StartCameraImpulse, RefreshCameraState, ApplyCameraState, AddCameraStateOverride, RemoveCameraStateOverride, SetSpectateCamera, ClearSpectateCamera

### `FootstepController.cs`
Path: `ScriptDev/Contents/Core/FootstepController.cs`
**Class**: FootstepController
**NS**: ProjectAegis.Contents
**Methods**: Awake, OnEnable, OnDisable, Update, IsMoving, IsFootGrounded, PlayLeftFootstep, PlayRightFootstep, PlayFootstep, OnDrawGizmosSelected

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

### `AutoFireStorage.cs`
Path: `ScriptDev/Contents/Core/AutoFireSystem/AutoFireStorage.cs`
**Class**: AutoFireSaveData, EFireAssistType, AutoFireItem, AutoFireStorage
**NS**: ProjectAegis.NetPlay
**Methods**: EnsureSettingsLoaded, Save, SaveSettings, SetState, GetState

## `ScriptDev/EffectTest/`

### `EffectTestManager.cs`
Path: `ScriptDev/EffectTest/EffectTestManager.cs`
**Class**: EffectTestManager, EnvMode
**NS**: Aegis.EffectTools
**Methods**: Awake, Start, LoadAssets, CoStartLocalHost, CoWaitForLocalCharacter, PreloadWeaponEffects, SpawnTestCharacter, SpawnAndEquipSequence, ReuseCharacter, CleanupInvalidCharacter, SpawnNewCharacter, SpawnDummyTarget, SetDummyDistance, SpawnAllyTarget, SetAllyDistance, SetDummyRotation, SetAllyRotation, SetCharacterRotation, SpawnDummyTargetInternal, TriggerAllySkill, TriggerEnemySkill, EquipWeapon, CoEquipWeapon, FireWeapon, SetAutoFire (+ 32 more)

## `ScriptDev/Framework/Scene/`

### `CFrameWorkManager.cs`
Path: `ScriptDev/Framework/Scene/CFrameWorkManager.cs`
**Class**: eFrameWork, CFrameWorkManager, eChangeProcess
**NS**: ProjectAegis.Framework
**Methods**: ToLogString, Init, ChangeFrameWork, CheckChangableFrameWork, Update, ChangeScene, OnFlowUIHided, ProcessPrepare, ProcessEmpty, ProcessRelease, ProcessLoadScene, ProcessLoadSceneAsync, ProcessLoad, ProcessLoadEnd, ProcessInit, ProcessUpdate, LateUpdate, GetCurrentFrameWork, GetOldFrameWork, Release, CreateSceneClass, ShouldCollectGarbage

## `ScriptDev/KPP/`

### `KppManager.cs`
Path: `ScriptDev/KPP/KppManager.cs`
**Class**: KppManager
**NS**: ProjectAegis.KPP
**Methods**: Awake, OnDestroy, ResolveDependencies, BindEvents, UnbindEvents, OnInitialized, OnInitializeFailed, OnLoginSucceeded, OnLoginFailed, OnLogoutSucceeded, OnLogoutFailed, Initialize, Login, Logout, DeviceLogin, LinkKraftonId, DeleteAccount, CheckGameServersMaintenance, SetGameServerId, CheckMaintenance, SetLanguageCode, GetLanguageCode, GetDeviceId

## `ScriptDev/Manager/`

### `AssetManager.cs`
Path: `ScriptDev/Manager/AssetManager.cs`
**Class**: AssetManager
**Methods**: LoadAssetAsync, UnloadAsset, UnloadAllAssets, UnloadAssetsByLabel, LoadAssetByLabel_CreatePools, UnloadAssetsByLabel_DestroyPools, LoadAsset_CreatePool, UnloadAsset_DestroyPool, LoadSceneAsync, UnloadSceneAsync, UnloadAllScenesAsync, IsSceneLoaded, ClearAll, OnDestroy, GetPrefab

### `CCombatManager.cs`
Path: `ScriptDev/Manager/CCombatManager.cs`
**Class**: CCombatManager, ECombatCategory, ECombatType, CombatData
**Methods**: Init, Disabled, Release, GetCombatCategory, IsTargetAlly, IsActivatedCategory, SetCombatDataMaxCount, GetCombatDataMaxCount, AddCombatData, IsValidCombatData, RemoveCombatData, IsTargetInCameraView, IsInViewport, GetOverlapIndex, OnTakeDamage, OnTakeDamageByStatusEffect, OnTakeDamageByCurse, OnTakeHeal, OnStatusEffectImmune

### `CharacterManager.cs`
Path: `ScriptDev/Manager/CharacterManager.cs`
**Class**: CharacterManager

### `ContentUnlockManager.cs`
Path: `ScriptDev/Manager/ContentUnlockManager.cs`
**Class**: ContentUnlockData, ContentUnlockManager
**NS**: ProjectAegis.Manager
**Methods**: InitializeInst, InitializeDummyData, IsUnlock, GetUnlockConditionValue, GetLockMessage, TryGetUnlockData, ShowLockNotice, GetPassiveSlotUnlockType, IsPassiveSlotUnlocked, GetPassiveSlotUnlockLevel, EditorSetDummyData, EditorPrintAllUnlockData

### `CPacketAckManager.cs`
Path: `ScriptDev/Manager/CPacketAckManager.cs`
**Class**: CPacketAckManager, PendingAckRequest
**NS**: ProjectAegis.Utility
**Methods**: LaunchPacketAckManager, ClearAndStopPacketAckManager, Dispose, Shutdown, OnDestroy

### `CScheduleManager.cs`
Path: `ScriptDev/Manager/CScheduleManager.cs`
**Class**: SampleEntity, IScheduleEntity, CScheduleManager, ScheduleEntityExtention
**NS**: ProjectAegis.Manager
**Methods**: LaunchScheduler, ClaerAndStopScheduler, TryGet, Contains, InternalAddSchedule, InternalRemoveSchedule, InternalCancelAllSchedule, RegistEntity, CancelSchedule, IntenralChangedScheduleTime, ChangeScheduleTime, LateUpdate, LaunchSchedule

### `EffectManager.cs`
Path: `ScriptDev/Manager/EffectManager.cs`
**Class**: EffectManager
**Methods**: SpawnEffect, DespawnEffect, CheckEffecEvent

### `Local_UserDataManager.cs`
Path: `ScriptDev/Manager/Local_UserDataManager.cs`
**Class**: Local_UserDataManager
**NS**: ProjectAegis.UserDatas
**Methods**: InitializeInst, InitilizePartyInfos

### `NamePlateManager.cs`
Path: `ScriptDev/Manager/NamePlateManager.cs`
**Class**: NamePlateManager, NamePlatePresenter
**Methods**: OnDrawGizmos, Start, OnDestroy, Update, UpdateSortingOrder, Release, Register, Unregister, OnHUDReady, CreateViewForPresenter, SetNamePlate, RefreshUI, ApplyRules, SetVisible, CheckLOS, IsInCenterViewportCapsule, ToIsotropicNorm, OnTakeDamaged, OnDeath, SetDisplayTimer, UpdatePosition, SetActiveNamePlate, SetEnabledOutline, NamePlatePresenter

### `ObjectPoolManager.cs`
Path: `ScriptDev/Manager/ObjectPoolManager.cs`
**Class**: PoolCategory, PoolConfig, ObjectPoolManager
**NS**: ProjectAegis.Pool
**Methods**: Custom, Awake, InitializePoolRoot, CreatePool, CreatePooledObject, OnGetFromPool, OnReleaseToPool, OnDestroyPoolObject, GetPool, ReturnPool, ReturnPoolDelay, HasPool, DestroyPool, DestroyAllPools, PrintPoolStatus, PrintAllPoolStatus, OnDestroy, PoolConfig

### `PlayerManager.cs`
Path: `ScriptDev/Manager/PlayerManager.cs`
**Class**: PlayerManager
**NS**: GameSources.ScriptDev.Manager
**Methods**: Register, Unregister, GetByObjectId, GetBySessionId, GetMembers, GetOtherTeamMembers, GetTeamIDs, ClearAllTeams

### `SettingsManager.cs`
Path: `ScriptDev/Manager/SettingsManager.cs`
**Class**: SettingsManager
**NS**: ProjectAegis.Manager
**Methods**: InitializeInst, LoadSettings, SaveSettings, SetBGMVolume, SetSFXVolume, SetGraphicsQuality, SetTargetFramerate, SetVibration, ApplySettings, ApplyAudioSettings, ApplyGraphicsSettings, ResetToDefault

### `UserDataManager.cs`
Path: `ScriptDev/Manager/UserDataManager.cs`
**Class**: IUserData, 타입, IUserDataChangeNotify, UserDataManager
**NS**: ProjectAegis.UserDatas
**Methods**: InitializeInst, OnLogin, OnLogout

### `UserDataUpdateEvent.cs`
Path: `ScriptDev/Manager/UserDataUpdateEvent.cs`
**Class**: EUserDataEvents, UserDataEvent
**NS**: ProjectAegis.UserDatas
**Methods**: Trigger

### `VibrationManager.cs`
Path: `ScriptDev/Manager/VibrationManager.cs`
**Class**: VibrationManager
**NS**: ProjectAegis.Manager
**Methods**: InitializeInst, PlayDamageVibration, PlayVibration, StopVibration, OnApplicationFocusChanged

## `ScriptDev/Manager/UserDatas/Achievement/`

### `AchievementDatas.cs`
Path: `ScriptDev/Manager/UserDatas/Achievement/AchievementDatas.cs`
**Class**: AchievementData
**NS**: ProjectAegis.UserDatas

### `AchievementExtention.cs`
Path: `ScriptDev/Manager/UserDatas/Achievement/AchievementExtention.cs`
**Class**: UserAchievementData, RefAchieveGroupHashData, AchievementGroupData, EUIMissionSlotState, AchievementExtention
**NS**: ProjectAegis.UserDatas
**Methods**: TryGetUserAchieveData, GetMissionLevel, GetCharacterAchieveGroupIDs, GetCommonAchieveGroupIDs, GetRefAchievesByGroupID, HasAchieveMission, BuildSampleUserData, HasNextAchieveMission, BuildSlotState, RefAchieveGroupHashData

### `UserAchievementData.cs`
Path: `ScriptDev/Manager/UserDatas/Achievement/UserAchievementData.cs`
**Class**: UserAchievementData, UserDataManager
**NS**: ProjectAegis.UserDatas
**Methods**: InitUserData, RegisterNetHandler, ResetData, InitializeAchievement, InitUserAchievementeData, ResetAchievementDatas

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

## `ScriptDev/Manager/UserDatas/CommonInterface/`

### `IRequestInviteData.cs`
Path: `ScriptDev/Manager/UserDatas/CommonInterface/IRequestInviteData.cs`
**Class**: EInviteType, IRequestInviteData
**NS**: ProjectAegis.UserDatas

## `ScriptDev/Manager/UserDatas/Currency/`

### `UserCurrencyData.cs`
Path: `ScriptDev/Manager/UserDatas/Currency/UserCurrencyData.cs`
**Class**: UserCurrencyData, UserDataManager
**NS**: ProjectAegis.UserDatas
**Methods**: RegisterNetHandler, InitUserData, ResetData, HasEnough, SetCurrency, SetCurrencyInternal, GetEnumerator, InitilizeUserCurrency, InitUserCurrencyData, ResetUserCurrencyDatas

## `ScriptDev/Manager/UserDatas/Friend/`

### `FriendExtention.cs`
Path: `ScriptDev/Manager/UserDatas/Friend/FriendExtention.cs`
**Class**: ReceiveRequest, UserFriendData, FriendExtention
**NS**: ProjectAegis.UserDatas
**Methods**: GetRequestExpireDuration, GetProfileIconName, GetProfileFrameName, GetCharacterIconName, SetRequestRespond, ConnectScheduleController, OnSchedulerCreated, OnSchedulerDestoried, AddRequestInstance, OnRequestInstnaceExpired, PopRequestInstances, PopSingleRequestInstance, ToStatusLocalString, FillRandValue

### `FriendFilterExtention.cs`
Path: `ScriptDev/Manager/UserDatas/Friend/FriendFilterExtention.cs`
**Class**: EFriendFilterType, ERoleType, ETierType, EGenderType, EUseType, ECountry, FriendFilterAndSort, FriendSorter
**NS**: ProjectAegis.UserDatas
**Methods**: SortFriends, FindFilteredFriends, Compare, Dispose, GetSortAction, _SortAction_UID, GetFilterAction, _FilterAction_UID, FriendSorter

### `FriendMember.cs`
Path: `ScriptDev/Manager/UserDatas/Friend/FriendMember.cs`
**Class**: FriendMember
**NS**: ProjectAegis.UserDatas
**Methods**: UpdateFrom, UpdateStatus, FriendMember

### `FriendRequestInstance.cs`
Path: `ScriptDev/Manager/UserDatas/Friend/FriendRequestInstance.cs`
**Class**: FriendRequestInstance
**NS**: ProjectAegis.UserDatas
**Methods**: Dispose, OnActiveSchedule, FriendRequestInstance

### `ReceiveRequest.cs`
Path: `ScriptDev/Manager/UserDatas/Friend/ReceiveRequest.cs`
**Class**: ReceiveRequest
**NS**: ProjectAegis.UserDatas
**Methods**: UpdateFrom, UpdateStatus, ReceiveRequest

### `UserDataManager_Friend.cs`
Path: `ScriptDev/Manager/UserDatas/Friend/UserDataManager_Friend.cs`
**Class**: UserDataManager
**NS**: ProjectAegis.UserDatas
**Methods**: InitializeFriend, InitUserFriendData, ResetFriendDatas

### `UserFriendData.cs`
Path: `ScriptDev/Manager/UserDatas/Friend/UserFriendData.cs`
**Class**: EFriendType, IFriendItem, UserFriendData, ReddotCondition
**NS**: ProjectAegis.UserDatas
**Methods**: DebugLog, IsRequesteds, GetMembers, GetSearching, GetReceivedRequest, InitUserData, ResetData, RegisterNetHandler, SendGetFriendList, SendFriendRequest, SendRespondFriendRequest, SendDeleteFriend, SendGetRecommendedFriends, SendSearchFriend, SendGetReceivedFriendRequestList, OnGS2C_GetFriendListAck, OnGS2C_SendFriendRequestAck, OnGS2C_RespondFriendRequestAck, OnGS2C_DeleteFriendAck, OnGS2C_GetRecommendedFriendsAck, OnGS2C_SearchFriendAck, OnGS2C_GetReceivedFriendRequestListAck, OnGS2C_FriendRequestNotify, OnGS2C_FriendStatusChangedNotify

## `ScriptDev/Manager/UserDatas/Inventory/`

### `ItemData.cs`
Path: `ScriptDev/Manager/UserDatas/Inventory/ItemData.cs`
**Class**: ItemData
**NS**: ProjectAegis.UserDatas
**Methods**: FromItemInfo, SetEquipState, ClearEquipState, ItemData

### `UserDataManager_Inventory.cs`
Path: `ScriptDev/Manager/UserDatas/Inventory/UserDataManager_Inventory.cs`
**Class**: UserInventoryData, UserDataManager
**NS**: ProjectAegis.UserDatas
**Methods**: RegisterNetHandler, InitUserData, ResetData, ProcessItemInfoList, AddItemFromInfo, OnGS2C_CheatGiveItemAck, GetItem, TryGetItem, HasItem, GetAllItems, GetItemsByType, GetItemCountByType, IsEquipped, SetItemEquipState, GetAllModules, GetModule, TryGetModule, GetUnequippedModules, GetModulesByItemId, GetModuleCount, GetEquippedModuleInSlot, HasEquippableModules, GetAllPassives, HasPassive, GetOwnedPassiveIds (+ 21 more)

## `ScriptDev/Manager/UserDatas/Profile/`

### `ProfileExtention.cs`
Path: `ScriptDev/Manager/UserDatas/Profile/ProfileExtention.cs`
**Class**: UserProfileData, ProfileExtention
**NS**: ProjectAegis.UserDatas
**Methods**: CreateSample, ToValueString, GetCharacterStatistics, GetProfileIconName, GetProfileFrameName, GetProfileBannerName

### `UserDataManager_Profile.cs`
Path: `ScriptDev/Manager/UserDatas/Profile/UserDataManager_Profile.cs`
**Class**: UserDataManager
**NS**: ProjectAegis.UserDatas
**Methods**: InitializeProfile, InitUserProfileData, ResetProfileDatas

### `UserProfileData.cs`
Path: `ScriptDev/Manager/UserDatas/Profile/UserProfileData.cs`
**Class**: EProfileChangeType, UserProfileData
**NS**: ProjectAegis.UserDatas
**Methods**: RegisterNetHandler, InitUserData, ResetData, DebugLog, SendGetProfile, OnGS2C_GetProfileAck, ResetSelectedStatistics, SendEquipProfileItem, OnGS2C_EquipProfileItemAck, SendSelectTitles, OnGS2C_SelectTitlesAck, SendSetSelectedStatistics, OnGS2C_SetSelectedStatisticsAck, SendSetPrivacySettings, OnGS2C_SetPrivacySettingsAck, SendChangeNickname, OnGS2C_ChangeNicknameAck

## `ScriptDev/Manager/UserDatas/Ranking/`

### `RankingExtention.cs`
Path: `ScriptDev/Manager/UserDatas/Ranking/RankingExtention.cs`
**Class**: RankingExtention
**NS**: ProjectAegis.UserDatas
**Methods**: GetProfileIconName, GetProfileFrameName, GetProfileBannerName

### `UserDataManager_Ranking.cs`
Path: `ScriptDev/Manager/UserDatas/Ranking/UserDataManager_Ranking.cs`
**Class**: UserDataManager
**NS**: ProjectAegis.UserDatas
**Methods**: InitializeRanking, InitUserRankingData, ResetRankingDatas

### `UserRankingData.cs`
Path: `ScriptDev/Manager/UserDatas/Ranking/UserRankingData.cs`
**Class**: RankingEntryData, UserRankingData
**NS**: ProjectAegis.UserDatas
**Methods**: RegisterNetHandler, InitUserData, ResetData, RequestRankingData, SendGetProfile, RequestRankingRewards, OnGS2C_GetLeaderboardAck, CreateFallbackMyEntry, OnGS2C_GetMyRankingAck, OnGS2C_GetRankingRewardsAck, OnGS2C_RankingScoreUpdateNotify, OnGS2C_GetProfileAck, SetLeaderboardData, GetRewardGroupList, FindMyRewardGroupId, GetMyRewardGroupIndex

## `ScriptDev/Manager/UserDatas/UserParty/`

### `CBattleMode.cs`
Path: `ScriptDev/Manager/UserDatas/UserParty/CBattleMode.cs`
**Class**: IPartySetting, BattleModePartySetting, DominationPartySetting, BattleMapInfo, BattleMapSelector
**NS**: ProjectAegis.UserDatas
**Methods**: AddRandomMap, Initialize, SelectMap, SelectRandomMap, SelectPrevMap, SelectNextMap, GetBattleTypeByGroupId, Reset, GetNextBattleType, GetBattleTypeIndex, BattleModePartySetting, BattleMapInfo

### `CMatchMaking.cs`
Path: `ScriptDev/Manager/UserDatas/UserParty/CMatchMaking.cs`
**Class**: EMatchingState, CMatchMaking, SelectedMapInfo, MatchRoomInfo, TeamMember
**NS**: ProjectAegis.UserDatas
**Methods**: SetMapInfo, Reset, GetMyTeamMembers, RegisterNetHandler, InitUserData, ResetData, ResetMatchingStartTime, SetBattleInfo, RequestBattleInfo, OnGS2C_SetPartyBattleTypeAck, OnGS2C_PartyBattleTypeNotify, StartMatchmaking, StartQuickMatchmaking, OnGS2C_StartMatchAck, CancelMatchmaking, OnGS2C_CancelMatchAck, OnGS2C_MatchStatusNotify, OnGS2C_MatchCompletedNotify, OnGS2C_MatchCancelledNotify, Dispose, SendSelectCharacter, onGS2C_ChangePartyCharacterAckEvent, TeamMember

### `CPartyInvited.cs`
Path: `ScriptDev/Manager/UserDatas/UserParty/CPartyInvited.cs`
**Class**: PartyInviteMsg, IRequestInviteData, PartyInviteScheduleEntity, CPartyInvited
**NS**: ProjectAegis.UserDatas
**Methods**: GetProfileIconName, GetProfileFrameName, GetCharacterIconName, SetRequestRespond, Dispose, OnActiveSchedule, GetInviteInfo, GetInviteCount, RemoveExpiredInvite, CheckAndRemoveExpiredInvites, RegisterNetHandler, InitUserData, ResetData, OnGS2C_PartyInviteNotify, SendAcceptPartyInvite, OnGS2C_AcceptPartyInviteAck, SendRejectPartyInvite, OnGS2C_RejectPartyInviteAck, OnSchedulerLaunched, OnSchedulerStopped, RegisterInviteSchedule, OnInviteExpiredBySchedule, CancelInviteSchedule, ClearAllScheduleEntities, GetScheduleId (+ 2 more)

### `CUserParty.cs`
Path: `ScriptDev/Manager/UserDatas/UserParty/CUserParty.cs`
**Class**: CPartyMember, InviteRequestCache, CUserParty
**NS**: ProjectAegis.UserDatas
**Methods**: Dispose, SetReady, UpdateData, Sended, RegisterNetHandler, InitUserData, ResetData, SendJoinPartyReq, OnGS2C_JoinPartyAck, SendLeavePartyReq, OnGS2C_LeavePartyAck, OnGS2C_SetPartyReadyReq, OnGS2C_SetPartyReadyAck, OnGS2C_PartyMembersNotify, UpdateLeaderIfChanged, QuickMatchSettingMember, ResetInvitedCache, SendInviteToParty, OnGS2C_InviteToPartyAck, SendKickMemberReq, OnGS2C_KickPartyMemberAck, OnGS2C_KickedFromPartyNotify

### `UserDataManager_Party.cs`
Path: `ScriptDev/Manager/UserDatas/UserParty/UserDataManager_Party.cs`
**Class**: EPartyPropertyChangeType, PartyDataEvent, UserDataManager
**NS**: ProjectAegis.UserDatas
**Methods**: Trigger, InitilizePartyInfos, InitUserPartyData, ResetPartyInfoDatas, SendCreateParty, OnGS2C_CreatePartyAck, RequestPartyList, OnGS2C_GetPartyListAck

## `ScriptDev/Pulse/`

### `CBenchmarkManager.cs`
Path: `ScriptDev/Pulse/CBenchmarkManager.cs`
**Class**: CBenchmarkManager, CMatch_CharacterSelectDone, CLoading_Match_LoadStart, CLoading_Match_SceneLoaded, CLoading_Match_ResourcesLoaded, CLoading_Match_BattlefieldShown
**Methods**: Init, StartApp, LoginLobby, Destroy, SendFPS, SendBenchmark, SendBatteryInfo, GetNowTimestamp, SendDictionary, RecvData, InputFirePressed, InputFireStart, LocalFireSent, ServerFireReceived, ServerHitResult, ClientFireResult, InputMoveStart, InputMoveStop, CharacterMove, ServerMoveResult, CharacterMoveResult, Loading_Match_CharacterSelectDone, Loading_Match_LoadStart, Loading_Match_SceneLoaded, Loading_Match_ResourcesLoaded (+ 14 more)

## `ScriptDev/Pulse/Runtime/`

### `UnityPulseByteArrayPool.cs`
Path: `ScriptDev/Pulse/Runtime/UnityPulseByteArrayPool.cs`
**Class**: UnityPulseByteArrayPool
**NS**: Pulse.Unity
**Methods**: Get, Return, UnityPulseByteArrayPool

## `ScriptDev/Rendering/MaterialEffect/`

### `MaterialEffectController.cs`
Path: `ScriptDev/Rendering/MaterialEffect/MaterialEffectController.cs`
**Class**: MaterialEffectController, Target
**NS**: Aegis.Rendering
**Methods**: GetAllEffectControllers, GetCurrentType, GetCurrentMaterial, OnDestroy, RefreshTargets, IsWeaponMesh, SetEffect, ClearEffect, ResetEffect, _EnsureEffectMaterial, _EnsureTransitionMaterial, _SetEffect, _Transition, _StopTransition, _UpdateTransitionOverlayFade, _TransitionCoroutine, IsNeedCombineSubmesh, HasCombinedSubmesh, CombineSubmesh

## `ScriptDev/Sound/`

### `SoundManager.cs`
Path: `ScriptDev/Sound/SoundManager.cs`
**Class**: SoundManager, PooledAudioSource, SoundCue, PlaySequence, SoundType
**Methods**: IsAvailable, Play, Stop, GetNextClip, MinClipLength, MaxClipLength, Awake, Start, Update, OnDestroy, InitializeAudioSources, CreatePooledAudioSource, ExpandPool, GetPooledAudioSource, CheckAndDisableFinishedSounds, GetActiveInstanceCount, CheckAndLoadSoundData, BuildSoundCueDict, GetSoundCue, PlayBGM, StopBGM, PauseBGM, ResumeBGM, CrossFadeBGM, CrossFadeCoroutine (+ 24 more)

## `ScriptDev/UI/Lobby/`

### `CUILobbyCharacterModelController.cs`
Path: `ScriptDev/UI/Lobby/CUILobbyCharacterModelController.cs`
**Class**: CUILobbyModelInfo, CUILobbyCharacterModelController, LobbyModelUserStatusInfo
**NS**: ProjectAegis.UI
**Methods**: Dispose, RefreshAll, UpdatePositions, Remove, HideAll, SetupModelInfo, CreateModelInfo, UpdatePosition, UpdateReadyMark, SetReadyAndChangeCharBtn, OnShowHeroSelect, UpdateUIData, SetKickBtn, OnLeavePartyCallback, OnKickMemberCallback, CUILobbyCharacterModelController, LobbyModelUserStatusInfo

### `CUILobbyHUDAreaController.cs`
Path: `ScriptDev/UI/Lobby/CUILobbyHUDAreaController.cs`
**Class**: CUILobbyHUDAreaController
**NS**: ProjectAegis.UI
**Methods**: Initialize, Show, Hide, ShowImmediate, HideImmediate, Dispose, CUILobbyHUDAreaController

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

## `ScriptDev/UI/Lobby/Clan/`

### `CUIClanManager.cs`
Path: `ScriptDev/UI/Lobby/Clan/CUIClanManager.cs`
**Class**: ClanState, ClanJoinMethod, ClanCreateData, ClanBadgeParsed, CUIClanManager
**NS**: ProjectAegis.UI
**Methods**: GetEmblemFromBadge, GetFrameFromBadge, GetColorFromBadge, InitializeConfig, ShowError, ShowSuccess, GetRefreshCooldownRemainingSeconds, GetRefreshCooldownErrorMessage, InitializeInst, OnLoginAckHandler, InitializeFromLoginAck, Reset, SetState, HasPermission, CanKick, CanChangeRole, RequestCreateClan, RequestUpdateClanInfo, RequestJoinClan, RequestAcceptInvitation, RequestDeclineInvitation, RequestLeaveClan, RequestKickMember, RequestChangeRole, RequestSetAdmin (+ 35 more)

## `ScriptDev/UI/Lobby/Party/`

### `PartyInviteButtonHandler.cs`
Path: `ScriptDev/UI/Lobby/Party/PartyInviteButtonHandler.cs`
**Class**: PartyInviteButtonHandler
**NS**: ProjectAegis.UI
**Methods**: RegisterEvents, UnregisterEvents, RefreshInviteCount, HandleButtonClick, ShowSingleInvitePopup, OnChangePartyEvent, OnAcceptPartyInviteCallback, OnRejectPartyInviteCallback, Dispose, PartyInviteButtonHandler

## `ScriptDev/UI/Manager/`

### `CFontDataAddressManager.cs`
Path: `ScriptDev/UI/Manager/CFontDataAddressManager.cs`
**Class**: CFontDataAddressManager
**NS**: ProjectAegis.Utility
**Methods**: InitializeInst, ExtractFontNameFromLocation, GetCurrentLanguageFont, GetFontForLanguage, GetFontForLanguageAsync, LoadFontByAddress, LoadFontByAddressDirect, TryLoadUnityDefaultFonts, LoadFontByAddressAsync, GetFallBackFont, GetFontKeyForLanguage, OnLanguageChanged, ClearFontCache, OnDestroy

### `CFontDataManager.cs`
Path: `ScriptDev/UI/Manager/CFontDataManager.cs`
**Class**: CFontDataManager
**NS**: ProjectAegis.Utility
**Methods**: InitializeInst, InitializeAddressableManager, Get, ClearFontAsset, GetFallBackFont, GetFontForLanguage, GetFontForLanguageAsync

### `CPushManager.cs`
Path: `ScriptDev/UI/Manager/CPushManager.cs`
**Class**: IPushManager, PushChannelSettings, PushManager, CPushManager, PushInfo
**NS**: ProjectAegis.Push.Local
**Methods**: Initialize, SchedulePush, CancelPush, CancelAllPush, InitializeSingleton, RequestNotificationPermission, CoRequestNotificationPermission, IsLocalPush, OnApplicationQuit, OnApplicationPause, ClearPush, MakePush, PlayPush, CheckNightPush, PushInfo

### `CRedDotManager.cs`
Path: `ScriptDev/UI/Manager/CRedDotManager.cs`
**Class**: CRedDotManager, RedDotChangedEvent
**NS**: ProjectAegis.Utility
**Methods**: InitialzieReddot, MarkAsActive, MarkAsInactive, GetCount, SetRedDotStateInternal, IsActive, IsActiveFromPlayerPrefs, HasState, RemoveState, SetMultipleRedDotStates, ForceSave, ClearCache, RemoveTypeStates, DebugPrintActiveRedDots, GetRedDotKey, UpdateCategoryHandler, RefreshAllActiveRedDots, OnApplicationPause, OnApplicationFocus, OnApplicationQuit, RedDotChangedEvent

### `CSpriteDataManager.cs`
Path: `ScriptDev/UI/Manager/CSpriteDataManager.cs`
**Class**: CSpriteDataManager
**NS**: ProjectAegis.Utility
**Methods**: InitLoad, InitializeInst, LoadSpriteAtlas, ReleaseAtlas, ClearAtlas, GetLoadSprite, PreloadByLabel, ReleaseLabel, IsLabelPreloaded

### `CTextureDataManager.cs`
Path: `ScriptDev/UI/Manager/CTextureDataManager.cs`
**Class**: CTextureDataManager
**NS**: ProjectAegis.Utility
**Methods**: InitializeInst, LoadTexture, ReleaseTexture, ClearTexture, GetLoadTexture, PreloadByLabel, ReleaseLabel, IsLabelPreloaded

## `ScriptDev/UI/Map/`

### `CUIMapManager.cs`
Path: `ScriptDev/UI/Map/CUIMapManager.cs`
**Class**: CUIMapManager, HitBufferComparer
**NS**: ProjectAegis.UI
**Methods**: GetMinimapTexture, InitializeInst, Update, RegisterMinimap, RegisterOverlayMap, RegisterLargeMap, SetMapInfoById, SetMapInfo, GetCurrentMapInfo, SetDirectMapSettings, SetPlayer, SyncMapInfoFromMinimap, SyncTextureFromMinimap, CycleMapMode, ToggleOverlayMap, OpenLargeMap, CloseLargeMap, ToggleLargeMap, OnMinimapClicked, AddPing, ClearAllPings, ClearPingsByOwner, SyncPingsToMap, UpdatePortraitCharacters, IsValidTarget (+ 1 more)

### `CUIPingManager.cs`
Path: `ScriptDev/UI/Map/CUIPingManager.cs`
**Class**: ECanPingResult, CUIPingManager, PingData
**NS**: ProjectAegis.UI
**Methods**: IsInfinite, InitializeInst, RegisterNavigation, RegisterAutoPingMessage, Update, TryCreatePingAtCrosshair, CreatePingAtPosition, CreateAutoPing, AddAllyPing, AddPingNavigation, RemovePingNavigationAt, ClearPingNavigationsByOwner, ClearAllPingNavigations, ClearAllPings, GetActivePings, CreateManualPing, ClearManualPings, RemovePingAt, CanPing, TryGetCrosshairWorldPosition, GetLocalCharacterId, GetLocalOwnerId, GetLocalPlayerName, TryShowPingMessage, TryPlayPingSound (+ 6 more)

## `ScriptDev/UI/Option/`

### `OptionSlotFactory.cs`
Path: `ScriptDev/UI/Option/OptionSlotFactory.cs`
**Class**: OptionSlotFactory
**NS**: ProjectAegis.UserDatas
**Methods**: Create, CreateSlotByUIType

## `ScriptDev/UI/UIFramework/`

### `CUIManager.cs`
Path: `ScriptDev/UI/UIFramework/CUIManager.cs`
**Class**: ELayout, CUIManager
**NS**: ProjectAegis.UI.Framework
**Methods**: EnableNavigation, DisableNavigation, ClearNavigationHistory, InitializeSingleton, TryGetPanelAttribute, InitLayouts, UpdateResolutionGuarantee, CalcDragThreshold, SetPixelDragThreshold, TryGetLayout, HasUIInstanceInternal, FindUIInstanceInternal, InstantiateInternal, OnPanelHideCompleted, DestroyDeactiveUIContentInternal, HideAllPanelsInternal, DestroyPanels, DestoryAllPanels, HasFlowUIInstance, HideAllFlowUI, DestroyAllExceptFlowUI, FindUIInstance, GetActiveUIPanelNames, IsUIPanelActive, ShowPanelInstance (+ 18 more)

## `ScriptDev/UI/Utilities/RedDot/`

### `CRedDotCategoryHandler.cs`
Path: `ScriptDev/UI/Utilities/RedDot/CRedDotCategoryHandler.cs`
**Class**: RedDotCategory, CRedDotCategoryHandler
**NS**: ProjectAegis.Utility
**Methods**: IsManagedCategory, IsActiveCheckByCategory, GetCount

## `ScriptDev/Utilities/`

### `CEventManager.cs`
Path: `ScriptDev/Utilities/CEventManager.cs`
**Class**: CEventManager, CEventRegister, IEventListenerBase, IEventListener
**NS**: ProjectAegis.Utility
**Methods**: InitializeStatics

### `ReferenceManagerExtension.cs`
Path: `ScriptDev/Utilities/ReferenceManagerExtension.cs`
**Class**: ReferenceManagerExtension, CommonConfig
**Methods**: EqualFieldData, ChangeFieldData, GetGroupSkills, GetApplyExecuteIds, GetApplyRefExecute, GetApplyExecuteEffectIds, GetApplyRefExecuteEffects, GetApplyResultDisplay, TryGetValue, GetTimeValue, GetInt, GetColor, GetDistance

## `ScriptDev/Utilities/UGUIPlus/Hnadlers/`

### `PositionOffsetHandler.cs`
Path: `ScriptDev/Utilities/UGUIPlus/Hnadlers/PositionOffsetHandler.cs`
**Class**: PositionOffsetHandler
**NS**: MoenenGames.UGUIPlus
**Methods**: PopulateMesh, RemapPositionOffset

### `ShadowHandler.cs`
Path: `ScriptDev/Utilities/UGUIPlus/Hnadlers/ShadowHandler.cs`
**Class**: ShadowHandler
**NS**: MoenenGames.UGUIPlus
**Methods**: PopulateMesh, SetQuadCachePosition, SetQuadCachePositionAlt, SetQuadCacheColorLR, SetQuadCacheColorUD

### `VertexColorHandler.cs`
Path: `ScriptDev/Utilities/UGUIPlus/Hnadlers/VertexColorHandler.cs`
**Class**: VertexColorHandler, ColorFilterType
**NS**: MoenenGames.UGUIPlus
**Methods**: PopulateMesh, RemapColor

## `ScriptTools/Editor/DataExportTool/ToolCore/`

### `CToolReferenceTableManager.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/CToolReferenceTableManager.cs`
**Class**: CReferenceEnumData, CToolReferenceTableManager
**NS**: DataExportTool
**Methods**: LoadExcels, LoadDefineExcels, LoadDefineExcel, LoadDataExcels, LoadDataExcel, LoadEnumData, GenerateCsharpCodes, GenerateProtoCode, GenerateJsonDatas, GenerateSchs, PackRefsBinary, PackRefsBinaryServer, PackSchs, PackSchsServer, Clear, CReferenceEnumData

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

### `S3Manager.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/S3Manager.cs`
**Class**: CS3Manager
**NS**: PNIX.Engine.Utility
**Methods**: Initialize, UploadData, UploadDataAsync, UploadFile, UploadFileAsync, DownloadFile, DownloadData, GetList, DeleteFile, DeleteFileAsync

## `ScriptTools/Editor/UILayoutBuilder/`

### `UIElementFactory.cs`
Path: `ScriptTools/Editor/UILayoutBuilder/UIElementFactory.cs`
**Class**: UIElementFactory
**NS**: ProjectAegis.EditorTools.UILayoutBuilder
**Methods**: SetDefaultFont, SetDefaultTMPFont, SetDefaultSprite, CreateUIElement, CreatePanel, CreateText, CreateTMPText, CreateButton, CreateTMPButton, CreateImage, CreateRawImage, CreateInputField, CreateTMPInputField, CreateToggle, CreateTMPToggle, CreateSlider, CreateDropdown, CreateTMPDropdown, CreateScrollView, SetupLayoutGroup, AddLayoutElement, SetupRectTransform, SetAnchorPreset, ParseTextAnchor, ParseFontStyle (+ 2 more)

## `ScriptTools/LevelTools/`

### `HeatmapSimulationManager.cs`
Path: `ScriptTools/LevelTools/HeatmapSimulationManager.cs`
**Class**: HeatmapSimulationManager
**NS**: ProjectAegis.NetPlay
**Methods**: Awake, Start, Update, OnDestroy, FindSpawnPoints, StartSimulation, StopSimulation, SimulationLoop, StartNewMatch, RespawnAllAI, ScanAndSubscribeCharacters, SubscribeToCharacter, UnsubscribeAllCharacters, UpdateAliveCount, OnCharacterDeath, OnCharacterFired, GetProgressText


