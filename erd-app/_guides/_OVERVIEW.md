# C# Codebase Overview — Project Aegis (TPS 히어로 슈터)
> Auto-generated: 2026-02-25 13:31

## ⭐ 게임 개요

Project Aegis는 **팀 기반 3인칭 히어로 슈터(TPS)** 게임입니다.
- **캐릭터 클래스**: Damage(딜러), Support(서포터), Tank(탱커)
- **전투 모드**: PointCapture, TeamDeathmatch, NeutralPointCapture, PayloadEscort, FreeForAll, Clash
- **핵심 시스템**: 캐릭터(스킬/패시브/스탯) → 무기(사격/투사체) → 전투(데미지/StatusEffect) → AI(봇)
- **아키텍처**: Unity 클라이언트(FishNet 네트워크) + .NET 서버(Orleans Silo) + AWS GameLift

## ⭐ 아키텍처 다이어그램

```
[Unity Client - ScriptDev/NetworkClient]
  ├── Character: 캐릭터 제어, FSM, IK, 애니메이션
  │     ├── Controller (PlayerController/AIController)
  │     ├── Equipment (GunBase, MeleeWeaponBase, Projectile)
  │     ├── Skill (SkillHandler, StatusEffect)
  │     └── Stat (StatContainer, StatModifier)
  ├── UI: CUIManager → CUIPanel → CUIPanelContent
  │     ├── Lobby (CharacterSelect, HeroSelect, Party)
  │     ├── InGame (HUD, Minimap, Crosshair, Scoreboard)
  │     └── Profile, Option, Shop
  ├── Manager: Singleton 매니저 (AssetManager, CharacterManager, EffectManager)
  ├── GameMode: 전투 모드별 로직 (TDM, PointCapture, Clash)
  ├── AI: 봇 브레인 (V1/V2), 센서, 액션, 이동
  └── Data: ReferenceTable (Excel→Binary), UserData

[Server - Aegis.GameServer/NetworkDev]
  ├── GameLogic: 로그인, 매칭, 게임 세션
  ├── GameLift: AWS GameLift 연동
  ├── Orleans: PlayerGrain 상태 관리
  └── Network: FishNet, 패킷 직렬화, 암호화

[Data Pipeline]
  Excel(40개 xlsx) → DBML Schema → Binary(CRefXxx) → Runtime
```

## ⭐ 시스템 연결 맵 (질문 유형별 찾아보기)

| 질문 주제 | 코드 가이드 | DB 가이드 | 핵심 클래스/테이블 |
|-----------|------------|-----------|-------------------|
| 캐릭터 스탯/능력치 | `_Character` | `_DB_Character` | `Character.cs`, `StatContainer.cs`, `CharacterStat` 테이블 |
| 무기/사격/RPM | `_Weapon` | `_DB_Weapon` | `GunBase.cs`, `EquipmentManager.cs`, `WeaponStat` 테이블 |
| 스킬/궁극기 | `_Skill` | `_DB_Skill` | `SkillHandler`, `Skill` 테이블, `SkillExecute*` 테이블 |
| 데미지 계산 | `_Combat` | `_DB_Character` | `DamageCalculator.cs`, `DamageEvent.cs`, `CharacterStat.damage_*` |
| StatusEffect/버프 | `_Combat` | `_DB_Misc` | `StatusEffectHandler`, `StatusEffect/Function` 테이블 |
| 패시브/카드 | `_Skill` | `_DB_Skill` | `PassiveHandler`, `Passive/PassiveEffect/PassiveProperty` 테이블 |
| AI/봇 행동 | `_AI` | `_DB_Misc` | `AIActionBrainV2`, `BotData/BotSensor/BotActionStat` 테이블 |
| 맵/레벨 | `_Map` | `_DB_Stage` | `MapObjectManager`, `MapInfo/MapObject` 테이블 |
| UI/로비 | `_UI` | (없음) | `CUIManager`, `CUIPanel`, `CUILobbyMainPanel` |
| 네트워크/패킷 | `_Network` | (없음) | `PacketManager`, `NetworkManager_Aegis`, FishNet |
| 이펙트/VFX | `_Effect` | `_DB_Misc` | `EffectManager`, `MaterialEffect`, `Effect` 테이블 |
| 사운드 | `_Audio` | (없음) | `SoundManager`, `CSoundData` |
| 카메라/에임어시스트 | `_Camera` | `_DB_Character` | `CCameraController`, `CAimAssistSystem` |
| 애니메이션 | `_Animation` | (없음) | `Character.Animation`, `AnimationEventReceiver` |
| 매니저 전반 | `_Manager` | (없음) | `UserDataManager`, `AssetManager`, `ContentUnlockManager` |
| 게임 모드 | `_Network` | `_DB_Misc` | `GameMode.cs`, `BattleModeInfo` 테이블 |

## ⭐ 핵심 패턴 & 컨벤션

### 네이밍 컨벤션
- `CXxx` = 클라이언트 클래스 (CUIManager, CCameraController, CReferenceManager)
- `CRefXxx` = ReferenceTable 래퍼 (CRefCharacter, CRefWeapon)
- `CUIXxx` = UI 패널/컴포넌트
- `EXxx` = Enum (EWeaponType, ECharacterClass)
- `IXxx` = 인터페이스

### 디자인 패턴
- **Singleton**: `CSingleton<T>`, `CSingletonMono<T>` — 대부분의 매니저
- **FSM**: `Character.FSM` — 캐릭터 상태 머신 (Idle, Move, Fire, Skill, Hit, Dead)
- **Observer**: `CEventManager` — 이벤트 기반 통신
- **ObjectPool**: `ObjectPoolManager` — 투사체, 이펙트 풀링
- **MVC**: UI 시스템 — `CUIPanel`(View) + `CUIPanelContent`(Controller)

### 데이터 플로우 (Excel → 게임)
```
[기획 Excel .xlsx] → [DataExportTool (Editor)] → [Binary + .cs Enum]
                                                      ↓
                            [CReferenceManager.LoadData()] → [CRefXxx 메모리 캐시]
                                                                   ↓
                                  코드에서 사용: CReferenceManager.FindRefCharacter(id)
```

## Stats

| Item | Count |
|------|-------|
| Files | 1312 |
| Classes / Interfaces | 3444 |
| Methods | 11431 |
| Total Size | 15599 KB |

## Top-level Folders (역할별 분류)

### 🎮 게임 클라이언트 (Unity)
| Folder | Files | 역할 | Key Classes |
|--------|-------|------|-------------|
| `NetworkClient` | 360 | 게임 로직 코어 (캐릭터, 무기, AI, 전투, 맵) | Character, GunBase, AIActionBrainV2, GameMode, Projectile |
| `ScriptDev` | 423 | UI, 매니저, 유틸, 데이터, 렌더링 | CUIManager, UserDataManager, SoundManager, CMain |
| `ScriptTools` | 227 | 에디터 도구 (빌드, 무기테스트, 맵에디터) | DataExportToolEditor, WeaponPlayEditor, BuildingGeneratorCore |
| `ReferenceTable` | 90 | 게임 데이터 래퍼 (Excel→코드) | CReferenceManager, CRefCharacter, CRefWeapon, CRefSkill |
| `Components` | 2 | 공용 컴포넌트 | EffectEventKey, OmniRaycaster |
| `DebugTools` | 5 | 디버그 | CDebug, DebugPlayComponent |

### 🖥️ 서버
| Folder | Files | 역할 | Key Classes |
|--------|-------|------|-------------|
| `Aegis.GameServer` | 31 | 게임 서버 메인 | LoginService, GameLogic, Player, DbManager |
| `Aegis.NetworkShared` | 6 | 공유 네트워크 | PacketSession, RecvBuffer, AesGcmEncryption |
| `Aegis.OrleansSilo` | 6 | Orleans 분산 처리 | PlayerGrain, SqsPollingGrain |
| `Aegis.ServerFramework` | 13 | 서버 프레임워크 | ConfigManager, JobSerializer, JobTimer |
| `Aegis.Client` | 7 | 테스트 클라이언트 | ServerConnector, PacketHandler |
| `Aegis.AppHost` | 1 | 앱 호스트 | — |
| `NetworkDev` | 115 | 데디케이트 서버(FishNet) | NetworkManager_Aegis, GameEventMessage |
| `OrleansX.*` | 12 | Orleans 확장 | StatefulGrainBase, GrainEvent |

### 🔧 코드 생성
| Folder | Files | 역할 |
|--------|-------|------|
| `Gen_Client` | 5 | 클라이언트 패킷/Enum (자동생성) |
| `Gen_Server` | 5 | 서버 패킷/Enum (자동생성) |
| `Aegis.PacketGenerator` | 2 | 패킷 코드 생성기 |

## ⭐ 핵심 코드 경로 (빠른 찾기)

### 캐릭터 시스템
- `NetworkClient/NetPlay/Character/Character.cs` — 캐릭터 메인 (Awake, Update, FSM, IK 등 60+ 메서드)
- `NetworkClient/NetPlay/Character/Character.Energy.cs` — 에너지/궁극기 게이지
- `NetworkClient/NetPlay/Character/CharacterAnimationInterface.cs` — 애니메이션 레이어 제어
- `NetworkClient/NetPlay/Controller/PlayerController.cs` — 플레이어 입력 처리
- `NetworkClient/NetPlay/Controller/AIController.cs` — AI 봇 제어

### 무기/사격 시스템
- `NetworkClient/NetPlay/Equipment/EquipmentManager.cs` — 무기 장착/교체
- `NetworkClient/NetPlay/Equipment/GunBase.cs` — 총기 기본 클래스
- `NetworkClient/NetPlay/Equipment/Projectile.cs` — 투사체

### 스킬 시스템
- `NetworkClient/NetPlay/Character/CharacterFSMInterface.cs` — 스킬 상태 전환
- 스킬 실행: `_Skill` 가이드 참조

### 데미지 시스템
- `NetworkClient/NetPlay/Damage/DamageCalculator.cs` — 데미지 공식
- `NetworkClient/NetPlay/Damage/DamageEvent.cs` — 데미지 이벤트 타입
- `NetworkClient/NetPlay/Stat/StatContainer.cs` — 스탯 컨테이너 (버프/디버프 적용)

### AI 시스템
- `NetworkClient/NetPlay/AI/AIActionBrainV2.cs` — V2 브레인 메인
- `NetworkClient/NetPlay/AI/AIActionBrainV2_Condition.cs` — 조건 판정 (34+ 메서드)
- `NetworkClient/NetPlay/AI/AIActionBrainV2_Sensor.cs` — 시야/감지

### UI 시스템
- `ScriptDev/UI/UIFramework/CUIManager.cs` — UI 매니저 싱글턴
- `ScriptDev/UI/UIFramework/CUIPanel.cs` — 패널 기본 클래스
- `ScriptDev/UI/Lobby/CUILobbyMainPanel.cs` — 로비 메인

### 게임 모드
- `NetworkClient/NetPlay/GameMode/GameMode.cs` — 게임 모드 기본 (53+ 메서드)
- `NetworkClient/NetPlay/GameMode/GameModeRound.cs` — 라운드 관리 (47+ 메서드)

### 데이터 시스템
- `ReferenceTable/` — CRefXxx 클래스 90개 (Excel 데이터 접근)
- `ScriptDev/Manager/UserDatas/` — 유저 데이터 30개 파일

## Detected Game System Domains

| Domain | Files | Guide | 핵심 진입점 |
|--------|-------|-------|------------|
| Character | 286 | `_Character` | `Character.cs`, `StatContainer.cs` |
| Combat | 155 | `_Combat` | `DamageCalculator.cs`, `StatusEffectHandler` |
| Skill | 151 | `_Skill` | `SkillHandler`, `PassiveHandler` |
| AI | 147 | `_AI` | `AIActionBrainV2.cs` |
| Network | 565 | `_Network` | `NetworkManager_Aegis.cs`, `PacketManager` |
| Map | 103 | `_Map` | `MapObjectManager.cs`, `SafetyZone.cs` |
| UI | 378 | `_UI` | `CUIManager.cs`, `CUIPanel.cs` |
| Manager | 273 | `_Manager` | `UserDataManager`, `AssetManager` |
| Data | 313 | `_Data` | `CReferenceManager`, `CRefXxx` |
| Weapon | 77 | `_Weapon` | `GunBase.cs`, `EquipmentManager.cs` |
| Effect | 89 | `_Effect` | `EffectManager.cs`, `MaterialEffectController` |
| Item | 57 | `_Item` | `Gear`, `ConsumableItem` |
| Camera | 20 | `_Camera` | `CCameraController.cs`, `CAimAssistSystem.cs` |
| Audio | 18 | `_Audio` | `SoundManager.cs`, `CEffectSound.cs` |
| Animation | 17 | `_Animation` | `CharacterAnimationInterface.cs` |

> Use `read_guide` tool to read domain-specific guides before searching code.

## Top Namespaces (by file count)

| Namespace | Files | 역할 |
|-----------|-------|------|
| `ProjectAegis.NetPlay` | 215 | 게임 로직 코어 |
| `Aegis.ReferenceTable` | 189 | 데이터 테이블 |
| `ProjectAegis.UI` | 109 | UI 시스템 |
| `ProjectAegis.NetPlay.FSM` | 103 | 캐릭터 FSM |
| `ProjectAegis.Utility` | 49 | 유틸리티 |
| `ProjectAegis.UserDatas` | 47 | 유저 데이터 |
| `Cysharp.Text` | 28 | 문자열 최적화 (ZString) |
| `ProjectAegis.EditorTools` | 25 | 에디터 도구 |
| `DataExportTool` | 21 | 데이터 내보내기 |
| `ProjectAegis.NetPlay.Interaction.Handlers` | 17 |
| `System` | 16 |
| `Aegis.EditorTools` | 16 |
| `ProjectAegis.UI.Ingame` | 15 |
| `ProjectAegis.UI.Layouts` | 14 |
| `Aegis.Rendering` | 13 |
| `Aegis.ServerFramework` | 13 |
| `ProjectAegis.UI.Profile` | 12 |
| `ProjectAegis.EditorTools.UILayoutBuilder` | 11 |
| `ProjectAegis.Data` | 11 |
| `FishNet.Managing` | 10 |

## Sub-folder Details (5+ files, top 60 by size)

### `NetworkClient/NetPlay/Character/` (184 files)
**Classes**: EFiringState, EUpperState, ELifeState, CanFireState, Character, Row, BlendWeightControl, ECharacterAnimLayerType, AnimHash, DetonationTarget, EDeathAnimType, ShieldInstance, SmoothRotationParams, AnimationDampTime, PingRpcData (+ 418 more)
- `Character.cs` -> EFiringState, EUpperState, ELifeState, CanFireState, Character [Awake, Start, OnDestroy, OnReloadCanceled, Update (+ 55 more)]
- `Character.Debug.cs` -> Character, Row [ResetDebugStatics, ResetDebugStaticsOnEnterPlayMode, DebugGUI, BuildRows]
- `Character.Energy.cs` -> Character [OnChangedEnergy, InitEnergy, ChangeEnergyGain, RestoreEnergyGain, UpdateEnergy (+ 17 more)]
- `Character.IK.cs` -> Character [SetupIK, UpdateIK, SetAimIKMuzzle, SetAimIKTarget, SetArmIKTarget (+ 15 more)]
- `Character.Log.cs` -> Character [ServerRpcLog, UpdateBenchmark]
- `Character.Mark.cs` -> Character [ApplyMark, RemoveMark, ForceRemoveMark, HasMark, UpdateMark (+ 4 more)]
- `Character.Trajectory.cs` -> Character [InitTrajectoryIndicator, SetTrajectoryVisible, UpdateTrajectory, ApplyTrajectoryVisual]
- `CharacterAnimationInterface.cs` -> BlendWeightControl, ECharacterAnimLayerType, AnimHash, Character [Update, SetValue, SetTarget, SetFadeIn, SetFadeOut (+ 40 more)]
- `CharacterDetonationInterface.cs` -> DetonationTarget, Character [Equals, GetHashCode, AddDetonationTarget, RemoveDetonationTarget, GetDetonationTarget (+ 2 more)]
- `CharacterFSMInterface.cs` -> Character [ResetWasFiringBeforeState, InitFSM, UpdateFSM, AddParkourState, ChangeParkourState (+ 36 more)]
- *(+ 174 more files)*

### `ReferenceTable/` (90 files)
**Classes**: CRefAccountLevel, CReferenceManager, CRefAchievement, CRefAchievementLevel, CRefArmor, CRefBattleModeInfo, CRefBotActionDecision, CRefBotActionStat, CRefBotAi, CRefBotBattleMovement, CRefBotCondition, CRefBotData, CRefBotEnemySelector, CRefBotEscapeTarget, CRefBotMoveDecision (+ 180 more)
- `RefAccountLevel.cs` -> CRefAccountLevel, CReferenceManager [RegisterRefAccountLevel, RegisterRefAccountLevelBinary, FindRefAccountLevel, GetRefAccountLevels]
- `RefAchievement.cs` -> CRefAchievement, CReferenceManager [RegisterRefAchievement, RegisterRefAchievementBinary, FindRefAchievement, GetRefAchievements]
- `RefAchievementLevel.cs` -> CRefAchievementLevel, CReferenceManager [RegisterRefAchievementLevel, RegisterRefAchievementLevelBinary, FindRefAchievementLevel, GetRefAchievementLevels]
- `RefArmor.cs` -> CRefArmor, CReferenceManager [RegisterRefArmor, RegisterRefArmorBinary, FindRefArmor, GetRefArmors]
- `RefBattleModeInfo.cs` -> CRefBattleModeInfo, CReferenceManager [RegisterRefBattleModeInfo, RegisterRefBattleModeInfoBinary, FindRefBattleModeInfo, GetRefBattleModeInfos]
- `RefBotActionDecision.cs` -> CRefBotActionDecision, CReferenceManager [RegisterRefBotActionDecision, RegisterRefBotActionDecisionBinary, FindRefBotActionDecision, GetRefBotActionDecisions]
- `RefBotActionStat.cs` -> CRefBotActionStat, CReferenceManager [RegisterRefBotActionStat, RegisterRefBotActionStatBinary, FindRefBotActionStat, GetRefBotActionStats]
- `RefBotAi.cs` -> CRefBotAi, CReferenceManager [RegisterRefBotAi, RegisterRefBotAiBinary, FindRefBotAi, GetRefBotAis]
- `RefBotBattleMovement.cs` -> CRefBotBattleMovement, CReferenceManager [RegisterRefBotBattleMovement, RegisterRefBotBattleMovementBinary, FindRefBotBattleMovement, GetRefBotBattleMovements]
- `RefBotCondition.cs` -> CRefBotCondition, CReferenceManager [RegisterRefBotCondition, RegisterRefBotConditionBinary, FindRefBotCondition, GetRefBotConditions]
- *(+ 80 more files)*

### `NetworkDev/03.ReferenceManager/02.ReferenceTable/` (90 files)
**Classes**: CRefAccountLevel, CReferenceManager, CRefAchievement, CRefAchievementLevel, CRefArmor, CRefBattleModeInfo, CRefBotActionDecision, CRefBotActionStat, CRefBotAi, CRefBotBattleMovement, CRefBotCondition, CRefBotData, CRefBotEnemySelector, CRefBotEscapeTarget, CRefBotMoveDecision (+ 180 more)
- `RefAccountLevel.cs` -> CRefAccountLevel, CReferenceManager [RegisterRefAccountLevel, RegisterRefAccountLevelBinary, FindRefAccountLevel, GetRefAccountLevels]
- `RefAchievement.cs` -> CRefAchievement, CReferenceManager [RegisterRefAchievement, RegisterRefAchievementBinary, FindRefAchievement, GetRefAchievements]
- `RefAchievementLevel.cs` -> CRefAchievementLevel, CReferenceManager [RegisterRefAchievementLevel, RegisterRefAchievementLevelBinary, FindRefAchievementLevel, GetRefAchievementLevels]
- `RefArmor.cs` -> CRefArmor, CReferenceManager [RegisterRefArmor, RegisterRefArmorBinary, FindRefArmor, GetRefArmors]
- `RefBattleModeInfo.cs` -> CRefBattleModeInfo, CReferenceManager [RegisterRefBattleModeInfo, RegisterRefBattleModeInfoBinary, FindRefBattleModeInfo, GetRefBattleModeInfos]
- `RefBotActionDecision.cs` -> CRefBotActionDecision, CReferenceManager [RegisterRefBotActionDecision, RegisterRefBotActionDecisionBinary, FindRefBotActionDecision, GetRefBotActionDecisions]
- `RefBotActionStat.cs` -> CRefBotActionStat, CReferenceManager [RegisterRefBotActionStat, RegisterRefBotActionStatBinary, FindRefBotActionStat, GetRefBotActionStats]
- `RefBotAi.cs` -> CRefBotAi, CReferenceManager [RegisterRefBotAi, RegisterRefBotAiBinary, FindRefBotAi, GetRefBotAis]
- `RefBotBattleMovement.cs` -> CRefBotBattleMovement, CReferenceManager [RegisterRefBotBattleMovement, RegisterRefBotBattleMovementBinary, FindRefBotBattleMovement, GetRefBotBattleMovements]
- `RefBotCondition.cs` -> CRefBotCondition, CReferenceManager [RegisterRefBotCondition, RegisterRefBotConditionBinary, FindRefBotCondition, GetRefBotConditions]
- *(+ 80 more files)*

### `ScriptDev/UI/Lobby/` (50 files)
**Classes**: CUIAlertButton, ERotationMode, ERotationZone, CUICharacterModelRotator, EInviteListTabType, CUIInviteListComp, FriendSlot, CUILobbyModelInfo, CUILobbyCharacterModelController, LobbyModelUserStatusInfo, CUILobbyHeroSelectComp, HeroSlotItem, HeroData, CUILobbyHUDArea, CUILobbyHUDAreaController (+ 105 more)
- `CUIAlertButton.cs` -> CUIAlertButton [SetReddotCount, CUIAlertButton]
- `CUICharacterModelRotator.cs` -> ERotationMode, ERotationZone, CUICharacterModelRotator [Awake, Update, OnDestroy, OnPointerDown, OnDrag (+ 20 more)]
- `CUIInviteListComp.cs` -> EInviteListTabType, CUIInviteListComp, FriendSlot [Awake, SetData, OnButtonInvite, OnDestroy, OnButtonClose (+ 14 more)]
- `CUILobbyCharacterModelController.cs` -> CUILobbyModelInfo, CUILobbyCharacterModelController, LobbyModelUserStatusInfo [Dispose, RefreshAll, UpdatePositions, Remove, HideAll (+ 12 more)]
- `CUILobbyHeroSelectComp.cs` -> CUILobbyHeroSelectComp, HeroSlotItem, HeroData [SetData, OnButtonSelect, SetSelected, SetDim, IsSelected (+ 15 more)]
- `CUILobbyHUDArea.cs` -> CUILobbyHUDArea [ConvertRangeTypeToSlideDirection, SetContentTypes, ExistsSlot, FinalizeLayout, SortIconSlots (+ 2 more)]
- `CUILobbyHUDAreaController.cs` -> CUILobbyHUDAreaController [Initialize, Show, Hide, ShowImmediate, HideImmediate (+ 2 more)]
- `CUILobbyInviteInfoBtn.cs` -> CUILobbyInviteInfoBtn [RegisterEvents, RemoveEvents, OnButtonClick, OnInviteCountChanged, SetActive (+ 3 more)]
- `CUILobbyMainPanel.cs` -> LobbyM2DefineEditor, CUILobbyMainPanel, ELobbyBtnState [ToggleLobbyM2, ToggleLobbyM2Validate, InitUIBind, InitializeControllers, OnPanelEnabled (+ 29 more)]
- `CUILobbyOverlayInviteBtn.cs` -> CUILobbyOverlayInviteBtn [InitUIBind, OnPanelEnabled, OnPanelDisabed, OnShow, OnButtonClick (+ 3 more)]
- *(+ 40 more files)*

### `NetworkClient/NetPlay/AI/` (46 files)
**Classes**: AIActionBrainBase, AIActionBrainV1, AIActionBrainV2, EShotResultType, EBotMoveState, EBattleMovementType, 확인, AIBrainV2StackFrameInfo, AIBrainV2DebugLogEntry, AIBrainV2DebugState, AIBrainV2GradeActionInfo, AIBrainV2SkillSlotInfo, AIBrainV2SkillDecisionStateInfo, AIBrainV2SensoredEnemyInfo, AIBrainV2DebugLogger (+ 86 more)
- `AIActionBrainBase.cs` -> AIActionBrainBase [GetAIController, GetAIMoveManager, GetAIActionManager, IsReservedResetAction, ReserveResetAction (+ 9 more)]
- `AIActionBrainV1.cs` -> AIActionBrainV1 [Update, FixedUpdate, ChangeTarget, ChangeBrainMode, ResetActionDirectly (+ 5 more)]
- `AIActionBrainV2.cs` -> AIActionBrainV2 [FirstInit, Update, FixedUpdate, ChangeTarget, ChangeBrainMode (+ 5 more)]
- `AIActionBrainV2_ActionStat.cs` -> EShotResultType, EBotMoveState, AIActionBrainV2 [EnterBlindState, ExitBlindState, GetCurrentActionStat, CalculateAccuracy, CalculateHeadshotRate (+ 15 more)]
- `AIActionBrainV2_BattleMovement.cs` -> EBattleMovementType, AIActionBrainV2 [UpdateBattleMovement, AccumulateMovementWeights, TryReserveBattleMovement, ReserveBattleMovement, ResetMovementWeights (+ 18 more)]
- `AIActionBrainV2_Condition.cs` -> AIActionBrainV2, 확인 [CheckCondition, GetConditionValue, CompareValue, GetOwnAmmoPercent, GetOwnFullMagCount (+ 34 more)]
- `AIActionBrainV2_Debug.cs` -> AIBrainV2StackFrameInfo, AIBrainV2DebugLogEntry, AIBrainV2DebugState, AIBrainV2GradeActionInfo, AIBrainV2SkillSlotInfo, AIBrainV2SkillDecisionStateInfo, AIBrainV2SensoredEnemyInfo, AIBrainV2DebugLogger, AIActionBrainV2, ChangeAimModeSkipInfo, AIActionDebugLogger [GetFormattedTime, ToString, Log, GetAllLogs, GetLogsByObjectId (+ 55 more)]
- `AIActionBrainV2_MoveDecision.cs` -> AIActionBrainV2 [InitWaypoints, TryGetPositionFromMoveDecision, UpdateMoveDecision, TryConsumeReservedMoveDecision, TrySelectMoveDecisionFromFullList (+ 13 more)]
- `AIActionBrainV2_Sensor.cs` -> ESensorState, ESensorChangeType, ESensorKind, EnemySensorInfo, AIActionBrainV2 [OnSensorStateChanged, StartSensorBlind, GetEnemySensorState, CanShootEnemy, UpdateSensor (+ 19 more)]
- `AIActionBrainV2_ShotSelector.cs` -> EShotAction, AIActionBrainV2 [UpdateShotSelector, UpdatePrepareTime, ClearPrepareState, EvaluateAndReserveShotAction, StartPrepareForFire (+ 12 more)]
- *(+ 36 more files)*

### `ScriptTools/Editor/x64/` (42 files)
**Classes**: ftAdditionalConfig, LogLevel, ftAPVSettings, ftAtlasPreview, ftBuildGraphics, TexInputType, TexInput, VBFull, FarSphereRenderData, AtlasNode, BufferedBinaryWriterFloat, ReinterpretBuffer, BufferedBinaryWriterInt, ExportSceneData, AdjustUVPaddingData (+ 61 more)
- `ftAdditionalConfig.cs` -> ftAdditionalConfig, LogLevel
- `ftAPVSettings.cs` -> ftAPVSettings [OnGUI, OnDisable]
- `ftAtlasPreview.cs` -> ftAtlasPreview [SelectionCallback, OnGUI]
- `ftBuildGraphics.cs` -> ftBuildGraphics, TexInputType, TexInput, VBFull, FarSphereRenderData, AtlasNode, BufferedBinaryWriterFloat, ReinterpretBuffer, BufferedBinaryWriterInt, ExportSceneData, AdjustUVPaddingData, PackData [InitShaders, LoadScene, SetAlbedos, CopyAlbedos, CopyHeightmapsFromRAM (+ 55 more)]
- `ftBuildLights.cs` -> ftBuildLights, SavedLight, cannot, BSPNode [InitMaps, BuildDirectLight, BuildSkyLight, GetRandomTriFromBSP, BuildProbabilityBSP (+ 6 more)]
- `ftClearCache.cs` -> ftClearCache [Clear, ClearCache]
- `ftClearMenu.cs` -> ftClearMenu, SceneClearingMode [ClearBakedDataShow, RemoveFiles, ClearBakedData]
- `ftClient.cs` -> ftClient [UpdateConnection, Disconnect, ConnectToServer, SendRenderSequence, ServerGetData (+ 1 more)]
- `ftCreateMenu.cs` -> ftCreateMenu [CreateDirectionalLight, CreateSkyLight, CreatePointLight, CreateAreaLight, CreateSpotLight (+ 1 more)]
- `ftDDS.cs` -> ftDDS
- *(+ 32 more files)*

### `ScriptTools/Editor/` (36 files)
**Classes**: AddressableHelper, AddressableScanEditor, FolderStatus, BundleFileInfo, DuplicateAddressInfo, AssetLocation, ProcessResult, FileProcessResult, AddressableConfig, GroupRule, AssetFileBrowser, BrowserTab, AssetEntry, TypeGroup, AutoDisableRaycastTargetEditor (+ 74 more)
- `AddressableHelper.cs` -> AddressableHelper
- `AddressableScanEditor.cs` -> AddressableScanEditor, FolderStatus, BundleFileInfo, DuplicateAddressInfo, AssetLocation, ProcessResult, FileProcessResult, AddressableConfig, GroupRule [ShowWindow, OnEnable, InitializeGUIStyles, OnGUI, DrawSeparator (+ 47 more)]
- `AssetFileBrowser.cs` -> AssetFileBrowser, BrowserTab, AssetEntry, TypeGroup [ShowWindow, OnEnable, OnDisable, CreateTextures, DestroyTextures (+ 26 more)]
- `AutoDisableRaycastTargetEditor.cs` -> AutoDisableRaycastTargetEditor [DisableRaycastTargetsInHierarchy, ValidateDisableRaycastTargetsInHierarchy]
- `BuildingGeneratorContextMenu.cs` -> BuildingGeneratorContextMenu [CreateWallMenu, CreateFloorMenu, AddWallMenuItem, AddFloorMenuItem, CreatePillarMenu (+ 1 more)]
- `BuildingGeneratorEditor.cs` -> BuildingGeneratorWindow, EditMode, DragDirection [ShowWindow]
- `BuildingGeneratorGridEditor.cs` -> BuildingGeneratorGridEditor, EditMode [DrawGrid, DrawGhostFloor, DrawGridCells, DrawCellFloor, DrawCellWalls (+ 9 more)]
- `BuildingGeneratorSettingsPanel.cs` -> BuildingGeneratorSettingsPanel, SettingsTab [Draw, DrawTabHeader, GetTabLabel, DrawBasicSettings, DrawBuildingSettings (+ 8 more)]
- `BuildingGeneratorUIHelper.cs` -> BuildingGeneratorUIHelper [GetWallColor, GetFloorColor, DrawWall, DrawFloor, DrawFloorRect (+ 7 more)]
- `BuildingJSONExporter.cs` -> BuildingJSONExporter, BuildingDataJSON, FloorDataJSON, CellDataJSON [ExportToJSON, ImportFromJSON, ConvertToJSON, ConvertFromJSON]
- *(+ 26 more files)*

### `ScriptDev/UI/` (34 files)
**Classes**: CLobbyBackGround, CLobbyCharacterInfo, CLobby2DBGOverrideInfo, OverrideFlag, CLobbyCameraPivot, CUIButtonAction, CUIButtonSkill, CUICombatDisplay, CUICombatText, ECommonPopupInfoType, ECommonPopupButtonType, CommonPopupData, CUICommonPopup, CUICrosshair, ECrosshairType (+ 36 more)
- `CLobbyBackGround.cs` -> CLobbyBackGround, CLobbyCharacterInfo, CLobby2DBGOverrideInfo, OverrideFlag [Awake, Update, SetTestMode, InitializeBackground, InitializeCameraPivots (+ 52 more)]
- `CLobbyCameraPivot.cs` -> CLobbyCameraPivot [InstallCamera, GetSlotTransform, SetSlotTransform, GetAllSlots, ApplySettings (+ 4 more)]
- `CUIButtonAction.cs` -> CUIButtonAction [Awake, SetPointerEvent, OnPointerDown, OnPointerUp, OnDrag (+ 2 more)]
- `CUIButtonSkill.cs` -> CUIButtonSkill [GetCooltimeText, Awake, SetIcon, SetIconAlphaByCooldown, SetSticker (+ 8 more)]
- `CUICombatDisplay.cs` -> CUICombatDisplay [Awake, GetCombatText, ShowCombatText, OverrideCambatText, HideCombatText]
- `CUICombatText.cs` -> CUICombatText [Awake, Update, SetData, Hide, GetCombatValueString (+ 4 more)]
- `CUICommonPopup.cs` -> ECommonPopupInfoType, ECommonPopupButtonType, CommonPopupData, CUICommonPopup [OnPanelEnabled, OnPanelDisabed, OnPanelRelase, InitUIBind, OnShow (+ 12 more)]
- `CUICrosshair.cs` -> CUICrosshair, ECrosshairType, EHitFeedbackType, ECrosshairColorType [Awake, OnDestroy, Update, LateUpdate, SetPlayer (+ 18 more)]
- `CUIGameMessage.cs` -> GameMessageData, CUIGameMessage [Awake, Update, OnDestroy, ShowMessage, ClearMessages (+ 10 more)]
- `CUIGlobalNotification.cs` -> CUIGlobalNotification [CanShow, TryShow, InitUIBind, OnPanelEnabled, OnPanelDisabed (+ 4 more)]
- *(+ 24 more files)*

### `ScriptDev/UI/UIFramework/` (33 files)
**Classes**: ELayout, CUIManager, CUIPanel, InOutOption, EHideOption, CUIPanelContent, CUIPanelLayout, UIAttachAssetAttribute, UILayoutEditSupport, ERuntimeTestMode, PrefabInfo, UILayoutEditSupportEditor, UINavigationControl, PageSnapshot, EditorHistoryEntry (+ 50 more)
- `CUIManager.cs` -> ELayout, CUIManager [EnableNavigation, DisableNavigation, ClearNavigationHistory, InitializeSingleton, TryGetPanelAttribute (+ 38 more)]
- `CUIPanel.cs` -> CUIPanel, InOutOption [Play, WaitAndCall, TryGetChildPanel, ShowChildPanel, HideChildPanel (+ 11 more)]
- `CUIPanelContent.cs` -> EHideOption, CUIPanelContent [Log, SetAsLastSibling, Initialize, InitAttachAsset, InitUIBind (+ 12 more)]
- `CUIPanelLayout.cs` -> CUIPanelLayout [Awake, LastActivePanel, DestroyAllPanels, DebugLog, RectTransform]
- `UIAttachAsset.cs` -> UIAttachAssetAttribute [Instantiate, ReleaseInstance, UIAttachAssetAttribute]
- `UILayoutEditSupport.cs` -> UILayoutEditSupport, ERuntimeTestMode [OnEnable, OnDisable, Start, OpenUIEditorLevel]
- `UILayoutEditSupportEditor.cs` -> UILayoutEditSupport, PrefabInfo, UILayoutEditSupportEditor [CreateLobbyBackGround, DestroyLobbyBackGround, HasLobbyBackGround, GetLobbyBackGroundInstance, UpdatePrefabPath (+ 22 more)]
- `UINavigationControl.cs` -> UINavigationControl, PageSnapshot, EditorHistoryEntry [FindPanelDelegate, GetActivePopupsDelegate, ShowPanelByTypeDelegate, TryGetLayoutDelegate, FindActivePanelByLayoutDelegate (+ 16 more)]
- `UIPanelAssetAttribute.cs` -> EAssetLoadType, UIPanelAssetAttribute [FindOrLoadLocation, InternalLoadCache, InstantiateInternal, Instantiate, DestroyInstance (+ 3 more)]
- `UIButton.cs` -> EButtonState, UIButton, ButtonStateData [SetColors, UpdateStateUI, Awake, GetActColor, RefreshState (+ 2 more)]
- *(+ 23 more files)*

### `ScriptDev/UI/Utilities/` (32 files)
**Classes**: AddressLoadingTracker, ArrayExtension, AspectRatioRawImage, ScaleMode, AspectRatioRawImageEditor, CanvasGroupExtenstion, CompareExtension, CompareCClientItem, ComponentExtension, CUIRewardSlot, DictionaryExetension, EmptyGraphics, EnumUtils, FunctionExtension, GameObjectExtension (+ 38 more)
- `AddressLoadingTracker.cs` -> AddressLoadingTracker [IsLoading, StartLoading, EndLoading, AddPendingCallback, HasPendingCallbacks]
- `ArrayExtension.cs` -> ArrayExtension [Sum]
- `AspectRatioRawImage.cs` -> AspectRatioRawImage, ScaleMode, AspectRatioRawImageEditor [Start, AdjustSize, OnInspectorGUI, OnSceneGUI]
- `CanvasGroupExtenstion.cs` -> CanvasGroupExtenstion [SetGroupAlpha, SetInteractable, FadeCanvasGroup]
- `CompareExtension.cs` -> CompareExtension, CompareCClientItem
- `ComponentExtension.cs` -> ComponentExtension [SafeSetActive, SetActive, SafeIsActive, IsActive]
- `CUIRewardSlot.cs` -> CUIRewardSlot [Awake, SetData]
- `DictionaryExetension.cs` -> DictionaryExetension
- `EmptyGraphics.cs` -> EmptyGraphics [UpdateMaterial, OnPopulateMesh]
- `EnumUtils.cs` -> EnumUtils
- *(+ 22 more files)*

### `NetworkClient/NetPlay/Interaction/` (31 files)
**Classes**: EInteractionDetectMode, IInteractable, InteractableObject, InteractableRegistry, InteractableVisual, InteractRequestBroadcast, InteractResultBroadcast, InteractableStateRequestBroadcast, InteractableStateResultBroadcast, InteractionNetworkManager, InteractionPlayerModule, RaycastHitDistanceComparer, LRUCache, RefInteractableSelectorAttribute, RefInteractableSelectorDrawer (+ 23 more)
- `IInteractable.cs` -> EInteractionDetectMode, IInteractable
- `InteractableObject.cs` -> InteractableObject [Awake, Start, OnDestroy, Initialize, GenerateUniqueId (+ 23 more)]
- `InteractableRegistry.cs` -> InteractableRegistry [ResetStatics, Register, Unregister, Get, TryGet (+ 2 more)]
- `InteractableVisual.cs` -> InteractableVisual [Awake, Initialize, Show, Hide, OnDestroy (+ 4 more)]
- `InteractionBroadcasts.cs` -> InteractRequestBroadcast, InteractResultBroadcast, InteractableStateRequestBroadcast, InteractableStateResultBroadcast
- `InteractionNetworkManager.cs` -> InteractionNetworkManager [ResetStatics, Awake, OnEnable, OnDisable, OnDestroy (+ 24 more)]
- `InteractionPlayerModule.cs` -> InteractionPlayerModule, RaycastHitDistanceComparer [ResetStatics, Awake, OnEnable, OnDisable, OnDestroy (+ 23 more)]
- `LRUCache.cs` -> LRUCache [TryGetValue, Set, ContainsKey, Clear, LRUCache]
- `RefInteractableSelectorAttribute.cs` -> RefInteractableSelectorAttribute
- `RefInteractableSelectorDrawer.cs` -> RefInteractableSelectorDrawer, InteractableEntry, InteractableJsonEntry [OnGUI, DrawPopup, DrawFilteredPopup, LoadInteractableObject, LoadFromJson (+ 1 more)]
- *(+ 21 more files)*

### `ScriptDev/Manager/UserDatas/` (30 files)
**Classes**: AchievementData, UserAchievementData, RefAchieveGroupHashData, AchievementGroupData, EUIMissionSlotState, AchievementExtention, UserDataManager, UserCharacters, WeaponEquipData, EInviteType, IRequestInviteData, UserCurrencyData, ReceiveRequest, UserFriendData, FriendExtention (+ 39 more)
- `AchievementDatas.cs` -> AchievementData
- `AchievementExtention.cs` -> UserAchievementData, RefAchieveGroupHashData, AchievementGroupData, EUIMissionSlotState, AchievementExtention [TryGetUserAchieveData, GetMissionLevel, GetCharacterAchieveGroupIDs, GetCommonAchieveGroupIDs, GetRefAchievesByGroupID (+ 5 more)]
- `UserAchievementData.cs` -> UserAchievementData, UserDataManager [InitUserData, RegisterNetHandler, ResetData, InitializeAchievement, InitUserAchievementeData (+ 1 more)]
- `UserDataManager_Character.cs` -> UserCharacters, UserDataManager [RegisterNetHandler, InitUserData, ResetData, InitializeFromServer, InitializeModulesFromCharacterInfo (+ 42 more)]
- `UserDataManager_Module.cs` -> UserCharacters [InitializeWeapons, EquipWeaponInternal, InitializeModulesFromServer, InitializeModuleSlot, GetWeaponSlotTypeByWeaponId (+ 7 more)]
- `UserDataManager_Skill.cs` -> UserCharacters [InitializeSkills, InitializePassiveSkillsFromCharacterInfo, GetPassiveIdFromItemUID, SendEquipPassiveSkillRequest, SendUnequipPassiveSkillRequest (+ 10 more)]
- `UserDataManager_Skin.cs` -> UserDataManager, UserCharacters [InitializeSkins, RegisterSkinNetHandler, IsCharacterSkinOwned, IsWeaponSkinOwned, SetCharacterSkin (+ 13 more)]
- `WeaponEquipData.cs` -> WeaponEquipData
- `IRequestInviteData.cs` -> EInviteType, IRequestInviteData
- `UserCurrencyData.cs` -> UserCurrencyData, UserDataManager [RegisterNetHandler, InitUserData, ResetData, HasEnough, SetCurrency (+ 5 more)]
- *(+ 20 more files)*

### `NetworkClient/NetPlay/MapObject/` (27 files)
**Classes**: MapObjectAttribute, EMapObjectNetworkObjectID, EMapObjectTriggerConditionType, EMapObjectTriggerFunctionType, EMapObjectTriggerTarget, EComparisonOperator, EMapObjectTriggerColliderShape, MapObjectManager, MapObjectTypeRegistry, SafetyZone, MapObjectDescription, MapObjectDescriptionComp, MapObjectDescriptionRoot, NeutralPointCaptureDescription, NeutralPointCaptureDescriptionComp (+ 27 more)
- `MapObjectAttribute.cs` -> MapObjectAttribute [MapObjectAttribute]
- `MapObjectDefine.cs` -> EMapObjectNetworkObjectID, EMapObjectTriggerConditionType, EMapObjectTriggerFunctionType, EMapObjectTriggerTarget, EComparisonOperator, EMapObjectTriggerColliderShape
- `MapObjectManager.cs` -> MapObjectManager [Init, OnMapObjectSpawned, Clear, TryGetMapObjects, TryGetMapObject]
- `MapObjectTypeRegistry.cs` -> MapObjectTypeRegistry [InitializeStatics, BuildTypeMap, NetworkObjectIDToMapObjectType, NetworkObjectIDToDescriptionComponentType, NetworkObjectIDToDescriptionType (+ 7 more)]
- `SafetyZone.cs` -> SafetyZone [SetTeamType, OnTriggerEnter, OnTriggerExit]
- `MapObjectDescriptionComp.cs` -> MapObjectDescription, MapObjectDescriptionComp [Dump, Init, OnDestroy, OnEnable]
- `MapObjectDescriptionComp.Editor.cs` -> MapObjectDescriptionComp [InitializeStatics, OnValidate, OnDrawGizmos, OnDrawGizmosSelected, OnEnableEditor (+ 14 more)]
- `MapObjectDescriptionRoot.cs` -> MapObjectDescriptionRoot [OnEnable, OnDisable, AssignUniqueIDs, Find, GatherDescriptionComponents (+ 1 more)]
- `MapObjectDescriptionRoot.Editor.cs` -> MapObjectDescriptionRoot [OnEnableEditor, OnDisableEditor, OnSceneSaving, OnSceneSaved, ClearModelsEditor (+ 3 more)]
- `NeutralPointCaptureDescriptionComp.cs` -> NeutralPointCaptureDescription, NeutralPointCaptureDescriptionComp
- *(+ 17 more files)*

### `NetworkClient/NetPlay/Equipment/` (26 files)
**Classes**: EquipmentManager, ArmorBase, Projectile, WeaponData, ProjectileResultData, CollisionRelay, ProjectileMovement, ProjectileMovementBallistic, EWeaponState, EquippableBase, GunBase, HitEffectData, MeleeWeaponBase, PhysicsConstants, Ballistics (+ 26 more)
- `EquipmentManager.Armor.cs` -> EquipmentManager [AddSyncVarChanedArmor, RemoveSyncVarChanedArmor, OnChangeSlotArmorID, EquipArmor, SetupClientArmorObject (+ 2 more)]
- `EquipmentManager.cs` -> EquipmentManager [GetWeaponRuntimeAnimatorController, AddSyncVarChanedWeapon, RemoveSyncVarChanedWeapon, OnChangeSlotWeaponID, OnEquipmentWeaponChanged (+ 55 more)]
- `EquipmentManager.Shield.cs` -> EquipmentManager [IsEquippedShield, GetCurrentShield]
- `ArmorBase.cs` -> ArmorBase [TakeDamage, Init]
- `Projectile.cs` -> Projectile, WeaponData, ProjectileResultData [Awake, OnDestroy, AddSyncValueOnChanged, RemoveSyncValueOnChanged, OnChangedOwnerObjectID (+ 46 more)]
- `CollisionRelay.cs` -> CollisionRelay [OnCollisionEnter, OnTriggerEnter]
- `ProjectileMovement.cs` -> ProjectileMovement [Initialize, Execute, SetVelocity, OnImpact, RecalcVelocity (+ 2 more)]
- `ProjectileMovementBallistic.cs` -> ProjectileMovementBallistic
- `EquippableBase.cs` -> EWeaponState, EquippableBase [AddSyncValueOnChanged, RemoveSyncValueOnChanged, SetupOwner, Awake, OnDestroy (+ 24 more)]
- `GunBase.AttachSystem.cs` -> GunBase [IsOverheat, UpdateOverhit, HandleOverHeat_Logic, HandleOverHeat_Visuals, GetHeatPercentage (+ 1 more)]
- *(+ 16 more files)*

### `ScriptTools/Editor/DataExportTool/` (25 files)
**Classes**: TestLoaderEditor, eToolTab, DataExportToolEditor, LogEntry, 자동, eToolState, DataUploadToolEditor, AutoUploader, ConverterTest, BinaryConverter, CCodeGenerator, CRef, CReferenceManager, CProtoEnumGenerator, CReferenceSchema (+ 32 more)
- `TestLoad.cs` -> TestLoaderEditor [ShowWindow, OnGUI]
- `DataExportToolEditor.cs` -> eToolTab, DataExportToolEditor, LogEntry, 자동 [ShowWindow, OnEnable, LoadPrefs, SavePrefs, CreateGUI (+ 15 more)]
- `DataUploadToolEditor.cs` -> eToolState, DataUploadToolEditor [GetRecentPatchVersion, OnShow, Draw, SetCommentFromCommitMessage, DrawUploader (+ 6 more)]
- `AutoUploader.cs` -> AutoUploader [Pump, UploadData, Succeed, Fail, GetRerferenceList (+ 4 more)]
- `BinaryConverter.cs` -> ConverterTest, BinaryConverter [ValidateBinaryConvert, BinaryConvert, ValidateLoadBinary, LoadBinary]
- `CCodeGenerator.cs` -> CCodeGenerator, CRef, CReferenceManager [GenerateReferenceTableCode, GenerateProperties, GenerateEnumCode]
- `CProtoEnumGenerator.cs` -> CProtoEnumGenerator [GenerateProtoEnumCode]
- `CSchemaGenerator.cs` -> CReferenceSchema, CSchemaGenerator [GenerateSch, GenerateSchEnum]
- `CToolReferenceTableManager.cs` -> CReferenceEnumData, CToolReferenceTableManager [LoadExcels, LoadDefineExcels, LoadDefineExcel, LoadDataExcels, LoadDataExcel (+ 11 more)]
- `CToolResourceClient.cs` -> ReferenceResource, CheckClientRequest, CheckClientResponse, BypassCertificate, CToolResourceClient [ValidateCertificate, PostResourceRequest, GetReferenceResource, PostCheckClientTest]
- *(+ 15 more files)*

### `ScriptTools/ZString/` (20 files)
**Classes**: EnumUtil, ExceptionUtil, FastNumberWriter, Utf16FormatHelper, Utf8FormatHelper, FormatParser, ParseResult, ParserScanResult, IResettableBufferWriter, is, NestedStringBuilderCreationException, Utf16PreparedFormat, Utf8PreparedFormat, PreparedFormatHelper, Utf8FormatSegment (+ 11 more)
- `EnumUtil.cs` -> EnumUtil [TryFormatUtf16, TryFormatUtf8]
- `ExceptionUtil.cs` -> ExceptionUtil [ThrowArgumentException, ThrowFormatException, ThrowFormatError]
- `FastNumberWriter.cs` -> FastNumberWriter [TryWriteInt64, TryWriteUInt64]
- `FormatHelper.cs` -> Utf16FormatHelper, Utf8FormatHelper
- `FormatParser.cs` -> FormatParser, ParseResult, ParserScanResult [ScanFormatString, IsDigit, Parse, ParseResult]
- `IResettableBufferWriter.cs` -> IResettableBufferWriter
- `NestedStringBuilderCreationException.cs` -> is, NestedStringBuilderCreationException [NestedStringBuilderCreationException]
- `PreparedFormat.cs` -> Utf16PreparedFormat, Utf8PreparedFormat [Format, Utf16PreparedFormat, Utf8PreparedFormat]
- `PreparedFormatHelper.cs` -> PreparedFormatHelper, Utf8FormatSegment, Utf16FormatSegment [Utf16Parse, Utf8Parse, Utf8FormatSegment, Utf16FormatSegment]
- `ReadOnlyListAdaptor.cs` -> that, ReadOnlyListAdaptor [GetEnumerator, ReadOnlyListAdaptor]
- *(+ 10 more files)*

### `ScriptDev/UI/InGame/` (20 files)
**Classes**: CUIHUDCaptureState, ECaputreProgessTendency, CUIHUDCaptureStateColor, CUIHUDGameState, CUIHUDMember, CUIIngameIntro, MemberUI, CUIIngameMatchingInfo, TeamUI, CUIIngameMatchResult, CUIIngameMVP, CUIIngamePlayerResult, CUIIngamePopupMap, CUIIngamePopupSynergy, ESynergyTab (+ 21 more)
- `CUIHUDCaptureState.cs` -> CUIHUDCaptureState, ECaputreProgessTendency [BindUI, Init, ConnectToCaptureSystem, SyncState, DelayedShowSystemMessage (+ 9 more)]
- `CUIHUDCaptureStateColor.cs` -> CUIHUDCaptureStateColor
- `CUIHUDGameState.cs` -> CUIHUDGameState [BindUI, Init, ConnectToCaptureSystem, UpdateProgress, UpdateScore (+ 2 more)]
- `CUIHUDMember.cs` -> CUIHUDMember [BindUI, SetContents, HelperGetCharacterPortrait, UpdatePlayStatus]
- `CUIIngameIntro.cs` -> CUIIngameIntro, MemberUI [InitUIBind, PrepareContent, BindUI]
- `CUIIngameMatchingInfo.cs` -> CUIIngameMatchingInfo, TeamUI, MemberUI [InitUIBind, PrepareContent, OnPanelRelase, OnUpdatePlayerData, BindMembersUI (+ 3 more)]
- `CUIIngameMatchResult.cs` -> CUIIngameMatchResult, MemberUI [InitUIBind, PrepareContent, OnClickNext, BindUI, ToCharacterInfo (+ 1 more)]
- `CUIIngameMVP.cs` -> CUIIngameMVP [InitUIBind, PrepareContent, OnClickNext]
- `CUIIngamePlayerResult.cs` -> CUIIngamePlayerResult [InitUIBind, PrepareContent, HelperSetTextValue, OnClinkExit]
- `CUIIngamePopupMap.cs` -> CUIIngamePopupMap [InitUIBind, PrepareContent, OnButtonClose]
- *(+ 10 more files)*

### `ScriptTools/ZString/Number/` (19 files)
**Classes**: BitOperations, BufferEx, DecimalEx, DecimalBits, DecCalc, FloatEx, FormattingHelpers, GuidEx, HexConverter, Casing, InternalSpanEx, MathEx, Number, BigInteger, return (+ 9 more)
- `BitOperations.cs` -> BitOperations [LeadingZeroCount, Log2, Log2SoftwareFallback, PopCount, TrailingZeroCount (+ 2 more)]
- `BufferEx.cs` -> BufferEx [ZeroMemory, Memcpy]
- `DecimalEx.cs` -> DecimalEx, DecimalBits, DecCalc [DecDivMod1E9, AsMutable, High, Low, Mid (+ 2 more)]
- `FloatEx.cs` -> FloatEx [IsFinite, IsNegative, SingleToInt32Bits]
- `FormattingHelpers.cs` -> FormattingHelpers [CountDigits, CountHexDigits, CountDecimalTrailingZeros]
- `GuidEx.cs` -> GuidEx [HexsToChars, HexsToCharsHexOutput, TryFormat]
- `HexConverter.cs` -> HexConverter, Casing [ToBytesBuffer, ToCharsBuffer, ToString, ToCharUpper, ToCharLower]
- `InternalSpanEx.cs` -> InternalSpanEx [EqualsOrdinalIgnoreCase, AllCharsInUInt32AreAscii, AllCharsInUInt64AreAscii, UInt32OrdinalIgnoreCaseAscii, UInt64OrdinalIgnoreCaseAscii (+ 1 more)]
- `MathEx.cs` -> MathEx [DivRem, Clamp]
- `Number.BigInteger.cs` -> Number, BigInteger, return [Add, Compare, CountSignificantBits, DivRem, HeuristicDivide (+ 19 more)]
- *(+ 9 more files)*

### `ScriptDev/Utilities/` (17 files)
**Classes**: ELogCategory, LogStatics, LogTakeDamageAegis, LogBattle, LogBaseDamage, LogTakeDamage, LogTakeHeal, LogStatusEffect, ELogType, CCachedMonoBehaviour, CEventManager, CEventRegister, IEventListenerBase, IEventListener, ColorDef (+ 20 more)
- `BattleLog.cs` -> ELogCategory, LogStatics, LogTakeDamageAegis, LogBattle, LogBaseDamage, LogTakeDamage, LogTakeHeal, LogStatusEffect, ELogType [Print, GetHeader, GetTextCaster, GetTextTarget, GetTitle (+ 2 more)]
- `CCachedMonoBehaviour.cs` -> CCachedMonoBehaviour [SetActive]
- `CEventManager.cs` -> CEventManager, CEventRegister, IEventListenerBase, IEventListener [InitializeStatics]
- `CInternalColorTable.cs` -> ColorDef, CInternalColorTable, ColorTableExtensions [GetColorByName, GetColorByIndex, TryGetColor, GetColor]
- `ColorDatabase.cs` -> ColorDatabase [GetColor, HasColor, EditorAddValue]
- `ColorUtils.cs` -> ColorUtils [TryHexToColor, HexToColor]
- `ContentLog.cs` -> ContentLog [Log, TrackingOverLog, Matching]
- `CoroutineUtils.cs` -> CoroutineUtils [PlayCoroutine, ClearCoroutine, Delay]
- `CSingleton.cs` -> CSingleton, CSingletonMono [InitializeInst, DestroyInst, Awake, InitializeSingleton]
- `CStateRunner.cs` -> StateRunner [Register, Start, Update, EnterState, MoveNext]
- *(+ 7 more files)*

### `ScriptDev/Contents/Core/` (17 files)
**Classes**: AnimationEventReceiver, CAimAssistSystem, ELineOfSightOrigin, CameraImpulse, ImpulseData, CameraRecoil, ERecoilState, PitchRecoil, RandomRecoil, FOVRecoil, LockOnRecoil, RecoilData, RecoilType, CameraOverride, CCameraController (+ 17 more)
- `AnimationEventReceiver.cs` -> AnimationEventReceiver [LeftFootDown, RightFootDown, PlaySound, OnAnimationEvent, OnAnimationEventInt (+ 2 more)]
- `CAimAssistSystem.cs` -> CAimAssistSystem, ELineOfSightOrigin [SetAutoFireToggle, SetAimAssistToggle, AddRecoilOffset, FixedUpdate, BindPlayerInput (+ 46 more)]
- `CameraImpulse.cs` -> CameraImpulse, ImpulseData [SetData, StartCameraImpulse, IsValid]
- `CameraRecoil.cs` -> CameraRecoil, ERecoilState, PitchRecoil, RandomRecoil, FOVRecoil, LockOnRecoil, RecoilData, RecoilType [Create, SetData, IsValid, IsMultiApply, IsWorking (+ 4 more)]
- `CCameraController.cs` -> CameraOverride, CCameraController [LateUpdate, OnDestroy, SetupPlayerCamera, OnChangedWeapon, OnFiredWeapon (+ 20 more)]
- `FootstepController.cs` -> FootstepController [Awake, OnEnable, OnDisable, Update, IsMoving (+ 5 more)]
- `AimAssistState.cs` -> AimAssistState, EAimAssistState [Enter, Update, Exit, AimAssistState]
- `AimAssistStateCooldown.cs` -> AimAssistStateCooldown [Update, AimAssistStateCooldown]
- `AimAssistStateFirstShot.cs` -> AimAssistStateFirstShot [Update, AimAssistStateFirstShot]
- `AimAssistStateNone.cs` -> AimAssistStateNone [Update, AimAssistStateNone]
- *(+ 7 more files)*

### `ScriptDev/UI/Profile/` (16 files)
**Classes**: EGNBViewType, EGNBMenuDummy, UIGNBElement, UIPanelEditProfile, EProfileEditPage, UIPanelProfile, EProfilePage, UIWidgetProfile, UISlotBase, UISlotNameValueslot, UISlotTitle, ProfilWidgetBase, WidgetFavorit, EFavoritType, WidgetStatistics (+ 27 more)
- `UIGNBElement.cs` -> EGNBViewType, EGNBMenuDummy, UIGNBElement [SetActive, OnSelectTab, SetTabWithoutNotify, ClearLockButton, SetLockButton (+ 1 more)]
- `UIPanelEditProfile.cs` -> UIPanelEditProfile, EProfileEditPage [InitUIBind, SetTarrgetViewProfile, OnPanelEnabled, OnPanelDisabed, OnLeftMenuSelectChanged]
- `UIPanelProfile.cs` -> UIPanelProfile, EProfilePage [InitUIBind, SetTargetProfile, OnPanelEnabled, OnPanelDisabed, SetPage (+ 4 more)]
- `UIWidgetProfile.cs` -> UIWidgetProfile [SetActive, UpdateProfile, GetProfileButton, UIWidgetProfile]
- `ProfileWidgets.cs` -> UISlotBase, UISlotNameValueslot, UISlotTitle, ProfilWidgetBase, WidgetFavorit, EFavoritType, WidgetStatistics, WidgetProfile, WidgetTitles, WidgetLeague, BattleTypeComboCtrl, ComboItem [SetData, SetName, SetValue, UpdateContent, UpdateWidgetContent (+ 21 more)]
- `UIEditProfilePageBasic.cs` -> UIEditProfilePageBasic, Switch [OnButtonToggleOn, OnButtonToggleOff, SetOnOff, BindUI, OnPageActived (+ 10 more)]
- `UIEditProfilePageDeco.cs` -> UIEditProfilePageDeco, IEditSpecTypeController, EditIconTypeController, EditFrameTypeController, EditBannerTypeController [GetEquipedItemID, GetIndexedItem, BindUI, OnChangeSpecifiedPageType, OnPageActived (+ 13 more)]
- `UIEditProfilePageStatistics.cs` -> UIEditProfilePageStatistics, SelectSlot [SetSelection, SetValueData, OnBtnToggleButton, BindUI, OnPageActived (+ 8 more)]
- `UIEditProfilePageTitles.cs` -> UIEditProfilePageTitles, EquippedSlot, TitleCompare [SetEquiped, OnClickSlot, UpdateButtonState, BindUI, Equals (+ 17 more)]
- `UIProfileDecoSlot.cs` -> UIProfileDecoSlot [Awake, SetSelectCallback, Setup, OnClickSlot]
- *(+ 6 more files)*

### `ScriptDev/UI/Option/` (15 files)
**Classes**: CUIOptionPanel, IOptionSlot, OptionSlotBase, OptionSlotFactory, IOptionSlotView, OptionSlotViewBase, OptionSlotViewOneButton, OptionSlotViewToggleBtn, OptionSlotViewSlider, OptionSlotAccountConnect, OptionSlotCopy, OptionSlotLanguage, OptionSlotOneButton, OptionSlotSlider, OptionSlotSmallBtn (+ 4 more)
- `CUIOptionPanel.cs` -> CUIOptionPanel [InitUIBind, OnPanelEnabled, OnPanelDisabed, OnPanelRelase, OnShow (+ 7 more)]
- `IOptionSlot.cs` -> IOptionSlot
- `OptionSlotBase.cs` -> OptionSlotBase [Initialize, ParseContentString, SetValue, ClampValue, ResetToDefault]
- `OptionSlotFactory.cs` -> OptionSlotFactory [Create, CreateSlotByUIType]
- `OptionSlotViewBase.cs` -> IOptionSlotView, OptionSlotViewBase, OptionSlotViewOneButton, OptionSlotViewToggleBtn, OptionSlotViewSlider [Bind, UpdateUI, Clear, SetClickCallback, OnClick (+ 2 more)]
- `OptionSlotAccountConnect.cs` -> OptionSlotAccountConnect [ParseContentString, ClampValue]
- `OptionSlotCopy.cs` -> OptionSlotCopy [ParseContentString, ClampValue]
- `OptionSlotLanguage.cs` -> OptionSlotLanguage [ParseContentString, ClampValue]
- `OptionSlotOneButton.cs` -> OptionSlotOneButton [ParseContentString, ClampValue]
- `OptionSlotSlider.cs` -> OptionSlotSlider [ParseContentString, ClampValue, Increase, Decrease]
- *(+ 5 more files)*

### `ScriptDev/Manager/` (15 files)
**Classes**: AssetManager, CCombatManager, ECombatCategory, ECombatType, CombatData, CharacterManager, ContentUnlockData, ContentUnlockManager, CPacketAckManager, PendingAckRequest, SampleEntity, IScheduleEntity, CScheduleManager, ScheduleEntityExtention, EffectManager (+ 15 more)
- `AssetManager.cs` -> AssetManager [LoadAssetAsync, UnloadAsset, UnloadAllAssets, UnloadAssetsByLabel, LoadAssetByLabel_CreatePools (+ 10 more)]
- `CCombatManager.cs` -> CCombatManager, ECombatCategory, ECombatType, CombatData [Init, Disabled, Release, GetCombatCategory, IsTargetAlly (+ 14 more)]
- `CharacterManager.cs` -> CharacterManager
- `ContentUnlockManager.cs` -> ContentUnlockData, ContentUnlockManager [InitializeInst, InitializeDummyData, IsUnlock, GetUnlockConditionValue, GetLockMessage (+ 7 more)]
- `CPacketAckManager.cs` -> CPacketAckManager, PendingAckRequest [LaunchPacketAckManager, ClearAndStopPacketAckManager, Dispose, Shutdown, OnDestroy]
- `CScheduleManager.cs` -> SampleEntity, IScheduleEntity, CScheduleManager, ScheduleEntityExtention [LaunchScheduler, ClaerAndStopScheduler, TryGet, Contains, InternalAddSchedule (+ 8 more)]
- `EffectManager.cs` -> EffectManager [SpawnEffect, DespawnEffect, CheckEffecEvent]
- `Local_UserDataManager.cs` -> Local_UserDataManager [InitializeInst, InitilizePartyInfos]
- `NamePlateManager.cs` -> NamePlateManager, NamePlatePresenter [OnDrawGizmos, Start, OnDestroy, Update, UpdateSortingOrder (+ 19 more)]
- `ObjectPoolManager.cs` -> PoolCategory, PoolConfig, ObjectPoolManager [Custom, Awake, InitializePoolRoot, CreatePool, CreatePooledObject (+ 13 more)]
- *(+ 5 more files)*

### `ScriptTools/LevelTools/` (14 files)
**Classes**: WallType, DiagonalDirection, FloorType, CellWalls, Floor, BuildingData, BuildingVisualStyle, BuildingGeneratorCore, BuildingGeneratorConstants, BuildingGeneratorUtility, BuildingImporter, CableLineRenderer, CableLineRendererEditor, CableLineRendererMenu, CaptureZone (+ 19 more)
- `BuildingGenerator.cs` -> WallType, DiagonalDirection, FloorType, CellWalls, Floor, BuildingData, BuildingVisualStyle, BuildingGeneratorCore [RebuildDictionary, GetOrCreateCell, Clear, SetDefaultMaterials, AddFloor (+ 35 more)]
- `BuildingGeneratorConstants.cs` -> BuildingGeneratorConstants
- `BuildingGeneratorUtility.cs` -> BuildingGeneratorUtility [EnsureFolderExists, SavePrefab, SaveMeshAsset, IsWindowType, IsStairType (+ 15 more)]
- `BuildingImporter.cs` -> BuildingImporter [ImportFromGameObject, ScanHierarchy, EstimateCellAndGridSize, EstimateWallProperties, ProcessAllObjects (+ 9 more)]
- `CableLineRenderer.cs` -> CableLineRenderer [OnEnable, Update, InitializeLineRenderer, UpdateLineRendererSettings, UpdateCablePoints (+ 11 more)]
- `CableLineRendererEditor.cs` -> CableLineRendererEditor, CableLineRendererMenu [OnEnable, OnDisable, OnInspectorGUI, OnSceneGUI, InitializeStyles (+ 2 more)]
- `CaptureZone.cs` -> CaptureZone [Awake, OnDestroy, OnTriggerEnter, OnTriggerExit, OnPlayerEnterZone (+ 8 more)]
- `CombatSectorChecker.cs` -> CombatSectorChecker, SectorData, CellData, RayData, VertexData, CombatSectorCheckerEditor [OnEnable, Update, OnDestroy, ClearMeshes, UpdateSectors (+ 14 more)]
- `CombatSimulationWindow.cs` -> CombatSimulationWindow [ShowWindow, OnEnable, OnDisable, OnPlayModeStateChanged, FindSimulationManager (+ 13 more)]
- `DistanceMeasureTool.cs` -> DistanceMeasureTool, RoutePoint, Route [GetPosition, IsValid, Start, OnDrawGizmos, OnDrawGizmosSelected (+ 15 more)]
- *(+ 4 more files)*

### `ScriptDev/Data/` (14 files)
**Classes**: CameraSettings, CAtlasData, CAtlasEntry, CCanvasData, CFontData, CFontEntry, CFontDataEditor, ESkillSlotType, EWeaponSlotType, ECharacterResult, CharacterConstants, SkillSlotData, PassiveSlotData, ModuleSlotData, WeaponSlotData (+ 30 more)
- `CameraSettings.cs` -> CameraSettings [copySetting, Equals, GetHashCode]
- `CAtlasData.cs` -> CAtlasData, CAtlasEntry [OpenItemDatabase]
- `CCanvasData.cs` -> CCanvasData
- `CFontData.cs` -> CFontData, CFontEntry, CFontDataEditor [OpenFlagDatabase, OnEnable, OnInspectorGUI]
- `CharacterData.cs` -> ESkillSlotType, EWeaponSlotType, ECharacterResult, CharacterConstants, SkillSlotData, PassiveSlotData, ModuleSlotData, WeaponSlotData, CharacterData, CharacterSaveData, CharacterResultMessages [GetRequiredExperience, GetTotalExperienceForLevel, GetModule, SetModule, GetEquippedModuleCount (+ 16 more)]
- `CMovementData.cs` -> CMovementData, SamplingData, SampleDataTree, Node, SampleDataSet [Load, SetData, FindNearest, InterpolateParamBarycentric, GetRoundVector (+ 2 more)]
- `ContentUnlockEnums.cs` -> EContentUnlockType_dummy, EUnlockConditionType_dummy
- `CProjectileSetting.cs` -> EResponseEffect, EResponseTrajectory, ELifeEndEffect, ProjectileSetting, ProjectileSettingEditor [copySetting, Equals, GetHashCode, OnInspectorGUI]
- `CTextureData.cs` -> CTextureData, CTextureEntry [OpenTextureDatabase]
- `CWeaponESSetting.cs` -> WeaponESSetting, WeaponEffect, WeaponSound [GetFireSoundPitch, GetLowAmmoVolume, copySetting, Equals, GetHashCode]
- *(+ 4 more files)*

### `NetworkDev/` (14 files)
**Classes**: CloudWatchLogger, LogWatchData, GameEventType, GameEventMessage, PlayerJoinedGameMessage, PlayerDisconnectedMessage, PlayerReconnectedMessage, GameEndedMessage, PlayerGameResult, PlayerWriteWeaponStat, PlayerWeaponBattleStats, InGameStatus, SQSMegManager, NetworkManager_Aegis, NetworkManagerExtention (+ 12 more)
- `CloudWatchLogger.cs` -> CloudWatchLogger, LogWatchData [EnsureLogGroupExists, EnsureLogStreamExists, LogMessage, LogWatchData]
- `GameEventMessage.cs` -> GameEventType, GameEventMessage, PlayerJoinedGameMessage, PlayerDisconnectedMessage, PlayerReconnectedMessage, GameEndedMessage, PlayerGameResult, PlayerWriteWeaponStat, PlayerWeaponBattleStats, InGameStatus, SQSMegManager [Init, SendPlayerJoinedGameMessage, SendPlayerDisconnectedMessage, SendPlayerReconnectedMessage, SendGameEndedMessage (+ 6 more)]
- `NetworkManagerClient_Aegis.cs` -> NetworkManager_Aegis [GetNetworkObjectName]
- `NetworkManagerExtention.cs` -> NetworkManagerExtention [FindNetworkObject, FindNetworkObjectCharacters, FindClientNetworkObject, FindServerNetworkObject]
- `NetworkManagerGameLift_Aegis.cs` -> AWSIntegrationOptions, NetworkManager_Aegis [SetConsoleTitle, InitGameLift, OnStartGameSession, OnUpdateGameSession, InitData (+ 7 more)]
- `NetworkManagerServer_Aegis.cs` -> ServerPlayerData, NetworkManager_Aegis [ServerPlayerData]
- `NetworkManager_Aegis.cs` -> NetworkManager_Aegis, eDediState [Awake, InitializeManager, DestroyManager, OnServerSentEmptyStartScenes, CompleteLoadClient (+ 8 more)]
- `NetworkObject_Aegis.cs` -> NetworkObject_Aegis
- `ServerPlayerSpawner_Aegis.cs` -> ServerPlayerSpawner_Aegis [Awake, OnDestroy, Spawn_Internally, SpawnAICharacter_Internally2, SpawnAICharacter_Internally (+ 1 more)]
- `TestLoadScene.cs` -> TestLoadScene [LoadScene, Update, OnClientChangeMap, OnDestroy]
- *(+ 4 more files)*

### `ScriptTools/Editor/WeaponTools/` (14 files)
**Classes**: EffectTestWindow, RowData, CameraViewType, WeaponPlayEditor, EBatchTestState, ETestMode, BatchResult, IAutoTestStrategy, RPMVerificationStrategy, ReloadSpeedStrategy, DPSMeasurementStrategy, AccuracySpreadStrategy, DamageFalloffStrategy, WeaponPreviewEditor, ActiveEffect (+ 4 more)
- `EffectTestWindow.cs` -> EffectTestWindow, RowData, CameraViewType [ShowWindow, OpenManual, OnEnable, OnDisable, OnDestroy (+ 12 more)]
- `EffectTestWindow.SceneBuilder.cs` -> EffectTestWindow [OpenOrCreateTestScene, CreateNewScene, EnsureEnvironmentSetup, SetupManagers]
- `WeaponPlayEditor.AutoTester.cs` -> WeaponPlayEditor, EBatchTestState, ETestMode, BatchResult [ToString, IsCurrentWeaponHealType, FindNearestTarget, StartCombatTest, StopCombatTest (+ 12 more)]
- `WeaponPlayEditor.AutoTester.Strategies.cs` -> WeaponPlayEditor, IAutoTestStrategy, RPMVerificationStrategy, ReloadSpeedStrategy, DPSMeasurementStrategy, AccuracySpreadStrategy, DamageFalloffStrategy [GetStrategy, Enter, Update, Exit, Analyze (+ 3 more)]
- `WeaponPlayEditor.AutoTester.UI.cs` -> WeaponPlayEditor [DrawAutoTesterGUI, GetResultDetails]
- `WeaponPlayEditor.cs` -> WeaponPlayEditor [ShowWindow, OpenManual, OnEnable, OnEditorPlayModeChanged, OnDisable (+ 15 more)]
- `WeaponPreviewEditor.Character.cs` -> WeaponPreviewEditor [SafeInvoke, InitCharacter, DrawPreviewEquip, ResetEquipPageObjects, RefreshPageEquip (+ 11 more)]
- `WeaponPreviewEditor.cs` -> WeaponPreviewEditor [ShowWindow, OpenManual, OpenSoundManual, OnEnable, UpdateMain (+ 22 more)]
- `WeaponPreviewEditor.Data.cs` -> WeaponPreviewEditor [InitSOData, ResetSOData, RefreshSOData, RefreshCamaraSetting, DrawSOData (+ 3 more)]
- `WeaponPreviewEditor.Effect.cs` -> WeaponPreviewEditor, ActiveEffect [RegisterWeaponParticles, InitEffectData, ResetEffectData, RefreshEffectData, RefreshEffectFoldOut (+ 9 more)]
- *(+ 4 more files)*

### `ScriptDev/Scripts_fx/com.coffee.ui-particle@3.3.10/` (12 files)
**Classes**: AnimatableProperty, ShaderPropertyType, BakingCamera, CombineInstanceEx, MeshHelper, ModifiedMaterial, MatEntry, UIParticle, UIParticleUpdater, SpriteExtensions, ListExtensions, MeshExtensions, MeshPool, CombineInstanceArrayPool, ParticleSystemExtensions (+ 4 more)
- `AnimatableProperty.cs` -> AnimatableProperty, ShaderPropertyType [UpdateMaterialProperties, OnBeforeSerialize, OnAfterDeserialize]
- `BakingCamera.cs` -> BakingCamera [Create, Awake, GetCamera]
- `CombineInstanceEx.cs` -> CombineInstanceEx [Combine, Clear, Push]
- `MeshHelper.cs` -> MeshHelper [Init, Get, GetTemporaryMesh, Push, Clear (+ 2 more)]
- `ModifiedMaterial.cs` -> ModifiedMaterial, MatEntry [Add, Remove, DestroyImmediate]
- `UIParticle.cs` -> UIParticle [Play, Pause, Stop, Clear, SetParticleSystemInstance (+ 13 more)]
- `UIParticleUpdater.cs` -> UIParticleUpdater [Register, Unregister, InitializeOnLoad, Refresh, ModifyScale (+ 3 more)]
- `Utils.cs` -> SpriteExtensions, ListExtensions, MeshExtensions, MeshPool, CombineInstanceArrayPool, ParticleSystemExtensions [GetActualTexture, SequenceEqualFast, CountFast, Clear, Init (+ 8 more)]
- `AnimatedPropertiesEditor.cs` -> AnimatedPropertiesEditor [CollectActiveNames, DrawAnimatableProperties, AddMenu]
- `ImportSampleMenu.cs` -> ImportSampleMenu_UIParticle [ImportSample, ImportSample_CFX, GetPreviousSamplePath]
- *(+ 2 more files)*

### `NetworkClient/NetPlay/GameMode/` (12 files)
**Classes**: EGameResult, GameMode, GameModeClash, GameModeClientHandler, GameModeClientRoundHandler, GameModeClientTDMHandler, GameModeClintPointCaptureHandler, GameModePointCapture, GameModeRespawnSystem, RoundState, RoundReadyState, TeamType, ERoundResult, GameModeRound, GameModeRoundSyncData (+ 8 more)
- `GameMode.cs` -> EGameResult, GameMode [InitStatic, Awake, OnDestroy, OnStartNetwork, OnStartServer (+ 53 more)]
- `GameModeClash.cs` -> GameModeClash [OnStartNetwork, OnMapObjectSpawned, OnStartClient, OnStopClient, OnStopServer (+ 13 more)]
- `GameModeClientHandler.cs` -> GameModeClientHandler [SetMaxRoundNumber, AddClientEvent, RemoveClientEvent, OnPlayerHealthChanged]
- `GameModeClientRoundHandler.cs` -> GameModeClientRoundHandler [ChangePlayTime, ChangeRoundState, SetRoundStateMessage, ShowRoundStateMessage, ChangeRoundReadyState (+ 10 more)]
- `GameModeClientTDMHandler.cs` -> GameModeClientTDMHandler
- `GameModeClintPointCaptureHandler.cs` -> GameModeClintPointCaptureHandler
- `GameModePointCapture.cs` -> GameModePointCapture [OnStartNetwork, OnStopServer, OnFinishedCapture, PlayTimeFinished, ServerChangeRoundState (+ 11 more)]
- `GameModeRespawnSystem.cs` -> GameModeRespawnSystem [InitBattleModeinfo, InitRespawnCount, IsInfiniteRespawn, GetRespawnCount, GetRespawnTime]
- `GameModeRound.cs` -> RoundState, RoundReadyState, TeamType, ERoundResult, GameModeRound, GameModeRoundSyncData, EDecideRoundWinScore [OnStartNetwork, OnStartServer, OnStartClient, InitSafetyZones, OnStopClient (+ 47 more)]
- `GameModeTDM.cs` -> GameModeTDM [CreateClientHandler, ServerChangeRoundState]
- *(+ 2 more files)*

### `ScriptDev/UI/Map/` (12 files)
**Classes**: CUIAutoPingMessage, PingMessageEntry, CUILargeMap, CUIMapBase, CUIMapManager, HitBufferComparer, CUIMinimap, CUIOverlayMap, ECanPingResult, CUIPingManager, PingData, CUIPingNavigation, CUIPingWheel, MapPingIcon, MapPortraitIcon (+ 2 more)
- `CUIAutoPingMessage.cs` -> CUIAutoPingMessage, PingMessageEntry [Awake, InitializePool, Update, AddMessage, AddMessageInternal (+ 10 more)]
- `CUILargeMap.cs` -> CUILargeMap [Awake, InitializeComponents, Init, InitPingTypeButtons, OnEnable (+ 8 more)]
- `CUIMapBase.cs` -> CUIMapBase [Awake, TryLoadMapImage, Init, CalculateMapBounds, SetMapInfo (+ 23 more)]
- `CUIMapManager.cs` -> CUIMapManager, HitBufferComparer [GetMinimapTexture, InitializeInst, Update, RegisterMinimap, RegisterOverlayMap (+ 21 more)]
- `CUIMinimap.cs` -> CUIMinimap [GetPingIconInverseScale, Awake, CalculateMapBounds, AdjustMapScaleToWorldRange, SetMapScale (+ 8 more)]
- `CUIOverlayMap.cs` -> CUIOverlayMap [Awake, OnEnable, InitializeComponents, Init, UpdatePlayer]
- `CUIPingManager.cs` -> ECanPingResult, CUIPingManager, PingData [IsInfinite, InitializeInst, RegisterNavigation, RegisterAutoPingMessage, Update (+ 26 more)]
- `CUIPingNavigation.cs` -> CUIPingNavigation [Init, SetCharacterPortrait, Hide, Update, UpdateNavigation (+ 6 more)]
- `CUIPingWheel.cs` -> CUIPingWheel [Init, Update, OnPointerDown, OnPointerUp, OnDrag (+ 11 more)]
- `MapPingIcon.cs` -> MapPingIcon [Init, UpdateWidgets, UpdatePosition, SetPingIcon, SetMaskVisibility (+ 1 more)]
- *(+ 2 more files)*

### `ScriptTools/Editor/UILayoutBuilder/` (11 files)
**Classes**: OptimizedScrollViewCreator, UGUILayoutBuilder, JsonLineInfo, UIElementFactory, UILayoutData, RectData, LayoutGroupData, UIElementType, AnchorPreset, LayoutGroupType, UIBuilderNode, UILayoutPreviewWindow
- `OptimizedScrollViewCreator.cs` -> OptimizedScrollViewCreator [CreateOptimizedScrollView, ValidateCreateOptimizedScrollView, CreateScrollViewStructure, CreateDemoScrollCell, CreateLabel]
- `UGUILayoutBuilder.AIPrompt.cs` -> UGUILayoutBuilder
- `UGUILayoutBuilder.cs` -> UGUILayoutBuilder [ShowWindow, OnEnable, OnDisable, OnEditorUpdate, LoadDefaults (+ 27 more)]
- `UGUILayoutBuilder.FileLoadTab.cs` -> UGUILayoutBuilder [DrawFileLoadTab]
- `UGUILayoutBuilder.JsonInputTab.cs` -> UGUILayoutBuilder, JsonLineInfo [EnsureStyles, DrawJsonInputTab, UpdateHighlightRange, DrawSelectedNodeActionBar, AddChildToSelected (+ 35 more)]
- `UGUILayoutBuilder.ModuleBuilderTab.cs` -> UGUILayoutBuilder [EnsureModuleBuilderStyles, DrawModuleBuilderTab, DrawTreeViewPanel, DrawTreeNode, GetTypeIcon (+ 5 more)]
- `UGUILayoutBuilder.PrefabToJsonTab.cs` -> UGUILayoutBuilder [DrawPrefabToJsonTab, ConvertPrefabToJson, ConvertSelectedToJson, ConvertGameObjectToLayoutData, IsInternalUIChild (+ 5 more)]
- `UGUILayoutBuilder.TemplateTab.cs` -> UGUILayoutBuilder [DrawTemplateTab, LoadTemplate, GetTemplateJson, GetBasicPanelTemplate, GetConfirmDialogTemplate (+ 4 more)]
- `UIElementFactory.cs` -> UIElementFactory [SetDefaultFont, SetDefaultTMPFont, SetDefaultSprite, CreateUIElement, CreatePanel (+ 22 more)]
- `UILayoutData.cs` -> UILayoutData, RectData, LayoutGroupData, UIElementType, AnchorPreset, LayoutGroupType, UIBuilderNode [AddChild, RemoveChild, IsDescendantOf, UpdateDescendantDepthsPublic, UpdateDescendantDepths (+ 5 more)]
- *(+ 1 more files)*

### `ScriptTools/Editor/MapTool/` (10 files)
**Classes**: MapToolFileHelper, MapToolBackupKind, SerializablePair, MapToolSettings, MapToolUtil, MapToolEditor, ListItemSource, ExcelListMaxAttribute, MapObjectDescExcelIO, MapObjectDescSheet, ExcelSchema, PathSegment, ColumnDef, ValueTypeFrame, CollectionValueTypeFrame (+ 2 more)
- `MapToolFileHelper.cs` -> MapToolFileHelper, MapToolBackupKind [SaveMapExcel, BackupIfExists, GetBackupCount, TrimExcessBackups]
- `MapToolSettings.cs` -> SerializablePair, MapToolSettings [Find, GetIgnoreColumnNamesSet, GetColumnNamePrefixReplaceMap]
- `MapToolUtil.cs` -> MapToolUtil [InitializeStatics, GetOrCreateHMPSystem, GatherDefaultDescriptionComponents, GatherDefaultDescriptionComponentsInternal, EnsureValidDefaultPrefabs]
- `MapToolEditor.Control.cs` -> MapToolEditor [InitControlUI, ReleaseControlUI, UpdateControlUI, OnControlHMPToggleClicked, OnControlModelLoadClicked (+ 10 more)]
- `MapToolEditor.cs` -> MapToolEditor [ShowWindow, OnEnable, OnDisable, OnDestroy, OnUpdate (+ 5 more)]
- `MapToolEditor.Excel.cs` -> MapToolEditor [InitExcelUI, ReleaseExcelUI, UpdateExcelUI, OnExcelLoadClicked, OnExcelToSceneClicked (+ 3 more)]
- `MapToolEditor.PrefabSearch.cs` -> MapToolEditor, ListItemSource [InitPrefabSearchUI, ReleasePrefabSearchUI, UpdatePrefabSearchUI, MakePrefabSearchListItem, BindPrefabSearchListItem (+ 4 more)]
- `MapToolEditor.Root.cs` -> MapToolEditor [InitRootUI, ReleaseRootUI, UpdateRootUI, OnTestClicked, OnRefreshWindowClicked (+ 1 more)]
- `MapObjectDescExcelIO.cs` -> ExcelListMaxAttribute, MapObjectDescExcelIO, MapObjectDescSheet, ExcelSchema, PathSegment, ColumnDef, ValueTypeFrame, CollectionValueTypeFrame, parse [Init, Write, WriteAll, Read, ReadAll (+ 38 more)]
- `MapToolExcelHelper.cs` -> MapToolExcelHelper [SelectExcel, Export, Import, ExportAll, ImportAll (+ 1 more)]

### `ScriptTools/Editor/CharacterSetupTools/` (9 files)
**Classes**: CharacterModuleBase, GameObjectExt, SectionContext, CharacterSetupData, CharacterSetupWindow, AimIKBoneData, AimIKModule, ArmIKModule, EColliderType, ColliderData, ColliderModule, FootstepModule, HitPointData, BoneLinkData, BoneHitPointData (+ 2 more)
- `CharacterModuleBase.cs` -> CharacterModuleBase, GameObjectExt, SectionContext [Reset, Collect, Apply, FindChildRecursively, GetPath (+ 3 more)]
- `CharacterSetupData.cs` -> CharacterSetupData [EnsureDefaultModules, OverwriteFrom]
- `CharacterSetupWindow.cs` -> CharacterSetupWindow [Open, OnGUI, CollectFromPrefab, SaveToAsset, ApplyToPrefab]
- `AimIKModule.cs` -> AimIKBoneData, AimIKModule [Reset, Collect, Apply, AimIKBoneData, AimIKModule]
- `ArmIKModule.cs` -> ArmIKModule [Reset, Collect, Apply, ArmIKModule]
- `ColliderModule.cs` -> EColliderType, ColliderData, ColliderModule [Reset, Collect, Apply, ColliderModule]
- `FootstepModule.cs` -> FootstepModule [Apply, Collect, Reset, FootstepModule]
- `HitReactionModule.cs` -> HitPointData, BoneLinkData, BoneHitPointData, HitReactionModule [Reset, Collect, Apply, HitPointData, BoneHitPointData (+ 1 more)]
- `LookIKModule.cs` -> LookIKModule [Reset, Collect, Apply, LookIKModule]

### `ScriptDev/Pulse/Runtime/` (7 files)
**Classes**: UnityPulse, UnityPulseByteArrayPool, UnityPulseData, UnityPulseData_json, UnityPulseCustomData, UnityPulseInitializer, IUnityPulseLogger, UnityPulseLogHandler, DefaultUnityPulseLogger, UnityPulseSessionStart, UnityPulseSessionStart_json, UnityPulseSessionStop, UnityPulseSessionStop_json, UdpTransport
- `UnityPulse.cs` -> UnityPulse [SetUserPID, SetDevice, SetPlatform, SetVersion, SetIdentifier (+ 19 more)]
- `UnityPulseByteArrayPool.cs` -> UnityPulseByteArrayPool [Get, Return, UnityPulseByteArrayPool]
- `UnityPulseData.cs` -> UnityPulseData, UnityPulseData_json, UnityPulseCustomData [Write, ToJson, UnityPulseData, UnityPulseCustomData]
- `UnityPulseInitializer.cs` -> UnityPulseInitializer [Init]
- `UnityPulseLogger.cs` -> IUnityPulseLogger, UnityPulseLogHandler, DefaultUnityPulseLogger [LogInfo, LogWarning, LogError, UnityPulseLogHandler]
- `UnityPulseSession.cs` -> UnityPulseSessionStart, UnityPulseSessionStart_json, UnityPulseSessionStop, UnityPulseSessionStop_json [Write, ToJson, UnityPulseSessionStart, UnityPulseSessionStop]
- `UdpTransport.cs` -> UdpTransport [SendData, SendDataAsync, Dispose, UdpTransport]

### `ScriptDev/Utilities/AutoTest/` (7 files)
**Classes**: AutoTestScenario, ReplayTouchPhase, CheckpointType, TouchRecordSession, TouchEvent, Checkpoint, AutoTestResult, CheckpointResult, AutoTester, 반환, TouchVisualizer
- `AutoTestData.cs` -> AutoTestScenario, ReplayTouchPhase, CheckpointType, TouchRecordSession, TouchEvent, Checkpoint, AutoTestResult, CheckpointResult
- `AutoTester.Checkpoint.cs` -> AutoTester [TryGetCheckpointForEvent, ProcessCheckpoint, GetEffectiveTimeout, ProcessWaitingCheckpoint, ProcessRemainingCheckpoints (+ 2 more)]
- `AutoTester.cs` -> AutoTester, 반환 [OnEnable, OnDisable, OnDestroy, Update, InitializeTextures (+ 6 more)]
- `AutoTester.GUI.cs` -> AutoTester [InitializeScenarioNames, OnGUI, EnsureTouchVisualizer, DrawControlWindow, DrawScenarioSelector (+ 2 more)]
- `AutoTester.Recording.cs` -> AutoTester [StartRecording, StopRecording, RecordTouchInput, RecordTouchOnly, RecordMouseInput (+ 5 more)]
- `AutoTester.Replay.cs` -> AutoTester [StartReplay, StartReplayCoroutine, InitializeReplay, StopReplay, SaveTestResult (+ 7 more)]
- `TouchVisualizer.cs` -> TouchVisualizer [Awake, OnEnable, OnDisable, OnDestroy, InitializeTexture (+ 7 more)]

### `ScriptDev/Rendering/Outline/` (6 files)
**Classes**: BackfaceOutlineRenderPass, PassData, OccludedSilhouetteRenderPass, Outline, OutlineRenderer, DrawInfo, OutlineRenderFeature, OutlineRendererEditor
- `BackfaceOutlineRenderPass.cs` -> BackfaceOutlineRenderPass, PassData [RecordRenderGraph, Dispose, BackfaceOutlineRenderPass]
- `OccludedSilhouetteRenderPass.cs` -> OccludedSilhouetteRenderPass, PassData [RecordRenderGraph, Dispose, OccludedSilhouetteRenderPass]
- `Outline.cs` -> Outline [Reset, InitCharacter, ShowOutline, HideOutline, ShowOccludedSilhouette (+ 3 more)]
- `OutlineRenderer.cs` -> OutlineRenderer, DrawInfo [GetAllOutlineRenderers, GetVisibleRenderersOfOutline, GetVisibleRenderersOfSilhouette, StartRendering, OnDestroy (+ 10 more)]
- `OutlineRenderFeature.cs` -> OutlineRenderFeature [Create, AddRenderPasses]
- `OutlineRendererEditor.cs` -> OutlineRendererEditor [OnInspectorGUI]

### `ScriptDev/Utilities/UGUIPlus/` (6 files)
**Classes**: ImagePlus, EditorUtil, SpriteUtil, ImagePlusEditor, PositionOffsetHandler, ShadowHandler, VertexColorHandler, ColorFilterType
- `ImagePlus.cs` -> ImagePlus [OnPopulateMesh]
- `EditorUtil.cs` -> EditorUtil, SpriteUtil [CreateImagePlus, SimpleGUI, SimpleUseGUI, VertexColorGUI, MinMaxSliderGUI (+ 8 more)]
- `ImagePlusEditor.cs` -> ImagePlusEditor [OnEnable, OnDisable, OnInspectorGUI, SpriteGUI, TypeGUI (+ 5 more)]
- `PositionOffsetHandler.cs` -> PositionOffsetHandler [PopulateMesh, RemapPositionOffset]
- `ShadowHandler.cs` -> ShadowHandler [PopulateMesh, SetQuadCachePosition, SetQuadCachePositionAlt, SetQuadCacheColorLR, SetQuadCacheColorUD]
- `VertexColorHandler.cs` -> VertexColorHandler, ColorFilterType [PopulateMesh, RemapColor]

### `ScriptDev/Rendering/PathGuide/` (6 files)
**Classes**: PathGuide, MaterialType, PathGuideSmoother, PathGuideUtil, RibbonMesh, PathGuideEditor, PathGuideMenu
- `PathGuide.cs` -> PathGuide, MaterialType [SetMaterialType, SetTeamType, SwapTeamType, SetGuidePoints, ShouldSkipPlayWork (+ 3 more)]
- `PathGuideSmoother.cs` -> PathGuideSmoother [Init, Smooth, CatmullRomSamplings, CatmullRomCentripetal, SafeDen (+ 1 more)]
- `PathGuideUtil.cs` -> PathGuideUtil [MakeNavPathPoints, MakeGroundSnapPoints, SimplifyStraightSections, RemoveNearDuplicates, AppendPointNoDup (+ 3 more)]
- `RibbonMesh.cs` -> RibbonMesh [Generate, SafeNormalize]
- `PathGuideEditor.cs` -> PathGuideEditor [OnInspectorGUI]
- `PathGuideMenu.cs` -> PathGuideMenu [RebuildAllPathGuides, RebuildAllPathGuides_Validate, ClearAllPathGuides, FindAllPathGuidesInLoadedScenes]

### `Aegis.GameServer/GameLogic/GameLift/` (6 files)
**Classes**: GameEventType, GameEventMessage, PlayerJoinedGameMessage, PlayerDisconnectedMessage, PlayerReconnectedMessage, GameEndedMessage, PlayerGameResult, InGameStatus, GameLiftManager, GameSessionManager, GameSessionInfo, PlayerSessionManager, PlayerSessionInfo, SQSManager, SQSMessageProcessor
- `GameEventMessage.cs` -> GameEventType, GameEventMessage, PlayerJoinedGameMessage, PlayerDisconnectedMessage, PlayerReconnectedMessage, GameEndedMessage, PlayerGameResult, InGameStatus [PlayerJoinedGameMessage, PlayerDisconnectedMessage, PlayerReconnectedMessage, GameEndedMessage]
- `GameLiftManager.cs` -> GameLiftManager [Initialize, Shutdown, CheckFleetStatusAsync]
- `GameSessionManager.cs` -> GameSessionManager, GameSessionInfo [CreateGameSessionAsync, UpdateGamePropertiesAsync, UpdateGameSessionAsync, WaitForGameSessionActiveAsync, GetGameSessionAsync (+ 4 more)]
- `PlayerSessionManager.cs` -> PlayerSessionManager, PlayerSessionInfo [CreatePlayerSessionAsync, CreatePlayerSessionsAsync, GetPlayerSession, GetPlayerSessionById, RemovePlayerSession (+ 4 more)]
- `SQSManager.cs` -> SQSManager [Initialize, Shutdown]
- `SQSMessageProcessor.cs` -> SQSMessageProcessor [Start, Stop, ScheduleNextPoll, PollMessagesCallback, PollAndProcessMessagesAsync (+ 7 more)]

### `ScriptDev/Sound/` (6 files)
**Classes**: CEffectSound, CEffectSoundEditor, CSoundData, SerializableKeyframe, SoundDatabaseExtraSetting, SoundCueExtraSetting, CSoundDataInspector, SoundID, CUIButtonSound, ButtonType, CUIButtonSoundExtention, CUISound, SoundManager, PooledAudioSource, SoundCue (+ 2 more)
- `CEffectSound.cs` -> CEffectSound, CEffectSoundEditor [OnEnable, OnDisable, PlaySound, StopSound, Reset (+ 2 more)]
- `CSoundData.cs` -> CSoundData, SerializableKeyframe, SoundDatabaseExtraSetting, SoundCueExtraSetting, CSoundDataInspector, SoundID [OpenSoundDatabase, GetExtraSettingJsonPath, UdateEntries, ToKeyframe, FromCurve (+ 38 more)]
- `CUIButtonSound.cs` -> CUIButtonSound, ButtonType, CUIButtonSoundExtention [OnEnable, OnDisable, PlayToggleSound, Reset, ForcePlayButtonSound]
- `CUISound.cs` -> CUISound [OnEnable, PlaySound, PlayUISound, Reset]
- `SoundID.cs` -> SoundID [GetName]
- `SoundManager.cs` -> SoundManager, PooledAudioSource, SoundCue, PlaySequence, SoundType [IsAvailable, Play, Stop, GetNextClip, MinClipLength (+ 44 more)]

### `ScriptDev/KPP/` (6 files)
**Classes**: KppAuth, KppInitialize, KppLogin, KppLogout, KppManager, KppSettings
- `KppAuth.cs` -> KppAuth [DeviceLogin, CheckGameServersMaintenance, SetGameServerId, CheckMaintenance, LinkKraftonId (+ 3 more)]
- `KppInitialize.cs` -> KppInitialize [Initialize]
- `KppLogin.cs` -> KppLogin [Login, ManualLogin, OnLoginSuccess, OnLoginFailure]
- `KppLogout.cs` -> KppLogout [Logout]
- `KppManager.cs` -> KppManager [Awake, OnDestroy, ResolveDependencies, BindEvents, UnbindEvents (+ 18 more)]
- `KppSettings.cs` -> KppSettings [NotifyBrokenToken, NotifyDuplicatedSession, NotifyDeletedAccount, NotifyRefreshSurvey, NotifyMergedAccount (+ 8 more)]

### `ScriptDev/UI/Manager/` (6 files)
**Classes**: CFontDataAddressManager, CFontDataManager, IPushManager, PushChannelSettings, PushManager, CPushManager, PushInfo, CRedDotManager, RedDotChangedEvent, CSpriteDataManager, CTextureDataManager
- `CFontDataAddressManager.cs` -> CFontDataAddressManager [InitializeInst, ExtractFontNameFromLocation, GetCurrentLanguageFont, GetFontForLanguage, GetFontForLanguageAsync (+ 9 more)]
- `CFontDataManager.cs` -> CFontDataManager [InitializeInst, InitializeAddressableManager, Get, ClearFontAsset, GetFallBackFont (+ 2 more)]
- `CPushManager.cs` -> IPushManager, PushChannelSettings, PushManager, CPushManager, PushInfo [Initialize, SchedulePush, CancelPush, CancelAllPush, InitializeSingleton (+ 10 more)]
- `CRedDotManager.cs` -> CRedDotManager, RedDotChangedEvent [InitialzieReddot, MarkAsActive, MarkAsInactive, GetCount, SetRedDotStateInternal (+ 16 more)]
- `CSpriteDataManager.cs` -> CSpriteDataManager [InitLoad, InitializeInst, LoadSpriteAtlas, ReleaseAtlas, ClearAtlas (+ 4 more)]
- `CTextureDataManager.cs` -> CTextureDataManager [InitializeInst, LoadTexture, ReleaseTexture, ClearTexture, GetLoadTexture (+ 3 more)]

### `NetworkDev/03.ReferenceManager/` (6 files)
**Classes**: CFileCompressor, ReferenceDataExetention, ReferenceFormatter, IReferenceTable, CReferenceManager, MsgPackInit, RefMpOptions, ReferenceManagerMenu, ReferenceResolver, EResourceErrorCode, CResultResourceServer, CResourceRequestInfo, EStoreType, CBuildVersion, ResourceNetworkManager
- `FileCompressor.cs` -> CFileCompressor [CompressFiles, ExtractToDataStrings, ExtractToDataBinary, _GetFiles]
- `ReferenceDataExetention.cs` -> ReferenceDataExetention [GetCommonConfigFloatValue, GetCommonConfigIntValue, GetRefNetworkObject, GetRefModelIDByWeapon, GetRefModelByWeapon]
- `ReferenceFormatter.cs` -> ReferenceFormatter [Serialize, Deserialize, IsSupportedType, WritePrimitive, ReadPrimitive]
- `ReferenceManager.cs` -> IReferenceTable, CReferenceManager, MsgPackInit, RefMpOptions, ReferenceManagerMenu [GetCacheData, LoadData, ReferenceManagerLoad, ReferenceManagerLoadDedi, LoadJsonData (+ 6 more)]
- `ReferenceResolver.cs` -> ReferenceResolver [IsPrimitiveOnlyType, ReferenceResolver]
- `ResourceNetworkManager.cs` -> EResourceErrorCode, CResultResourceServer, CResourceRequestInfo, EStoreType, CBuildVersion, ResourceNetworkManager [Create, CBuildVersion, ToString, ToDetailString, ToInt32 (+ 4 more)]

### `ScriptDev/Rendering/MaterialEffect/` (5 files)
**Classes**: MaterialEffect, MaterialEffectController, Target, MaterialEffectType, MaterialEffectLibrary, MaterialEffectRenderFeature, MaterialEffectTransitionRenderPass, PassData
- `MaterialEffect.cs` -> MaterialEffect [Apply, Remove, GetCurrentType, GetCurrentMaterial, ResetCurrentMaterial (+ 3 more)]
- `MaterialEffectController.cs` -> MaterialEffectController, Target [GetAllEffectControllers, GetCurrentType, GetCurrentMaterial, OnDestroy, RefreshTargets (+ 14 more)]
- `MaterialEffectLibrary.cs` -> MaterialEffectType, MaterialEffectLibrary [Init, LoadMaterials, UnloadMaterials, GetMaterial, GetPath]
- `MaterialEffectRenderFeature.cs` -> MaterialEffectRenderFeature [Create, AddRenderPasses]
- `MaterialEffectTransitionRenderPass.cs` -> MaterialEffectTransitionRenderPass, PassData [RecordRenderGraph, Dispose, MaterialEffectTransitionRenderPass]

### `ScriptDev/UI/UITeamMemberCharacterSelect/` (5 files)
**Classes**: UISelectableHeroSlot, UISelectCharacterMemberSlot, UITeamSelectCharacterList, UITeamSelectCharacterMembers, UITeamSelectChracterInfo, ESlotType, MajorStat, EquipSlot
- `UISelectableHeroSlot.cs` -> UISelectableHeroSlot [Awake, ResetData, SetupData, SetEmpty, OnBtnFocusSlot (+ 2 more)]
- `UISelectCharacterMemberSlot.cs` -> UISelectCharacterMemberSlot [RefreshMemberCharacterIcon, Awake, Setup, SetupEmpty, ResetData (+ 1 more)]
- `UITeamSelectCharacterList.cs` -> UITeamSelectCharacterList [Dispose, SetupCharacterList, OnFocusCharacterSlot, UITeamSelectCharacterList]
- `UITeamSelectCharacterMembers.cs` -> UITeamSelectCharacterMembers [Dispose, SetupTeamMembers, UITeamSelectCharacterMembers]
- `UITeamSelectChracterInfo.cs` -> UITeamSelectChracterInfo, ESlotType, MajorStat, EquipSlot [Setup, OnClickSelect, SetFocusedCharacter, RefreshSelectUI, UpdateStatSlots (+ 8 more)]

### `NetworkClient/NetPlay/Controller/` (5 files)
**Classes**: AIController, EInputBlock, Controller, PlayerController, PlayerController_FishNet, OneTimeInput, ReplicateData, ReconcileData, SkillButtonState
- `AIController.cs` -> AIController [GetSV_LastTarget, GetSV_AimTargetPosition, GetSV_MoveDirectionKind, GetSV_IsMoving, GetCharacter (+ 55 more)]
- `Controller.cs` -> EInputBlock, Controller [InvokeOnManualFire, Awake, Start, OnDestroy, Update (+ 29 more)]
- `PlayerController.cs` -> PlayerController [Awake, Update, OnStartServer, OnStartClient, OnStopClient (+ 41 more)]
- `PlayerController_FishNet.cs` -> PlayerController_FishNet, OneTimeInput, ReplicateData, ReconcileData [ResetState, Dispose, GetTick, SetTick, Update (+ 19 more)]
- `SkillButtonState.cs` -> SkillButtonState [SetButtonClick, SetButtonRelease]

### `NetworkDev/DedicateLoadManager/` (5 files)
**Classes**: NetworkManager_Aegis
- `DedicateLoadManager_Assetbundle.cs` -> NetworkManager_Aegis [LoadAssetbundle, UpdateAssetbundle]
- `DedicateLoadManager_GameMode.cs` -> NetworkManager_Aegis [LoadGameMode, UpdateGameMode]
- `DedicateLoadManager_MapObject.cs` -> NetworkManager_Aegis [LoadMapObject, UpdateMapObject]
- `DedicateLoadManager_Player.cs` -> NetworkManager_Aegis [LoadPlayer, UpdatePlayer, PlayerSpawner, ALLRemoveOwnership]
- `DedicateLoadManager_Scene.cs` -> NetworkManager_Aegis [Initialized_Scene_Client, Initialized_Scene_Server, LoadScene, UpdateScene, IsUnLoadSuccess (+ 3 more)]

### `DebugTools/` (5 files)
**Classes**: CDebug, DebugPlayComponent, DebugPlaySpawnInfo, DebugPlayTeamInfo, DebugShotCountInfo, DebugPlayPlayerInfo, DebugPlayComponent_Editor, ExceptionLogger, FIX_8322, NavLinkDebug, NavLinkDebug_Editor, NavLinkDiagnosticResult, DiagnosticSeverity
- `CDebug.cs` -> CDebug [Log, LogFormat, LogWarning, LogWarningFormat, LogError (+ 6 more)]
- `DebugPlayComponent.cs` -> DebugPlayComponent, DebugPlaySpawnInfo, DebugPlayTeamInfo, DebugShotCountInfo, DebugPlayPlayerInfo, DebugPlayComponent_Editor [SetGameStarted, AICharacter_AllKill, OnInspectorGUI, DebugPlayPlayerInfo]
- `ExceptionLogger.cs` -> ExceptionLogger [OnDestroy]
- `FIX_8322.cs` -> FIX_8322 [Start, CallGLFlushAtEndOfFrames]
- `NavLinkDebug.cs` -> NavLinkDebug, NavLinkDebug_Editor, NavLinkDiagnosticResult, DiagnosticSeverity [DrawNavLinkLines, DrawSingleNavLink, FindAllNavLinks, DiagnoseAllNavLinks, DiagnoseSingleNavLink (+ 12 more)]

### `ScriptDev/UI/ReferenceTable/` (5 files)
**Classes**: CReferenceManager
- `RefCharacterExtension.cs` -> CReferenceManager [GetCharacterIconName, GetCharacterModelID, GetClassIconName, GetHeroName, GetHeroDetail (+ 4 more)]
- `RefCommonConfigExtension.cs` -> CReferenceManager [GetCommonConfigInt, GetCommonConfigFloat, GetCommonConfigString, GetCommonConfigBool]
- `RefSkillExtension.cs` -> CReferenceManager [GetPassiveName, GetPassiveDescription, BuildSkillOptionsList]
- `RefStatExtension.cs` -> CReferenceManager [GetStatLocalizationKey, GetStatDisplayValue, GetDetailStats, GetWeaponDetailStats, GetMoaMaxDisplayValue]
- `RefWeaponExtension.cs` -> CReferenceManager [GetWeaponName, GetWeaponIconName, GetWeaponSkinIconName, GetWeaponTypeName, GetWeaponTypeIconName (+ 6 more)]

### `Gen_Server/` (5 files)
**Classes**: EnumReflection, EErrorCode, EPassiveSkillSlotType, EPlatformType, EStoreType, EMatchCancelReason, EServerRegion, EServerGroupType, EResourceErrorCode, EFriendRequestStatus, EFriendStatus, EClanInvitationStatus, EClanJoinRequestStatus, ERankType, EItemAcquireReason (+ 289 more)
- `Enum.cs` -> EnumReflection, EErrorCode, EPassiveSkillSlotType, EPlatformType, EStoreType, EMatchCancelReason, EServerRegion, EServerGroupType, EResourceErrorCode, EFriendRequestStatus, EFriendStatus, EClanInvitationStatus, EClanJoinRequestStatus, ERankType, EItemAcquireReason, ELogType, ELoginResult
- `GameServerPacketManager.cs` -> MsgId, PacketManager [Register, RegisterEncryptedPackets, RequiresEncryption, OnRecvPacket, GetPacketHandler]
- `Protocol.cs` -> ProtocolReflection, C2GS_KeyExchangeReq, GS2C_KeyExchangeAck, C2GS_LoginReq, GS2C_LoginAck, C2GS_PongNotify, GS2C_PingNotify, C2GS_TestCreateGameSessionReq, C2GS_CreatePartyReq, GS2C_CreatePartyAck, C2GS_GetPartyListReq, GS2C_GetPartyListAck, C2GS_JoinPartyReq, GS2C_JoinPartyAck, C2GS_LeavePartyReq, GS2C_LeavePartyAck, GS2C_PartyMembersNotify, C2GS_InviteToPartyReq, GS2C_InviteToPartyAck, GS2C_PartyInviteNotify, C2GS_AcceptPartyInviteReq, GS2C_AcceptPartyInviteAck, C2GS_RejectPartyInviteReq, GS2C_RejectPartyInviteAck, C2GS_SetPartyReadyReq, GS2C_SetPartyReadyAck, C2GS_SetPartyBattleTypeReq, GS2C_SetPartyBattleTypeAck, GS2C_PartyBattleTypeNotify, C2GS_KickPartyMemberReq, GS2C_KickPartyMemberAck, GS2C_KickedFromPartyNotify, C2GS_ChangePartyCharacterReq, GS2C_ChangePartyCharacterAck, C2GS_StartMatchReq, GS2C_StartMatchAck, C2GS_CancelMatchReq, GS2C_CancelMatchAck, GS2C_MatchCancelledNotify, GS2C_MatchStatusNotify, GS2C_MatchCompletedNotify, C2GS_CheatGiveItemReq, GS2C_CheatGiveItemAck, C2GS_GetCharacterTierReq, GS2C_GetCharacterTierAck, C2GS_GetAccountHighestTierReq, GS2C_GetAccountHighestTierAck, C2GS_GetAllCharacterTiersReq, GS2C_GetAllCharacterTiersAck, GS2C_TierUpdateNotify, GS2C_AccountLevelUpdateNotify, GS2C_CharacterLevelUpdateNotify, C2GS_ChangeDeployCharacterReq, GS2C_ChangeDeployCharacterAck, C2GS_EquipModuleReq, GS2C_EquipModuleAck, C2GS_UnequipModuleReq, GS2C_UnequipModuleAck, C2GS_GetProfileReq, GS2C_GetProfileAck, C2GS_ChangeNicknameReq, GS2C_ChangeNicknameAck, C2GS_GetFriendListReq, GS2C_GetFriendListAck, C2GS_SendFriendRequestReq, GS2C_SendFriendRequestAck, C2GS_GetRecommendedFriendsReq, GS2C_GetRecommendedFriendsAck, C2GS_GetReceivedFriendRequestListReq, GS2C_GetReceivedFriendRequestListAck, C2GS_RespondFriendRequestReq, GS2C_RespondFriendRequestAck, C2GS_DeleteFriendReq, GS2C_DeleteFriendAck, C2GS_SearchFriendReq, GS2C_SearchFriendAck, GS2C_FriendRequestNotify, GS2C_FriendStatusChangedNotify, C2GS_EquipProfileItemReq, GS2C_EquipProfileItemAck, C2GS_SelectTitlesReq, GS2C_SelectTitlesAck, C2GS_SetSelectedStatisticsReq, GS2C_SetSelectedStatisticsAck, C2GS_SetPrivacySettingsReq, GS2C_SetPrivacySettingsAck, C2GS_EquipPassiveSkillReq, GS2C_EquipPassiveSkillAck, C2GS_ClanCreateReq, GS2C_ClanCreateAck, C2GS_ClanJoinReq, GS2C_ClanJoinAck, C2GS_ClanLeaveReq, GS2C_ClanLeaveAck, C2GS_ClanKickReq, GS2C_ClanKickAck, C2GS_ClanChangeRoleReq, GS2C_ClanChangeRoleAck, C2GS_ClanSearchReq, GS2C_ClanSearchAck, C2GS_ClanRefreshReq, GS2C_ClanRefreshAck, C2GS_ClanInviteReq, GS2C_ClanInviteAck, C2GS_ClanInviteAcceptReq, GS2C_ClanInviteAcceptAck, C2GS_ClanInviteDeclineReq, GS2C_ClanInviteDeclineAck, C2GS_ClanJoinRequestApproveReq, GS2C_ClanJoinRequestApproveAck, C2GS_ClanJoinRequestRejectReq, GS2C_ClanJoinRequestRejectAck, C2GS_ClanJoinRequestCancelReq, GS2C_ClanJoinRequestCancelAck, C2GS_ClanGetJoinRequestsReq, GS2C_ClanGetJoinRequestsAck, C2GS_ClanGetInvitationsReq, GS2C_ClanGetInvitationsAck, C2GS_ClanGetMyJoinRequestsReq, GS2C_ClanGetMyJoinRequestsAck, C2GS_ClanGetRecommendedPlayersReq, GS2C_ClanGetRecommendedPlayersAck, C2GS_ClanUpdateSettingsReq, GS2C_ClanUpdateSettingsAck, C2GS_ClanGetInfoReq, GS2C_ClanGetInfoAck, C2GS_ClanGetMembersReq, GS2C_ClanGetMembersAck, C2GS_PlayerSearchReq, GS2C_PlayerSearchAck, GS2C_ClanMemberUpdateNotify, GS2C_ClanMemberOnlineNotify, GS2C_ClanInvitationNotify, GS2C_ClanJoinRequestNotify, C2GS_GetLeaderboardReq, GS2C_GetLeaderboardAck, C2GS_GetMyRankingReq, GS2C_GetMyRankingAck, C2GS_GetRankingRewardsReq, GS2C_GetRankingRewardsAck, GS2C_RankingScoreUpdateNotify, GS2C_ItemAcquiredNotify, GS2C_SkinInfoNotify, C2GS_EquipSkinReq, GS2C_EquipSkinAck [OnConstruction, Clone, Equals, GetHashCode, ToString (+ 55 more)]
- `RefEnum.cs` -> RefEnumReflection, EAchievementType, EAimAssistTargetType, EAimMode, EAmmoType, EArmorSlot, EAutoFireConditionType, EAutoFireTargetType, EAvailableTag, EBattleType, EBotActionType, EBotCheckPointType, EBotConditionType, EBotMoveDecisionTarget, EBotSkillDecisionCondType, EBotTargetType, EBotType, ECardEffectType, ECardPositionType, ECardSynergyType, ECardType, ECharacterClass, ECharacterRotationMode, ECharacterSkinPart, ECharacterStance, ECharacterType, ECheckCondition, ECheckPoint, ECheckTransType, EClanPermissionType, EClanRoleType, EClearConditionType, EComparisonOp, EConsumableType, EContentType, EContentUnlockType, ECrosshairAimType, ECrosshairSpreadLineType, EDamageType, EElementalType, EEnergyType, EExecuteCheckType, EExecuteChkType, EExecuteOption, EExecuteShapeType, EExecuteTarget, EExecuteTargetCompare, EFaction, EGearClass, EGearRarity, EHitOption, EHitType, EInteractionDetectMode, EInteractionExecutionType, EInteractionFunction, EInteractionType, EItemType, ELevelObjectFunctionType, ELevelObjectTarget, ELogicalOp, ELookDirection, EMapObjectTriggerType, EMissionType, EModuleType, EMovePointType, ENormVec3, EOptionCategory, EOptionContent, EOptionUIType, EPassiveConditionType, EPassiveEffectType, EPassiveType, EPerkType, EPingTrigger, EPromitionType, ERangeType, ERankingType, ESTATISTICS, ESkillArmorType, ESkillCategory, ESkillEffectType, ESkillSetSlot, ESkillType, ESkillUIType, ESkillWeapon, ESkinCharacterType, ESkinResourceParts, ESkinResourceType, ESkinWeaponType, ESpawnPosType, ESpawnPositionType, EStackType, EStatType, EStatusEffectCategory, EStatusEffectCondition, EStatusEffectDescValueType, EStatusEffectFunctionType, ESynergyEffectType, ETierType, ETransCondition, EWarningDisplayType, EWeaponFireDamageType, EWeaponFireType, EWeaponSourceType, EWeaponType, ECurrencyType
- `Struct.cs` -> StructReflection, LoginInfo, PartyInfo, PartyDetailInfo, PartyMember, PartyInviteInfo, MatchPlayerInfo, CharacterSelectionInfo, CharacterInfo, PassiveSkillInfo, WeaponModuleInfo, CharacterTierInfo, TierUpdateInfo, ItemInfo, SimpleProfileInfo, ProfileInfo, 값을, CharacterStatisticsInfo, WeaponStatisticsInfo, ModeStatisticsInfo, MatchHistoryInfo, FriendInfo, FriendRequestInfo, ClanInfo, ClanMemberInfo, ClanInvitationInfo, ClanJoinRequestInfo, ClanBadgeInfo, PlayerSessionDataInfo, WeaponSkinInfo, CharacterSkinEquipInfo, RankingEntryInfo, MyRankingInfo, RankingScoreUpdateInfo [OnConstruction, Clone, Equals, GetHashCode, ToString (+ 35 more)]

### `Aegis.ServerFramework/Job/` (5 files)
**Classes**: Job, JobBase, JobSerializer, JobTimer, JobTimerElem
- `Job.cs` -> Job [Execute, Job]
- `JobBase.cs` -> JobBase [Execute]
- `JobSerializer.cs` -> JobSerializer [PushAfter, Push, Flush]
- `JobTimer.cs` -> JobTimer [Push, Flush]
- `JobTimerElem.cs` -> JobTimerElem [CompareTo]

### `NetworkClient/NetPlay/Stat/` (5 files)
**Classes**: StatPair, Stat, BuffStat, WeaponBuffStat, ESkillPropertyStat, EAdditionalBuffStat, StatContainer, DebugStat, StatMapper, EStatModOp, StatModifier, StatUtils
- `Stat.cs` -> StatPair, Stat, BuffStat, WeaponBuffStat, ESkillPropertyStat, EAdditionalBuffStat [SetValue, SetCurrentWeaponID, Rebuild, AddBuffValue, RemoveBuffValue (+ 4 more)]
- `StatContainer.cs` -> StatContainer, DebugStat [GenerateBuffTicket, Init, GetStat, TryGetStat, GetValue (+ 20 more)]
- `StatMapper.cs` -> StatMapper [From, TryMapFieldNameToEStatType, SnakeToPascal, IsNumeric, ConvertToInt]
- `StatModifier.cs` -> EStatModOp, StatModifier [StatModifier]
- `StatUtils.cs` -> StatUtils [CreateStat]

### `NetworkClient/NetPlay/Damage/` (5 files)
**Classes**: DamageCalculator, EDamageSource, DamageEvent, AnyDamageEvent, FallOffDamageEvent, WeaponDamageEvent, PointDamageEvent, RadialDamageEvent, SkillDamageEvent, StatusEffectDamageEvent, HitResult, HitDistanceComparer, WeaponHelper, DamageResult, NetRpcDamageResult (+ 2 more)
- `DamageCalculator.cs` -> DamageCalculator [CalculateDamage, CalculateWeaponBaseDamage, CalculateSkillBaseDamage, CalculateRatioDamage, CalculateShieldDamage (+ 10 more)]
- `DamageEvent.cs` -> EDamageSource, DamageEvent, AnyDamageEvent, FallOffDamageEvent, WeaponDamageEvent, PointDamageEvent, RadialDamageEvent, SkillDamageEvent, StatusEffectDamageEvent
- `DamageHelper.cs` -> HitResult, HitDistanceComparer, WeaponHelper [Compare, FindValidHit, PerformRaycastAll, FindValidHitSphere, ClosestPointOnCameraLine (+ 1 more)]
- `DamageResult.cs` -> DamageResult, NetRpcDamageResult, TakeDamageInfo [MakeDamageResult, NetRpcDamageResult, DamageResult, GetField, SetField]
- `IDamageable.cs` -> IDamageable [TakeDamage]

### `Gen_Client/` (5 files)
**Classes**: MsgId, PacketManager, EnumReflection, EErrorCode, EPassiveSkillSlotType, EPlatformType, EStoreType, EMatchCancelReason, EServerRegion, EServerGroupType, EResourceErrorCode, EFriendRequestStatus, EFriendStatus, EClanInvitationStatus, EClanJoinRequestStatus (+ 289 more)
- `ClientPacketManager.cs` -> MsgId, PacketManager [Register, RegisterEncryptedPackets, RequiresEncryption, OnRecvPacket, GetPacketHandler]
- `Enum.cs` -> EnumReflection, EErrorCode, EPassiveSkillSlotType, EPlatformType, EStoreType, EMatchCancelReason, EServerRegion, EServerGroupType, EResourceErrorCode, EFriendRequestStatus, EFriendStatus, EClanInvitationStatus, EClanJoinRequestStatus, ERankType, EItemAcquireReason, ELogType, ELoginResult
- `Protocol.cs` -> ProtocolReflection, C2GS_KeyExchangeReq, GS2C_KeyExchangeAck, C2GS_LoginReq, GS2C_LoginAck, C2GS_PongNotify, GS2C_PingNotify, C2GS_TestCreateGameSessionReq, C2GS_CreatePartyReq, GS2C_CreatePartyAck, C2GS_GetPartyListReq, GS2C_GetPartyListAck, C2GS_JoinPartyReq, GS2C_JoinPartyAck, C2GS_LeavePartyReq, GS2C_LeavePartyAck, GS2C_PartyMembersNotify, C2GS_InviteToPartyReq, GS2C_InviteToPartyAck, GS2C_PartyInviteNotify, C2GS_AcceptPartyInviteReq, GS2C_AcceptPartyInviteAck, C2GS_RejectPartyInviteReq, GS2C_RejectPartyInviteAck, C2GS_SetPartyReadyReq, GS2C_SetPartyReadyAck, C2GS_SetPartyBattleTypeReq, GS2C_SetPartyBattleTypeAck, GS2C_PartyBattleTypeNotify, C2GS_KickPartyMemberReq, GS2C_KickPartyMemberAck, GS2C_KickedFromPartyNotify, C2GS_ChangePartyCharacterReq, GS2C_ChangePartyCharacterAck, C2GS_StartMatchReq, GS2C_StartMatchAck, C2GS_CancelMatchReq, GS2C_CancelMatchAck, GS2C_MatchCancelledNotify, GS2C_MatchStatusNotify, GS2C_MatchCompletedNotify, C2GS_CheatGiveItemReq, GS2C_CheatGiveItemAck, C2GS_GetCharacterTierReq, GS2C_GetCharacterTierAck, C2GS_GetAccountHighestTierReq, GS2C_GetAccountHighestTierAck, C2GS_GetAllCharacterTiersReq, GS2C_GetAllCharacterTiersAck, GS2C_TierUpdateNotify, GS2C_AccountLevelUpdateNotify, GS2C_CharacterLevelUpdateNotify, C2GS_ChangeDeployCharacterReq, GS2C_ChangeDeployCharacterAck, C2GS_EquipModuleReq, GS2C_EquipModuleAck, C2GS_UnequipModuleReq, GS2C_UnequipModuleAck, C2GS_GetProfileReq, GS2C_GetProfileAck, C2GS_ChangeNicknameReq, GS2C_ChangeNicknameAck, C2GS_GetFriendListReq, GS2C_GetFriendListAck, C2GS_SendFriendRequestReq, GS2C_SendFriendRequestAck, C2GS_GetRecommendedFriendsReq, GS2C_GetRecommendedFriendsAck, C2GS_GetReceivedFriendRequestListReq, GS2C_GetReceivedFriendRequestListAck, C2GS_RespondFriendRequestReq, GS2C_RespondFriendRequestAck, C2GS_DeleteFriendReq, GS2C_DeleteFriendAck, C2GS_SearchFriendReq, GS2C_SearchFriendAck, GS2C_FriendRequestNotify, GS2C_FriendStatusChangedNotify, C2GS_EquipProfileItemReq, GS2C_EquipProfileItemAck, C2GS_SelectTitlesReq, GS2C_SelectTitlesAck, C2GS_SetSelectedStatisticsReq, GS2C_SetSelectedStatisticsAck, C2GS_SetPrivacySettingsReq, GS2C_SetPrivacySettingsAck, C2GS_EquipPassiveSkillReq, GS2C_EquipPassiveSkillAck, C2GS_ClanCreateReq, GS2C_ClanCreateAck, C2GS_ClanJoinReq, GS2C_ClanJoinAck, C2GS_ClanLeaveReq, GS2C_ClanLeaveAck, C2GS_ClanKickReq, GS2C_ClanKickAck, C2GS_ClanChangeRoleReq, GS2C_ClanChangeRoleAck, C2GS_ClanSearchReq, GS2C_ClanSearchAck, C2GS_ClanRefreshReq, GS2C_ClanRefreshAck, C2GS_ClanInviteReq, GS2C_ClanInviteAck, C2GS_ClanInviteAcceptReq, GS2C_ClanInviteAcceptAck, C2GS_ClanInviteDeclineReq, GS2C_ClanInviteDeclineAck, C2GS_ClanJoinRequestApproveReq, GS2C_ClanJoinRequestApproveAck, C2GS_ClanJoinRequestRejectReq, GS2C_ClanJoinRequestRejectAck, C2GS_ClanJoinRequestCancelReq, GS2C_ClanJoinRequestCancelAck, C2GS_ClanGetJoinRequestsReq, GS2C_ClanGetJoinRequestsAck, C2GS_ClanGetInvitationsReq, GS2C_ClanGetInvitationsAck, C2GS_ClanGetMyJoinRequestsReq, GS2C_ClanGetMyJoinRequestsAck, C2GS_ClanGetRecommendedPlayersReq, GS2C_ClanGetRecommendedPlayersAck, C2GS_ClanUpdateSettingsReq, GS2C_ClanUpdateSettingsAck, C2GS_ClanGetInfoReq, GS2C_ClanGetInfoAck, C2GS_ClanGetMembersReq, GS2C_ClanGetMembersAck, C2GS_PlayerSearchReq, GS2C_PlayerSearchAck, GS2C_ClanMemberUpdateNotify, GS2C_ClanMemberOnlineNotify, GS2C_ClanInvitationNotify, GS2C_ClanJoinRequestNotify, C2GS_GetLeaderboardReq, GS2C_GetLeaderboardAck, C2GS_GetMyRankingReq, GS2C_GetMyRankingAck, C2GS_GetRankingRewardsReq, GS2C_GetRankingRewardsAck, GS2C_RankingScoreUpdateNotify, GS2C_ItemAcquiredNotify, GS2C_SkinInfoNotify, C2GS_EquipSkinReq, GS2C_EquipSkinAck [OnConstruction, Clone, Equals, GetHashCode, ToString (+ 55 more)]
- `RefEnum.cs` -> RefEnumReflection, EAchievementType, EAimAssistTargetType, EAimMode, EAmmoType, EArmorSlot, EAutoFireConditionType, EAutoFireTargetType, EAvailableTag, EBattleType, EBotActionType, EBotCheckPointType, EBotConditionType, EBotMoveDecisionTarget, EBotSkillDecisionCondType, EBotTargetType, EBotType, ECardEffectType, ECardPositionType, ECardSynergyType, ECardType, ECharacterClass, ECharacterRotationMode, ECharacterSkinPart, ECharacterStance, ECharacterType, ECheckCondition, ECheckPoint, ECheckTransType, EClanPermissionType, EClanRoleType, EClearConditionType, EComparisonOp, EConsumableType, EContentType, EContentUnlockType, ECrosshairAimType, ECrosshairSpreadLineType, EDamageType, EElementalType, EEnergyType, EExecuteCheckType, EExecuteChkType, EExecuteOption, EExecuteShapeType, EExecuteTarget, EExecuteTargetCompare, EFaction, EGearClass, EGearRarity, EHitOption, EHitType, EInteractionDetectMode, EInteractionExecutionType, EInteractionFunction, EInteractionType, EItemType, ELevelObjectFunctionType, ELevelObjectTarget, ELogicalOp, ELookDirection, EMapObjectTriggerType, EMissionType, EModuleType, EMovePointType, ENormVec3, EOptionCategory, EOptionContent, EOptionUIType, EPassiveConditionType, EPassiveEffectType, EPassiveType, EPerkType, EPingTrigger, EPromitionType, ERangeType, ERankingType, ESTATISTICS, ESkillArmorType, ESkillCategory, ESkillEffectType, ESkillSetSlot, ESkillType, ESkillUIType, ESkillWeapon, ESkinCharacterType, ESkinResourceParts, ESkinResourceType, ESkinWeaponType, ESpawnPosType, ESpawnPositionType, EStackType, EStatType, EStatusEffectCategory, EStatusEffectCondition, EStatusEffectDescValueType, EStatusEffectFunctionType, ESynergyEffectType, ETierType, ETransCondition, EWarningDisplayType, EWeaponFireDamageType, EWeaponFireType, EWeaponSourceType, EWeaponType, ECurrencyType
- `Struct.cs` -> StructReflection, LoginInfo, PartyInfo, PartyDetailInfo, PartyMember, PartyInviteInfo, MatchPlayerInfo, CharacterSelectionInfo, CharacterInfo, PassiveSkillInfo, WeaponModuleInfo, CharacterTierInfo, TierUpdateInfo, ItemInfo, SimpleProfileInfo, ProfileInfo, 값을, CharacterStatisticsInfo, WeaponStatisticsInfo, ModeStatisticsInfo, MatchHistoryInfo, FriendInfo, FriendRequestInfo, ClanInfo, ClanMemberInfo, ClanInvitationInfo, ClanJoinRequestInfo, ClanBadgeInfo, PlayerSessionDataInfo, WeaponSkinInfo, CharacterSkinEquipInfo, RankingEntryInfo, MyRankingInfo, RankingScoreUpdateInfo [OnConstruction, Clone, Equals, GetHashCode, ToString (+ 35 more)]

