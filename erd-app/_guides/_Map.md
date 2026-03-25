# Map System Code Guide
> Auto-generated: 2026-02-25 13:31 | 103 files

## `NetworkClient/NetPlay/AI/`

### `AIWorldActionComponent.cs`
Path: `NetworkClient/NetPlay/AI/AIWorldActionComponent.cs`
**Class**: AIWorldActionComponent, AIWorldActionComponent_Editor
**NS**: ProjectAegis.NetPlay
**Methods**: OnDrawGizmos, OnInspectorGUI

## `NetworkClient/NetPlay/AI/Actions/`

### `AIActionSelectWorldActionPoint.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionSelectWorldActionPoint.cs`
**Class**: AIActionSelectWorldActionPoint
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, Update, AIActionSelectWorldActionPoint

## `NetworkClient/NetPlay/Character/Skill/ActionNode/Conditional/`

### `ConditionEnergyStage.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Conditional/ConditionEnergyStage.cs`
**Class**: ConditionEnergyStage
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: CheckCondition, ConditionEnergyStage

## `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/`

### `ExecuteLaunchProjectile.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteLaunchProjectile.cs`
**Class**: ExecuteLaunchProjectile, Setting
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, GetProjectileStartPosition, GetProjectileDirection, TryGetThrowingDirection, TryCalculateThrowVelocity, ExecuteLaunchProjectile

## `NetworkClient/NetPlay/Character/Skill/Summon/`

### `SmokeArea.cs`
Path: `NetworkClient/NetPlay/Character/Skill/Summon/SmokeArea.cs`
**Class**: SmokeArea
**NS**: ProjectAegis.NetPlay

## `NetworkClient/NetPlay/Equipment/Weapon/Bullet/`

### `Projectile.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Bullet/Projectile.cs`
**Class**: Projectile, WeaponData, ProjectileResultData
**NS**: ProjectAegis.NetPlay
**Methods**: Awake, OnDestroy, AddSyncValueOnChanged, RemoveSyncValueOnChanged, OnChangedOwnerObjectID, OnChangedVelocity, GetIgnoredEntities, AddIgnoredEntity, IsIgnoredEntity, Init, LoadGameData, InitProjectileData, GetShooterRoot, OnStartServer, OnStartClient, InitCollider, InitComponent, CheckNInitOwner, Update, FixedUpdate, Launch, CreateDamageData, Observers_CheckSpawnHitEffect, Observers_CheckSpawnLifeEndEffect, DespawnProjectile (+ 26 more)

## `NetworkClient/NetPlay/Equipment/Weapon/Bullet/Movement/`

### `ProjectileMovement.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Bullet/Movement/ProjectileMovement.cs`
**Class**: ProjectileMovement
**NS**: ProjectAegis.NetPlay
**Methods**: Initialize, Execute, SetVelocity, OnImpact, RecalcVelocity, OnCollisionEnter, OnTriggerEnter

### `ProjectileMovementBallistic.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Bullet/Movement/ProjectileMovementBallistic.cs`
**Class**: ProjectileMovementBallistic

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

## `NetworkClient/NetPlay/Stat/`

### `StatMapper.cs`
Path: `NetworkClient/NetPlay/Stat/StatMapper.cs`
**Class**: StatMapper
**NS**: ProjectAegis.NetPlay
**Methods**: From, TryMapFieldNameToEStatType, SnakeToPascal, IsNumeric, ConvertToInt

## `NetworkDev/`

### `TestLoadScene.cs`
Path: `NetworkDev/TestLoadScene.cs`
**Class**: TestLoadScene
**Methods**: LoadScene, Update, OnClientChangeMap, OnDestroy

### `TestLocalDedi_SceneLoader.cs`
Path: `NetworkDev/TestLocalDedi_SceneLoader.cs`
**Class**: TestLocalDedi_SceneLoader
**Methods**: SetOfflineScene, GetOfflineScene, SetOnlineScene, GetOnlineScene, OnEnable, StartSceneLoad, OnDestroy, Initialize, Deinitialize, SceneManager_OnLoadEnd, ServerManager_OnServerConnectionState, ClientManager_OnClientConnectionState, ServerManager_OnAuthenticationResult, LoadOfflineScene, UnloadOfflineScene, GetSceneName

## `NetworkDev/03.ReferenceManager/02.ReferenceTable/`

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

## `NetworkDev/DedicateLoadManager/`

### `DedicateLoadManager_MapObject.cs`
Path: `NetworkDev/DedicateLoadManager/DedicateLoadManager_MapObject.cs`
**Class**: NetworkManager_Aegis
**NS**: FishNet.Managing
**Methods**: LoadMapObject, UpdateMapObject

### `DedicateLoadManager_Scene.cs`
Path: `NetworkDev/DedicateLoadManager/DedicateLoadManager_Scene.cs`
**Class**: NetworkManager_Aegis
**NS**: FishNet.Managing
**Methods**: Initialized_Scene_Client, Initialized_Scene_Server, LoadScene, UpdateScene, IsUnLoadSuccess, UnLoadScene, ChangeMap, Update

## `ReferenceTable/`

### `RefMapInfo.cs`
Path: `ReferenceTable/RefMapInfo.cs`
**Class**: CRefMapInfo, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefMapInfo, RegisterRefMapInfoBinary, FindRefMapInfo, GetRefMapInfos

### `RefMapObject.cs`
Path: `ReferenceTable/RefMapObject.cs`
**Class**: CRefMapObject, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefMapObject, RegisterRefMapObjectBinary, FindRefMapObject, GetRefMapObjects

### `RefMapObjectStat.cs`
Path: `ReferenceTable/RefMapObjectStat.cs`
**Class**: CRefMapObjectStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefMapObjectStat, RegisterRefMapObjectStatBinary, FindRefMapObjectStat, GetRefMapObjectStats

### `RefProjectile.cs`
Path: `ReferenceTable/RefProjectile.cs`
**Class**: CRefProjectile, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefProjectile, RegisterRefProjectileBinary, FindRefProjectile, GetRefProjectiles

### `RefProjectileSkin.cs`
Path: `ReferenceTable/RefProjectileSkin.cs`
**Class**: CRefProjectileSkin, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefProjectileSkin, RegisterRefProjectileSkinBinary, FindRefProjectileSkin, GetRefProjectileSkins

## `ScriptDev/Contents/00.SplashScene/`

### `CSceneSplash.cs`
Path: `ScriptDev/Contents/00.SplashScene/CSceneSplash.cs`
**Class**: CSceneSplash
**NS**: ProjectAegis.Contents
**Methods**: IsLoaded, Init, DefaultInit, Update, LateUpdate, Release

## `ScriptDev/Contents/01.LoadScene/`

### `CSceneLoad.cs`
Path: `ScriptDev/Contents/01.LoadScene/CSceneLoad.cs`
**Class**: CSceneLoad
**NS**: ProjectAegis.Contents
**Methods**: IsLoaded, Init, Update, LateUpdate, Release

## `ScriptDev/Contents/02.TitleScene/`

### `CSceneTitle.cs`
Path: `ScriptDev/Contents/02.TitleScene/CSceneTitle.cs`
**Class**: CSceneTitle, eServerConnectState
**NS**: ProjectAegis.Contents
**Methods**: Load, LoadResourceAsync, IsLoaded, Init, Update, LateUpdate, Release, GetFlowUIType, GameServerConnect, OnMatchCompleteNotifyEvent, OnGS2C_PartyMembersNotify

## `ScriptDev/Contents/03.OutgameScene/`

### `CSceneOutgame.cs`
Path: `ScriptDev/Contents/03.OutgameScene/CSceneOutgame.cs`
**Class**: CSceneOutgame
**NS**: ProjectAegis.Contents
**Methods**: IsLoaded, Init, DefaultInit, Update, LateUpdate, Release, GetFlowUIType, IsLoadingScene, OnGS2C_MatchCompletedNotify

## `ScriptDev/Contents/04.IngameScene/`

### `CDedicateConnector.cs`
Path: `ScriptDev/Contents/04.IngameScene/CDedicateConnector.cs`
**Class**: CDedicateConnection
**Methods**: NotifyMatchEnded, ConnectionClient, CheckConnect, NotifyNetworkChanged, RequestReconnect, ReconnectCoroutine, Cleanup, OnClientConnectionStateChanged, TryReconnect

### `CSceneIngame.cs`
Path: `ScriptDev/Contents/04.IngameScene/CSceneIngame.cs`
**Class**: CSceneIngame
**NS**: ProjectAegis.Contents
**Methods**: Load, IsLoaded, Init, OnClientChangeMap, Update, LateUpdate, Release, GetFlowUIType, IsLoadingScene, OnNetworkReachabilityChanged, OnReconnecting, OnReconnectAttempt, OnReconnected, OnConnectionFailed, StartReconnectCoroutine, StopReconnectCoroutine

## `ScriptDev/Data/`

### `CProjectileSetting.cs`
Path: `ScriptDev/Data/CProjectileSetting.cs`
**Class**: EResponseEffect, EResponseTrajectory, ELifeEndEffect, ProjectileSetting, ProjectileSettingEditor
**Methods**: copySetting, Equals, GetHashCode, OnInspectorGUI

## `ScriptDev/Framework/Scene/`

### `CFrameWorkManager.cs`
Path: `ScriptDev/Framework/Scene/CFrameWorkManager.cs`
**Class**: eFrameWork, CFrameWorkManager, eChangeProcess
**NS**: ProjectAegis.Framework
**Methods**: ToLogString, Init, ChangeFrameWork, CheckChangableFrameWork, Update, ChangeScene, OnFlowUIHided, ProcessPrepare, ProcessEmpty, ProcessRelease, ProcessLoadScene, ProcessLoadSceneAsync, ProcessLoad, ProcessLoadEnd, ProcessInit, ProcessUpdate, LateUpdate, GetCurrentFrameWork, GetOldFrameWork, Release, CreateSceneClass, ShouldCollectGarbage

### `CSceneBase.cs`
Path: `ScriptDev/Framework/Scene/CSceneBase.cs`
**Class**: ISceneFlow, ISceneFlowUI, CSceneBase
**NS**: ProjectAegis.Framework
**Methods**: Load, IsLoaded, Init, Update, LateUpdate, Release, GetFlowUIType, IsLoadingScene, HideAllFlowUI

## `ScriptDev/UI/InGame/`

### `CUIIngamePopupMap.cs`
Path: `ScriptDev/UI/InGame/CUIIngamePopupMap.cs`
**Class**: CUIIngamePopupMap
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, PrepareContent, OnButtonClose

## `ScriptDev/UI/Lobby/`

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

### `LobbyMapUIController.cs`
Path: `ScriptDev/UI/Lobby/LobbyMapUIController.cs`
**Class**: LobbyMapUIController
**NS**: ProjectAegis.UI
**Methods**: Initialize, RefreshUI, SyncWithServer, OnButtonClickMapSelectPrev, OnButtonClickMapSelectNext, OnButtonClickModeSelect, UpdateModeSelect, UpdateMapUI, Dispose

## `ScriptDev/UI/Map/`

### `CUIAutoPingMessage.cs`
Path: `ScriptDev/UI/Map/CUIAutoPingMessage.cs`
**Class**: CUIAutoPingMessage, PingMessageEntry
**NS**: ProjectAegis.UI
**Methods**: Awake, InitializePool, Update, AddMessage, AddMessageInternal, GetFromPool, GetActiveMessageCount, GetFirstNonFadingIndex, FadeOutAndReturn, SlideAllMessagesUp, KillEntryAnimations, ReturnToPoolImmediate, ClearAllMessages, GetCharacterName, OnDestroy

### `CUILargeMap.cs`
Path: `ScriptDev/UI/Map/CUILargeMap.cs`
**Class**: CUILargeMap
**NS**: ProjectAegis.UI
**Methods**: Awake, InitializeComponents, Init, InitPingTypeButtons, OnEnable, OnPingTypeButtonClicked, SelectPingType, IndexToPingType, OnMapClicked, OnPointerClick, OnClickedClose, PassClickToUnderlyingUI, SetCloseCallback

### `CUIMapBase.cs`
Path: `ScriptDev/UI/Map/CUIMapBase.cs`
**Class**: CUIMapBase
**NS**: ProjectAegis.UI
**Methods**: Awake, TryLoadMapImage, Init, CalculateMapBounds, SetMapInfo, LoadMapImage, GetMapTexture, SetMapTexture, SetDirectMapSettings, SetPlayer, SetPlayerInternal, Update, UpdatePlayer, GetMapWorldSize, GetMapCenter, GetMapOffset, GetCurrentMapInfo, SetMapSettings, GetMapImageSize, GetPingIconInverseScale, AddPing, RemovePing, ClearAllPings, ClearPingsByOwner, UpdatePingPositions (+ 3 more)

### `CUIMapManager.cs`
Path: `ScriptDev/UI/Map/CUIMapManager.cs`
**Class**: CUIMapManager, HitBufferComparer
**NS**: ProjectAegis.UI
**Methods**: GetMinimapTexture, InitializeInst, Update, RegisterMinimap, RegisterOverlayMap, RegisterLargeMap, SetMapInfoById, SetMapInfo, GetCurrentMapInfo, SetDirectMapSettings, SetPlayer, SyncMapInfoFromMinimap, SyncTextureFromMinimap, CycleMapMode, ToggleOverlayMap, OpenLargeMap, CloseLargeMap, ToggleLargeMap, OnMinimapClicked, AddPing, ClearAllPings, ClearPingsByOwner, SyncPingsToMap, UpdatePortraitCharacters, IsValidTarget (+ 1 more)

### `CUIMinimap.cs`
Path: `ScriptDev/UI/Map/CUIMinimap.cs`
**Class**: CUIMinimap
**NS**: ProjectAegis.UI
**Methods**: GetPingIconInverseScale, Awake, CalculateMapBounds, AdjustMapScaleToWorldRange, SetMapScale, Init, UpdatePlayer, SetMapToPlayerPosition, WorldToMapUIPosition, OnClickedMinimap, OnClickedOverlay, SetClickCallback, SetOverlayCallback

### `CUIOverlayMap.cs`
Path: `ScriptDev/UI/Map/CUIOverlayMap.cs`
**Class**: CUIOverlayMap
**NS**: ProjectAegis.UI
**Methods**: Awake, OnEnable, InitializeComponents, Init, UpdatePlayer

### `CUIPingManager.cs`
Path: `ScriptDev/UI/Map/CUIPingManager.cs`
**Class**: ECanPingResult, CUIPingManager, PingData
**NS**: ProjectAegis.UI
**Methods**: IsInfinite, InitializeInst, RegisterNavigation, RegisterAutoPingMessage, Update, TryCreatePingAtCrosshair, CreatePingAtPosition, CreateAutoPing, AddAllyPing, AddPingNavigation, RemovePingNavigationAt, ClearPingNavigationsByOwner, ClearAllPingNavigations, ClearAllPings, GetActivePings, CreateManualPing, ClearManualPings, RemovePingAt, CanPing, TryGetCrosshairWorldPosition, GetLocalCharacterId, GetLocalOwnerId, GetLocalPlayerName, TryShowPingMessage, TryPlayPingSound (+ 6 more)

### `CUIPingNavigation.cs`
Path: `ScriptDev/UI/Map/CUIPingNavigation.cs`
**Class**: CUIPingNavigation
**NS**: ProjectAegis.UI
**Methods**: Init, SetCharacterPortrait, Hide, Update, UpdateNavigation, UpdateOnScreenPosition, UpdateOffScreenPosition, ClampToScreenEdge, SetPingIcon, SetMaskVisibility, UpdateDistanceText

### `CUIPingWheel.cs`
Path: `ScriptDev/UI/Map/CUIPingWheel.cs`
**Class**: CUIPingWheel
**NS**: ProjectAegis.UI
**Methods**: Init, Update, OnPointerDown, OnPointerUp, OnDrag, ShowWheel, HideWheel, OpenWheel, CloseWheel, UpdateWheelSelection, UpdateSelection, SetSelection, SetButtonHighlight, ResetAllButtons, SelectPing, IndexToPingType

### `MapPingIcon.cs`
Path: `ScriptDev/UI/Map/MapPingIcon.cs`
**Class**: MapPingIcon
**NS**: ProjectAegis.UI
**Methods**: Init, UpdateWidgets, UpdatePosition, SetPingIcon, SetMaskVisibility, SetCharacterPortrait

### `MapPortraitIcon.cs`
Path: `ScriptDev/UI/Map/MapPortraitIcon.cs`
**Class**: MapPortraitIcon
**NS**: ProjectAegis.UI
**Methods**: UpdatePortraitIcon

### `MapUtils.cs`
Path: `ScriptDev/UI/Map/MapUtils.cs`
**Class**: PingType, MapUtils
**NS**: ProjectAegis.UI
**Methods**: IsValidPingType, IsNavigationExcluded, GetMinimapIconByCharacterId, GetPingColor, GetPingSpriteName, WorldToMapPosition, MapToWorldPosition, WorldToNormalizedPosition, NormalizedToWorldPosition, WorldToMapEulerAngles, WorldToMapRotationZ, NormalizeAngle, Distance2D, FormatDistance

## `ScriptDev/UI/UIFramework/Layout/`

### `CanvasSafeAreaHelper.cs`
Path: `ScriptDev/UI/UIFramework/Layout/CanvasSafeAreaHelper.cs`
**Class**: EUICorner, EUIEdge, EUIEdgeMask, CanvasSafeAreaHelper, RectExtention
**NS**: ProjectAegis.UI.Layouts
**Methods**: OnCanvasSafeAreaRebuildedEventHandler, UpdateChangedEditorDeviceEnv, Start, OnEnable, OnRectTransformDimensionsChange, LateUpdate, InvalidateSafeCorners, GetSafeWorldCorner, GetWorldCorner, SafePaddingSize, OnDrawGizmosSelected, ToEdgeMask, GetPoint, GetValdiateEdgeMask

### `UICanvasSafeArea.cs`
Path: `ScriptDev/UI/UIFramework/Layout/UICanvasSafeArea.cs`
**Class**: UICanvasSafeArea
**NS**: ProjectAegis.UI.Layouts
**Methods**: ResetAnchor, UpdateLayoutInternal

## `ScriptDev/Utilities/StateTag/`

### `StateTagMap.cs`
Path: `ScriptDev/Utilities/StateTag/StateTagMap.cs`
**Class**: StateTagMap
**NS**: ProjectAegis.Utility
**Methods**: AddTag, RemoveTag, Clear, ClearAll, HasTag, GetTagCount, SetTagValue, GetAllKeys

## `ScriptTools/`

### `AdditiveSceneCollection.cs`
Path: `ScriptTools/AdditiveSceneCollection.cs`
**Class**: AdditiveSceneCollection, SceneRef

## `ScriptTools/Editor/`

### `SceneDistanceMeasurement.cs`
Path: `ScriptTools/Editor/SceneDistanceMeasurement.cs`
**Class**: SceneDistanceMeasurement
**NS**: ProjectAegis.EditorTools
**Methods**: ToggleMeasurementTool, ShowWindow, OnGUI, OnSceneGUI, AddMeasurementPoint, CreateNewRoute, AddPointToRoute, StartNewRoute, UpdateAllRoutesSpeed, OnDestroy, InitializeOnLoad, OnSelectionChanged

## `ScriptTools/Editor/MapTool/`

### `MapToolFileHelper.cs`
Path: `ScriptTools/Editor/MapTool/MapToolFileHelper.cs`
**Class**: MapToolFileHelper, MapToolBackupKind
**Methods**: SaveMapExcel, BackupIfExists, GetBackupCount, TrimExcessBackups

### `MapToolSettings.cs`
Path: `ScriptTools/Editor/MapTool/MapToolSettings.cs`
**Class**: SerializablePair, MapToolSettings
**Methods**: Find, GetIgnoreColumnNamesSet, GetColumnNamePrefixReplaceMap

### `MapToolUtil.cs`
Path: `ScriptTools/Editor/MapTool/MapToolUtil.cs`
**Class**: MapToolUtil
**Methods**: InitializeStatics, GetOrCreateHMPSystem, GatherDefaultDescriptionComponents, GatherDefaultDescriptionComponentsInternal, EnsureValidDefaultPrefabs

## `ScriptTools/Editor/MapTool/EditorWindows/`

### `MapToolEditor.Control.cs`
Path: `ScriptTools/Editor/MapTool/EditorWindows/MapToolEditor.Control.cs`
**Class**: MapToolEditor
**Methods**: InitControlUI, ReleaseControlUI, UpdateControlUI, OnControlHMPToggleClicked, OnControlModelLoadClicked, OnControlModelUnloadClicked, OnControlRotationFieldChanged, OnControlRotationResetClicked, OnControlSinkFieldChanged, OnControlSinkResetClicked, OnControlPositionSnapFieldChanged, OnControlPositionSnapResetClicked, OnControlRotationSnapFieldChanged, OnControlRotationSnapResetClicked, RefreshControlUI

### `MapToolEditor.cs`
Path: `ScriptTools/Editor/MapTool/EditorWindows/MapToolEditor.cs`
**Class**: MapToolEditor
**Methods**: ShowWindow, OnEnable, OnDisable, OnDestroy, OnUpdate, OnSceneOpened, OnSceneSaving, OnSceneSaved, ClearHMPs, FindHMPSystem

### `MapToolEditor.Excel.cs`
Path: `ScriptTools/Editor/MapTool/EditorWindows/MapToolEditor.Excel.cs`
**Class**: MapToolEditor
**Methods**: InitExcelUI, ReleaseExcelUI, UpdateExcelUI, OnExcelLoadClicked, OnExcelToSceneClicked, OnExcelFromSceneClicked, OnExcelToSceneAllClicked, OnExcelFromSceneAllClicked

### `MapToolEditor.PrefabSearch.cs`
Path: `ScriptTools/Editor/MapTool/EditorWindows/MapToolEditor.PrefabSearch.cs`
**Class**: MapToolEditor, ListItemSource
**Methods**: InitPrefabSearchUI, ReleasePrefabSearchUI, UpdatePrefabSearchUI, MakePrefabSearchListItem, BindPrefabSearchListItem, OnPrefabSearchFieldChanged, OnPrefabSearchListItemSelectClicked, OnPrefabSearchListItemSpawnClicked, RefreshPrefabList

### `MapToolEditor.Root.cs`
Path: `ScriptTools/Editor/MapTool/EditorWindows/MapToolEditor.Root.cs`
**Class**: MapToolEditor
**Methods**: InitRootUI, ReleaseRootUI, UpdateRootUI, OnTestClicked, OnRefreshWindowClicked, OnSettingsClicked

## `ScriptTools/Editor/MapTool/Excel/`

### `MapObjectDescExcelIO.cs`
Path: `ScriptTools/Editor/MapTool/Excel/MapObjectDescExcelIO.cs`
**Class**: ExcelListMaxAttribute, MapObjectDescExcelIO, MapObjectDescSheet, ExcelSchema, PathSegment, ColumnDef, ValueTypeFrame, CollectionValueTypeFrame, parse
**Methods**: Init, Write, WriteAll, Read, ReadAll, ReadHeader, BuildSchema, ReadTable, EnsureHeader, ValidateHeader, EnsureTable, AppendHeader, TryGetRowRange, ReadCell, WriteCell, OpenPackage, GetOrCreateWorksheet, EnsureDirectory, GetHeaderEndColumn, IsCommentHeader, MakeMultiKey, Build, BuildRecursive, BuildHeaderName, GetListMax (+ 18 more)

### `MapToolExcelHelper.cs`
Path: `ScriptTools/Editor/MapTool/Excel/MapToolExcelHelper.cs`
**Class**: MapToolExcelHelper
**Methods**: SelectExcel, Export, Import, ExportAll, ImportAll, ImportByScene

## `ScriptTools/Editor/WeaponTools/Effect/`

### `EffectTestWindow.SceneBuilder.cs`
Path: `ScriptTools/Editor/WeaponTools/Effect/EffectTestWindow.SceneBuilder.cs`
**Class**: EffectTestWindow
**NS**: Aegis.EditorTools
**Methods**: OpenOrCreateTestScene, CreateNewScene, EnsureEnvironmentSetup, SetupManagers

## `ScriptTools/Editor/x64/Bakery/scripts/`

### `ftExtendLightmapParameters.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftExtendLightmapParameters.cs`
**Class**: ftExtendLightmapParameters
**Methods**: OnInspectorGUI

### `ftLightmappedPrefabInspector.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftLightmappedPrefabInspector.cs`
**Class**: ftLightmappedPrefabInspector
**Methods**: FindPrefabStorage, OnInspectorGUI

### `ftLightmapsStorageInspector.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftLightmapsStorageInspector.cs`
**Class**: ftLightmapsStorageInspector
**Methods**: OnInspectorGUI

### `ftRenderLightmap.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftRenderLightmap.cs`
**Class**: ftRenderLightmap, RenderMode, RenderDirMode, SettingsMode, LightProbeMode, Convex, LightBounds, SavedLight, AdjustUVMode, ProbeEventArgs, VolumeEventArgs, Int2, BlendVertex, BlendVertexData, name, ComposeInstructionFiles
**Methods**: simpleProgressBarShow, simpleProgressBarCancelled, simpleProgressBarEnd, halffloat2vb, IsProcessFinished, GetProcessReturnValueAndClose, StopProcess, SetForegroundWindow, GetWindowText, GetClassName, AreSettingsEnabled, PatchPath, UnloadScenes, TestSystemSpecs, GetTime, GetTimeMs, LoadScenes, ProcessCoroutine, RenderReflectionProbesButton, LightProbesSupported, RenderLightProbesButton, RenderAPVButton, TestNeedsBenchmark, RenderButton, ProgressBarEnd (+ 35 more)

### `ftSceneView.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftSceneView.cs`
**Class**: ftSceneView
**Methods**: Init, Atlas, ApplyNewProperties, ToggleChecker, ToggleProjMode, RefreshChecker

## `ScriptTools/LevelTools/`

### `CaptureZone.cs`
Path: `ScriptTools/LevelTools/CaptureZone.cs`
**Class**: CaptureZone
**NS**: ProjectAegis.Gameplay
**Methods**: Awake, OnDestroy, OnTriggerEnter, OnTriggerExit, OnPlayerEnterZone, OnPlayerExitZone, SetTeam, UpdateMaterial, TransitionMaterials, IsInLayerMask, GetCurrentTeam, GetPlayerCount, OnDrawGizmos

### `HeatmapDataCollector.cs`
Path: `ScriptTools/LevelTools/HeatmapDataCollector.cs`
**Class**: HeatmapDataCollector, SimulationSession, SessionSummary, MatchData, CombatEvent
**NS**: ProjectAegis.NetPlay
**Methods**: StartNewSession, OnMatchStart, OnMatchEnd, RecordFireStart, RecordDeath, SaveAllData, SanitizeFileName, OpenLastSavedFile, OpenSaveFolder, GetSessionStats

### `HeatmapSimulationManager.cs`
Path: `ScriptTools/LevelTools/HeatmapSimulationManager.cs`
**Class**: HeatmapSimulationManager
**NS**: ProjectAegis.NetPlay
**Methods**: Awake, Start, Update, OnDestroy, FindSpawnPoints, StartSimulation, StopSimulation, SimulationLoop, StartNewMatch, RespawnAllAI, ScanAndSubscribeCharacters, SubscribeToCharacter, UnsubscribeAllCharacters, UpdateAliveCount, OnCharacterDeath, OnCharacterFired, GetProgressText

## `ScriptTools/MinimapTool/Scripts/`

### `DataSheet.cs`
Path: `ScriptTools/MinimapTool/Scripts/DataSheet.cs`
**Class**: RefDataStringSize, DataSheet, DataFile
**Methods**: CreateDataSheet, LoadDataSheet, ReadTableData, SetDataFromInstance, CreateFile, CreateSheet, LoadDataSheetAll, LoadDataInstance, RefDataStringSize

### `MinimapExporter.cs`
Path: `ScriptTools/MinimapTool/Scripts/MinimapExporter.cs`
**Class**: MinimapExporter, MinimapData, MinimapExporterEditor
**Methods**: ExportScenes, ParseFromScene

### `MinimapTool.cs`
Path: `ScriptTools/MinimapTool/Scripts/MinimapTool.cs`
**Class**: MinimapTool, LayerGroup
**Methods**: Start, NameToLayer, ConvertModelNormal, GenerateColliderMeshMinimap, ContainLayer, IsFloorCollider, GenerateMinimapPipe_4, GetCamera, GenerateMinimapPipe_5, GenerateMinimapPipe_3, GenerateMinimapPipe_1, GenerateMinimapPipe_2, SetCameraPosition, Init, CombineRenderTextures, GenerateNavMeshMinimap, MeshNormalAverage, RenderLayer, ToTexture, SaveFile, Clear, CreateMeshObject, GenerateBoxMesh, GenerateBoxToPlaneMesh, GenerateSphereMesh (+ 1 more)

### `MinimapToolEditor.cs`
Path: `ScriptTools/MinimapTool/Scripts/MinimapToolEditor.cs`
**Class**: MinimapToolEditor
**Methods**: OnInspectorGUI


