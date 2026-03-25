# Data System Code Guide
> Auto-generated: 2026-02-25 13:31 | 313 files

## `Aegis.GameServer/DB/EFCore/`

### `DataModel.cs`
Path: `Aegis.GameServer/DB/EFCore/DataModel.cs`
**Class**: PlayerDb
**NS**: Aegis.GameServer
**Methods**: PlayerDb

## `Aegis.ServerFramework/Configuration/`

### `ConfigManager.cs`
Path: `Aegis.ServerFramework/Configuration/ConfigManager.cs`
**Class**: ConfigManager
**NS**: Aegis.ServerFramework
**Methods**: LoadConfig

### `ServerConfig.cs`
Path: `Aegis.ServerFramework/Configuration/ServerConfig.cs`
**Class**: ServerConfig, GameLiftConfig
**NS**: Aegis.ServerFramework
**Methods**: IsValid, IsSqsValid

## `NetworkClient/NetPlay/AI/`

### `AIData.cs`
Path: `NetworkClient/NetPlay/AI/AIData.cs`
**Class**: EAIBrainVersion, EAIBrainMode, EAIActionKind, EAIActionPresetKind, EAIActionResult, EAIBotMainState, EAITargetKind, EAIGrade, EAIMovementType, EAIMoveDirectionKind, EOverlapStepMain, EOverlapStepSub, EDirection, EMonSpreaded_History, EAIOverlapStep, EOverlapExceptionKind, EAITendencyType, EAIBywayType, EAIPatrolKind, EAIRotateBody, EAIMoveAttrib, EAIReloadKind, EAIGoalRotateGrade, EAIActionEndKind, EAIStandMode, EAITryStep, EAIReasonForAction, EAIWorldActionKind, EAIWorldActionAreaType, EAIDamageKind, EAISkillKind, HitResultM, CForbidMoveInfo, OverlapDecideData, SpreadedTargetData, MoveCheckData, AIActionConfig, AIParameter, AIData, AIBrainData, AIBrainPersonality, AIBrainEnvironment, CombatEventRecordInfo
**NS**: ProjectAegis.NetPlay
**Methods**: Clear, Set, GetAccumHitCount, GetAccumHpChangeRate, GetEnemyApproachDistance, HitResultM, AIParameter

## `NetworkClient/NetPlay/Character/FSM/`

### `CharFSMDefine.cs`
Path: `NetworkClient/NetPlay/Character/FSM/CharFSMDefine.cs`
**Class**: EEightDirection, EDamageInvokeSource, EMoveCasterDir
**NS**: ProjectAegis.NetPlay.FSM

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

## `NetworkClient/NetPlay/Equipment/Weapon/Core/`

### `WeaponData.cs`
Path: `NetworkClient/NetPlay/Equipment/Weapon/Core/WeaponData.cs`
**Class**: GunConfiguration
**NS**: ProjectAegis.NetPlay

## `NetworkClient/NetPlay/GameMode/`

### `PlayerReplicationData.cs`
Path: `NetworkClient/NetPlay/GameMode/PlayerReplicationData.cs`
**Class**: RepPlayerInfo, RepPlayStatus, RepTotalScore, RepRoundScore, RepTeamSynergyLevel, RepReward
**NS**: ProjectAegis.NetPlay
**Methods**: Clone, ResetLevel, IncreaseLevel

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

## `NetworkClient/NetPlay/Interaction/Test/`

### `DynamicInteractableTest.cs`
Path: `NetworkClient/NetPlay/Interaction/Test/DynamicInteractableTest.cs`
**Class**: DynamicInteractableTest
**NS**: ProjectAegis.NetPlay.Interaction.Test
**Methods**: Update, MakeInteractable, RemoveInteractable, OnGUI

## `NetworkClient/NetPlay/MapObject/`

### `MapObjectDefine.cs`
Path: `NetworkClient/NetPlay/MapObject/MapObjectDefine.cs`
**Class**: EMapObjectNetworkObjectID, EMapObjectTriggerConditionType, EMapObjectTriggerFunctionType, EMapObjectTriggerTarget, EComparisonOperator, EMapObjectTriggerColliderShape
**NS**: ProjectAegis.NetPlay

## `NetworkDev/03.ReferenceManager/`

### `ReferenceDataExetention.cs`
Path: `NetworkDev/03.ReferenceManager/ReferenceDataExetention.cs`
**Class**: ReferenceDataExetention
**NS**: Aegis.ReferenceTable
**Methods**: GetCommonConfigFloatValue, GetCommonConfigIntValue, GetRefNetworkObject, GetRefModelIDByWeapon, GetRefModelByWeapon

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

## `ReferenceTable/`

### `RefAccountLevel.cs`
Path: `ReferenceTable/RefAccountLevel.cs`
**Class**: CRefAccountLevel, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefAccountLevel, RegisterRefAccountLevelBinary, FindRefAccountLevel, GetRefAccountLevels

### `RefAchievement.cs`
Path: `ReferenceTable/RefAchievement.cs`
**Class**: CRefAchievement, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefAchievement, RegisterRefAchievementBinary, FindRefAchievement, GetRefAchievements

### `RefAchievementLevel.cs`
Path: `ReferenceTable/RefAchievementLevel.cs`
**Class**: CRefAchievementLevel, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefAchievementLevel, RegisterRefAchievementLevelBinary, FindRefAchievementLevel, GetRefAchievementLevels

### `RefArmor.cs`
Path: `ReferenceTable/RefArmor.cs`
**Class**: CRefArmor, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefArmor, RegisterRefArmorBinary, FindRefArmor, GetRefArmors

### `RefBattleModeInfo.cs`
Path: `ReferenceTable/RefBattleModeInfo.cs`
**Class**: CRefBattleModeInfo, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefBattleModeInfo, RegisterRefBattleModeInfoBinary, FindRefBattleModeInfo, GetRefBattleModeInfos

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

### `RefCard.cs`
Path: `ReferenceTable/RefCard.cs`
**Class**: CRefCard, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCard, RegisterRefCardBinary, FindRefCard, GetRefCards

### `RefCardPreset.cs`
Path: `ReferenceTable/RefCardPreset.cs`
**Class**: CRefCardPreset, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCardPreset, RegisterRefCardPresetBinary, FindRefCardPreset, GetRefCardPresets

### `RefCardPresetEnhance.cs`
Path: `ReferenceTable/RefCardPresetEnhance.cs`
**Class**: CRefCardPresetEnhance, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCardPresetEnhance, RegisterRefCardPresetEnhanceBinary, FindRefCardPresetEnhance, GetRefCardPresetEnhances

### `RefCardPresetTactical.cs`
Path: `ReferenceTable/RefCardPresetTactical.cs`
**Class**: CRefCardPresetTactical, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCardPresetTactical, RegisterRefCardPresetTacticalBinary, FindRefCardPresetTactical, GetRefCardPresetTacticals

### `RefCardSynergy.cs`
Path: `ReferenceTable/RefCardSynergy.cs`
**Class**: CRefCardSynergy, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCardSynergy, RegisterRefCardSynergyBinary, FindRefCardSynergy, GetRefCardSynergys

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

### `RefClanPermissionGroup.cs`
Path: `ReferenceTable/RefClanPermissionGroup.cs`
**Class**: CRefClanPermissionGroup, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefClanPermissionGroup, RegisterRefClanPermissionGroupBinary, FindRefClanPermissionGroup, GetRefClanPermissionGroups

### `RefClanRole.cs`
Path: `ReferenceTable/RefClanRole.cs`
**Class**: CRefClanRole, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefClanRole, RegisterRefClanRoleBinary, FindRefClanRole, GetRefClanRoles

### `RefCommonConfig.cs`
Path: `ReferenceTable/RefCommonConfig.cs`
**Class**: CRefCommonConfig, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCommonConfig, RegisterRefCommonConfigBinary, FindRefCommonConfig, GetRefCommonConfigs

### `RefConsumableItem.cs`
Path: `ReferenceTable/RefConsumableItem.cs`
**Class**: CRefConsumableItem, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefConsumableItem, RegisterRefConsumableItemBinary, FindRefConsumableItem, GetRefConsumableItems

### `RefContentUnlock.cs`
Path: `ReferenceTable/RefContentUnlock.cs`
**Class**: CRefContentUnlock, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefContentUnlock, RegisterRefContentUnlockBinary, FindRefContentUnlock, GetRefContentUnlocks

### `RefEffect.cs`
Path: `ReferenceTable/RefEffect.cs`
**Class**: CRefEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefEffect, RegisterRefEffectBinary, FindRefEffect, GetRefEffects

### `RefEnum.cs`
Path: `ReferenceTable/RefEnum.cs`
**Class**: CRefEnum, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefEnum, RegisterRefEnumBinary, FindRefEnum, GetRefEnums

### `RefGear.cs`
Path: `ReferenceTable/RefGear.cs`
**Class**: CRefGear, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefGear, RegisterRefGearBinary, FindRefGear, GetRefGears

### `RefImmune.cs`
Path: `ReferenceTable/RefImmune.cs`
**Class**: CRefImmune, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefImmune, RegisterRefImmuneBinary, FindRefImmune, GetRefImmunes

### `RefInteractable.cs`
Path: `ReferenceTable/RefInteractable.cs`
**Class**: CRefInteractable, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefInteractable, RegisterRefInteractableBinary, FindRefInteractable, GetRefInteractables

### `RefItemDataName.cs`
Path: `ReferenceTable/RefItemDataName.cs`
**Class**: CRefItemDataName, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefItemDataName, RegisterRefItemDataNameBinary, FindRefItemDataName, GetRefItemDataNames

### `RefLobbyUI.cs`
Path: `ReferenceTable/RefLobbyUI.cs`
**Class**: CRefLobbyUI, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefLobbyUI, RegisterRefLobbyUIBinary, FindRefLobbyUI, GetRefLobbyUIs

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

### `RefMark.cs`
Path: `ReferenceTable/RefMark.cs`
**Class**: CRefMark, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefMark, RegisterRefMarkBinary, FindRefMark, GetRefMarks

### `RefMissionSet.cs`
Path: `ReferenceTable/RefMissionSet.cs`
**Class**: CRefMissionSet, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefMissionSet, RegisterRefMissionSetBinary, FindRefMissionSet, GetRefMissionSets

### `RefModel.cs`
Path: `ReferenceTable/RefModel.cs`
**Class**: CRefModel, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefModel, RegisterRefModelBinary, FindRefModel, GetRefModels

### `RefModuleItem.cs`
Path: `ReferenceTable/RefModuleItem.cs`
**Class**: CRefModuleItem, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefModuleItem, RegisterRefModuleItemBinary, FindRefModuleItem, GetRefModuleItems

### `RefNetworkObject.cs`
Path: `ReferenceTable/RefNetworkObject.cs`
**Class**: CRefNetworkObject, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefNetworkObject, RegisterRefNetworkObjectBinary, FindRefNetworkObject, GetRefNetworkObjects

### `RefOption.cs`
Path: `ReferenceTable/RefOption.cs`
**Class**: CRefOption, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefOption, RegisterRefOptionBinary, FindRefOption, GetRefOptions

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

### `RefPerk.cs`
Path: `ReferenceTable/RefPerk.cs`
**Class**: CRefPerk, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefPerk, RegisterRefPerkBinary, FindRefPerk, GetRefPerks

### `RefPerkEffect.cs`
Path: `ReferenceTable/RefPerkEffect.cs`
**Class**: CRefPerkEffect, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefPerkEffect, RegisterRefPerkEffectBinary, FindRefPerkEffect, GetRefPerkEffects

### `RefPing.cs`
Path: `ReferenceTable/RefPing.cs`
**Class**: CRefPing, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefPing, RegisterRefPingBinary, FindRefPing, GetRefPings

### `RefProfileBanner.cs`
Path: `ReferenceTable/RefProfileBanner.cs`
**Class**: CRefProfileBanner, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefProfileBanner, RegisterRefProfileBannerBinary, FindRefProfileBanner, GetRefProfileBanners

### `RefProfileFrame.cs`
Path: `ReferenceTable/RefProfileFrame.cs`
**Class**: CRefProfileFrame, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefProfileFrame, RegisterRefProfileFrameBinary, FindRefProfileFrame, GetRefProfileFrames

### `RefProfileIcon.cs`
Path: `ReferenceTable/RefProfileIcon.cs`
**Class**: CRefProfileIcon, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefProfileIcon, RegisterRefProfileIconBinary, FindRefProfileIcon, GetRefProfileIcons

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

### `RefRanking.cs`
Path: `ReferenceTable/RefRanking.cs`
**Class**: CRefRanking, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefRanking, RegisterRefRankingBinary, FindRefRanking, GetRefRankings

### `RefReward.cs`
Path: `ReferenceTable/RefReward.cs`
**Class**: CRefReward, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefReward, RegisterRefRewardBinary, FindRefReward, GetRefRewards

### `RefSharedEnum.cs`
Path: `ReferenceTable/RefSharedEnum.cs`
**Class**: EAchievementType, EAimAssistTargetType, EAimMode, EAmmoType, EArmorSlot, EAutoFireConditionType, EAutoFireTargetType, EAvailableTag, EBattleType, EBotActionType, EBotCheckPointType, EBotConditionType, EBotMoveDecisionTarget, EBotSkillDecisionCondType, EBotTargetType, EBotType, ECardEffectType, ECardPositionType, ECardSynergyType, ECardType, ECharacterClass, ECharacterRotationMode, ECharacterSkinPart, ECharacterStance, ECharacterType, ECheckCondition, ECheckPoint, ECheckTransType, EClanPermissionType, EClanRoleType, EClearConditionType, EComparisonOp, EConsumableType, EContentType, EContentUnlockType, ECrosshairAimType, ECrosshairSpreadLineType, EDamageType, EElementalType, EEnergyType, EExecuteCheckType, EExecuteChkType, EExecuteOption, EExecuteShapeType, EExecuteTarget, EExecuteTargetCompare, EFaction, EGearClass, EGearRarity, EHitOption, EHitType, EInteractionDetectMode, EInteractionExecutionType, EInteractionFunction, EInteractionType, EItemType, ELevelObjectFunctionType, ELevelObjectTarget, ELogicalOp, ELookDirection, EMapObjectTriggerType, EMissionType, EModuleType, EMovePointType, ENormVec3, EOptionCategory, EOptionContent, EOptionUIType, EPassiveConditionType, EPassiveEffectType, EPassiveType, EPerkType, EPingTrigger, EPromitionType, ERangeType, ERankingType, ESTATISTICS, ESkillArmorType, ESkillCategory, ESkillEffectType, ESkillSetSlot, ESkillType, ESkillUIType, ESkillWeapon, ESkinCharacterType, ESkinResourceParts, ESkinResourceType, ESkinWeaponType, ESpawnPosType, ESpawnPositionType, EStackType, EStatType, EStatusEffectCategory, EStatusEffectCondition, EStatusEffectDescValueType, EStatusEffectFunctionType, ESynergyEffectType, ETierType, ETransCondition, EWarningDisplayType, EWeaponFireDamageType, EWeaponFireType, EWeaponSourceType, EWeaponType, ECurrencyType
**NS**: Aegis.ReferenceTable

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

### `RefSkinResource.cs`
Path: `ReferenceTable/RefSkinResource.cs`
**Class**: CRefSkinResource, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkinResource, RegisterRefSkinResourceBinary, FindRefSkinResource, GetRefSkinResources

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

### `RefTier.cs`
Path: `ReferenceTable/RefTier.cs`
**Class**: CRefTier, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefTier, RegisterRefTierBinary, FindRefTier, GetRefTiers

### `RefTitle.cs`
Path: `ReferenceTable/RefTitle.cs`
**Class**: CRefTitle, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefTitle, RegisterRefTitleBinary, FindRefTitle, GetRefTitles

### `RefWeapon.cs`
Path: `ReferenceTable/RefWeapon.cs`
**Class**: CRefWeapon, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefWeapon, RegisterRefWeaponBinary, FindRefWeapon, GetRefWeapons

### `RefWeaponSelfStat.cs`
Path: `ReferenceTable/RefWeaponSelfStat.cs`
**Class**: CRefWeaponSelfStat, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefWeaponSelfStat, RegisterRefWeaponSelfStatBinary, FindRefWeaponSelfStat, GetRefWeaponSelfStats

### `RefWeaponSkin.cs`
Path: `ReferenceTable/RefWeaponSkin.cs`
**Class**: CRefWeaponSkin, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefWeaponSkin, RegisterRefWeaponSkinBinary, FindRefWeaponSkin, GetRefWeaponSkins

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

## `ScriptDev/Data/`

### `CameraSettings.cs`
Path: `ScriptDev/Data/CameraSettings.cs`
**Class**: CameraSettings
**Methods**: copySetting, Equals, GetHashCode

### `CAtlasData.cs`
Path: `ScriptDev/Data/CAtlasData.cs`
**Class**: CAtlasData, CAtlasEntry
**NS**: ProjectAegis.Data
**Methods**: OpenItemDatabase

### `CCanvasData.cs`
Path: `ScriptDev/Data/CCanvasData.cs`
**Class**: CCanvasData
**NS**: ProjectAegis.Data

### `CFontData.cs`
Path: `ScriptDev/Data/CFontData.cs`
**Class**: CFontData, CFontEntry, CFontDataEditor
**NS**: ProjectAegis.Data
**Methods**: OpenFlagDatabase, OnEnable, OnInspectorGUI

### `CharacterData.cs`
Path: `ScriptDev/Data/CharacterData.cs`
**Class**: ESkillSlotType, EWeaponSlotType, ECharacterResult, CharacterConstants, SkillSlotData, PassiveSlotData, ModuleSlotData, WeaponSlotData, CharacterData, CharacterSaveData, CharacterResultMessages
**NS**: ProjectAegis.Data
**Methods**: GetRequiredExperience, GetTotalExperienceForLevel, GetModule, SetModule, GetEquippedModuleCount, GetActiveSkill, SetActiveSkill, GetActiveSkillCount, GetOwnedPassive, SetOwnedPassive, GetPassiveSlot, SetPassiveSlot, GetWeaponSlot, SetWeaponSlot, GetExperienceInCurrentLevel, GetExperienceRequiredForCurrentLevel, CanLevelUp, IsPassiveEquipped, FindOwnedPassiveIndex, GetMessage, CharacterSaveData

### `CMovementData.cs`
Path: `ScriptDev/Data/CMovementData.cs`
**Class**: CMovementData, SamplingData, SampleDataTree, Node, SampleDataSet
**Methods**: Load, SetData, FindNearest, InterpolateParamBarycentric, GetRoundVector, Node, SampleDataTree

### `ContentUnlockEnums.cs`
Path: `ScriptDev/Data/ContentUnlockEnums.cs`
**Class**: EContentUnlockType_dummy, EUnlockConditionType_dummy
**NS**: ProjectAegis.Data

### `CProjectileSetting.cs`
Path: `ScriptDev/Data/CProjectileSetting.cs`
**Class**: EResponseEffect, EResponseTrajectory, ELifeEndEffect, ProjectileSetting, ProjectileSettingEditor
**Methods**: copySetting, Equals, GetHashCode, OnInspectorGUI

### `CTextureData.cs`
Path: `ScriptDev/Data/CTextureData.cs`
**Class**: CTextureData, CTextureEntry
**Methods**: OpenTextureDatabase

### `CWeaponESSetting.cs`
Path: `ScriptDev/Data/CWeaponESSetting.cs`
**Class**: WeaponESSetting, WeaponEffect, WeaponSound
**Methods**: GetFireSoundPitch, GetLowAmmoVolume, copySetting, Equals, GetHashCode

### `CWeaponFireSetting.cs`
Path: `ScriptDev/Data/CWeaponFireSetting.cs`
**Class**: WeaponFireSetting, WeaponFireSettingEditor
**Methods**: copySetting, Equals, GetHashCode, OnInspectorGUI

### `ExtraWeaponFireSettings.cs`
Path: `ScriptDev/Data/ExtraWeaponFireSettings.cs`
**Class**: EExtraWeaponFireSettingsType, ExtraWeaponFireSettings, LockOnChargeWeaponFireSettings, ExtraWeaponFireSettingsFactory
**Methods**: Create

### `VibrationData.cs`
Path: `ScriptDev/Data/VibrationData.cs`
**Class**: EVibrationType, VibrationData, VibrationMode
**NS**: ProjectAegis.Data
**Methods**: Play, Stop, ApplyModifiersAndPlay, PlayCurve, GetDuration, GenerateCurveData

### `VignetteData.cs`
Path: `ScriptDev/Data/VignetteData.cs`
**Class**: VignetteData
**Methods**: GetData

## `ScriptDev/Manager/`

### `Local_UserDataManager.cs`
Path: `ScriptDev/Manager/Local_UserDataManager.cs`
**Class**: Local_UserDataManager
**NS**: ProjectAegis.UserDatas
**Methods**: InitializeInst, InitilizePartyInfos

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

## `ScriptDev/Pulse/Runtime/`

### `UnityPulseData.cs`
Path: `ScriptDev/Pulse/Runtime/UnityPulseData.cs`
**Class**: UnityPulseData, UnityPulseData_json, UnityPulseCustomData
**NS**: Pulse.Unity
**Methods**: Write, ToJson, UnityPulseData, UnityPulseCustomData

## `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/`

### `AnimatableProperty.cs`
Path: `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/AnimatableProperty.cs`
**Class**: AnimatableProperty, ShaderPropertyType
**NS**: Coffee.UIExtensions
**Methods**: UpdateMaterialProperties, OnBeforeSerialize, OnAfterDeserialize

## `ScriptDev/Sound/`

### `CSoundData.cs`
Path: `ScriptDev/Sound/CSoundData.cs`
**Class**: CSoundData, SerializableKeyframe, SoundDatabaseExtraSetting, SoundCueExtraSetting, CSoundDataInspector, SoundID
**Methods**: OpenSoundDatabase, GetExtraSettingJsonPath, UdateEntries, ToKeyframe, FromCurve, ToCurve, OnInspectorGUI, DrawSearchUI, SetAllSoundsToNull, SetAllAudioClipsToNull, RestoreAudioClipsFromAddressable, DrawEntriesGrid, AddNewSoundEntry, LoadAllClipsFromFolder, SortEntriesByName, GetOrLoadAudioClipAsync, FindAndSetMissingPaths, UpdateFromFolder, GenerateSoundIDScript, ConvertToIdentifier, ApplyExtraSettingsToEntries, GetAddressableKey, IsFileIn3DFolder, GetEntryKeyFromClipName, HasChanges (+ 18 more)

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

## `ScriptDev/UI/ReferenceTable/`

### `RefCharacterExtension.cs`
Path: `ScriptDev/UI/ReferenceTable/RefCharacterExtension.cs`
**Class**: CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: GetCharacterIconName, GetCharacterModelID, GetClassIconName, GetHeroName, GetHeroDetail, GetClassName, GetCharacterSkins, GetWeaponSkins, GetWeaponSkinsToWeaponID

### `RefCommonConfigExtension.cs`
Path: `ScriptDev/UI/ReferenceTable/RefCommonConfigExtension.cs`
**Class**: CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: GetCommonConfigInt, GetCommonConfigFloat, GetCommonConfigString, GetCommonConfigBool

### `RefSkillExtension.cs`
Path: `ScriptDev/UI/ReferenceTable/RefSkillExtension.cs`
**Class**: CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: GetPassiveName, GetPassiveDescription, BuildSkillOptionsList

### `RefStatExtension.cs`
Path: `ScriptDev/UI/ReferenceTable/RefStatExtension.cs`
**Class**: CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: GetStatLocalizationKey, GetStatDisplayValue, GetDetailStats, GetWeaponDetailStats, GetMoaMaxDisplayValue

### `RefWeaponExtension.cs`
Path: `ScriptDev/UI/ReferenceTable/RefWeaponExtension.cs`
**Class**: CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: GetWeaponName, GetWeaponIconName, GetWeaponSkinIconName, GetWeaponTypeName, GetWeaponTypeIconName, GetWeaponIdFromRefChar, GetWeaponIdFromGearSetId, GetWeaponIdFromGearSet, GetModuleIconName, GetModuleName, GetModuleDescription

## `ScriptDev/UI/UITeamMemberCharacterSelect/`

### `UISelectableHeroSlot.cs`
Path: `ScriptDev/UI/UITeamMemberCharacterSelect/UISelectableHeroSlot.cs`
**Class**: UISelectableHeroSlot
**NS**: ProjectAegis.UI
**Methods**: Awake, ResetData, SetupData, SetEmpty, OnBtnFocusSlot, OnBtnSelectSlot, OnBtnCancelSlot

## `ScriptDev/UI/Utilities/`

### `RefDataExtention.cs`
Path: `ScriptDev/UI/Utilities/RefDataExtention.cs`
**Class**: RefDataExtention
**NS**: ProjectAegis
**Methods**: ToLocalize, HasRedDotCondition, GetNewDotCondition, BuildRedDotConditions, GetItemIconName

## `ScriptDev/UI/Utilities/Scroll/`

### `IScrollData.cs`
Path: `ScriptDev/UI/Utilities/Scroll/IScrollData.cs`
**Class**: IScrollData
**NS**: ProjectAegis.Utility

## `ScriptDev/Utilities/`

### `CInternalColorTable.cs`
Path: `ScriptDev/Utilities/CInternalColorTable.cs`
**Class**: ColorDef, CInternalColorTable, ColorTableExtensions
**NS**: ProjectAegis.Utility
**Methods**: GetColorByName, GetColorByIndex, TryGetColor, GetColor

### `ColorDatabase.cs`
Path: `ScriptDev/Utilities/ColorDatabase.cs`
**Class**: ColorDatabase
**NS**: ProjectAegis.Utility
**Methods**: GetColor, HasColor, EditorAddValue

## `ScriptDev/Utilities/AutoTest/`

### `AutoTestData.cs`
Path: `ScriptDev/Utilities/AutoTest/AutoTestData.cs`
**Class**: AutoTestScenario, ReplayTouchPhase, CheckpointType, TouchRecordSession, TouchEvent, Checkpoint, AutoTestResult, CheckpointResult

## `ScriptDev/Utilities/Editor/`

### `CInternalColorTableEditor.cs`
Path: `ScriptDev/Utilities/Editor/CInternalColorTableEditor.cs`
**Class**: CInternalColorTableEditor
**NS**: ProjectAegis.Utility.Editors
**Methods**: OnEnable, OnTestMenuClicked, OnInspectorGUI, OpenNewInspector

## `ScriptTools/Editor/`

### `BuildingJSONExporter.cs`
Path: `ScriptTools/Editor/BuildingJSONExporter.cs`
**Class**: BuildingJSONExporter, BuildingDataJSON, FloorDataJSON, CellDataJSON
**Methods**: ExportToJSON, ImportFromJSON, ConvertToJSON, ConvertFromJSON

### `CAtlasDataEditor.cs`
Path: `ScriptTools/Editor/CAtlasDataEditor.cs`
**Class**: CAtlasDataEditor
**NS**: ProjectAegis.Data
**Methods**: OnInspectorGUI, GetAddressKeyFromGuid, RegisterToAddressable, GetOrCreateUIGroup, GenerateLabelsFromPath, UpdateEntryFromAtlas, ClearAllAtlasReferences, LoadCurrentAddressable, GetAddressKeyInEditor, DrawAllSpritesGrid, GetSpriteOptions, GetPreviewSprite, GetPackedAtlasTexture

### `CCanvasDataEditor.cs`
Path: `ScriptTools/Editor/CCanvasDataEditor.cs`
**Class**: CCanvasDataEditor
**NS**: ProjectAegis.Data
**Methods**: OpenDatabase, OnInspectorGUI

### `CTextureDataEditor.cs`
Path: `ScriptTools/Editor/CTextureDataEditor.cs`
**Class**: CTextrueDataInspector, TextureConfigWindow
**NS**: ProjectAegis.Data
**Methods**: GetColorForLabel, GetBrightColor, GetDarkColor, OnEnable, CheckAndUpdateEntries, IsInInspector, OnInspectorGUI, DrawSearch, UpdateSearchResults, GetFirstLabelForEntry, UpdateLabelGroups, DrawLabelFilter, SortEntries, FindAndSetMissingPaths, AjustRenameTextures, DrawGridByLabel, DrawTextureGridForGroup, DrawTextureSlotInGroup, DrawRectOutline, DrawSelectedTextureInfo, DrawGrid, DrawTextureEntry, GetOrLoadTextureAsync, DrawDeleteButton, DrawCopyButton (+ 9 more)

### `DataFolderTool.cs`
Path: `ScriptTools/Editor/DataFolderTool.cs`
**Class**: DataFolderTool
**NS**: ProjectAegis.Utility
**Methods**: OpenPersistentDataPath, OpenTemporaryCachePath, OpenStreamingAssetsPath, OpenDataPath, ClearCache, ClearPersistentDataPath, DeleteAllPlayerPrefs, ClearAllData, DeleteAllPlayerPrefsInternal, ClearCacheInternal, ClearPersistentDataPathInternal

### `OutGameCharacterDataViewer.cs`
Path: `ScriptTools/Editor/OutGameCharacterDataViewer.cs`
**Class**: OutGameCharacterDataViewer
**Methods**: Open, OpenWithCharacter, OnEnable, OnGUI, OnInspectorUpdate, InitStyles, CheckManager, DrawBackground, DrawHeader, DrawToolbar, DrawWarningBox, DrawCharacterList, DrawCharacterListItem, DrawCharacterDetail, DrawTabs, DrawBasicInfoTab, DrawSkillsTab, DrawSkillSlot, DrawPassiveSlot, DrawEquipmentTab, DrawWeaponSlot, DrawActionsTab, ShowResultNotification, DrawCodeTab, DrawCodeSection (+ 5 more)

## `ScriptTools/Editor/CharacterSetupTools/`

### `CharacterSetupData.cs`
Path: `ScriptTools/Editor/CharacterSetupTools/CharacterSetupData.cs`
**Class**: CharacterSetupData
**NS**: ProjectAegis.EditorTools
**Methods**: EnsureDefaultModules, OverwriteFrom

## `ScriptTools/Editor/DataExportTool/`

### `TestLoad.cs`
Path: `ScriptTools/Editor/DataExportTool/TestLoad.cs`
**Class**: TestLoaderEditor
**Methods**: ShowWindow, OnGUI

## `ScriptTools/Editor/DataExportTool/EditorGUI/`

### `DataExportToolEditor.cs`
Path: `ScriptTools/Editor/DataExportTool/EditorGUI/DataExportToolEditor.cs`
**Class**: eToolTab, DataExportToolEditor, LogEntry, 자동
**NS**: DataExportTool
**Methods**: ShowWindow, OnEnable, LoadPrefs, SavePrefs, CreateGUI, DrawIMGUI, DrawLogArea, GetFilteredLogs, GetStyleForLogType, GetIconForLogType, BuildLogText, JumpToFile, DrawPathInputField, RunWithProgress, SafeProgress, GenerateCSharpFromDefine, GenerateJsonFromData, SimulateWork, OnDataToolLog, DataExportToolEditor

### `DataUploadToolEditor.cs`
Path: `ScriptTools/Editor/DataExportTool/EditorGUI/DataUploadToolEditor.cs`
**Class**: eToolState, DataUploadToolEditor
**NS**: DataExportTool
**Methods**: GetRecentPatchVersion, OnShow, Draw, SetCommentFromCommitMessage, DrawUploader, DrawPatchList, UploadGameDataFromGit, UploadGameData, GetRerferenceList, LoadCommitList, Refresh

## `ScriptTools/Editor/DataExportTool/ToolCore/`

### `AutoUploader.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/AutoUploader.cs`
**Class**: AutoUploader
**NS**: DataExportTool
**Methods**: Pump, UploadData, Succeed, Fail, GetRerferenceList, GetRecentPatchVersion, OnDataToolLog, GetArg, GetServerType

### `BinaryConverter.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/BinaryConverter.cs`
**Class**: ConverterTest, BinaryConverter
**NS**: DataExportTool
**Methods**: ValidateBinaryConvert, BinaryConvert, ValidateLoadBinary, LoadBinary

### `CCodeGenerator.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/CCodeGenerator.cs`
**Class**: CCodeGenerator, CRef, CReferenceManager
**NS**: DataExportTool, Aegis.ReferenceTable
**Methods**: GenerateReferenceTableCode, GenerateProperties, GenerateEnumCode

### `CProtoEnumGenerator.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/CProtoEnumGenerator.cs`
**Class**: CProtoEnumGenerator
**NS**: DataExportTool
**Methods**: GenerateProtoEnumCode

### `CSchemaGenerator.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/CSchemaGenerator.cs`
**Class**: CReferenceSchema, CSchemaGenerator
**NS**: DataExportTool
**Methods**: GenerateSch, GenerateSchEnum

### `CToolReferenceTableManager.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/CToolReferenceTableManager.cs`
**Class**: CReferenceEnumData, CToolReferenceTableManager
**NS**: DataExportTool
**Methods**: LoadExcels, LoadDefineExcels, LoadDefineExcel, LoadDataExcels, LoadDataExcel, LoadEnumData, GenerateCsharpCodes, GenerateProtoCode, GenerateJsonDatas, GenerateSchs, PackRefsBinary, PackRefsBinaryServer, PackSchs, PackSchsServer, Clear, CReferenceEnumData

### `CToolResourceClient.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/CToolResourceClient.cs`
**Class**: ReferenceResource, CheckClientRequest, CheckClientResponse, BypassCertificate, CToolResourceClient
**NS**: DataExportTool
**Methods**: ValidateCertificate, PostResourceRequest, GetReferenceResource, PostCheckClientTest

### `DataExportTool.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/DataExportTool.cs`
**Class**: DataExportTool
**NS**: DataExportTool
**Methods**: GenerateCsharpFromDefine, GenerateJsonFromData, GenerateAll, BinaryPackTest, CommitDatas, CommitCodes, Pack, GetData

### `DataExportToolEvent.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/DataExportToolEvent.cs`
**Class**: EventBus, DataToolEvent
**NS**: DataExportTool
**Methods**: EventBus

### `DataExportToolLog.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/DataExportToolLog.cs`
**Class**: DataToolEvent_Log, DataExportToolLog
**NS**: DataExportTool
**Methods**: Log, LogWarning, LogError, LogException, DataToolEvent_Log

### `DataToolGitUtility.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/DataToolGitUtility.cs`
**Class**: CommitData, DataToolGitUtility
**Methods**: WithRepo, GetJsonFolderEntries, InitRepository, LoadRemoteBranches, LoadRemoteBranchesInternal, DrawRemoteBranchesUI, LoadCommitList, CommitAndPushSpecificFiles, ListRemoteBranchFilesAtPath

### `DataToolUtil.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/DataToolUtil.cs`
**Class**: DataToolUtils
**NS**: DataExportTool
**Methods**: WriteFileIfChanged

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

### `ExcelWorkbook.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/ExcelWorkbook.cs`
**Class**: CExcelWorkbook, CExcelWorksheet
**NS**: DataExportTool
**Methods**: Open, ToDictionaryList, CExcelWorkbook

### `NewEmptyCSharpScript.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/NewEmptyCSharpScript.cs`
**Class**: NewEmptyCSharpScript

### `PropertyDefine.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/PropertyDefine.cs`
**Class**: PropertyDefine
**NS**: DataExportTool
**Methods**: Generate, ToCsharpDataType

### `S3Manager.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/S3Manager.cs`
**Class**: CS3Manager
**NS**: PNIX.Engine.Utility
**Methods**: Initialize, UploadData, UploadDataAsync, UploadFile, UploadFileAsync, DownloadFile, DownloadData, GetList, DeleteFile, DeleteFileAsync

### `SheetDefine.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/SheetDefine.cs`
**Class**: SheetDefine
**NS**: DataExportTool
**Methods**: Clear, GetCsharpType, SheetDefine

### `TableDefine.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/TableDefine.cs`
**Class**: TableDefine
**NS**: DataExportTool

### `ToolOption.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/ToolOption.cs`
**Class**: eServerType, ValidationLevel, ToolOption
**NS**: DataExportTool

### `ToolReferenceTable.cs`
Path: `ScriptTools/Editor/DataExportTool/ToolCore/ToolReferenceTable.cs`
**Class**: ToolReferenceTable, ToolReferenceTableData
**NS**: DataExportTool
**Methods**: ToJson, Merge, ToolReferenceTable, ToolReferenceTableData

## `ScriptTools/Editor/MapTool/EditorWindows/`

### `MapToolEditor.Excel.cs`
Path: `ScriptTools/Editor/MapTool/EditorWindows/MapToolEditor.Excel.cs`
**Class**: MapToolEditor
**Methods**: InitExcelUI, ReleaseExcelUI, UpdateExcelUI, OnExcelLoadClicked, OnExcelToSceneClicked, OnExcelFromSceneClicked, OnExcelToSceneAllClicked, OnExcelFromSceneAllClicked

## `ScriptTools/Editor/MapTool/Excel/`

### `MapObjectDescExcelIO.cs`
Path: `ScriptTools/Editor/MapTool/Excel/MapObjectDescExcelIO.cs`
**Class**: ExcelListMaxAttribute, MapObjectDescExcelIO, MapObjectDescSheet, ExcelSchema, PathSegment, ColumnDef, ValueTypeFrame, CollectionValueTypeFrame, parse
**Methods**: Init, Write, WriteAll, Read, ReadAll, ReadHeader, BuildSchema, ReadTable, EnsureHeader, ValidateHeader, EnsureTable, AppendHeader, TryGetRowRange, ReadCell, WriteCell, OpenPackage, GetOrCreateWorksheet, EnsureDirectory, GetHeaderEndColumn, IsCommentHeader, MakeMultiKey, Build, BuildRecursive, BuildHeaderName, GetListMax (+ 18 more)

### `MapToolExcelHelper.cs`
Path: `ScriptTools/Editor/MapTool/Excel/MapToolExcelHelper.cs`
**Class**: MapToolExcelHelper
**Methods**: SelectExcel, Export, Import, ExportAll, ImportAll, ImportByScene

## `ScriptTools/Editor/UILayoutBuilder/`

### `UGUILayoutBuilder.JsonInputTab.cs`
Path: `ScriptTools/Editor/UILayoutBuilder/UGUILayoutBuilder.JsonInputTab.cs`
**Class**: UGUILayoutBuilder, JsonLineInfo
**NS**: ProjectAegis.EditorTools.UILayoutBuilder
**Methods**: EnsureStyles, DrawJsonInputTab, UpdateHighlightRange, DrawSelectedNodeActionBar, AddChildToSelected, InsertSiblingAfterSelected, DrawJsonViewer, RebuildVisibleLines, ExpandParentFolds, CollapseAllJsonFolds, ExpandAllJsonFolds, GetCollapsedSummary, DrawJsonLine, HandleJsonLineMouseEvents, ShowJsonViewerContextMenu, HasValidNodeJsonInClipboard, PasteFromClipboardAsChild, PasteFromClipboardAsSibling, CopyNodeToClipboard, MoveNodeDepthUp, MoveNodeDepthDown, DrawEditableJsonProperty, DrawReadOnlyValue, ApplyJsonValueChange, RebuildJsonLineCache (+ 15 more)

### `UGUILayoutBuilder.PrefabToJsonTab.cs`
Path: `ScriptTools/Editor/UILayoutBuilder/UGUILayoutBuilder.PrefabToJsonTab.cs`
**Class**: UGUILayoutBuilder
**NS**: ProjectAegis.EditorTools.UILayoutBuilder
**Methods**: DrawPrefabToJsonTab, ConvertPrefabToJson, ConvertSelectedToJson, ConvertGameObjectToLayoutData, IsInternalUIChild, CreateLayoutGroupData, DetectUITypeFromGameObject, DetectAnchorPreset, ConvertTMPAlignmentToString, SavePrefabJsonToFile

### `UILayoutData.cs`
Path: `ScriptTools/Editor/UILayoutBuilder/UILayoutData.cs`
**Class**: UILayoutData, RectData, LayoutGroupData, UIElementType, AnchorPreset, LayoutGroupType, UIBuilderNode
**NS**: ProjectAegis.EditorTools.UILayoutBuilder
**Methods**: AddChild, RemoveChild, IsDescendantOf, UpdateDescendantDepthsPublic, UpdateDescendantDepths, MoveUp, MoveDown, ToLayoutData, FromLayoutData, UIBuilderNode

## `ScriptTools/Editor/Vibration/`

### `VibrationDataEditor.cs`
Path: `ScriptTools/Editor/Vibration/VibrationDataEditor.cs`
**Class**: VibrationDataEditor
**NS**: ProjectAegis.Data
**Methods**: OnInspectorGUI, DrawHelpBox, ResetUnusedValues, DrawPropWithHelp, GetPresetDescription

## `ScriptTools/Editor/WeaponTools/Preview/`

### `WeaponPreviewEditor.Data.cs`
Path: `ScriptTools/Editor/WeaponTools/Preview/WeaponPreviewEditor.Data.cs`
**Class**: WeaponPreviewEditor
**NS**: Aegis.EditorTools
**Methods**: InitSOData, ResetSOData, RefreshSOData, RefreshCamaraSetting, DrawSOData, DrawWeaponSetting, DrawProjectileSetting, DrawCameraSetting

## `ScriptTools/Editor/x64/Bakery/scripts/`

### `ftAdditionalConfig.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftAdditionalConfig.cs`
**Class**: ftAdditionalConfig, LogLevel

### `ftDefine.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftDefine.cs`
**Class**: ftDefine
**Methods**: AddDefine, CreateAsmDefs, OnActiveBuildTargetChanged

### `ftLightingDataGen.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftLightingDataGen.cs`
**Class**: ftLightingDataGen
**Methods**: GenerateShadowmaskLightingData, PatchShadowmaskLightingData

## `ScriptTools/LevelTools/`

### `HeatmapDataCollector.cs`
Path: `ScriptTools/LevelTools/HeatmapDataCollector.cs`
**Class**: HeatmapDataCollector, SimulationSession, SessionSummary, MatchData, CombatEvent
**NS**: ProjectAegis.NetPlay
**Methods**: StartNewSession, OnMatchStart, OnMatchEnd, RecordFireStart, RecordDeath, SaveAllData, SanitizeFileName, OpenLastSavedFile, OpenSaveFolder, GetSessionStats

## `ScriptTools/MinimapTool/Scripts/`

### `DataSheet.cs`
Path: `ScriptTools/MinimapTool/Scripts/DataSheet.cs`
**Class**: RefDataStringSize, DataSheet, DataFile
**Methods**: CreateDataSheet, LoadDataSheet, ReadTableData, SetDataFromInstance, CreateFile, CreateSheet, LoadDataSheetAll, LoadDataInstance, RefDataStringSize

## `ScriptTools/MovementSample/`

### `SampleDataTool.cs`
Path: `ScriptTools/MovementSample/SampleDataTool.cs`
**Class**: SampleDataTool
**Methods**: SetSamplePoint, StartSimulateAnimator, UpdateSimulateAnimator, SetAnimFloat, ResetAnimPosistion, SetSmallValuesToZero

## `ScriptTools/ZString/`

### `IResettableBufferWriter.cs`
Path: `ScriptTools/ZString/IResettableBufferWriter.cs`
**Class**: IResettableBufferWriter
**NS**: Cysharp.Text

## `ScriptTools/ZString/Utf16/`

### `Utf16ValueStringBuilder.SpanFormattableAppend.cs`
Path: `ScriptTools/ZString/Utf16/Utf16ValueStringBuilder.SpanFormattableAppend.cs`
**Class**: Utf16ValueStringBuilder
**NS**: Cysharp.Text
**Methods**: Append, AppendLine

## `ScriptTools/ZString/Utf8/`

### `Utf8ValueStringBuilder.SpanFormattableAppend.cs`
Path: `ScriptTools/ZString/Utf8/Utf8ValueStringBuilder.SpanFormattableAppend.cs`
**Class**: Utf8ValueStringBuilder
**NS**: Cysharp.Text
**Methods**: Append, AppendLine


