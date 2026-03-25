# Camera System Code Guide
> Auto-generated: 2026-02-25 13:31 | 20 files

## `NetworkClient/NetPlay/AI/`

### `AIMoveManager.cs`
Path: `NetworkClient/NetPlay/AI/AIMoveManager.cs`
**Class**: AIMoveManager
**NS**: ProjectAegis.NetPlay
**Methods**: GetMovementType, GetAIController, Update, FixedUpdate, GetMoveSpeedCur, SetMoveSpeedCur, SetMoveDestination, SetMoveDir, SetMoveDirFromPos, GetMoveDestination, GetMoveDir, DecideMoveSpeedAndMoveAni, MoveStart, MoveEnd, SetGoalRotY, GoalRotYProc, SetRotationY, GetMoveNow, GetMoveArrivedPos, OverlapMoveInfoInit, Temp_ReadyPatrolPointList, Temp_ReadyPatrolPointList2, OnBywayStart, SetMoveDirectionKind, AIMoveManager

## `NetworkClient/NetPlay/AI/Actions/`

### `AIActionChangeAimMode.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionChangeAimMode.cs`
**Class**: AIActionChangeAimMode
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, OnActionEnd, Update, AIActionChangeAimMode

### `AIActionFireOnAim.cs`
Path: `NetworkClient/NetPlay/AI/Actions/AIActionFireOnAim.cs`
**Class**: AIActionFireOnAim
**NS**: ProjectAegis.NetPlay
**Methods**: ReadyWithConfig, OnActionStart, OnActionEnd, Update, AIActionFireOnAim

## `NetworkClient/NetPlay/Character/FSM/States/`

### `AimState.cs`
Path: `NetworkClient/NetPlay/Character/FSM/States/AimState.cs`
**Class**: AimState
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: EnterState, ExitState, UpdateState, AimState

## `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/`

### `AimCorrection.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/AimCorrection.cs`
**Class**: AimCorrection
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, AimCorrection

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

## `ScriptDev/Contents/Core/`

### `CAimAssistSystem.cs`
Path: `ScriptDev/Contents/Core/CAimAssistSystem.cs`
**Class**: CAimAssistSystem, ELineOfSightOrigin
**Methods**: SetAutoFireToggle, SetAimAssistToggle, AddRecoilOffset, FixedUpdate, BindPlayerInput, UnbindPlayerInput, OnManualFire, InitializeAutoFireStates, ChangeState, UpdateAutoFire, LoadAutoFireState, ToggleAutoFire, ToggleAimAssist, IsAutoFireConditionMet, IsAimAssistConditionMet, InitializeAimAssistStates, ChangeAimAssistState, IsApplyFireAimAssist, UpdateAimAssist, StartAimAssist, StopAimAssist, StartFireAimAssistCooldown, OnLookInput, UpdateTargetPart, ApplySustainedRotation (+ 26 more)

### `CameraImpulse.cs`
Path: `ScriptDev/Contents/Core/CameraImpulse.cs`
**Class**: CameraImpulse, ImpulseData
**Methods**: SetData, StartCameraImpulse, IsValid

### `CameraRecoil.cs`
Path: `ScriptDev/Contents/Core/CameraRecoil.cs`
**Class**: CameraRecoil, ERecoilState, PitchRecoil, RandomRecoil, FOVRecoil, LockOnRecoil, RecoilData, RecoilType
**Methods**: Create, SetData, IsValid, IsMultiApply, IsWorking, IsTerminated, StartCameraRecoil, UpdateCameraRecoil, Evaluate

### `CCameraController.cs`
Path: `ScriptDev/Contents/Core/CCameraController.cs`
**Class**: CameraOverride, CCameraController
**Methods**: LateUpdate, OnDestroy, SetupPlayerCamera, OnChangedWeapon, OnFiredWeapon, GetLerpValue, AddCameraRotation, UpdateCameraPosition, GetPredictedCameraPosition, UpdateCameraRotation, UpdateCameraFOV, SetCameraFOV, SetRotation, StartCameraRecoil, UpdateCameraRecoil, AddCameraRecoilRotation, AddCameraRecoilFOV, SetupCameraImpulse, StartCameraImpulse, RefreshCameraState, ApplyCameraState, AddCameraStateOverride, RemoveCameraStateOverride, SetSpectateCamera, ClearSpectateCamera

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

## `ScriptDev/Data/`

### `CameraSettings.cs`
Path: `ScriptDev/Data/CameraSettings.cs`
**Class**: CameraSettings
**Methods**: copySetting, Equals, GetHashCode

## `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/`

### `BakingCamera.cs`
Path: `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/BakingCamera.cs`
**Class**: BakingCamera
**NS**: Coffee.UIParticleExtensions
**Methods**: Create, Awake, GetCamera

## `ScriptDev/UI/`

### `CLobbyCameraPivot.cs`
Path: `ScriptDev/UI/CLobbyCameraPivot.cs`
**Class**: CLobbyCameraPivot
**NS**: ProjectAegis.UI
**Methods**: InstallCamera, GetSlotTransform, SetSlotTransform, GetAllSlots, ApplySettings, ApplySettingsFromAsset, ApplySetUISlot, SetViewMode, ToCameraSpaceWorldPosition

## `ScriptTools/Editor/CharacterSetupTools/Modules/`

### `AimIKModule.cs`
Path: `ScriptTools/Editor/CharacterSetupTools/Modules/AimIKModule.cs`
**Class**: AimIKBoneData, AimIKModule
**NS**: ProjectAegis.EditorTools
**Methods**: Reset, Collect, Apply, AimIKBoneData, AimIKModule


