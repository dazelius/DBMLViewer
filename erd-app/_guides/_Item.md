# Item System Code Guide
> Auto-generated: 2026-02-25 13:31 | 57 files

## `NetworkClient/NetPlay/Character/Skill/`

### `SkillSlot.cs`
Path: `NetworkClient/NetPlay/Character/Skill/SkillSlot.cs`
**Class**: SkillPriority, TransSkillInfo, SkillSlot
**NS**: ProjectAegis.NetPlay.FSM
**Methods**: HasAvailableTag, Clear, AddSkill, SetPostureCoolTime, AddPostureTransSkill, IsValidPostureSkill, IsTransAimSkill, AddStatusEffectTransSkill, GetStatusEffectTransSkills, SetSkillWeaponSkillInfo, StartSkill, RefreshSkillButton, OnStartSkill, GetSkillPriority, OnEndSkill, SetSkillTerminate, IsButtonOnSkill, IsStickerOnSkill, SetButtonOn, SetButtonTrans, SetButtonIcon, SetButtonStickerOn, SetButtonFocus, UpdateFocusGauge, SetIgnoreCooldown (+ 15 more)

## `NetworkClient/NetPlay/GameMode/`

### `GameReward.cs`
Path: `NetworkClient/NetPlay/GameMode/GameReward.cs`
**Class**: GameMode
**NS**: ProjectAegis.NetPlay
**Methods**: SetReward

## `NetworkClient/NetPlay/Interaction/Handlers/Character/`

### `AddItemHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Character/AddItemHandler.cs`
**Class**: AddItemHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

### `RemoveItemHandler.cs`
Path: `NetworkClient/NetPlay/Interaction/Handlers/Character/RemoveItemHandler.cs`
**Class**: RemoveItemHandler
**NS**: ProjectAegis.NetPlay.Interaction.Handlers
**Methods**: Execute, OnStart, OnCancel

## `NetworkDev/03.ReferenceManager/02.ReferenceTable/`

### `RefCharacterGearSet.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefCharacterGearSet.cs`
**Class**: CRefCharacterGearSet, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterGearSet, RegisterRefCharacterGearSetBinary, FindRefCharacterGearSet, GetRefCharacterGearSets

### `RefConsumableItem.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefConsumableItem.cs`
**Class**: CRefConsumableItem, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefConsumableItem, RegisterRefConsumableItemBinary, FindRefConsumableItem, GetRefConsumableItems

### `RefGear.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefGear.cs`
**Class**: CRefGear, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefGear, RegisterRefGearBinary, FindRefGear, GetRefGears

### `RefItemDataName.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefItemDataName.cs`
**Class**: CRefItemDataName, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefItemDataName, RegisterRefItemDataNameBinary, FindRefItemDataName, GetRefItemDataNames

### `RefModuleItem.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefModuleItem.cs`
**Class**: CRefModuleItem, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefModuleItem, RegisterRefModuleItemBinary, FindRefModuleItem, GetRefModuleItems

### `RefReward.cs`
Path: `NetworkDev/03.ReferenceManager/02.ReferenceTable/RefReward.cs`
**Class**: CRefReward, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefReward, RegisterRefRewardBinary, FindRefReward, GetRefRewards

## `ReferenceTable/`

### `RefCharacterGearSet.cs`
Path: `ReferenceTable/RefCharacterGearSet.cs`
**Class**: CRefCharacterGearSet, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefCharacterGearSet, RegisterRefCharacterGearSetBinary, FindRefCharacterGearSet, GetRefCharacterGearSets

### `RefConsumableItem.cs`
Path: `ReferenceTable/RefConsumableItem.cs`
**Class**: CRefConsumableItem, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefConsumableItem, RegisterRefConsumableItemBinary, FindRefConsumableItem, GetRefConsumableItems

### `RefGear.cs`
Path: `ReferenceTable/RefGear.cs`
**Class**: CRefGear, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefGear, RegisterRefGearBinary, FindRefGear, GetRefGears

### `RefItemDataName.cs`
Path: `ReferenceTable/RefItemDataName.cs`
**Class**: CRefItemDataName, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefItemDataName, RegisterRefItemDataNameBinary, FindRefItemDataName, GetRefItemDataNames

### `RefModuleItem.cs`
Path: `ReferenceTable/RefModuleItem.cs`
**Class**: CRefModuleItem, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefModuleItem, RegisterRefModuleItemBinary, FindRefModuleItem, GetRefModuleItems

### `RefReward.cs`
Path: `ReferenceTable/RefReward.cs`
**Class**: CRefReward, CReferenceManager
**NS**: Aegis.ReferenceTable
**Methods**: RegisterRefReward, RegisterRefRewardBinary, FindRefReward, GetRefRewards

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

## `ScriptDev/UI/`

### `CUIKillLogItem.cs`
Path: `ScriptDev/UI/CUIKillLogItem.cs`
**Class**: CUIKillLogItem
**NS**: ProjectAegis.UI
**Methods**: Awake, OnDisable, ResetItem, Show, Hide, SetKiller, SetVictim, SetDamageSourceIcon, SetActiveKiller, SetActiveDamageSourceIcon, SetActiveHeadshotFlag, SetActiveDeathFlag, SetAlpha, SetPositionY, StartFadeOut, MoveTo

### `CUIWeaponSlot.cs`
Path: `ScriptDev/UI/CUIWeaponSlot.cs`
**Class**: CUIWeaponSlot
**NS**: ProjectAegis.UI
**Methods**: SetWeaponInfo, RefreshSelected, RefreshData

## `ScriptDev/UI/Achievement/`

### `UIAchievementItemSlot.cs`
Path: `ScriptDev/UI/Achievement/UIAchievementItemSlot.cs`
**Class**: UIAchievementItemSlot
**NS**: ProjectAegis.UI
**Methods**: Awake, SetData, UpdateContent

## `ScriptDev/UI/Friends/`

### `CUIFriendSlot.cs`
Path: `ScriptDev/UI/Friends/CUIFriendSlot.cs`
**Class**: CUIFriendSlot
**NS**: ProjectAegis.UI
**Methods**: RefreshButtonState, Awake, SetUp, RefreshSendingState, OnBtnInviteParty, OnBtnWhisper, OnBtnInviteClan, OnBtnDelete, OnBtnRequest, OnBtnInviteCancel, OnBtnAccept, OnBtnReject

## `ScriptDev/UI/Lobby/`

### `CUILobbyUIBtnSlot.cs`
Path: `ScriptDev/UI/Lobby/CUILobbyUIBtnSlot.cs`
**Class**: CUILobbyUIBtnSlot
**NS**: ProjectAegis.UI
**Methods**: OnButtonClick, Dispose, CUILobbyUIBtnSlot

## `ScriptDev/UI/Lobby/Chraracter/Elements/`

### `CUICharacterSlot.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/Elements/CUICharacterSlot.cs`
**Class**: CUICharacterSlot
**NS**: ProjectAegis.UI
**Methods**: InitUIBind, SetSelectCallback, SetData, SetDataByCharacterId, SetSelect, OnButtonClick, UpdateUI, SetCharacterName, SetLevel, SetRankPointText, SetTierGauge, SetDimd, SetDeployed, SetCharacterPortrait, SetJobIcon, SetTierIcon, OnDisable, OnDestroy

### `CUIPassiveInventoryCell.cs`
Path: `ScriptDev/UI/Lobby/Chraracter/Elements/CUIPassiveInventoryCell.cs`
**Class**: CUIPassiveInventoryCell
**NS**: ProjectAegis.UI
**Methods**: BindUI, SetClickCallback, OnClick, SetData, SetSelected, UpdateEquipState, SetIcon

## `ScriptDev/UI/Lobby/Clan/`

### `CUIClanBadgeItem.cs`
Path: `ScriptDev/UI/Lobby/Clan/CUIClanBadgeItem.cs`
**Class**: CUIClanBadgeItem
**NS**: ProjectAegis.UI
**Methods**: Initialize, SetEmblem, SetFrame, SetColor, SetSelected, SetEquipped

### `CUIClanListItem.cs`
Path: `ScriptDev/UI/Lobby/Clan/CUIClanListItem.cs`
**Class**: CUIClanListItem
**NS**: ProjectAegis.UI
**Methods**: Awake, OnEnable, AutoBindComponents, SetData, SetSelected, OnClick, GetMasterNameFromClanInfo, LoadBadgeTextures

### `CUIClanMemberItem.cs`
Path: `ScriptDev/UI/Lobby/Clan/CUIClanMemberItem.cs`
**Class**: CUIClanMemberItem
**NS**: ProjectAegis.UI
**Methods**: Awake, OnEnable, AutoBindComponents, SetDataForMember, SetDataForRecruit, ApplyData, SetButtonVisibility, SetInviteButtonInteractable, SetSelected, GetData, RefreshUI, SetProfileImages, UpdateLastAccessText, FormatLastAccessAt, GetRoleIconColor, OnClickItem, OnClickInvite, OnClickMore, OnClickLeave, OnClickAccept, OnClickReject

## `ScriptDev/UI/Lobby/OldLobby/`

### `CUILobbyModeTabSlot.cs`
Path: `ScriptDev/UI/Lobby/OldLobby/CUILobbyModeTabSlot.cs`
**Class**: CUILobbyModeTabSlot
**Methods**: SetSelected, SetButtonEnable, Dispose, OnButtonClick, CUILobbyModeTabSlot

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

## `ScriptDev/UI/Option/`

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

## `ScriptDev/UI/Profile/Elements/`

### `UIProfileDecoSlot.cs`
Path: `ScriptDev/UI/Profile/Elements/UIProfileDecoSlot.cs`
**Class**: UIProfileDecoSlot
**NS**: ProjectAegis.UI.Profile
**Methods**: Awake, SetSelectCallback, Setup, OnClickSlot

### `UIProfileTitleSlot.cs`
Path: `ScriptDev/UI/Profile/Elements/UIProfileTitleSlot.cs`
**Class**: UIProfileTitleSlot
**NS**: ProjectAegis.UI.Profile
**Methods**: Awake, OnClickSlot, SetSelectCallback, SetTitle

## `ScriptDev/UI/Ranking/`

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

## `ScriptDev/UI/UIElements/`

### `DropDown.cs`
Path: `ScriptDev/UI/UIElements/DropDown.cs`
**Class**: DropDownContent, MenuItem, DropDownLabel
**NS**: ProjectAegis.UI
**Methods**: Setup, SetClickEvent, HideAllItems, MakeItems, ShowDropDown, OnSelectItem, SetupItemDatas, SetItemIndexWithoutNotify, OnClickOpenDropDown, SetDropDownItemIndex, ResetContent, SetDropDownFocus, MenuItem, DropDownContent, DropDownLabel

## `ScriptDev/UI/UIFramework/Editor/`

### `UITemplateImporter.cs`
Path: `ScriptDev/UI/UIFramework/Editor/UITemplateImporter.cs`
**Class**: UITemplateImporter, UIPrefabPreview, UIPrefabPreviewRenderer, UIPrefabPreviewCache
**NS**: ProjectAegis.UI.Editors
**Methods**: ObjectToFile, ShowWindow, UpdateFiltered, RefreshAssets, OnEnable, OnDestroy, OnGUI, DrawDragDropArea, CreatePrefabFromGameObject, SaveDescription, ImportAset, GeneratePreview, SetupPreviewScene, ConvertToTexture2D, CleanupPreviewScene, RenderPreview, Dispose, GetPreview, ClearCache, UIPrefabPreviewRenderer

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

## `ScriptDev/UI/Utilities/`

### `CUIRewardSlot.cs`
Path: `ScriptDev/UI/Utilities/CUIRewardSlot.cs`
**Class**: CUIRewardSlot
**NS**: ProjectAegis.UI
**Methods**: Awake, SetData

### `UIHeroSelectSlot.cs`
Path: `ScriptDev/UI/Utilities/UIHeroSelectSlot.cs`
**Class**: UIHeroSelectSlot
**NS**: ProjectAegis.UI
**Methods**: Awake, SetupSlot, OnButtonSelect

## `ScriptTools/Editor/`

### `InventoryCheatTool.cs`
Path: `ScriptTools/Editor/InventoryCheatTool.cs`
**Class**: InventoryCheatTool, RequestState
**Methods**: Open, OnEnable, OnDisable, OnEditorUpdate, CheckRequestCompleted, GetInventoryCountByType, SendCheatRequest, OnGUI, CheckManager, InitStyles, DrawBackground, DrawHeader, DrawToolbar, DrawRequestStatus, DrawWarningBox, DrawContent, GetListHeight, DrawModuleTab, DrawModuleAddSection, DrawModuleList, DrawPassiveTab, DrawPassiveAddSection, DrawPassiveList, DrawSkinTab, DrawSkinAddSection (+ 15 more)


