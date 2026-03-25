# Item 관련 테이블

## ConsumableItem — 소모품 아이템 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| consumable_id |  |  | 테이블 고유 id |
| name_id |  |  | 아이템 이름(Aegis Localization Key 값) |
| desc_id |  |  | 아이템 설명(Aegis Localization Key 값) |
| consumable_type |  |  | 소모품 아이템을 구분하는 타입 |
| use_target_id |  |  | 아이템을 사용할 수 있는 캐릭터 id |
| is_inventory |  |  | 아이템이 인벤토리에 들어가는지 여부( 0: 인벤토리에 들어가지 않으며 별도 저장 / 1: 인벤토리에 저장) |
| is_stack |  |  | 인벤토리에서 아이템이 스택되지는 여부(0: 스택되지 않음 / 1: 스택됨) |
| icon_id |  |  | 아이콘 이름 |

## Gear — 장비 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| gear_class |  |  | 장비 시스템 분류 |
| name_id |  |  | 이름 키값(로컬라이제이션) |
| desc_id |  |  | 설명 키값(로컬라이제이션) |
| icon |  |  | 아이콘 이름 |
| rarity |  |  | 희귀도 |
| max_stack |  |  | 최대 보유량 |
| netobject_id |  |  | 사격 형태에 따른 NetworkObject id (1:라이플, 2:차지, 3: 투척) |

## ItemDataName — 아이템 타입의 enum 이 참조해야 하는 ref 이름
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| itemtype |  |  | 아이템 타입 값 |
| refdata_name |  |  | 서버에서 참조해야 하는 Ref 이름 |

## ModuleItem — 스킬 UI 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| module_type |  |  | 모듈 타입 (타입에 따라 참조하는 테이블 결정) |
| use_target_id |  |  | 참조되는 테이블의 id 값 |

