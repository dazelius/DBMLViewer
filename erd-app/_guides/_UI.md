# UI System Code Guide
> Auto-generated: 2026-02-25 13:31 | 378 files

## `NetworkClient/NetPlay/Character/FSM/States/`

### `EquipState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/EquipState.cs`
**Class**: EquipState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, EquipState

## `NetworkClient/NetPlay/Character/Passive/Editor/`

### `CharacterDetailWindow.cs`
Path: `NetworkClient/NetPlay/Character/Passive/Editor/CharacterDetailWindow.cs`
**Class**: CharacterDetailWindow, CharacterDetailBase
**NS**: ProjectAegis.Tool
**Methods**: ShowWindow, Awake, Update, OnGUI, DrawTarget, InitStatic, Draw, DrawTitle, DrawName, DrawView, DrawLabelName, DrawLabelValue, DrawObjectField, DrawUILine, CharacterDetailBase

## `NetworkClient/NetPlay/Character/Skill/`

### `SkillBuilder.cs`
Path: `NetworkClient/NetPlay/Character/Skill/SkillBuilder.cs`
**Class**: SkillBuilder
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: IsExistSkill, IsAimSkill, IsEnableRes, BuildSkillState, BuildSkillExecute, BuildSkillExecuteEffect, SetupExecuteResultDisplay, LoadActionRes, SetActionResNode, LoadTrackData, CollectAllLinkedSkills, RequireDamageRecord

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

## `NetworkClient/NetPlay/Interaction/Test/`

### `SimpleInteractionUI.cs`
Path: `NetworkClient/NetPlay/Interaction/Test/SimpleInteractionUI.cs`
**Class**: SimpleInteractionUI
**NS**: ProjectAegis.NetPlay.Interaction.Test
**Methods**: Start, Update, UpdateCastingProgress, RefreshPrompt, TryBindModule, OnDestroy, OnLocalInstanceReady, OnLocalInstanceDestroyed, BindToModule, UnbindFromModule, OnTargetLost, OnTargetAcquired, CreateSimpleUI, CreateWhiteSprite, OnTargetChanged, OnGUI

## `NetworkDev/03.ReferenceManager/02.ReferenceTable/`

### `RefLobbyUI.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefLobbyUI.cs`
**Class**: CRefLobbyUI, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefLobbyUI, RegisterRefLobbyUIBinary, FindRefLobbyUI, GetRefLobbyUIs

### `RefSkillUI.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefSkillUI.cs`
**Class**: CRefSkillUI, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillUI, RegisterRefSkillUIBinary, FindRefSkillUI, GetRefSkillUIs

## `OrleansX.Silo.Hosting/Extensions/`

### `SiloBuilderExtensions.cs`
Path: `OrleansX.Silo.Hosting/Extensions/SiloBuilderExtensions.cs`
**Class**: SiloBuilderExtensions, OrleansXSiloOptionsBuilder
**NS**: OrleansX.Silo.Hosting.Extensions
**Methods**: UseOrleansXDefaults, ConfigureClustering, ConfigurePersistence, ConfigureStreams, ConfigureTransactions, WithCluster, WithPorts, WithClustering, WithPersistence, WithStreams, WithTransactions, WithDashboard, Build

## `ReferenceTable/`

### `RefLobbyUI.cs`
Path: `ReferenceTable/RefLobbyUI.cs`
**Class**: CRefLobbyUI, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefLobbyUI, RegisterRefLobbyUIBinary, FindRefLobbyUI, GetRefLobbyUIs

### `RefSkillUI.cs`
Path: `ReferenceTable/RefSkillUI.cs`
**Class**: CRefSkillUI, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefSkillUI, RegisterRefSkillUIBinary, FindRefSkillUI, GetRefSkillUIs

## `ScriptDev/Contents/Core/AutoFireSystem/`

### `AutoFireStateAcquire.cs`
Path: `ScriptDev/Contents/Core/AutoFireSystem/AutoFireStateAcquire.cs`
**Class**: AutoFireStateAcquire
**Methods**: Enter, Update, AutoFireStateAcquire

## `ScriptDev/Data/`

### `CCanvasData.cs`
Path: `ScriptDev/Data/CCanvasData.cs`
**Class**: CCanvasData
**NS**: ProjectAegis.Data

## `ScriptDev/Manager/UserDatas/Characters/`

### `WeaponEquipData.cs`
Path: `ScriptDev/Manager/UserDatas/Characters/WeaponEquipData.cs`
**Class**: WeaponEquipData
**NS**: ProjectAegis.UserDatas

## `ScriptDev/Rendering/AegisBasicLit/Editor/`

### `AegisBasicLitMenu.cs`
Path: `ScriptDev/Rendering/AegisBasicLit/Editor/AegisBasicLitMenu.cs`
**Class**: AegisBasicLitMenu
**Methods**: ConvertSimpleLitToBasicLit

## `ScriptDev/Rendering/PathGuide/`

### `PathGuide.cs`
Path: `ScriptDev/Rendering/PathGuide/PathGuide.cs`
**Class**: PathGuide, MaterialType
**NS**: Aegis.Rendering
**Methods**: SetMaterialType, SetTeamType, SwapTeamType, SetGuidePoints, ShouldSkipPlayWork, ShouldSkipEditorWork, RebuildPathPoints, RebuildMesh

### `PathGuideSmoother.cs`
Path: `ScriptDev/Rendering/PathGuide/PathGuideSmoother.cs`
**Class**: PathGuideSmoother
**NS**: Aegis.Rendering
**Methods**: Init, Smooth, CatmullRomSamplings, CatmullRomCentripetal, SafeDen, SafeLerp

### `PathGuideUtil.cs`
Path: `ScriptDev/Rendering/PathGuide/PathGuideUtil.cs`
**Class**: PathGuideUtil
**Methods**: MakeNavPathPoints, MakeGroundSnapPoints, SimplifyStraightSections, RemoveNearDuplicates, AppendPointNoDup, AppendPointNoDup_WithGroundSnap, SnapToGround, SafeNormalize

### `RibbonMesh.cs`
Path: `ScriptDev/Rendering/PathGuide/RibbonMesh.cs`
**Class**: RibbonMesh
**NS**: Aegis.Rendering
**Methods**: Generate, SafeNormalize

## `ScriptDev/Rendering/PathGuide/Editor/`

### `PathGuideEditor.cs`
Path: `ScriptDev/Rendering/PathGuide/Editor/PathGuideEditor.cs`
**Class**: PathGuideEditor
**Methods**: OnInspectorGUI

### `PathGuideMenu.cs`
Path: `ScriptDev/Rendering/PathGuide/Editor/PathGuideMenu.cs`
**Class**: PathGuideMenu
**Methods**: RebuildAllPathGuides, RebuildAllPathGuides_Validate, ClearAllPathGuides, FindAllPathGuidesInLoadedScenes

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

### `CUIButtonSound.cs`
Path: `ScriptDev/Sound/CUIButtonSound.cs`
**Class**: CUIButtonSound, ButtonType, CUIButtonSoundExtention
**Methods**: OnEnable, OnDisable, PlayToggleSound, Reset, ForcePlayButtonSound

### `CUISound.cs`
Path: `ScriptDev/Sound/CUISound.cs`
**Class**: CUISound
**Methods**: OnEnable, PlaySound, PlayUISound, Reset

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

### `CUIButtonAction.cs`
Path: `ScriptDev/UI/CUIButtonAction.cs`
**Class**: CUIButtonAction
**Methods**: Awake, SetPointerEvent, OnPointerDown, OnPointerUp, OnDrag, SetToggleState, SetInputScale

### `CUIButtonSkill.cs`
Path: `ScriptDev/UI/CUIButtonSkill.cs`
**Class**: CUIButtonSkill
**Methods**: GetCooltimeText, Awake, SetIcon, SetIconAlphaByCooldown, SetSticker, SetCooltimeProgress, SetCooltimeText, SetStackCooltimeProgress, SetStackCount, SetActiveCooltime, SetActiveStack, SetActiveStackCooltime, PlayAnimCooldown

### `CUICombatDisplay.cs`
Path: `ScriptDev/UI/CUICombatDisplay.cs`
**Class**: CUICombatDisplay
**Methods**: Awake, GetCombatText, ShowCombatText, OverrideCambatText, HideCombatText

### `CUICombatText.cs`
Path: `ScriptDev/UI/CUICombatText.cs`
**Class**: CUICombatText
**Methods**: Awake, Update, SetData, Hide, GetCombatValueString, SetGradientColor, GetWidgetPosition, UpdateCombatText, OnCompleteAnimation

### `CUICommonPopup.cs`
Path: `ScriptDev/UI/CUICommonPopup.cs`
**Class**: ECommonPopupInfoType, ECommonPopupButtonType, CommonPopupData, CUICommonPopup
**NS**: ProjectAegis.UI
**Methods**: OnPanelEnabled, OnPanelDisabed, OnPanelRelase, InitUIBind, OnShow, Update, SetupPopup, StopProgressTimer, UpdateUI, UpdateInfoTypeUI, UpdateButtonTypeUI, StartProgressTimer, UpdateProgressTimer, OnProgressTimerComplete, ClearPopupData, OnButtonConfirm, OnButtonCancel

### `CUICrosshair.cs`
Path: `ScriptDev/UI/CUICrosshair.cs`
**Class**: CUICrosshair, ECrosshairType, EHitFeedbackType, ECrosshairColorType
**Methods**: Awake, OnDestroy, Update, LateUpdate, SetPlayer, OnWeaponChanged, OnSkillStarted, OnSkillEnded, OnAimModeChanged, OnPlayerDealDamage, UpdateAmmoUI, UpdateMuzzleBlockUI, UpdateShieldUI, UpdateCrosshairWidgets, GetSpreadData, UpdateCrosshairType, GetCurrentCrosshairType, GetCrosshairType, GetCrosshairSpreadLineType, CheckCrosshairHit, GetTargetCrosshairColorType, IsCrosshairActionBlocked, GetSpreadRadiusPixel

### `CUIGameMessage.cs`
Path: `ScriptDev/UI/CUIGameMessage.cs`
**Class**: GameMessageData, CUIGameMessage
**NS**: ProjectAegis.UI
**Methods**: Awake, Update, OnDestroy, ShowMessage, ClearMessages, ShowMessageInternal, HideMessage, SetMessage, PlayAnim, OnEndAnim, CheckForNextMessage, ShowSystemMessage, ShowStateMessage, ClearStateMessage, GameMessageData

### `CUIGlobalNotification.cs`
Path: `ScriptDev/UI/CUIGlobalNotification.cs`
**Class**: CUIGlobalNotification
**NS**: ProjectAegis.UI
**Methods**: CanShow, TryShow, InitUIBind, OnPanelEnabled, OnPanelDisabed, OnPanelRelase, OnShow, OnRequestInstanceUpdated, OnButtonFriendInviteList

### `CUIHitDirection.cs`
Path: `ScriptDev/UI/CUIHitDirection.cs`
**Class**: CUIHitDirection, HitInstance
**Methods**: Refresh, Awake, SetPlayer, Update, OnTakeDamage, GetCameraForward, CalculateAngle, GetSignedAngle, GetHitInstance, ReturnToPool

### `CUIHitFeedbackComponent.cs`
Path: `ScriptDev/UI/CUIHitFeedbackComponent.cs`
**Class**: CUIHitFeedbackComponent
**Methods**: Initialize, PlayFeedback, UpdateLogic, StopFeedback

### `CUIIngameHUD.cs`
Path: `ScriptDev/UI/CUIIngameHUD.cs`
**Class**: CUIIngameHUD
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, OnPanelEnabled, OnPanelDisabed, OnPanelRelase, Reset, SetPlayer, ConnectGameMode, ConnectToClashModePointCaptureSystem, ConnectToPointCaptureModePointCaptureSystem, OnAxisMovedMovement, OnMovedRotation, OnPressChangeWeapon, OnPressChangeWeapon2, OnPressChangeWeapon3, OnPressGrenade, OnPressFireInstant, OnReleaseFireInstant, OnPressFire, OnReleaseFire, OnDragFire, OnPressReload, OnPressAim, OnPressJump, OnReleaseJump, OnPressCrouch (+ 35 more)

### `CUIKillFeedback.cs`
Path: `ScriptDev/UI/CUIKillFeedback.cs`
**Class**: CUIKillFeedback
**NS**: ProjectAegis.UI
**Methods**: Awake, Show, WaitFrameAndShow, SetContentsActive, PlayAnimation, WaitAndPlayOutro

### `CUIKillLog.cs`
Path: `ScriptDev/UI/CUIKillLog.cs`
**Class**: CUIKillLog, KillMessageData
**NS**: ProjectAegis.UI
**Methods**: Awake, OnEnable, Update, Show, ShowInternal, ProcessPendingMessages, GetItem, ReturnItem, FadeAndReturnItem, UpdateItemPositions, TryGetPlayerInfo, GetIconPath, GetNicknameColor, KillMessageData

### `CUIKillLogItem.cs`
Path: `ScriptDev/UI/CUIKillLogItem.cs`
**Class**: CUIKillLogItem
**NS**: ProjectAegis.UI
**Methods**: Awake, OnDisable, ResetItem, Show, Hide, SetKiller, SetVictim, SetDamageSourceIcon, SetActiveKiller, SetActiveDamageSourceIcon, SetActiveHeadshotFlag, SetActiveDeathFlag, SetAlpha, SetPositionY, StartFadeOut, MoveTo

### `CUINamePlate.cs`
Path: `ScriptDev/UI/CUINamePlate.cs`
**Class**: CUINamePlate
**Methods**: SetUIColorByAlly, SetUIDistance, SetUIDistanceActive, SetUINickname, SetUIHealth, SetUIHealthActive, SetUIShield, SetScreenPosition

### `CUIPanelInputBox.cs`
Path: `ScriptDev/UI/CUIPanelInputBox.cs`
**Class**: CUIPanelInputBox
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, OnPanelEnabled, OnPanelDisabed, SetupBox, SetupExtCostValue, OnClickTryToChange

### `CUISlideAnimator.cs`
Path: `ScriptDev/UI/CUISlideAnimator.cs`
**Class**: CUISlideAnimator
**NS**: ProjectAegis.UI
**Methods**: GetAnimationOffset, PlayShowAnimation, PlayHideAnimation, ShowImmediate, HideImmediate, StopAnimation, Dispose, CUISlideAnimator

### `CUISpectate.cs`
Path: `ScriptDev/UI/CUISpectate.cs`
**Class**: CUISpectate
**NS**: ProjectAegis.UI
**Methods**: BindUI, OnClinkLeft, OnClinkRight, RequestNextSpectate, SetPlayer, SetSpectateTarget, UpdateRespawnTimer

### `CUIToastMessage.cs`
Path: `ScriptDev/UI/CUIToastMessage.cs`
**Class**: CUIToastMessage
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, OnShow, Update, ShowToastMessage

### `CUITouchDefence.cs`
Path: `ScriptDev/UI/CUITouchDefence.cs`
**Class**: CUITouchDefence
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, OnPanelDisabed, SetOption, IndicatorDelayRoutine

### `CUIVignette.cs`
Path: `ScriptDev/UI/CUIVignette.cs`
**Class**: CUIVignette, VignetteEffect
**NS**: ProjectAegis.UI
**Methods**: Awake, Update, OnDestroy, SetPlayer, SetVignettes, ClearVignettes, ShowVignette, HideVignette, OnResolutionChanged, Destroy, SetAlpha, GetAlpha, SetActive, SetLocalScale, StartFade, EndFade, Create

### `CUIWeaponSlot.cs`
Path: `ScriptDev/UI/CUIWeaponSlot.cs`
**Class**: CUIWeaponSlot
**NS**: ProjectAegis.UI
**Methods**: SetWeaponInfo, RefreshSelected, RefreshData

### `IUISlideAnimation.cs`
Path: `ScriptDev/UI/IUISlideAnimation.cs`
**Class**: ESlideDirection, IUISlideAnimation
**NS**: ProjectAegis.UI

### `SpriteImageLoader.cs`
Path: `ScriptDev/UI/SpriteImageLoader.cs`
**Class**: SpriteImageLoader
**NS**: ProjectAegis.Utility
**Methods**: SetReference

### `UIEnumTabGroup.cs`
Path: `ScriptDev/UI/UIEnumTabGroup.cs`
**Class**: UIEnumTabGroup, TabItem
**Methods**: SetSelected, SetActive, SetLocalize, SetButtonEnable, IsLockButton, ClearLockButton, SetLockButton, SetTabLabelKeys, SetTabActive, SetTabSelected, OnTabSelectedInternal, SetAllButtonEnable, UIEnumTabGroup

### `UILoading.cs`
Path: `ScriptDev/UI/UILoading.cs`
**Class**: UILoading
**NS**: ProjectAegis.UI
**Methods**: HideFlowUI, InitUIBind, Awake, OnShow, OnPanelDisabed

### `UIMainOverlayMenu.cs`
Path: `ScriptDev/UI/UIMainOverlayMenu.cs`
**Class**: UIMainOverlayMenu
**NS**: ProjectAegis.UI
**Methods**: BindTop, BindButtom, SetActive, SetTitle, SetCoinIcon, SetCoinText, SetGemIcon, SetGemText, SetCurrencyVisible, SetChatTab, OnSelectChattingTab, SetChatChannelText, SetChatNickNameText, SetChatMessageText, SetChatFieldVisible, SetButtomVisible, SetBackButtonAction, SetHomeButtonAction, SetAllData, Clear, Release, UIMainOverlayMenu

### `UIPlaneMesh.cs`
Path: `ScriptDev/UI/UIPlaneMesh.cs`
**Class**: UIPlaneMesh, BuildType
**Methods**: Awake, BuildMesh, OverridePlanScale, ClearOverridePlanScale, BuildUp, OnDrawGizmos

### `UITeamCharacterSelect.cs`
Path: `ScriptDev/UI/UITeamCharacterSelect.cs`
**Class**: UITeamCharacterSelect
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, PrepareContent, OnPanelEnabled, OnPanelDisabed, OnPanelRelase, LateUpdate, OnChangeMatchingState, OnFocusCharacterChanged, InitTooltipGear, ShowGearTooltip, InitTooltipSkill, ShowSkillTooltip, OnTouchDetected, OnSelectEquipSlotEvent

### `UITitle.cs`
Path: `ScriptDev/UI/UITitle.cs`
**Class**: UITitle, ReConnectionState
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, OnPanelDisabed, OnLoginAck, OnMatchCompleteNotifyEvent, ReconnecTimeOutCheck, ActiveUIEnterButtons, OnShow, HideFlowUI, OnButtonEnterLobby, OnButtonReconnectMatch, StaticInit, SetStateAsReconnect, ClearFlag

### `UIVirtualJoystick.cs`
Path: `ScriptDev/UI/UIVirtualJoystick.cs`
**Class**: UIVirtualJoystick
**Methods**: Start, SetEventListner, OnPointerDown, OnDrag, OnPointerUp, UpdateAxisInput, SetActiveHandle, SetHandlePosition, SetThumbPosition, LateUpdate

### `UIVirtualTouch.cs`
Path: `ScriptDev/UI/UIVirtualTouch.cs`
**Class**: UIVirtualTouch
**Methods**: SetEventListner, OnPointerDown, OnDrag, OnPointerUp, SetInputScale

## `ScriptDev/UI/Achievement/`

### `UIAchievementItemSlot.cs`
Path: `ScriptDev/UI/Achievement/UIAchievementItemSlot.cs`
**Class**: UIAchievementItemSlot
**NS**: ProjectAegis.UI
**Methods**: Awake, SetData, UpdateContent

### `UIPanelAchievement.cs`
Path: `ScriptDev/UI/Achievement/UIPanelAchievement.cs`
**Class**: UIPanelAchievement, MenuTab, RewardSlot
**NS**: ProjectAegis.UI
**Methods**: SetData, InitUIBind, PrepareContent, OnPanelRelase, GetCellCount, OnSelectTabMenuItem, OnTabSelectAccount, OnTabSelectSpecCharacter, OnButtonChangeHero, OnSelectedSpecCharacter, ReloadDataContent, RewardSlot

## `ScriptDev/UI/Crosshair/`

### `CUICrosshairComponent.cs`
Path: `ScriptDev/UI/Crosshair/CUICrosshairComponent.cs`
**Class**: CUICrosshairComponent
**Methods**: BindComponents, SetColor, Initialize, OnCrosshairUpdate, SetSpread, Reset

### `CUICrosshairSpreadLines.cs`
Path: `ScriptDev/UI/Crosshair/CUICrosshairSpreadLines.cs`
**Class**: CUICrosshairSpreadLines, SpreadLine
**Methods**: UpdateAimMode, OnEnable, BindComponents, OnCrosshairUpdate, SetSpread, UpdateSpreadLineType, UpdateRenderSpreadMultiplier

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

## `ScriptDev/UI/Friends/`

### `CUIFriendSlot.cs`
Path: `ScriptDev/UI/Friends/CUIFriendSlot.cs`
**Class**: CUIFriendSlot
**NS**: ProjectAegis.UI
**Methods**: RefreshButtonState, Awake, SetUp, RefreshSendingState, OnBtnInviteParty, OnBtnWhisper, OnBtnInviteClan, OnBtnDelete, OnBtnRequest, OnBtnInviteCancel, OnBtnAccept, OnBtnReject

### `UIPanelFriends.cs`
Path: `ScriptDev/UI/Friends/UIPanelFriends.cs`
**Class**: EFriendPage, CUIPanelFriends
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, OnPanelEnabled, OnPanelDisabed, OnGNBSelected, OnContentMenuEvent, OnFilterChanged, OnShareContent, SetCategory, SetupCategoryContent, OnGS2C_GetFriendListAck, OnGS2C_GetReceivedFriendRequestListAck, OnGS2C_GetRecommendedFriendsAck, OnGS2C_SearchFriendAck, OnGS2C_RespondFriendRequestAck, OnGS2C_SendFriendRequestAck, OnGS2C_DeleteFriendAck, OnGS2C_FriendRequestNotify, SetData, GetCellCount, RefreshMembers, OnFilteredRefresh

### `UIPanelFriends_Elements.cs`
Path: `ScriptDev/UI/Friends/UIPanelFriends_Elements.cs`
**Class**: CUIPanelFriends, MemberHeader, EMenuEventType, RequestsFriendHeader, FilterContent, ESocialShareType, ShareContent, FriendMemberFilter
**NS**: ProjectAegis.UI
**Methods**: UpdateContent, SetOpenShareUIWithoutNotify, SetOpenFilterUIWithoutNotify, OnFilterModified, OnButtonQR, OnButtonScan, OnButtonOpenShare, OnButtonCloaseShare, OnButtonOpenFilter, OnButtonCloseFilter, OnBtnResetFilter, OnButtonSearching, OnButtonRefresh, GetDropDownContent, ChangeFilterItem, ResetFilters, OnChangeSelectVoiceChat, OnChangeSelectTime, OnChangeSelectGender, OnChangeSelectCountry, OnChangeSelectTier, OnChangeSelectFavoritRole, OnChangeFilterEvent, OnButtonSocial1, OnButtonSocial2 (+ 9 more)

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

### `CUIHUDMember.cs`
Path: `ScriptDev/UI/InGame/CUIHUDMember.cs`
**Class**: CUIHUDMember
**NS**: ProjectAegis.UI
**Methods**: BindUI, SetContents, HelperGetCharacterPortrait, UpdatePlayStatus

### `CUIIngameIntro.cs`
Path: `ScriptDev/UI/InGame/CUIIngameIntro.cs`
**Class**: CUIIngameIntro, MemberUI
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, PrepareContent, BindUI

### `CUIIngameMatchingInfo.cs`
Path: `ScriptDev/UI/InGame/CUIIngameMatchingInfo.cs`
**Class**: CUIIngameMatchingInfo, TeamUI, MemberUI
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, PrepareContent, OnPanelRelase, OnUpdatePlayerData, BindMembersUI, BindUI, SetContents, SetupMember

### `CUIIngameMatchResult.cs`
Path: `ScriptDev/UI/InGame/CUIIngameMatchResult.cs`
**Class**: CUIIngameMatchResult, MemberUI
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, PrepareContent, OnClickNext, BindUI, ToCharacterInfo, SetupContents

### `CUIIngameMVP.cs`
Path: `ScriptDev/UI/InGame/CUIIngameMVP.cs`
**Class**: CUIIngameMVP
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, PrepareContent, OnClickNext

### `CUIIngamePlayerResult.cs`
Path: `ScriptDev/UI/InGame/CUIIngamePlayerResult.cs`
**Class**: CUIIngamePlayerResult
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, PrepareContent, HelperSetTextValue, OnClinkExit

### `CUIIngamePopupMap.cs`
Path: `ScriptDev/UI/InGame/CUIIngamePopupMap.cs`
**Class**: CUIIngamePopupMap
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, PrepareContent, OnButtonClose

### `CUIIngamePopupSynergy.cs`
Path: `ScriptDev/UI/InGame/CUIIngamePopupSynergy.cs`
**Class**: CUIIngamePopupSynergy, ESynergyTab, SynergyItemUI, SynergyMarkUI
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, OnPanelRelase, PrepareContent, OnSelectTab, RefreshList, BindUI, SetActive, SetContents

### `CUIIngamePopupSynergySelect.cs`
Path: `ScriptDev/UI/InGame/CUIIngamePopupSynergySelect.cs`
**Class**: CUIIngamePopupSynergySelect, TacticalCardUI
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, OnPanelRelase, PrepareContent, PrepareContentsProc, OnSelectCard, OnClickConfirm, OnClickClose, BindUI, SetContents, SetSelected

### `CUIIngamePopupWeaponSelect.cs`
Path: `ScriptDev/UI/InGame/CUIIngamePopupWeaponSelect.cs`
**Class**: CUIIngamePopupWeaponSelect, WeaponUI
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, PrepareContent, OnPanelRelase, OnPanelEnabled, OnSelectWeapon, OnClickConfirm, BindUI, SetContents

### `CUIIngameRoundResult.cs`
Path: `ScriptDev/UI/InGame/CUIIngameRoundResult.cs`
**Class**: CUIIngameRoundResult, MemberResultUI
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, PrepareContent, SetupTeamScores, UpdateRoundScore, OnPanelRelase, BindUI, Setup, SetupScore

### `CUIIngameRoundStart.cs`
Path: `ScriptDev/UI/InGame/CUIIngameRoundStart.cs`
**Class**: CUIIngameRoundStart, MemberUI
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, PrepareContent, BindUI, SetupMember, ToCharacterInfo

### `CUIIngameRoundStatus.cs`
Path: `ScriptDev/UI/InGame/CUIIngameRoundStatus.cs`
**Class**: EUIIngameRoundStatusRoundResult, CUIIngameRoundStatus, RoundResultUI
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, PrepareContent, Setup, Show, Setcontents

### `CUIIngameTactical.cs`
Path: `ScriptDev/UI/InGame/CUIIngameTactical.cs`
**Class**: CUIIngameTactical, TeamMemberUI, WeaponInfo, TacticalCardInfo, SynergyCardInfo
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, PrepareContent, StartTime, OnChangeSelectTacticalCardSlot, OnPanelRelase, OnUpdatePlayerData, OnUpdateTeamSynergy, OnClickButtonMap, OnClickButtonWeaponSelect, OnClickButtonTacticalSelect, RequestChangeWeapon, RequestChangeTacticalCard, OnClickSynergyInfo, BindUI, SetUIContents, SetContents

### `CUIIngameTotalResult.cs`
Path: `ScriptDev/UI/InGame/CUIIngameTotalResult.cs`
**Class**: CUIIngameTotalResult, EScoreTabRound, MemberResultUI
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, PrepareContent, SetupScoreProc, OnPanelRelase, OnUpdatePlayScore, OnSelectScoreRoundTab, OnClickNextButton, BindUI, SetupContents, UpdateContents

### `CUIIngameUtility.cs`
Path: `ScriptDev/UI/InGame/CUIIngameUtility.cs`
**Class**: UIIngameHelper
**NS**: ProjectAegis.UI.Ingame
**Methods**: HelperGetCharacterClassInfo, HelperGetCharacterClassIcon, HelperSetCharacterClassIcon, HelperSetCharacterPortrait, HelperSetCharacterFullShot, HelperCharacterDefaultWeaponID, HelperWeaponPortraitURL, HelperWeaponIconURL, HelperWeaponTypeIconURL, HelperGetPlayerWeaponID, HelperFindGearSet

### `InGameMainHUD.cs`
Path: `ScriptDev/UI/InGame/InGameMainHUD.cs`
**Class**: InGameMainHUD
**NS**: GameSources.ScriptDev.UI.InGame

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

## `ScriptDev/UI/Option/`

### `CUIOptionPanel.cs`
Path: `ScriptDev/UI/Option/CUIOptionPanel.cs`
**Class**: CUIOptionPanel
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, OnPanelEnabled, OnPanelDisabed, OnPanelRelase, OnShow, UpdateUI, UpdateCategoryContent, OnButtonBack, OnSelectOptionCategory, OnButtonReset, SetData, GetCellCount

### `IOptionSlot.cs`
Path: `ScriptDev/UI/Option/IOptionSlot.cs`
**Class**: IOptionSlot
**NS**: ProjectAegis.UserDatas

### `OptionSlotBase.cs`
Path: `ScriptDev/UI/Option/OptionSlotBase.cs`
**Class**: OptionSlotBase
**NS**: ProjectAegis.UserDatas
**Methods**: Initialize, ParseContentString, SetValue, ClampValue, ResetToDefault

### `OptionSlotFactory.cs`
Path: `ScriptDev/UI/Option/OptionSlotFactory.cs`
**Class**: OptionSlotFactory
**NS**: ProjectAegis.UserDatas
**Methods**: Create, CreateSlotByUIType

### `OptionSlotViewBase.cs`
Path: `ScriptDev/UI/Option/OptionSlotViewBase.cs`
**Class**: IOptionSlotView, OptionSlotViewBase, OptionSlotViewOneButton, OptionSlotViewToggleBtn, OptionSlotViewSlider
**NS**: ProjectAegis.UserDatas
**Methods**: Bind, UpdateUI, Clear, SetClickCallback, OnClick, OnToggleClick, OnSliderValueChanged

## `ScriptDev/UI/Option/Slots/`

### `OptionSlotAccountConnect.cs`
Path: `ScriptDev/UI/Option/Slots/OptionSlotAccountConnect.cs`
**Class**: OptionSlotAccountConnect
**NS**: ProjectAegis.UserDatas
**Methods**: ParseContentString, ClampValue

### `OptionSlotCopy.cs`
Path: `ScriptDev/UI/Option/Slots/OptionSlotCopy.cs`
**Class**: OptionSlotCopy
**NS**: ProjectAegis.UserDatas
**Methods**: ParseContentString, ClampValue

### `OptionSlotLanguage.cs`
Path: `ScriptDev/UI/Option/Slots/OptionSlotLanguage.cs`
**Class**: OptionSlotLanguage
**NS**: ProjectAegis.UserDatas
**Methods**: ParseContentString, ClampValue

### `OptionSlotOneButton.cs`
Path: `ScriptDev/UI/Option/Slots/OptionSlotOneButton.cs`
**Class**: OptionSlotOneButton
**NS**: ProjectAegis.UserDatas
**Methods**: ParseContentString, ClampValue

### `OptionSlotSlider.cs`
Path: `ScriptDev/UI/Option/Slots/OptionSlotSlider.cs`
**Class**: OptionSlotSlider
**NS**: ProjectAegis.UserDatas
**Methods**: ParseContentString, ClampValue, Increase, Decrease

### `OptionSlotSmallBtn.cs`
Path: `ScriptDev/UI/Option/Slots/OptionSlotSmallBtn.cs`
**Class**: OptionSlotSmallBtn
**NS**: ProjectAegis.UserDatas
**Methods**: ParseContentString, ClampValue

### `OptionSlotToggle2Btn.cs`
Path: `ScriptDev/UI/Option/Slots/OptionSlotToggle2Btn.cs`
**Class**: OptionSlotToggle2Btn
**NS**: ProjectAegis.UserDatas
**Methods**: ParseContentString, ClampValue

### `OptionSlotToggle3Btn.cs`
Path: `ScriptDev/UI/Option/Slots/OptionSlotToggle3Btn.cs`
**Class**: OptionSlotToggle3Btn
**NS**: ProjectAegis.UserDatas
**Methods**: ParseContentString, ClampValue

### `OptionSlotToggleSlider.cs`
Path: `ScriptDev/UI/Option/Slots/OptionSlotToggleSlider.cs`
**Class**: OptionSlotToggleSlider
**NS**: ProjectAegis.UserDatas
**Methods**: ParseContentString, ClampValue, SetToggle, Increase, Decrease, ResetToDefault

### `UIOptionSlotItem.cs`
Path: `ScriptDev/UI/Option/Slots/UIOptionSlotItem.cs`
**Class**: UIOptionSlotItem
**NS**: ProjectAegis.UI
**Methods**: CacheRoots, SetData

## `ScriptDev/UI/Profile/`

### `UIGNBElement.cs`
Path: `ScriptDev/UI/Profile/UIGNBElement.cs`
**Class**: EGNBViewType, EGNBMenuDummy, UIGNBElement
**NS**: ProjectAegis.UI
**Methods**: SetActive, OnSelectTab, SetTabWithoutNotify, ClearLockButton, SetLockButton, UIGNBElement

### `UIPanelEditProfile.cs`
Path: `ScriptDev/UI/Profile/UIPanelEditProfile.cs`
**Class**: UIPanelEditProfile, EProfileEditPage
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, SetTarrgetViewProfile, OnPanelEnabled, OnPanelDisabed, OnLeftMenuSelectChanged

### `UIPanelProfile.cs`
Path: `ScriptDev/UI/Profile/UIPanelProfile.cs`
**Class**: UIPanelProfile, EProfilePage
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, SetTargetProfile, OnPanelEnabled, OnPanelDisabed, SetPage, OnPanelRelase, OnProfilePageLockNotice, OnGNBMenuSelectChanged, RefreshContent

### `UIWidgetProfile.cs`
Path: `ScriptDev/UI/Profile/UIWidgetProfile.cs`
**Class**: UIWidgetProfile
**NS**: ProjectAegis.UI
**Methods**: SetActive, UpdateProfile, GetProfileButton, UIWidgetProfile

## `ScriptDev/UI/Profile/Elements/`

### `ProfileWidgets.cs`
Path: `ScriptDev/UI/Profile/Elements/ProfileWidgets.cs`
**Class**: UISlotBase, UISlotNameValueslot, UISlotTitle, ProfilWidgetBase, WidgetFavorit, EFavoritType, WidgetStatistics, WidgetProfile, WidgetTitles, WidgetLeague, BattleTypeComboCtrl, ComboItem
**NS**: ProjectAegis.UI.Profile
**Methods**: SetData, SetName, SetValue, UpdateContent, UpdateWidgetContent, SetHasNotJoinedClan, SetHasJoinedClan, CopyUIDToClipboard, Set, OnClickSlot, SetBattleTypeWithoutNotify, HideDropdown, OnButtonShowDropDown, OnItemSelect, OnTouchDetected, UISlotBase, UISlotNameValueslot, UISlotTitle, ProfilWidgetBase, WidgetFavorit, WidgetStatistics, WidgetProfile, WidgetTitles, WidgetLeague, ComboItem (+ 1 more)

### `UIEditProfilePageBasic.cs`
Path: `ScriptDev/UI/Profile/Elements/UIEditProfilePageBasic.cs`
**Class**: UIEditProfilePageBasic, Switch
**NS**: ProjectAegis.UI.Profile
**Methods**: OnButtonToggleOn, OnButtonToggleOff, SetOnOff, BindUI, OnPageActived, OnPageDeactived, OnClickChangeNickname, TryChangeAcept, OnGS2C_ChangeNicknameAck, OnTryChangeAllowViewProfile, OnTryChangeAllowViewStatistics, OnTryChangeAllowViewMatchHistory, OnGS2C_SetPrivacySettingsAck, Switch, UIEditProfilePageBasic

### `UIEditProfilePageDeco.cs`
Path: `ScriptDev/UI/Profile/Elements/UIEditProfilePageDeco.cs`
**Class**: UIEditProfilePageDeco, IEditSpecTypeController, EditIconTypeController, EditFrameTypeController, EditBannerTypeController
**NS**: ProjectAegis.UI.Profile
**Methods**: GetEquipedItemID, GetIndexedItem, BindUI, OnChangeSpecifiedPageType, OnPageActived, OnPageDeactived, SetData, GetCellCount, RefreshUIChangeEquiped, RefreshUIChangeSelection, RefreshButtonState, OnSelectContentItem, OnButtonEquip, OnGS2C_EquipProfileItemAck, EditIconTypeController, EditFrameTypeController, EditBannerTypeController, UIEditProfilePageDeco

### `UIEditProfilePageStatistics.cs`
Path: `ScriptDev/UI/Profile/Elements/UIEditProfilePageStatistics.cs`
**Class**: UIEditProfilePageStatistics, SelectSlot
**NS**: ProjectAegis.UI.Profile
**Methods**: SetSelection, SetValueData, OnBtnToggleButton, BindUI, OnPageActived, OnPageDeactived, RefreshSelectCount, RefreeshSelectionDatas, RefreshUISelection, OnTrySelectChange, OnGS2C_SetSelectedStatisticsAck, SelectSlot, UIEditProfilePageStatistics

### `UIEditProfilePageTitles.cs`
Path: `ScriptDev/UI/Profile/Elements/UIEditProfilePageTitles.cs`
**Class**: UIEditProfilePageTitles, EquippedSlot, TitleCompare
**NS**: ProjectAegis.UI.Profile
**Methods**: SetEquiped, OnClickSlot, UpdateButtonState, BindUI, Equals, GetHashCode, OnPageActived, OnPageDeactived, RefreshEquipedDatas, RefreshEquipedSlots, SetData, GetCellCount, UpdateUIChangeEquiped, UpdateUIChangeSelection, OnSelectTargetSlot, OnSlotSelect, OnButtonEquip, OnButtonUnequip, TryToEquipChange, OnGS2C_SelectTitlesAck, EquippedSlot, UIEditProfilePageTitles

### `UIProfileDecoSlot.cs`
Path: `ScriptDev/UI/Profile/Elements/UIProfileDecoSlot.cs`
**Class**: UIProfileDecoSlot
**NS**: ProjectAegis.UI.Profile
**Methods**: Awake, SetSelectCallback, Setup, OnClickSlot

### `UIProfilePage.cs`
Path: `ScriptDev/UI/Profile/Elements/UIProfilePage.cs`
**Class**: UIProfilePage
**NS**: ProjectAegis.UI.Profile
**Methods**: SetPageActive, SetSpecifiedPageType, BindUI, OnUserDataChanged, RefreshContent, OnChangeSpecifiedPageType, OnUpdatedContentData, UpdateStaticContent, OnPageActived, OnPageDeactived, ClearUIDatas, UIProfilePage

### `UIProfilePageHistory.cs`
Path: `ScriptDev/UI/Profile/Elements/UIProfilePageHistory.cs`
**Class**: UIProfilePageHistory, HistorySlot
**NS**: ProjectAegis.UI.Profile
**Methods**: SetActive, SetHistory, BindUI, RefreshContent, UpdateContent, OnSelectBattleTypeEvent, HistorySlot, UIProfilePageHistory

### `UIProfilePageInfo.cs`
Path: `ScriptDev/UI/Profile/Elements/UIProfilePageInfo.cs`
**Class**: UIProfilePageInfo
**NS**: ProjectAegis.UI.Profile
**Methods**: BindUI, OnPageActived, RefreshContent, OnUpdatedContentData, ClearUIDatas, OnButtonOpenEditProfile, OnButtonSharePRofile, UIProfilePageInfo

### `UIProfilePageStatistics.cs`
Path: `ScriptDev/UI/Profile/Elements/UIProfilePageStatistics.cs`
**Class**: UIProfilePageStatistics, CharcterSlot
**NS**: ProjectAegis.UI.Profile
**Methods**: SetSelect, SetActive, OnClickSlot, BindUI, RefreshContent, Setup, UpdateStaticContent, OnSelectCharacter, OnSelectBattleTypeEvent, CharcterSlot, UIProfilePageStatistics

### `UIProfileTitleSlot.cs`
Path: `ScriptDev/UI/Profile/Elements/UIProfileTitleSlot.cs`
**Class**: UIProfileTitleSlot
**NS**: ProjectAegis.UI.Profile
**Methods**: Awake, OnClickSlot, SetSelectCallback, SetTitle

### `UISideMenu.cs`
Path: `ScriptDev/UI/Profile/Elements/UISideMenu.cs`
**Class**: UISideMenu, MenuItem
**NS**: ProjectAegis.UI.Profile
**Methods**: OnBtnClick, SetSelectWithoutNotify, OnSelectMenuItem, MenuItem, UISideMenu

## `ScriptDev/UI/Ranking/`

### `UIPanelRanking.cs`
Path: `ScriptDev/UI/Ranking/UIPanelRanking.cs`
**Class**: ERankingTab, RankingConstants, CUIRankingTitleSlot, CUIRankingLeaderboard, CUIRankingReward, UIPanelRanking
**NS**: ProjectAegis.UI
**Methods**: GetRankIconName, FormatRankText, CalcRankRangeStart, SetData, InitUIBind, BindScroll, BindUserInfo, BindTitleSlots, SetUserInfoBasic, SetUserInfoFromProfile, SetMainCharacter, SetLeague, SetClanInfo, SetClanDisplay, SetTitles, SetMyRank, ReloadScroll, GetVisibleSlots, Release, Clear, BindRewardInfo, BindButtons, RefreshMyRewardInfo, SetRewardTitle, UpdateRewardPreview (+ 33 more)

### `UIRankingLeaderboardSlot.cs`
Path: `ScriptDev/UI/Ranking/UIRankingLeaderboardSlot.cs`
**Class**: UIRankingLeaderboardSlot
**NS**: ProjectAegis.UI
**Methods**: Awake, SetUp, SetSelected, SetRankDisplay, ApplyRankIcon, SetProfileDisplay, OnClick

### `UIRankingRewardGroupSlot.cs`
Path: `ScriptDev/UI/Ranking/UIRankingRewardGroupSlot.cs`
**Class**: UIRankingRewardGroupSlot
**NS**: ProjectAegis.UI
**Methods**: Awake, SetUp, SetNoRecord, ClearItemSelection, GetFirstActiveItemSlot, SetRankDisplay, SetRewardItems, EnsureItemSlots

### `UIRankingRewardItemSlot.cs`
Path: `ScriptDev/UI/Ranking/UIRankingRewardItemSlot.cs`
**Class**: UIRankingRewardItemSlot
**NS**: ProjectAegis.UI
**Methods**: Awake, SetUp, SetSelected, OnClick, GetItemTextureName

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

## `ScriptDev/UI/UIElements/`

### `DropDown.cs`
Path: `ScriptDev/UI/UIElements/DropDown.cs`
**Class**: DropDownContent, MenuItem, DropDownLabel
**NS**: ProjectAegis.UI
**Methods**: Setup, SetClickEvent, HideAllItems, MakeItems, ShowDropDown, OnSelectItem, SetupItemDatas, SetItemIndexWithoutNotify, OnClickOpenDropDown, SetDropDownItemIndex, ResetContent, SetDropDownFocus, MenuItem, DropDownContent, DropDownLabel

### `UIElementRoot.cs`
Path: `ScriptDev/UI/UIElements/UIElementRoot.cs`
**Class**: UIElementRoot
**NS**: ProjectAegis.UI
**Methods**: UIElementRoot

## `ScriptDev/UI/UIFramework/`

### `CUIManager.cs`
Path: `ScriptDev/UI/UIFramework/CUIManager.cs`
**Class**: ELayout, CUIManager
**NS**: ProjectAegis.UI.Framework
**Methods**: EnableNavigation, DisableNavigation, ClearNavigationHistory, InitializeSingleton, TryGetPanelAttribute, InitLayouts, UpdateResolutionGuarantee, CalcDragThreshold, SetPixelDragThreshold, TryGetLayout, HasUIInstanceInternal, FindUIInstanceInternal, InstantiateInternal, OnPanelHideCompleted, DestroyDeactiveUIContentInternal, HideAllPanelsInternal, DestroyPanels, DestoryAllPanels, HasFlowUIInstance, HideAllFlowUI, DestroyAllExceptFlowUI, FindUIInstance, GetActiveUIPanelNames, IsUIPanelActive, ShowPanelInstance (+ 18 more)

### `CUIPanel.cs`
Path: `ScriptDev/UI/UIFramework/CUIPanel.cs`
**Class**: CUIPanel, InOutOption
**NS**: ProjectAegis.UI.Framework
**Methods**: Play, WaitAndCall, TryGetChildPanel, ShowChildPanel, HideChildPanel, HideAllChildPanels, OnChildPanelHided, InitPosition, SetInitPositionForEdit, SetHideCallback, Awake, OnEnable, OnDisable, Hide, HideImmediate, CallHideCallback

### `CUIPanelContent.cs`
Path: `ScriptDev/UI/UIFramework/CUIPanelContent.cs`
**Class**: EHideOption, CUIPanelContent
**NS**: ProjectAegis.UI.Framework
**Methods**: Log, SetAsLastSibling, Initialize, InitAttachAsset, InitUIBind, PrepareContent, OnShow, OnPanelRelase, OnEnable, OnDisable, OnPanelEnabled, OnPanelDisabed, OnBackButton, Show, Hide, HideImmediate, HideChildPanel

### `CUIPanelLayout.cs`
Path: `ScriptDev/UI/UIFramework/CUIPanelLayout.cs`
**Class**: CUIPanelLayout
**NS**: ProjectAegis.UI.Framework
**Methods**: Awake, LastActivePanel, DestroyAllPanels, DebugLog, RectTransform

### `UIAttachAsset.cs`
Path: `ScriptDev/UI/UIFramework/UIAttachAsset.cs`
**Class**: UIAttachAssetAttribute
**NS**: ProjectAegis.UI.Framework
**Methods**: Instantiate, ReleaseInstance, UIAttachAssetAttribute

### `UILayoutEditSupport.cs`
Path: `ScriptDev/UI/UIFramework/UILayoutEditSupport.cs`
**Class**: UILayoutEditSupport, ERuntimeTestMode
**NS**: ProjectAegis.UI.Layouts
**Methods**: OnEnable, OnDisable, Start, OpenUIEditorLevel

### `UILayoutEditSupportEditor.cs`
Path: `ScriptDev/UI/UIFramework/UILayoutEditSupportEditor.cs`
**Class**: UILayoutEditSupport, PrefabInfo, UILayoutEditSupportEditor
**NS**: ProjectAegis.UI.Layouts
**Methods**: CreateLobbyBackGround, DestroyLobbyBackGround, HasLobbyBackGround, GetLobbyBackGroundInstance, UpdatePrefabPath, UpdateFilteredPrefabInfos, RecollectPrefabs, RestorePrefabInstances, ShowPrefabInstance, HidePrefabInstance, MoveTop, ClearAllPrefabPanels, CollectContentTypes, UpdateFilteredContentInfos, OnEnable, OnDestroy, OnChangedPrefabCollection, OnInspectorGUI, DrawLobbyBackGroundSection, ReorderListPrefabEditorable_DrawHeader, ReorderListPrefabEditorable_DrawElement, OnInitilizePrefabEditSupport, OnDrawPrefabEditSupport, ReorderListContentEditorable_DrawHeader, ReorderListContentEditorable_DrawElement (+ 2 more)

### `UINavigationControl.cs`
Path: `ScriptDev/UI/UIFramework/UINavigationControl.cs`
**Class**: UINavigationControl, PageSnapshot, EditorHistoryEntry
**NS**: ProjectAegis.UI.Framework
**Methods**: FindPanelDelegate, GetActivePopupsDelegate, ShowPanelByTypeDelegate, TryGetLayoutDelegate, FindActivePanelByLayoutDelegate, Initialize, PushCurrentPage, TryPopPreviousPage, UpdateCurrentPage, Clear, GetHistoryDebugInfo, EditorGetActivePopups, EditorGetHistoryStack, HandleBackButton, FindTopActivePopup, TryCloseTopPopup, TryRestorePreviousPage, HandleLastPage, RestorePageWithPopups, FindActivePageType, PageSnapshot

### `UIPanelAssetAttribute.cs`
Path: `ScriptDev/UI/UIFramework/UIPanelAssetAttribute.cs`
**Class**: EAssetLoadType, UIPanelAssetAttribute
**NS**: ProjectAegis.UI.Framework
**Methods**: FindOrLoadLocation, InternalLoadCache, InstantiateInternal, Instantiate, DestroyInstance, ReleaseCache, ToDebugLog, UIPanelAssetAttribute

## `ScriptDev/UI/UIFramework/Components/`

### `UIButton.cs`
Path: `ScriptDev/UI/UIFramework/Components/UIButton.cs`
**Class**: EButtonState, UIButton, ButtonStateData
**NS**: ProjectAegis.UI
**Methods**: SetColors, UpdateStateUI, Awake, GetActColor, RefreshState, DoStateTransition, ButtonStateData

## `ScriptDev/UI/UIFramework/Editor/`

### `CUILayoutGroupEditor.cs`
Path: `ScriptDev/UI/UIFramework/Editor/CUILayoutGroupEditor.cs`
**Class**: CUILayoutGroupEditor, CUILayoutGroupSingleDementsionEditor
**NS**: ProjectAegis.UI.Layouts.Editors
**Methods**: OnEnable, OnInspectorGUI, OnFinalInspectorGUI, SetMarkUpUpdateLayout, DrawLayoutEdit, DrawLayout, DrawChildAlignmentExtra

### `CUILayoutGroupGridEditor.cs`
Path: `ScriptDev/UI/UIFramework/Editor/CUILayoutGroupGridEditor.cs`
**Class**: CUILayoutGroupGridEditor
**NS**: ProjectAegis.UI.Layouts.Editors
**Methods**: OnEnable, DrawLayoutEdit

### `CUILayoutGroupHorizontalEditor.cs`
Path: `ScriptDev/UI/UIFramework/Editor/CUILayoutGroupHorizontalEditor.cs`
**Class**: CUILayoutGroupHorizontalEditor
**NS**: ProjectAegis.UI.Layouts.Editors
**Methods**: OnEnable, DrawLayout, DrawChildAlignmentExtra

### `CUILayoutGroupVerticalEditor.cs`
Path: `ScriptDev/UI/UIFramework/Editor/CUILayoutGroupVerticalEditor.cs`
**Class**: CUILayoutGroupVerticalEditor
**NS**: ProjectAegis.UI.Layouts.Editors
**Methods**: OnEnable, DrawLayout, DrawChildAlignmentExtra

### `CUILayoutTreeElementEditor.cs`
Path: `ScriptDev/UI/UIFramework/Editor/CUILayoutTreeElementEditor.cs`
**Class**: CUIElementTextPostScalerDrawer, CUIElementTMProPostScalerDrawer, CUILayoutTreeElementEditor
**NS**: ProjectAegis.UI.Layouts.Editors
**Methods**: GetPropertyHeight, OnGUI, OnEnable, OnInspectorGUI

### `CUIPanelEditor.cs`
Path: `ScriptDev/UI/UIFramework/Editor/CUIPanelEditor.cs`
**Class**: CUIPanelEditor
**NS**: ProjectAegis.UI.Framework.Editors
**Methods**: OnEnable, OnInspectorGUI

### `CUIPanelLayoutEditor.cs`
Path: `ScriptDev/UI/UIFramework/Editor/CUIPanelLayoutEditor.cs`
**Class**: CUIPanelLayoutEditor
**NS**: ProjectAegis.UI.Framework.Editors
**Methods**: OnEnable, OnInspectorGUI

### `EditorEventUtiility.cs`
Path: `ScriptDev/UI/UIFramework/Editor/EditorEventUtiility.cs`
**Class**: EditorEventUtiility
**NS**: ProjectAegis.UI.Editors
**Methods**: IsDoubleClick

### `UICanvasAnchorEditor.cs`
Path: `ScriptDev/UI/UIFramework/Editor/UICanvasAnchorEditor.cs`
**Class**: UICanvasAnchorEditorBase, UICanvasCornerAnchorEditor, UICanvasEdgeAnchorEditor, UICanvasSafeAnchorEditor
**NS**: ProjectAegis.UI.Layouts.Editors
**Methods**: OnEnable, OnDisable, DrawAnchorEdit, OnInspectorGUI

### `UITemplateImporter.cs`
Path: `ScriptDev/UI/UIFramework/Editor/UITemplateImporter.cs`
**Class**: UITemplateImporter, UIPrefabPreview, UIPrefabPreviewRenderer, UIPrefabPreviewCache
**NS**: ProjectAegis.UI.Editors
**Methods**: ObjectToFile, ShowWindow, UpdateFiltered, RefreshAssets, OnEnable, OnDestroy, OnGUI, DrawDragDropArea, CreatePrefabFromGameObject, SaveDescription, ImportAset, GeneratePreview, SetupPreviewScene, ConvertToTexture2D, CleanupPreviewScene, RenderPreview, Dispose, GetPreview, ClearCache, UIPrefabPreviewRenderer

## `ScriptDev/UI/UIFramework/Editor/Components/`

### `UIButtonEditor.cs`
Path: `ScriptDev/UI/UIFramework/Editor/Components/UIButtonEditor.cs`
**Class**: UIButtonEditor
**NS**: ProjectAegis.UI.Editors.Component
**Methods**: OnEnable, OnInspectorGUI, DrawExtGUI

## `ScriptDev/UI/UIFramework/Layout/`

### `CanvasSafeAreaHelper.cs`
Path: `ScriptDev/UI/UIFramework/Layout/CanvasSafeAreaHelper.cs`
**Class**: EUICorner, EUIEdge, EUIEdgeMask, CanvasSafeAreaHelper, RectExtention
**NS**: ProjectAegis.UI.Layouts
**Methods**: OnCanvasSafeAreaRebuildedEventHandler, UpdateChangedEditorDeviceEnv, Start, OnEnable, OnRectTransformDimensionsChange, LateUpdate, InvalidateSafeCorners, GetSafeWorldCorner, GetWorldCorner, SafePaddingSize, OnDrawGizmosSelected, ToEdgeMask, GetPoint, GetValdiateEdgeMask

### `CUILayoutElementPostScaler.cs`
Path: `ScriptDev/UI/UIFramework/Layout/CUILayoutElementPostScaler.cs`
**Class**: EPostScalerType, CUIElementPostScaler, CUIElementTextPostScaler, CUIElementTMProPostScaler, CUIPostScalerFactory
**NS**: ProjectAegis.UI.Layouts
**Methods**: SetElement, RegistEventCallback, UnregistEventCallback, OnScalerChanged, ForceUpdate, LateUpdateLagucyText, DelayUpdateScale, CalculateTxtPreferredHeight, OnTextChanged, ElementModePreferredHeight, ElementModePreferredWidth, CreateScaler, IsValidScalerTyppe

### `CUILayoutGroup.cs`
Path: `ScriptDev/UI/UIFramework/Layout/CUILayoutGroup.cs`
**Class**: CUILayoutGroup, CUILayoutUtill
**NS**: ProjectAegis.UI.Layouts
**Methods**: CalculateLayoutSize, ClmapedCalculatedSize, Awake, LateUpdate, ForceUpdateLayout, InvalidateChildAlign, MarkupUpdateLayout, CancelMarkupUpdate, OnDrawGizmos, ClmapBound

### `CUILayoutGroupGrid.cs`
Path: `ScriptDev/UI/UIFramework/Layout/CUILayoutGroupGrid.cs`
**Class**: CUILayoutGroupGrid, EContentLayout
**NS**: ProjectAegis.UI.Layouts
**Methods**: CalculateLayoutSize, InvalidateChildAlign, CalcuatleCellIndex, PoseIndexToOffset, OnDrawGizmosSelected

### `CUILayoutGroupHorizontal.cs`
Path: `ScriptDev/UI/UIFramework/Layout/CUILayoutGroupHorizontal.cs`
**Class**: CUILayoutGroupHorizontal
**NS**: ProjectAegis.UI.Layouts
**Methods**: CalculateLayoutSize, InvalidateChildAlign

### `CUILayoutGroupSingleDementsion.cs`
Path: `ScriptDev/UI/UIFramework/Layout/CUILayoutGroupSingleDementsion.cs`
**Class**: CUILayoutGroupSingleDementsion, EHorizontalAlignment, EVerticalAlignment
**NS**: ProjectAegis.UI.Layouts
**Methods**: ClampHorizontal, ClampVertical

### `CUILayoutGroupVertical.cs`
Path: `ScriptDev/UI/UIFramework/Layout/CUILayoutGroupVertical.cs`
**Class**: CUILayoutGroupVertical
**NS**: ProjectAegis.UI.Layouts
**Methods**: CalculateLayoutSize, InvalidateChildAlign

### `CUILayoutTreeElement.cs`
Path: `ScriptDev/UI/UIFramework/Layout/CUILayoutTreeElement.cs`
**Class**: CUILayoutTreeElement, LayoutElementMode
**NS**: ProjectAegis.UI.Layouts
**Methods**: GetIndexedChildElement, GetEnumerator, SetupTracker, Awake, SetRebuildChildAndDirt, Start, UpdateLocalGroupLayout, OnValidate, OnEnable, OnDisable, LinkParent, RegistLayoutChild, UnregistLayoutChild, OnBeforeTransformParentChanged, OnTransformParentChanged, OnRectTransformDimensionsChange, UpdateCachedSize, SetSize, SetSizeWithoutNotify, SetSizeAxiWithoutNotify

### `UICanvasAnchor.cs`
Path: `ScriptDev/UI/UIFramework/Layout/UICanvasAnchor.cs`
**Class**: UICanvasAnchor
**NS**: ProjectAegis.UI.Layouts
**Methods**: SetTracker, OnEnable, OnDisable, OnCanvasHierarchyChanged, OnRectTransformDimensionsChange, OnValidate, LayoutUpdate, ForceUpdate, ResetAnchor, UpdateLayoutInternal

### `UICanvasCornerAnchor.cs`
Path: `ScriptDev/UI/UIFramework/Layout/UICanvasCornerAnchor.cs`
**Class**: UICanvasCornerAnchor
**NS**: ProjectAegis.UI.Layouts
**Methods**: SetTracker, ResetAnchor, UpdateLayoutInternal, AlignCornerToWorldPosition

### `UICanvasEdgeAnchor.cs`
Path: `ScriptDev/UI/UIFramework/Layout/UICanvasEdgeAnchor.cs`
**Class**: UICanvasEdgeAnchor
**NS**: ProjectAegis.UI.Layouts
**Methods**: SetTracker, ResetAnchor, UpdateLayoutInternal

### `UICanvasSafeArea.cs`
Path: `ScriptDev/UI/UIFramework/Layout/UICanvasSafeArea.cs`
**Class**: UICanvasSafeArea
**NS**: ProjectAegis.UI.Layouts
**Methods**: ResetAnchor, UpdateLayoutInternal

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

### `AddressLoadingTracker.cs`
Path: `ScriptDev/UI/Utilities/AddressLoadingTracker.cs`
**Class**: AddressLoadingTracker
**NS**: ProjectAegis.Utility
**Methods**: IsLoading, StartLoading, EndLoading, AddPendingCallback, HasPendingCallbacks

### `ArrayExtension.cs`
Path: `ScriptDev/UI/Utilities/ArrayExtension.cs`
**Class**: ArrayExtension
**NS**: ProjectAegis.Utility
**Methods**: Sum

### `AspectRatioRawImage.cs`
Path: `ScriptDev/UI/Utilities/AspectRatioRawImage.cs`
**Class**: AspectRatioRawImage, ScaleMode, AspectRatioRawImageEditor
**NS**: ProjectAegis.Utility
**Methods**: Start, AdjustSize, OnInspectorGUI, OnSceneGUI

### `CanvasGroupExtenstion.cs`
Path: `ScriptDev/UI/Utilities/CanvasGroupExtenstion.cs`
**Class**: CanvasGroupExtenstion
**NS**: ProjectAegis.Utility
**Methods**: SetGroupAlpha, SetInteractable, FadeCanvasGroup

### `CompareExtension.cs`
Path: `ScriptDev/UI/Utilities/CompareExtension.cs`
**Class**: CompareExtension, CompareCClientItem
**NS**: ProjectAegis.Utility

### `ComponentExtension.cs`
Path: `ScriptDev/UI/Utilities/ComponentExtension.cs`
**Class**: ComponentExtension
**NS**: ProjectAegis.Utility
**Methods**: SafeSetActive, SetActive, SafeIsActive, IsActive

### `CUIRewardSlot.cs`
Path: `ScriptDev/UI/Utilities/CUIRewardSlot.cs`
**Class**: CUIRewardSlot
**NS**: ProjectAegis.UI
**Methods**: Awake, SetData

### `DictionaryExetension.cs`
Path: `ScriptDev/UI/Utilities/DictionaryExetension.cs`
**Class**: DictionaryExetension
**NS**: ProjectAegis.Utility

### `EmptyGraphics.cs`
Path: `ScriptDev/UI/Utilities/EmptyGraphics.cs`
**Class**: EmptyGraphics
**NS**: ProjectAegis.Utility
**Methods**: UpdateMaterial, OnPopulateMesh

### `EnumUtils.cs`
Path: `ScriptDev/UI/Utilities/EnumUtils.cs`
**Class**: EnumUtils
**NS**: ProjectAegis.Utility

### `FunctionExtension.cs`
Path: `ScriptDev/UI/Utilities/FunctionExtension.cs`
**Class**: FunctionExtension
**NS**: ProjectAegis.Utility
**Methods**: SafeInvoke, HasClip

### `GameObjectExtension.cs`
Path: `ScriptDev/UI/Utilities/GameObjectExtension.cs`
**Class**: GameObjectExtension
**NS**: ProjectAegis.Utility
**Methods**: ChangeLayer

### `ListExtension.cs`
Path: `ScriptDev/UI/Utilities/ListExtension.cs`
**Class**: ListExtension
**NS**: ProjectAegis.Utility

### `LocalizeExtension.cs`
Path: `ScriptDev/UI/Utilities/LocalizeExtension.cs`
**Class**: LocalizeExtension
**Methods**: Localize, LocalizeFormat, ObserveLocalizeEvent, OnLocalized, ToOfflieTime, ToRemainTimString, ToSystemRemainTimString

### `OutGameStatContainer.cs`
Path: `ScriptDev/UI/Utilities/OutGameStatContainer.cs`
**Class**: EStatQueryType, EStatBuildDirtyFlag, StatDifference, OutGameStatSnapshot, WeaponStatSnapshot, CharacterStatLayer, WeaponStatLayer, PassiveStatLayer, OutGameStatContainer
**NS**: ProjectAegis.Data
**Methods**: GetDifference, GetDifferencePercent, GetBeforeValue, GetAfterValue, GetChangedStats, GetIncreasedStats, GetDecreasedStats, GetValue, Init, GetBaseValue, GetAllBaseStats, GetStatTypes, SetDirty, FindCharacterStatByLevel, InitWeaponOnly, LoadWeaponStats, LoadModuleStats, LoadPerkStats, ApplyPerkEffect, LoadPassiveModuleStats, ApplyPassiveEffectToDict, GetWeaponOnlyStat, GetWeaponWithModuleStat, GetModuleOnlyStat, GetWeaponOnlyStats (+ 35 more)

### `OutGameUIUtils.cs`
Path: `ScriptDev/UI/Utilities/OutGameUIUtils.cs`
**Class**: OutGameUIUtils
**NS**: ProjectAegis.Utility
**Methods**: ContentNavigation, GotoHome, OpenCharacterPanel, OpenClanPanel, OpenAchievement, OpenRankingPanel, OnRankingDataReceive, OpenFriendPanel, OnFriendListReceive, OpenOptionPanel, ShowConfirmPopup, ShowYesNoCommonPopup, ShowProgressBarPopup, IsCharacterSkin, ToWeaponSlotType, GetWeaponSlotTypeToESkinWeaponType

### `RefDataExtention.cs`
Path: `ScriptDev/UI/Utilities/RefDataExtention.cs`
**Class**: RefDataExtention
**NS**: ProjectAegis
**Methods**: ToLocalize, HasRedDotCondition, GetNewDotCondition, BuildRedDotConditions, GetItemIconName

### `StringUtils.cs`
Path: `ScriptDev/UI/Utilities/StringUtils.cs`
**Class**: StringUtils
**NS**: ProjectAegis.Utility
**Methods**: GetOrdinalSuffix

### `TMProExtension.cs`
Path: `ScriptDev/UI/Utilities/TMProExtension.cs`
**Class**: TMProExtension
**NS**: ProjectAegis.Utility
**Methods**: SetShader

### `TransformExtension.cs`
Path: `ScriptDev/UI/Utilities/TransformExtension.cs`
**Class**: TransformExtension
**NS**: ProjectAegis.Utility
**Methods**: SetParentAndResetTransform, SetActiveChildIndex, GetHierarchyFullPath, FindChecked, TryGetGameObject, FindChildRecursively, FindRootTransform, FindChildRecursive, Traverse, GetPositionXZ, DestroyChildren, HasActiveChild

### `UGUIExtension.cs`
Path: `ScriptDev/UI/Utilities/UGUIExtension.cs`
**Class**: UGUIExtension
**NS**: ProjectAegis.Utility
**Methods**: SetClickEvent, RemoveClickEvent, ClearClickEvent, SetOnHold, SetActiveParentTransform, SetInteractionOnOff, SafeSetText, SafeSetColor, SetLocalizeTerms, SetText, SetSprite, SafeLoadAsyncSprite, SafeLoadAsyncSpriteFallBack, SetTexture, SafeLoadAsyncTexture, SafeLoadAsyncTextureFallBack, SafeSetAmount, SafeSetEnabled, HoldScroll, SetSiblingIndex, GetSiblingIndex, MoveUP, MoveDown, MoveToTop, MoveToBottom (+ 7 more)

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

## `ScriptDev/UI/Utilities/ProgressBar/`

### `HorizontalFillGuage.cs`
Path: `ScriptDev/UI/Utilities/ProgressBar/HorizontalFillGuage.cs`
**Class**: HorizontalFillGuage
**NS**: ProjectAegis.Utility
**Methods**: OnEnable, OnDisable, OnRectTransformDimensionsChange, RefreshFillAmount, OnValidate, Update

### `ProgressBar.cs`
Path: `ScriptDev/UI/Utilities/ProgressBar/ProgressBar.cs`
**Class**: ProgressBar, FillDirection, ProgressBarEditor
**NS**: ProjectAegis.Utility
**Methods**: Initialize, SetBarFillColor, SetBarFillColorNormal, SetGhostFillColor, UpdateBarFillColor, UpdateGhostFillColor, AnimateBarFill, AnimateBarExtFill, AnimateGhostFill, AnimateFill, SetFillPosition, UpdateRectTracker, OnEnable, OnDisable, UpdateBarFill, UpdateBarExtFill, UpdateGhostFill, OnValidate, OnInspectorGUI

### `ProgressBarImage.cs`
Path: `ScriptDev/UI/Utilities/ProgressBar/ProgressBarImage.cs`
**Class**: ProgressBarImage
**NS**: ProjectAegis.Utility
**Methods**: OnPopulateMesh, GenerateSlicedSprite, SetVertices, SetUVs, AddSlicedQuads, AddQuad, AdjustBorders

## `ScriptDev/UI/Utilities/RedDot/`

### `CRedDotCategoryHandler.cs`
Path: `ScriptDev/UI/Utilities/RedDot/CRedDotCategoryHandler.cs`
**Class**: RedDotCategory, CRedDotCategoryHandler
**NS**: ProjectAegis.Utility
**Methods**: IsManagedCategory, IsActiveCheckByCategory, GetCount

### `CUIRedDot.cs`
Path: `ScriptDev/UI/Utilities/RedDot/CUIRedDot.cs`
**Class**: CUIRedDot, RedDotCheckType, CountDisplayMode, RedDotCondition
**NS**: ProjectAegis.Utility
**Methods**: Awake, OnEnable, OnDisable, OnDestroy, OnRedDotStateChanged, SetReddotTarget, SetConditions, SetConditionsWithoutCheck, SetNewDotCondition, SetNewDotTarget, SetCountDisplayMode, CheckRedDot, CalculateCount, UpdateCountDisplay, OnRefreshSelf

## `ScriptDev/UI/Utilities/Scroll/`

### `IScrollData.cs`
Path: `ScriptDev/UI/Utilities/Scroll/IScrollData.cs`
**Class**: IScrollData
**NS**: ProjectAegis.Utility

### `OptimizedScrollRect.cs`
Path: `ScriptDev/UI/Utilities/Scroll/OptimizedScrollRect.cs`
**Class**: ScrollRectCell, OptimizedScrollRect, ScrollDirection, ScrollTask, OptimizedScrollRectEditor
**NS**: ProjectAegis.Utility
**Methods**: SetProvider, Initialize, ReloadData, StartScroll, ClearCache, RefreshAllCells, RefreshCell, JumpToCell, UpdateContentSize, OnScrollValueChanged, UpdateScrollBounds, IsCellVisible, GetCellPosition, ProcessScrollTasks, AddScrollTask, UpdateCellVisibility, ResetScroll, DestroyAllCells, ClearPool, TrimPool, GetOrCreateCell, ReturnCellToPool, SetTopLeftAnchor, SetAnchor, OnInspectorGUI (+ 2 more)

### `ScrollExtension.cs`
Path: `ScriptDev/UI/Utilities/Scroll/ScrollExtension.cs`
**Class**: ScrollExtension
**NS**: ProjectAegis.Utility
**Methods**: UpdateScrollability, CalculateMaxVisibleCells

### `ScrollSnap.cs`
Path: `ScriptDev/UI/Utilities/Scroll/ScrollSnap.cs`
**Class**: ScrollSnap, ScrollDirection
**NS**: UnityEngine.UI.Extensions
**Methods**: PageSnapChange, Awake, Start, OnDisable, UpdateListItemsSize, UpdateListItemPositions, ResetPage, UpdateScrollbar, NextScreen, PreviousScreen, NextScreenCommand, PrevScreenCommand, CurrentPage, ChangePage, PageChanged, OnBeginDrag, OnEndDrag, OnDrag

## `ScriptDev/Utilities/AutoTest/`

### `AutoTester.GUI.cs`
Path: `ScriptDev/Utilities/AutoTest/AutoTester.GUI.cs`
**Class**: AutoTester
**Methods**: InitializeScenarioNames, OnGUI, EnsureTouchVisualizer, DrawControlWindow, DrawScenarioSelector, DrawRecordingUI, DrawReplayUI

## `ScriptDev/Utilities/UGUIPlus/`

### `ImagePlus.cs`
Path: `ScriptDev/Utilities/UGUIPlus/ImagePlus.cs`
**Class**: ImagePlus
**NS**: MoenenGames.UGUIPlus
**Methods**: OnPopulateMesh

## `ScriptDev/Utilities/UGUIPlus/Editor/`

### `EditorUtil.cs`
Path: `ScriptDev/Utilities/UGUIPlus/Editor/EditorUtil.cs`
**Class**: EditorUtil, SpriteUtil
**NS**: MoenenGames.UGUIPlus
**Methods**: CreateImagePlus, SimpleGUI, SimpleUseGUI, VertexColorGUI, MinMaxSliderGUI, GUIRect, Space, LayoutV, LayoutH, LayoutF, ResetInCanvasFor, InCanvas, GetCreateCanvas

### `ImagePlusEditor.cs`
Path: `ScriptDev/Utilities/UGUIPlus/Editor/ImagePlusEditor.cs`
**Class**: ImagePlusEditor
**NS**: MoenenGames.UGUIPlus
**Methods**: OnEnable, OnDisable, OnInspectorGUI, SpriteGUI, TypeGUI, HasPreviewGUI, OnPreviewGUI, GetInfoString, LayoutV, LayoutF

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

## `ScriptTools/Editor/`

### `BuildingGeneratorContextMenu.cs`
Path: `ScriptTools/Editor/BuildingGeneratorContextMenu.cs`
**Class**: BuildingGeneratorContextMenu
**Methods**: CreateWallMenu, CreateFloorMenu, AddWallMenuItem, AddFloorMenuItem, CreatePillarMenu, BuildingGeneratorContextMenu

### `BuildingGeneratorEditor.cs`
Path: `ScriptTools/Editor/BuildingGeneratorEditor.cs`
**Class**: BuildingGeneratorWindow, EditMode, DragDirection
**Methods**: ShowWindow

### `BuildingGeneratorGridEditor.cs`
Path: `ScriptTools/Editor/BuildingGeneratorGridEditor.cs`
**Class**: BuildingGeneratorGridEditor, EditMode
**Methods**: DrawGrid, DrawGhostFloor, DrawGridCells, DrawCellFloor, DrawCellWalls, DrawCellPillars, DrawGridLines, HandleGridEvents, HandleMouseDown, HandleMouseDrag, HandleMouseUp, HandleScrollWheel, HandleContextClick, ResetRepaintFlag

### `BuildingGeneratorSettingsPanel.cs`
Path: `ScriptTools/Editor/BuildingGeneratorSettingsPanel.cs`
**Class**: BuildingGeneratorSettingsPanel, SettingsTab
**Methods**: Draw, DrawTabHeader, GetTabLabel, DrawBasicSettings, DrawBuildingSettings, DrawMaterialSettings, DrawImportExportSettings, LoadDefaultMaterials, ClearAllMaterials, ClearCurrentFloor, ClearAllFloors, AddAllFloorsToCurrentLevel, BuildingGeneratorSettingsPanel

### `BuildingGeneratorUIHelper.cs`
Path: `ScriptTools/Editor/BuildingGeneratorUIHelper.cs`
**Class**: BuildingGeneratorUIHelper
**Methods**: GetWallColor, GetFloorColor, DrawWall, DrawFloor, DrawFloorRect, DrawTriangleFloor, GetTrianglePoints, DrawStairsFloor, GetStairStepRect, DrawStairsArrow, DrawPillar, DrawPillarCircle

### `BuildingJSONExporter.cs`
Path: `ScriptTools/Editor/BuildingJSONExporter.cs`
**Class**: BuildingJSONExporter, BuildingDataJSON, FloorDataJSON, CellDataJSON
**Methods**: ExportToJSON, ImportFromJSON, ConvertToJSON, ConvertFromJSON

### `CCanvasDataEditor.cs`
Path: `ScriptTools/Editor/CCanvasDataEditor.cs`
**Class**: CCanvasDataEditor
**NS**: ProjectAegis.Data
**Methods**: OpenDatabase, OnInspectorGUI

### `ComponentGUIDReplacer.cs`
Path: `ScriptTools/Editor/ComponentGUIDReplacer.cs`
**Class**: ComponentReplacerSelectMode, ComponentGUIDReplacer
**NS**: ProjectAegis.ScriptTools
**Methods**: OpenWindow, ListPrefabsRecursive, CollectTargetComponent, CheckTranslate, ExtractGUIDFromMonoScript, ExtractGUIDFromType, GetChangeTargetGUID, GetReplaceTargetGUID, FindMonoScriptPathByClassType, OnEnable, OnGUI, TrnaslateComponent, TranslateGUID, BatchTrnaslateComponent, TranslateDir

### `NavigationHistoryEditorWindow.cs`
Path: `ScriptTools/Editor/NavigationHistoryEditorWindow.cs`
**Class**: NavigationHistoryEditorWindow
**NS**: ProjectAegis.EditorTools
**Methods**: ShowWindow, InitStyles, OnGUI, DrawTitle, DrawSeparator, DrawInfoBox, DrawNavigationStatus, DrawControlButtons, DrawCurrentState, DrawHistoryStack, DrawFooter, Update

### `OutGameCharacterDataViewer.cs`
Path: `ScriptTools/Editor/OutGameCharacterDataViewer.cs`
**Class**: OutGameCharacterDataViewer
**Methods**: Open, OpenWithCharacter, OnEnable, OnGUI, OnInspectorUpdate, InitStyles, CheckManager, DrawBackground, DrawHeader, DrawToolbar, DrawWarningBox, DrawCharacterList, DrawCharacterListItem, DrawCharacterDetail, DrawTabs, DrawBasicInfoTab, DrawSkillsTab, DrawSkillSlot, DrawPassiveSlot, DrawEquipmentTab, DrawWeaponSlot, DrawActionsTab, ShowResultNotification, DrawCodeTab, DrawCodeSection (+ 5 more)

### `OutGameStatViewer.cs`
Path: `ScriptTools/Editor/OutGameStatViewer.cs`
**Class**: OutGameStatViewer, CharacterInfo, WeaponOption, PassiveOption, ModuleOption, CodeSample
**Methods**: Open, OpenWithCharacter, OpenWithCharacterAndEquipment, SelectCharacterWithEquipment, SelectCharacterByID, OnEnable, OnGUI, DrawCopyNotification, InitStyles, TryLoadRefData, LoadRefData, DrawBackground, DrawHeader, DrawToolbar, DrawWarningBox, DrawInfoBox, DrawCharacterSelector, DrawCharacterInfoPanel, DrawTabs, DrawTabContent, DrawStatsTab, DrawEquipmentTab, DrawWeaponSlot, DrawModuleSlots, GetModuleStatSummary (+ 35 more)

### `ReferencePreviewTool.cs`
Path: `ScriptTools/Editor/ReferencePreviewTool.cs`
**Class**: ReferencePreviewTool
**NS**: ProjectAegis.ScriptTools.Editor
**Methods**: Open, OnEnable, LoadReferenceFileLists, ApplyFileFilter, OnGUI, DrawGlobalToolbar, DrawFileSection, DrawDataSection, LoadSelectedFileData, SaveCurrentFileData, ApplyDataFilter, DrawDataTable, CopyRowToClipboard, AddNewRow, PasteRowFromClipboard, RemoveRow

### `UIAutoBinderTool.cs`
Path: `ScriptTools/Editor/UIAutoBinderTool.cs`
**Class**: UIAutoBinderTool, UIComponentInfo, ComponentTypeConfig, HierarchyNode
**NS**: ProjectAegis.Tools
**Methods**: ShowWindow, ValidateGenerateBindings, GenerateBindingsFromSelection, InitStyles, OnGUI, DrawHeader, DrawPrefabSelector, DrawOptions, DrawFilters, DrawTypeSelectButton, GetComponentsByType, IsTypeInCategory, DrawComponentList, DrawGroupedComponents, BuildHierarchyTree, DrawHierarchyNode, CountSelectedInNode, CountTotalInNode, DrawComponentItem, DrawActionButtons, AnalyzePrefab, AnalyzeTransformRecursive, ShouldAutoSelect, CopyFieldDeclarations, CopyBindingCode (+ 9 more)

### `UIButtonSoundTool.cs`
Path: `ScriptTools/Editor/UIButtonSoundTool.cs`
**Class**: UIButtonSoundTool, PrefabInfo, ComponentInfo, SoundChangePopup
**Methods**: ShowWindow, OnEnable, LoadSoundData, FilterSoundList, OnGUI, DrawTitle, DrawSettingsSection, DrawSoundSelector, PlaySelectedSound, DrawFolderDropArea, DrawSearchSection, DrawResultsSection, DrawPrefabItem, DrawActionButtons, SearchPrefabs, AnalyzePrefab, GetSoundNameFromId, GetGameObjectPath, ApplyFilter, AddSoundComponents, AddSoundComponentsToPrefabs, SelectObjectInPrefab, SelectObjectInOpenedPrefab, FindChildByPath, FindDirectChild (+ 6 more)

## `ScriptTools/Editor/CharacterSetupTools/`

### `CharacterSetupWindow.cs`
Path: `ScriptTools/Editor/CharacterSetupTools/CharacterSetupWindow.cs`
**Class**: CharacterSetupWindow
**NS**: ProjectAegis.EditorTools
**Methods**: Open, OnGUI, CollectFromPrefab, SaveToAsset, ApplyToPrefab

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

## `ScriptTools/Editor/UILayoutBuilder/`

### `OptimizedScrollViewCreator.cs`
Path: `ScriptTools/Editor/UILayoutBuilder/OptimizedScrollViewCreator.cs`
**Class**: OptimizedScrollViewCreator
**NS**: ProjectAegis.EditorTools.UILayoutBuilder
**Methods**: CreateOptimizedScrollView, ValidateCreateOptimizedScrollView, CreateScrollViewStructure, CreateDemoScrollCell, CreateLabel

### `UGUILayoutBuilder.AIPrompt.cs`
Path: `ScriptTools/Editor/UILayoutBuilder/UGUILayoutBuilder.AIPrompt.cs`
**Class**: UGUILayoutBuilder
**NS**: ProjectAegis.EditorTools.UILayoutBuilder

### `UGUILayoutBuilder.cs`
Path: `ScriptTools/Editor/UILayoutBuilder/UGUILayoutBuilder.cs`
**Class**: UGUILayoutBuilder
**NS**: ProjectAegis.EditorTools.UILayoutBuilder
**Methods**: ShowWindow, OnEnable, OnDisable, OnEditorUpdate, LoadDefaults, InitializeStyles, MakeTexture, InitializeRootNode, NotifyNodeDirty, SetJsonInput, MarkNodeDirty, ForceSyncNodeToJson, PushUndoSnapshot, PerformUndo, PerformRedo, TrySyncJsonToNode, SyncNodeToJsonInternal, ResetAll, EnsureNodeSynced, OnGUI, DrawHeader, DrawSettings, HandleKeyboardShortcuts, DrawUnifiedActionBar, DrawHelpBox (+ 7 more)

### `UGUILayoutBuilder.FileLoadTab.cs`
Path: `ScriptTools/Editor/UILayoutBuilder/UGUILayoutBuilder.FileLoadTab.cs`
**Class**: UGUILayoutBuilder
**NS**: ProjectAegis.EditorTools.UILayoutBuilder
**Methods**: DrawFileLoadTab

### `UGUILayoutBuilder.JsonInputTab.cs`
Path: `ScriptTools/Editor/UILayoutBuilder/UGUILayoutBuilder.JsonInputTab.cs`
**Class**: UGUILayoutBuilder, JsonLineInfo
**NS**: ProjectAegis.EditorTools.UILayoutBuilder
**Methods**: EnsureStyles, DrawJsonInputTab, UpdateHighlightRange, DrawSelectedNodeActionBar, AddChildToSelected, InsertSiblingAfterSelected, DrawJsonViewer, RebuildVisibleLines, ExpandParentFolds, CollapseAllJsonFolds, ExpandAllJsonFolds, GetCollapsedSummary, DrawJsonLine, HandleJsonLineMouseEvents, ShowJsonViewerContextMenu, HasValidNodeJsonInClipboard, PasteFromClipboardAsChild, PasteFromClipboardAsSibling, CopyNodeToClipboard, MoveNodeDepthUp, MoveNodeDepthDown, DrawEditableJsonProperty, DrawReadOnlyValue, ApplyJsonValueChange, RebuildJsonLineCache (+ 15 more)

### `UGUILayoutBuilder.ModuleBuilderTab.cs`
Path: `ScriptTools/Editor/UILayoutBuilder/UGUILayoutBuilder.ModuleBuilderTab.cs`
**Class**: UGUILayoutBuilder
**NS**: ProjectAegis.EditorTools.UILayoutBuilder
**Methods**: EnsureModuleBuilderStyles, DrawModuleBuilderTab, DrawTreeViewPanel, DrawTreeNode, GetTypeIcon, DrawInspectorPanel, AddNewElement, DeleteSelectedElement, DuplicateSelectedElement, ShowTreeNodeContextMenu

### `UGUILayoutBuilder.PrefabToJsonTab.cs`
Path: `ScriptTools/Editor/UILayoutBuilder/UGUILayoutBuilder.PrefabToJsonTab.cs`
**Class**: UGUILayoutBuilder
**NS**: ProjectAegis.EditorTools.UILayoutBuilder
**Methods**: DrawPrefabToJsonTab, ConvertPrefabToJson, ConvertSelectedToJson, ConvertGameObjectToLayoutData, IsInternalUIChild, CreateLayoutGroupData, DetectUITypeFromGameObject, DetectAnchorPreset, ConvertTMPAlignmentToString, SavePrefabJsonToFile

### `UGUILayoutBuilder.TemplateTab.cs`
Path: `ScriptTools/Editor/UILayoutBuilder/UGUILayoutBuilder.TemplateTab.cs`
**Class**: UGUILayoutBuilder
**NS**: ProjectAegis.EditorTools.UILayoutBuilder
**Methods**: DrawTemplateTab, LoadTemplate, GetTemplateJson, GetBasicPanelTemplate, GetConfirmDialogTemplate, GetInputFormTemplate, GetButtonListTemplate, GetScrollListTemplate, GetTabMenuTemplate

### `UIElementFactory.cs`
Path: `ScriptTools/Editor/UILayoutBuilder/UIElementFactory.cs`
**Class**: UIElementFactory
**NS**: ProjectAegis.EditorTools.UILayoutBuilder
**Methods**: SetDefaultFont, SetDefaultTMPFont, SetDefaultSprite, CreateUIElement, CreatePanel, CreateText, CreateTMPText, CreateButton, CreateTMPButton, CreateImage, CreateRawImage, CreateInputField, CreateTMPInputField, CreateToggle, CreateTMPToggle, CreateSlider, CreateDropdown, CreateTMPDropdown, CreateScrollView, SetupLayoutGroup, AddLayoutElement, SetupRectTransform, SetAnchorPreset, ParseTextAnchor, ParseFontStyle (+ 2 more)

### `UILayoutData.cs`
Path: `ScriptTools/Editor/UILayoutBuilder/UILayoutData.cs`
**Class**: UILayoutData, RectData, LayoutGroupData, UIElementType, AnchorPreset, LayoutGroupType, UIBuilderNode
**NS**: ProjectAegis.EditorTools.UILayoutBuilder
**Methods**: AddChild, RemoveChild, IsDescendantOf, UpdateDescendantDepthsPublic, UpdateDescendantDepths, MoveUp, MoveDown, ToLayoutData, FromLayoutData, UIBuilderNode

### `UILayoutPreviewWindow.cs`
Path: `ScriptTools/Editor/UILayoutBuilder/UILayoutPreviewWindow.cs`
**Class**: UILayoutPreviewWindow
**NS**: ProjectAegis.EditorTools.UILayoutBuilder
**Methods**: Open, OnEnable, OnDisable, OnEditorUpdate, NotifyDirty, HandlePreviewKeyboardShortcuts, OnGUI, DrawToolbar, DrawPreviewNode, CalculateNodeRect, DrawRectOutline, DrawResizeHandles, GetResizeHandleRects, GetContrastColor, HandlePreviewInput, ShowPreviewContextMenu, ApplyResize, HitTestNode, GetNodePreviewRect, FindParentPreviewRect, GetSelectedNodePreviewRect, DrawPropertyBar, GetPreviewTypeIcon

## `ScriptTools/Editor/Vibration/`

### `AudioToHapticContextMenu.cs`
Path: `ScriptTools/Editor/Vibration/AudioToHapticContextMenu.cs`
**Class**: AudioToHapticContextMenu
**NS**: ProjectAegis.EditorTools
**Methods**: ConvertToHapticValidation, ConvertToHaptic, ShowVibrationDataManual

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

## `ScriptTools/Editor/WeaponTools/Play/`

### `WeaponPlayEditor.AutoTester.UI.cs`
Path: `ScriptTools/Editor/WeaponTools/Play/WeaponPlayEditor.AutoTester.UI.cs`
**Class**: WeaponPlayEditor
**NS**: Aegis.EditorTools
**Methods**: DrawAutoTesterGUI, GetResultDetails

## `ScriptTools/Editor/WeaponTools/Preview/`

### `WeaponPreviewEditor.Character.cs`
Path: `ScriptTools/Editor/WeaponTools/Preview/WeaponPreviewEditor.Character.cs`
**Class**: WeaponPreviewEditor
**NS**: Aegis.EditorTools
**Methods**: SafeInvoke, InitCharacter, DrawPreviewEquip, ResetEquipPageObjects, RefreshPageEquip, SetupIKTarget, CharacterUpdate, DrawAnimState, CheckDisableCurrentState, ChangeAimState, ChangeCrouchState, ChangeReloadState, PlayCharge, SetWeight, PlayFire, ChangeCharacterMeshEnable

### `WeaponPreviewEditor.cs`
Path: `ScriptTools/Editor/WeaponTools/Preview/WeaponPreviewEditor.cs`
**Class**: WeaponPreviewEditor
**NS**: Aegis.EditorTools
**Methods**: ShowWindow, OpenManual, OpenSoundManual, OnEnable, UpdateMain, calcLabelWidth, RefreshPreviewUtility, ResetWeaponPageObjects, OnDisable, OnDestroy, OnGUI, DrawPreviewInfo, DrawSelectObjectTarget, DrawPreviewWeapon, DrawHierarchyPositionFields, DrawAddNewGameObjectBtn, RefreshWeaponModel, RefreshPageWeapon, SetupShieldVisuals, ResetHierarchyObject, RefreshHierarchyObject, RefreshAnimController, RefreshDatas, HandlePreviewMouseEvents, DrawTextLabel (+ 2 more)

### `WeaponPreviewEditor.Data.cs`
Path: `ScriptTools/Editor/WeaponTools/Preview/WeaponPreviewEditor.Data.cs`
**Class**: WeaponPreviewEditor
**NS**: Aegis.EditorTools
**Methods**: InitSOData, ResetSOData, RefreshSOData, RefreshCamaraSetting, DrawSOData, DrawWeaponSetting, DrawProjectileSetting, DrawCameraSetting

### `WeaponPreviewEditor.Effect.cs`
Path: `ScriptTools/Editor/WeaponTools/Preview/WeaponPreviewEditor.Effect.cs`
**Class**: WeaponPreviewEditor, ActiveEffect
**NS**: Aegis.EditorTools
**Methods**: RegisterWeaponParticles, InitEffectData, ResetEffectData, RefreshEffectData, RefreshEffectFoldOut, MakeEffectSetting, DrawEffectNSoundSetting, DrawEffect, DrawEffectInfo, PlayEffect, ResetPlayEffect, EffectUpdate, DrawWeaponEffect, GetTotalDuration

### `WeaponPreviewEditor.Sound.cs`
Path: `ScriptTools/Editor/WeaponTools/Preview/WeaponPreviewEditor.Sound.cs`
**Class**: WeaponPreviewEditor
**NS**: Aegis.EditorTools
**Methods**: InitSoundData, DrawSound, RefreshSoundFoldOut, DrawSoundInfo, DrawWeaponSound, PlaySound

## `ScriptTools/Editor/x64/Bakery/scripts/`

### `ftAtlasPreview.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftAtlasPreview.cs`
**Class**: ftAtlasPreview
**Methods**: SelectionCallback, OnGUI

### `ftBuildGraphics.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftBuildGraphics.cs`
**Class**: ftBuildGraphics, TexInputType, TexInput, VBFull, FarSphereRenderData, AtlasNode, BufferedBinaryWriterFloat, ReinterpretBuffer, BufferedBinaryWriterInt, ExportSceneData, AdjustUVPaddingData, PackData
**Methods**: InitShaders, LoadScene, SetAlbedos, CopyAlbedos, CopyHeightmapsFromRAM, FreeAlbedoCopies, SetAlphas, SetAlphasFromRAM, SaveSky, SaveCookie, SaveCookieFromRAM, ftRenderUVGBuffer, SetUVGBFlags, SetUVGBTangents, SetFixPos, SetCompression, ftGenerateAlphaBuffer, SaveGBufferMap, SaveGBufferMapFromRAM, GetABGErrorCode, ToggleABGDither, GetUVGBErrorCode, uvrLoad, uvrRepack, uvrUnload (+ 35 more)

### `ftBuildLights.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftBuildLights.cs`
**Class**: ftBuildLights, SavedLight, cannot, BSPNode
**Methods**: InitMaps, BuildDirectLight, BuildSkyLight, GetRandomTriFromBSP, BuildProbabilityBSP, BuildLight, GetTempTexName, WriteNullTerminatedStringWithNewLine, SavePointLightTexture, BuildLights, BuildTranslucentTextures

### `ftClearMenu.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftClearMenu.cs`
**Class**: ftClearMenu, SceneClearingMode
**Methods**: ClearBakedDataShow, RemoveFiles, ClearBakedData

### `ftCreateMenu.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftCreateMenu.cs`
**Class**: ftCreateMenu
**Methods**: CreateDirectionalLight, CreateSkyLight, CreatePointLight, CreateAreaLight, CreateSpotLight, CreateVolume

### `ftRestorePaddingMenu.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftRestorePaddingMenu.cs`
**Class**: ftRestorePaddingMenu
**Methods**: RestorePadding

### `ftSaveSettingsMenu.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftSaveSettingsMenu.cs`
**Class**: ftSaveSettingsMenu
**Methods**: SaveSettings, LoadSettings

### `ftSceneView.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftSceneView.cs`
**Class**: ftSceneView
**Methods**: Init, Atlas, ApplyNewProperties, ToggleChecker, ToggleProjMode, RefreshChecker

## `ScriptTools/LevelTools/`

### `BuildingGenerator.cs`
Path: `ScriptTools/LevelTools/BuildingGenerator.cs`
**Class**: WallType, DiagonalDirection, FloorType, CellWalls, Floor, BuildingData, BuildingVisualStyle, BuildingGeneratorCore
**Methods**: RebuildDictionary, GetOrCreateCell, Clear, SetDefaultMaterials, AddFloor, Initialize, UpdatePreview, GenerateFinal, SaveBlueprint, OverwriteBlueprint, SaveAsPrefab, SaveBlueprintAsPrefab, ClearPreview, ClearGenerated, ImportFromGameObject, DEPRECATED_EstimateCellAndGridSize, DEPRECATED_ExtractWallsData, DEPRECATED_ExtractFloorsData, DEPRECATED_IsStairType, DEPRECATED_DetermineTriangleType, DEPRECATED_DetermineWallType, DEPRECATED_DetermineStairType, GenerateBuilding, GenerateFloor, GenerateFloorMesh (+ 15 more)

### `BuildingGeneratorConstants.cs`
Path: `ScriptTools/LevelTools/BuildingGeneratorConstants.cs`
**Class**: BuildingGeneratorConstants

### `BuildingGeneratorUtility.cs`
Path: `ScriptTools/LevelTools/BuildingGeneratorUtility.cs`
**Class**: BuildingGeneratorUtility
**Methods**: EnsureFolderExists, SavePrefab, SaveMeshAsset, IsWindowType, IsStairType, IsTriangleType, IsDoubleStairs, GetStairRotation, GetStairPositionOffset, GetWallColor, GetNextWallType, GetNextFloorType, IsValidGridPosition, IsEdgeCell, GetFloorColor, SetStaticFlags, ApplyMaterial, DetermineTriangleTypeFromVertices, DetermineStairTypeFromRotation, GetTriangleVertices

### `BuildingImporter.cs`
Path: `ScriptTools/LevelTools/BuildingImporter.cs`
**Class**: BuildingImporter
**Methods**: ImportFromGameObject, ScanHierarchy, EstimateCellAndGridSize, EstimateWallProperties, ProcessAllObjects, ProcessObjectRecursive, ProcessFloorObject, ProcessWallObject, ProcessStairObject, ProcessPillarObject, PositionToGrid, DetermineWallTypeFromChildren, ExtractMaterials, LogImportResult

### `CombatSimulationWindow.cs`
Path: `ScriptTools/LevelTools/CombatSimulationWindow.cs`
**Class**: CombatSimulationWindow
**NS**: ProjectAegis.NetPlay
**Methods**: ShowWindow, OnEnable, OnDisable, OnPlayModeStateChanged, FindSimulationManager, InitStyles, OnGUI, DrawHeader, DrawNotPlayingMode, DrawNoManagerFound, DrawSettings, DrawControls, DrawStatus, DrawResults, CreateSimulationManager, CreateSimulationManagerRuntime, OpenHeatmapFolder, OpenHeatmapViewer

## `ScriptTools/LevelTools/Editor/`

### `PrefabCleanupWindow.cs`
Path: `ScriptTools/LevelTools/Editor/PrefabCleanupWindow.cs`
**Class**: PrefabCleanupWindow
**NS**: Aegis.EditorTools
**Methods**: Open, OnGUI, RunAddMeshCollidersForLod0, AddMeshCollidersUnderLod0, RunDisableLodGroups, DisableLodGroupsInHierarchy, DrawActions, DrawScanSummary, RunScan, RunCleanup, CleanupSceneInstances, RemoveChildrenByNameContainsAny, CollectScenePrefabInstanceRoots, EstimateRemovals, CountChildrenByAnyToken, BuildActiveTokens, EnsureTargetSceneLoaded, FindScenePathByName, ShowCompletionDialog

## `ScriptTools/ZString/`

### `NestedStringBuilderCreationException.cs`
Path: `ScriptTools/ZString/NestedStringBuilderCreationException.cs`
**Class**: is, NestedStringBuilderCreationException
**NS**: Cysharp.Text
**Methods**: NestedStringBuilderCreationException

### `StringBuilder.AppendJoin.cs`
Path: `ScriptTools/ZString/StringBuilder.AppendJoin.cs`
**Class**: Utf16ValueStringBuilder, Utf8ValueStringBuilder
**NS**: Cysharp.Text

### `Utf16ValueStringBuilder.cs`
Path: `ScriptTools/ZString/Utf16ValueStringBuilder.cs`
**Class**: Utf16ValueStringBuilder, ExceptionUtil, type, FormatterCache
**NS**: Cysharp.Text
**Methods**: AsSpan, AsMemory, AsArraySegment, Dispose, Clear, TryGrow, Grow, AppendLine, Append, ThrowArgumentOutOfRangeException, Insert, Replace, ReplaceAt, Remove, TryCopyTo, ToString, GetMemory, GetSpan, Advance, ThrowFormatException, ThrowNestedException, TryFormatString, TryFormatDefault, Utf16ValueStringBuilder

### `Utf8ValueStringBuilder.cs`
Path: `ScriptTools/ZString/Utf8ValueStringBuilder.cs`
**Class**: Utf8ValueStringBuilder, type, FormatterCache
**NS**: Cysharp.Text
**Methods**: AsSpan, AsMemory, AsArraySegment, Dispose, Clear, TryGrow, Grow, AppendLine, Append, AppendLiteral, CopyTo, TryCopyTo, WriteToAsync, ToString, GetMemory, GetSpan, Advance, ThrowNestedException, TryFormatDefault, Utf8ValueStringBuilder

## `ScriptTools/ZString/Number/`

### `GuidEx.cs`
Path: `ScriptTools/ZString/Number/GuidEx.cs`
**Class**: GuidEx
**NS**: System
**Methods**: HexsToChars, HexsToCharsHexOutput, TryFormat

### `ValueStringBuilder.cs`
Path: `ScriptTools/ZString/Number/ValueStringBuilder.cs`
**Class**: ValueStringBuilder
**NS**: System.Text
**Methods**: EnsureCapacity, GetPinnableReference, ToString, AsSpan, TryCopyTo, Insert, Append, AppendSlow, AppendSpan, GrowAndAppend, Grow, Dispose, ValueStringBuilder

## `ScriptTools/ZString/Unity/`

### `TextMeshProExtensions.SetStringBuilder.cs`
Path: `ScriptTools/ZString/Unity/TextMeshProExtensions.SetStringBuilder.cs`
**Class**: TextMeshProExtensions
**NS**: Cysharp.Text
**Methods**: SetText

## `ScriptTools/ZString/Utf16/`

### `Utf16ValueStringBuilder.AppendFormat.cs`
Path: `ScriptTools/ZString/Utf16/Utf16ValueStringBuilder.AppendFormat.cs`
**Class**: Utf16ValueStringBuilder
**NS**: Cysharp.Text

### `Utf16ValueStringBuilder.CreateFormatter.cs`
Path: `ScriptTools/ZString/Utf16/Utf16ValueStringBuilder.CreateFormatter.cs`
**Class**: Utf16ValueStringBuilder
**NS**: Cysharp.Text
**Methods**: CreateFormatter

### `Utf16ValueStringBuilder.SpanFormattableAppend.cs`
Path: `ScriptTools/ZString/Utf16/Utf16ValueStringBuilder.SpanFormattableAppend.cs`
**Class**: Utf16ValueStringBuilder
**NS**: Cysharp.Text
**Methods**: Append, AppendLine

## `ScriptTools/ZString/Utf8/`

### `Utf8ValueStringBuilder.AppendFormat.cs`
Path: `ScriptTools/ZString/Utf8/Utf8ValueStringBuilder.AppendFormat.cs`
**Class**: Utf8ValueStringBuilder
**NS**: Cysharp.Text

### `Utf8ValueStringBuilder.CreateFormatter.cs`
Path: `ScriptTools/ZString/Utf8/Utf8ValueStringBuilder.CreateFormatter.cs`
**Class**: Utf8ValueStringBuilder
**NS**: Cysharp.Text
**Methods**: CreateFormatter

### `Utf8ValueStringBuilder.SpanFormattableAppend.cs`
Path: `ScriptTools/ZString/Utf8/Utf8ValueStringBuilder.SpanFormattableAppend.cs`
**Class**: Utf8ValueStringBuilder
**NS**: Cysharp.Text
**Methods**: Append, AppendLine


