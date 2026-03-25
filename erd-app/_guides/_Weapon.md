# Weapon System Code Guide
> Auto-generated: 2026-02-25 13:31 | 77 files

## `NetworkClient/NetPlay/AI/Actions/`

### `AIActionChangeWeapon.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionChangeWeapon.cs`
**Class**: AIActionChangeWeapon
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, Update, AIActionChangeWeapon

### `AIActionMuzzleUpDownToTarget.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionMuzzleUpDownToTarget.cs`
**Class**: AIActionMuzzleUpDownToTarget
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, Update, DrawDebugElements, AIActionMuzzleUpDownToTarget

## `NetworkClient/NetPlay/Character/FSM/States/`

### `EquipState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/EquipState.cs`
**Class**: EquipState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, EquipState

## `NetworkClient/NetPlay/Character/Passive/PassiveExecutor/`

### `PassiveExecutor_StatModeWeapon.cs`
Path: `NetworkClient/NetPlay/Character/Passive/PassiveExecutor/PassiveExecutor_StatModeWeapon.cs`
**Class**: PassiveExecutor_ModWeaponEffectiveRange, PassiveExecutor_ModMagCapacity
**NS**: ProjectAegis.NetPlay
**Methods**: Activate, AddWeaponIDFromSlot, Terminate, ApplyBuff

## `NetworkClient/NetPlay/Character/Skill/`

### `PlayerSkillSystem.SkillWeapon.cs`
Path: `NetworkClient/NetPlay/Character/Skill/PlayerSkillSystem.SkillWeapon.cs`
**Class**: SkillWeaponData, PlayerSkillSystem
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: InitSkillWeapon, OnChangedSkillWeaponDatas, GetSkillWeaponEquipIndex, ChangeSkillWeapon, GetSkillWeaponData, ShatterSkillWeapon, ResetAllSkillWeapons, TerminateSkillWeapon, UpdateSkillWeaponDatas

## `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/`

### `CancelWeaponControl.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/CancelWeaponControl.cs`
**Class**: CancelWeaponControl
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, CancelWeaponControl

### `ExecuteFireWeapon.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/ExecuteFireWeapon.cs`
**Class**: ExecuteFireWeapon
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, ExecuteFireWeapon

### `LockWeaponControl.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/LockWeaponControl.cs`
**Class**: LockWeaponControl
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, LockWeaponControl

### `PlayWeaponDraw.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/PlayWeaponDraw.cs`
**Class**: PlayWeaponDraw
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, PlayWeaponDraw

### `WeaponControl.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/WeaponControl.cs`
**Class**: WeaponControl
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, SetVisible, WeaponControl

## `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/`

### `ExecuteChangeSkillWeapon.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteChangeSkillWeapon.cs`
**Class**: ExecuteChangeSkillWeapon
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, SetSkillWeaponInfo, ExecuteChangeSkillWeapon

### `ExecuteLaunchProjectile.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/SkillExecute/ExecuteLaunchProjectile.cs`
**Class**: ExecuteLaunchProjectile, Setting
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, GetProjectileStartPosition, GetProjectileDirection, TryGetThrowingDirection, TryCalculateThrowVelocity, ExecuteLaunchProjectile

## `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/`

### `StatusEffect_ChangeAmmo.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffect_ChangeAmmo.cs`
**Class**: StatusEffect_ChangeAmmo
**NS**: ProjectAegis.NetPlay
**Methods**: SetValue, Activate, Deactivate

### `StatusEffectFunction_Weapon.cs`
Path: `NetworkClient/NetPlay/Character/StatusEffect/StatusEffectFunction/StatusEffectFunction_Weapon.cs`
**Class**: StatusEffectFunction_RemoveSkillWeapon
**NS**: ProjectAegis.NetPlay
**Methods**: Activate, Deactivate

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

## `NetworkDev/03.ReferenceManager/02.ReferenceTable/`

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

### `CProjectileSetting.cs`
Path: `ScriptDev/Data/CProjectileSetting.cs`
**Class**: EResponseEffect, EResponseTrajectory, ELifeEndEffect, ProjectileSetting, ProjectileSettingEditor
**Methods**: copySetting, Equals, GetHashCode, OnInspectorGUI

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

## `ScriptDev/Manager/UserDatas/Characters/`

### `WeaponEquipData.cs`
Path: `ScriptDev/Manager/UserDatas/Characters/WeaponEquipData.cs`
**Class**: WeaponEquipData
**NS**: ProjectAegis.UserDatas

## `ScriptDev/UI/`

### `CUIWeaponSlot.cs`
Path: `ScriptDev/UI/CUIWeaponSlot.cs`
**Class**: CUIWeaponSlot
**NS**: ProjectAegis.UI
**Methods**: SetWeaponInfo, RefreshSelected, RefreshData

## `ScriptDev/UI/InGame/`

### `CUIIngamePopupWeaponSelect.cs`
Path: `ScriptDev/UI/InGame/CUIIngamePopupWeaponSelect.cs`
**Class**: CUIIngamePopupWeaponSelect, WeaponUI
**NS**: ProjectAegis.UI.Ingame
**Methods**: InitUIBind, PrepareContent, OnPanelRelase, OnPanelEnabled, OnSelectWeapon, OnClickConfirm, BindUI, SetContents

## `ScriptDev/UI/Lobby/Chraracter/`

### `CUICharacterWeapon.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/CUICharacterWeapon.cs`
**Class**: CUICharacterWeaponInfo, CUICharacterWeaponSlot, CUICharacterModuleSlot, CUICharacterModuleListPopup, CUIModuleDetailPopupManager, CUIModuleChangePopup, CUICharacterWeaponStatusList, CUICharacterWeapon
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, SetCharacterIcon, SetCharacterName, SetWeaponIcon, SetWeaponName, SetAllData, Clear, OnClickSlot, SetWeapon, SetModule, SetSelected, SetActive, SetState, Open, SetInitialSelectedUID, TriggerInitialSelection, Close, LoadModulesFromInventory, SetModuleList, ClearModuleList, RefreshScroll, SetData, GetOrCreateCell, OnClickModuleItem, GetCellCount (+ 35 more)

## `ScriptDev/UI/ReferenceTable/`

### `RefWeaponExtension.cs`
Path: `ScriptDev/UI/ReferenceTable/RefWeaponExtension.cs`
**Class**: CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: GetWeaponName, GetWeaponIconName, GetWeaponSkinIconName, GetWeaponTypeName, GetWeaponTypeIconName, GetWeaponIdFromRefChar, GetWeaponIdFromGearSetId, GetWeaponIdFromGearSet, GetModuleIconName, GetModuleName, GetModuleDescription

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

### `WeaponPlayEditor.AutoTester.cs`
Path: `ScriptTools/Editor/WeaponTools/Play/WeaponPlayEditor.AutoTester.cs`
**Class**: WeaponPlayEditor, EBatchTestState, ETestMode, BatchResult
**NS**: Aegis.EditorTools
**Methods**: ToString, IsCurrentWeaponHealType, FindNearestTarget, StartCombatTest, StopCombatTest, UpdateCombatLogic, UpdateMoveLogic, UpdateAimLogic, StartBatchTest, StopBatchTest, UpdateAutoTester, SetState, UpdateFireLogic, GetGearName, AnalyzeResult, OnTestHitPoint, OnCharacterDealDamage

### `WeaponPlayEditor.AutoTester.Strategies.cs`
Path: `ScriptTools/Editor/WeaponTools/Play/WeaponPlayEditor.AutoTester.Strategies.cs`
**Class**: WeaponPlayEditor, IAutoTestStrategy, RPMVerificationStrategy, ReloadSpeedStrategy, DPSMeasurementStrategy, AccuracySpreadStrategy, DamageFalloffStrategy
**NS**: Aegis.EditorTools
**Methods**: GetStrategy, Enter, Update, Exit, Analyze, GetAverage, OnDamage, OnHitPoint

### `WeaponPlayEditor.AutoTester.UI.cs`
Path: `ScriptTools/Editor/WeaponTools/Play/WeaponPlayEditor.AutoTester.UI.cs`
**Class**: WeaponPlayEditor
**NS**: Aegis.EditorTools
**Methods**: DrawAutoTesterGUI, GetResultDetails

### `WeaponPlayEditor.cs`
Path: `ScriptTools/Editor/WeaponTools/Play/WeaponPlayEditor.cs`
**Class**: WeaponPlayEditor
**NS**: Aegis.EditorTools
**Methods**: ShowWindow, OpenManual, OnEnable, OnEditorPlayModeChanged, OnDisable, OnDestroy, Update, OnInspectorUpdate, CheckNRefreshRefData, OnGUI, CheckSetCharacter, RefreshDrawCharacter, RefreshDrawWeaponList, DrawPlayer, DrawUnifiedDebugInfo, DrawWeapon, DrawWeaponList, DrawHitTest, ApplyDamageTest, GetWeaponName

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

## `ScriptTools/Editor/WeaponTools/PropertyDrawer/`

### `CPropertyDrawer.cs`
Path: `ScriptTools/Editor/WeaponTools/PropertyDrawer/CPropertyDrawer.cs`
**Class**: CPropertyDrawer, PropertyInfo
**NS**: Aegis.EditorTools
**Methods**: EqualsProperty, ResetHeight, AddTotalHeight, ChangeFoldOutState, SetTempValue, GetPropertyHeight, GetTotalHeight, AddNGetPropertyInfo, FindPropertyInfo, GetElementIndexInArray, DrawLabelField, DrawPropertyField, DrawFloat, DrawIntPopup, DrawPopupSetInt, DrawGuiButton, PropertyInfo

### `CWeaponEffect_PropertyDrawer.cs`
Path: `ScriptTools/Editor/WeaponTools/PropertyDrawer/CWeaponEffect_PropertyDrawer.cs`
**Class**: CWeaponEffect_PropertyDrawer
**NS**: Aegis.EditorTools
**Methods**: OnGUI, DrawEffectTypeOfSubType, DrawEffectID, GetPropertyHeight

### `CWeaponSound_PropertyDrawer.cs`
Path: `ScriptTools/Editor/WeaponTools/PropertyDrawer/CWeaponSound_PropertyDrawer.cs`
**Class**: CWeaponSound_PropertyDrawer
**NS**: Aegis.EditorTools
**Methods**: Init, OnGUI, DrawSoundTypeOfSubType, DrawSoundSelection, GetPropertyHeight


