# Audio System Code Guide
> Auto-generated: 2026-02-25 13:31 | 18 files

## `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/`

### `PlaySound.cs`
Path: `NetworkClient/NetPlay/Character/Skill/ActionNode/Actions/PlaySound.cs`
**Class**: PlaySound
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: Activated, Terminated, PlaySound

## `NetworkClient/NetPlay/MapObject/Description/`

### `TriggerVolumeStatusEffectDescriptionComp.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/TriggerVolumeStatusEffectDescriptionComp.cs`
**Class**: TriggerVolumeStatusEffectDescription, TriggerVolumeStatusEffectDescriptionComp
**NS**: ProjectAegis.NetPlay

### `TriggerVolumeStatusEffectDescriptionComp.Editor.cs`
Path: `NetworkClient/NetPlay/MapObject/Description/TriggerVolumeStatusEffectDescriptionComp.Editor.cs`
**Class**: TriggerVolumeStatusEffectDescriptionComp
**NS**: ProjectAegis.NetPlay

## `NetworkClient/NetPlay/MapObject/Object/`

### `TriggerVolumeStatusEffect.cs`
Path: `NetworkClient/NetPlay/MapObject/Object/TriggerVolumeStatusEffect.cs`
**Class**: TriggerVolumeStatusEffect, VolumeState
**NS**: ProjectAegis.NetPlay
**Methods**: SetupByDescription, OnStartServer, OnStartClient, OnStateChange, OnSetState, PostSetupModel, Update, OnTriggerEnter, EnableCollide

## `NetworkDev/03.ReferenceManager/02.ReferenceTable/`

### `RefCharacterPingSound.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCharacterPingSound.cs`
**Class**: CRefCharacterPingSound, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterPingSound, RegisterRefCharacterPingSoundBinary, FindRefCharacterPingSound, GetRefCharacterPingSounds

## `ReferenceTable/`

### `RefCharacterPingSound.cs`
Path: `ReferenceTable/RefCharacterPingSound.cs`
**Class**: CRefCharacterPingSound, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterPingSound, RegisterRefCharacterPingSoundBinary, FindRefCharacterPingSound, GetRefCharacterPingSounds

## `ScriptDev/Sound/`

### `CEffectSound.cs`
Path: `ScriptDev/Sound/CEffectSound.cs`
**Class**: CEffectSound, CEffectSoundEditor
**Methods**: OnEnable, OnDisable, PlaySound, StopSound, Reset, FilterList, OnInspectorGUI

### `CSoundData.cs`
Path: `ScriptDev/Sound/CSoundData.cs`
**Class**: CSoundData, SerializableKeyframe, SoundDatabaseExtraSetting, SoundCueExtraSetting, CSoundDataInspector, SoundID
**Methods**: OpenSoundDatabase, GetExtraSettingJsonPath, UdateEntries, ToKeyframe, FromCurve, ToCurve, OnInspectorGUI, DrawSearchUI, SetAllSoundsToNull, SetAllAudioClipsToNull, RestoreAudioClipsFromAddressable, DrawEntriesGrid, AddNewSoundEntry, LoadAllClipsFromFolder, SortEntriesByName, GetOrLoadAudioClipAsync, FindAndSetMissingPaths, UpdateFromFolder, GenerateSoundIDScript, ConvertToIdentifier, ApplyExtraSettingsToEntries, GetAddressableKey, IsFileIn3DFolder, GetEntryKeyFromClipName, HasChanges (+ 18 more)

### `CUIButtonSound.cs`
Path: `ScriptDev/Sound/CUIButtonSound.cs`
**Class**: CUIButtonSound, ButtonType, CUIButtonSoundExtention
**Methods**: OnEnable, OnDisable, PlayToggleSound, Reset, ForcePlayButtonSound

### `CUISound.cs`
Path: `ScriptDev/Sound/CUISound.cs`
**Class**: CUISound
**Methods**: OnEnable, PlaySound, PlayUISound, Reset

### `SoundID.cs`
Path: `ScriptDev/Sound/SoundID.cs`
**Class**: SoundID
**Methods**: GetName

### `SoundManager.cs`
Path: `ScriptDev/Sound/SoundManager.cs`
**Class**: SoundManager, PooledAudioSource, SoundCue, PlaySequence, SoundType
**Methods**: IsAvailable, Play, Stop, GetNextClip, MinClipLength, MaxClipLength, Awake, Start, Update, OnDestroy, InitializeAudioSources, CreatePooledAudioSource, ExpandPool, GetPooledAudioSource, CheckAndDisableFinishedSounds, GetActiveInstanceCount, CheckAndLoadSoundData, BuildSoundCueDict, GetSoundCue, PlayBGM, StopBGM, PauseBGM, ResumeBGM, CrossFadeBGM, CrossFadeCoroutine (+ 24 more)

## `ScriptDev/Utilities/`

### `SoundUtils.cs`
Path: `ScriptDev/Utilities/SoundUtils.cs`
**Class**: SoundUtils
**NS**: ProjectAegis.Utility
**Methods**: PlayClip, StopClip, StopAllClips

## `ScriptTools/Editor/`

### `UIButtonSoundTool.cs`
Path: `ScriptTools/Editor/UIButtonSoundTool.cs`
**Class**: UIButtonSoundTool, PrefabInfo, ComponentInfo, SoundChangePopup
**Methods**: ShowWindow, OnEnable, LoadSoundData, FilterSoundList, OnGUI, DrawTitle, DrawSettingsSection, DrawSoundSelector, PlaySelectedSound, DrawFolderDropArea, DrawSearchSection, DrawResultsSection, DrawPrefabItem, DrawActionButtons, SearchPrefabs, AnalyzePrefab, GetSoundNameFromId, GetGameObjectPath, ApplyFilter, AddSoundComponents, AddSoundComponentsToPrefabs, SelectObjectInPrefab, SelectObjectInOpenedPrefab, FindChildByPath, FindDirectChild (+ 6 more)

## `ScriptTools/Editor/Vibration/`

### `AudioToHapticContextMenu.cs`
Path: `ScriptTools/Editor/Vibration/AudioToHapticContextMenu.cs`
**Class**: AudioToHapticContextMenu
**NS**: ProjectAegis.EditorTools
**Methods**: ConvertToHapticValidation, ConvertToHaptic, ShowVibrationDataManual

## `ScriptTools/Editor/WeaponTools/Preview/`

### `WeaponPreviewEditor.Sound.cs`
Path: `ScriptTools/Editor/WeaponTools/Preview/WeaponPreviewEditor.Sound.cs`
**Class**: WeaponPreviewEditor
**NS**: Aegis.EditorTools
**Methods**: InitSoundData, DrawSound, RefreshSoundFoldOut, DrawSoundInfo, DrawWeaponSound, PlaySound

## `ScriptTools/Editor/WeaponTools/PropertyDrawer/`

### `CWeaponSound_PropertyDrawer.cs`
Path: `ScriptTools/Editor/WeaponTools/PropertyDrawer/CWeaponSound_PropertyDrawer.cs`
**Class**: CWeaponSound_PropertyDrawer
**NS**: Aegis.EditorTools
**Methods**: Init, OnGUI, DrawSoundTypeOfSubType, DrawSoundSelection, GetPropertyHeight

## `ScriptTools/Editor/x64/Bakery/scripts/`

### `ftVolumeInspector.cs`
Path: `ScriptTools/Editor/x64/Bakery/scripts/ftVolumeInspector.cs`
**Class**: BakeryVolumeInspector
**Methods**: OnInspectorGUI, OnSceneGUI


