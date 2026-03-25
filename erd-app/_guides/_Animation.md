# Animation System Code Guide
> Auto-generated: 2026-02-25 13:31 | 17 files

## `NetworkClient/NetPlay/Character/`

### `Character.IK.cs`
Path: `NetworkClient/NetPlay/Character/Character.IK.cs`
**Class**: Character
**NS**: ProjectAegis.NetPlay
**Methods**: SetupIK, UpdateIK, SetAimIKMuzzle, SetAimIKTarget, SetArmIKTarget, SetLookAtIKTarget, SetAimIKWeight, SetArmIKWeight, SetLookAtIKWeight, FadeAimIK, FadeArmIK, FadeLookIK, FadeAimingIK, IsRequiredAimingIK, IsBlockedAimingIK, UpdateAimingIK, SetEnabledAimingIK, PlayHitReaction, StopHitReaction, SetHitReactionTime

### `CharacterAnimationInterface.cs`
Path: `NetworkClient/NetPlay/Character/CharacterAnimationInterface.cs`
**Class**: BlendWeightControl, ECharacterAnimLayerType, AnimHash, Character
**NS**: ProjectAegis.NetPlay
**Methods**: Update, SetValue, SetTarget, SetFadeIn, SetFadeOut, SetAutoBlendOff, PostSetupModel, SetAnimParameter, CacheSocketTransforms, GetSocketTransform, FadeInAnimLayer, FadeOutAnimLayer, SetAutoBlendOffAnimLayer, UpdateAnimLayerWeight, SetAnimInteger, SetAnimBool, SetAnimFloat, SetAnimTrigger, SetAnimResetTrigger, SetAnimLayerWeight, GetAnimLayer, GetAnimInteger, GetAnimBool, GetAnimFloat, GetAnimLayerWeight (+ 20 more)

## `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/`

### `AnimationSpeed.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/AnimationSpeed.cs`
**Class**: AnimationSpeed
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, AnimationSpeed

### `BodyAnimLayerControl.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/BodyAnimLayerControl.cs`
**Class**: BodyAnimLayerControl
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, BodyAnimLayerControl

### `PlayAnimation.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/PlayAnimation.cs`
**Class**: EAnimationVarType, AnimatorVariable, PlayAnimation
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, SetAnimatorVariables, OnUpdate, Terminated, OnAnimationEnd, NeedUpdate, IsFinishAnimation, ApplyLookDirection, PlayAnimation

## `ScriptDev/Contents/Core/`

### `AnimationEventReceiver.cs`
Path: `ScriptDev/Contents/Core/AnimationEventReceiver.cs`
**Class**: AnimationEventReceiver
**NS**: ProjectAegis.Contents
**Methods**: LeftFootDown, RightFootDown, PlaySound, OnAnimationEvent, OnAnimationEventInt, OnAnimationEventFloat, OnAnimationEventObject

## `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/`

### `AnimatableProperty.cs`
Path: `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/AnimatableProperty.cs`
**Class**: AnimatableProperty, ShaderPropertyType
**NS**: Coffee.UIExtensions
**Methods**: UpdateMaterialProperties, OnBeforeSerialize, OnAfterDeserialize

## `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/Editor/`

### `AnimatedPropertiesEditor.cs`
Path: `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/Scripts/Editor/AnimatedPropertiesEditor.cs`
**Class**: AnimatedPropertiesEditor
**NS**: Coffee.UIExtensions
**Methods**: CollectActiveNames, DrawAnimatableProperties, AddMenu

## `ScriptDev/UI/`

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

### `CUISlideAnimator.cs`
Path: `ScriptDev/UI/CUISlideAnimator.cs`
**Class**: CUISlideAnimator
**NS**: ProjectAegis.UI
**Methods**: GetAnimationOffset, PlayShowAnimation, PlayHideAnimation, ShowImmediate, HideImmediate, StopAnimation, Dispose, CUISlideAnimator

### `IUISlideAnimation.cs`
Path: `ScriptDev/UI/IUISlideAnimation.cs`
**Class**: ESlideDirection, IUISlideAnimation
**NS**: ProjectAegis.UI

## `ScriptDev/UI/Lobby/`

### `LobbyIdleRandomAnimation.cs`
Path: `ScriptDev/UI/Lobby/LobbyIdleRandomAnimation.cs`
**Class**: IdleAnimationEntry, LobbyIdleRandomAnimation
**NS**: ProjectAegis.UI
**Methods**: OnStateEnter, OnStateUpdate, SelectRandomIdleTrigger

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

### `LookIKModule.cs`
Path: `ScriptTools/Editor/CharacterSetupTools/Modules/LookIKModule.cs`
**Class**: LookIKModule
**NS**: ProjectAegis.EditorTools
**Methods**: Reset, Collect, Apply, LookIKModule


