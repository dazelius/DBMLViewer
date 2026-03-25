# Shop 관련 테이블

## BattlePassReward — 배틀 패스의 보상 설정 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| battle_pass_reward_id |  |  | 고유 ID (PK) |
| track_type |  |  | 보상 트랙 구분 (Free / Elite) |
| level |  |  | 해당 보상이 속하는 배틀 패스 레벨 |
| reward_id |  |  | 지급할 보상 ID (FK) |
| is_milestone |  |  | 마일스톤 보상 여부 |

## InitialRewardTable — 칭호 아이템
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 테이블 고유 id |
| item_id |  |  | 지급할 아이템 id |
| item_type |  |  | 지급할 아이템 타입 |
| quantity |  |  | 지급할 아이템 수량 |

## Reward — 보상 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| reward_id |  |  | 보상의 ID(키값) |
| item_type |  |  | 보상의 타입(enum 값에 따라 참조하는 테이블이 결정됨) |
| item_id |  |  | 지급 대상인 아이템의 ID |
| item_amount |  |  | 지급 되는 보상의 수량 |

## ShopProductGroup — 상품 그룹 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| product_id |  |  | 구매 요청 시 상품을 구분하는 키값 |
| order |  |  | 상품 출력 순서 |
| is_active |  |  | 상품 활성화 여부 (비활성이면 상점 공��� 시간 중이라도 즉시 닫힘/ 0: 비활성, 1: 활성) |
| reward_id |  |  | 구매 아이템 ID (Reward.id) |
| currency_type_1 |  |  | 재화 아이템 타입 1 |
| currency_price_1 |  |  | 재화 수량 1 |
| currency_type_2 |  |  | 재화 아이템 타입 2 |
| currency_price_2 |  |  | 재화 수량 2 |
| sales_count |  |  | 구매 제한 횟수 (0: 수량 제한 없음) |

## Shop — 상점 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| shop_name |  |  | 상점 카테고리 이름 로컬 키 값 |
| order |  |  | 카테고리 출력 순서 |
| shop_hud_type |  |  | 진입한 상점별 재화 HUD 출력 정보 (0: Combat Point (무료 재화), 1: Elite Permits (유료 재화), 2: Fragment Pieces (재활용 재화), 3: Synapse Packets (남은 캐릭터 EXP)) |
| is_active |  |  | 상점 활성화 여부 (비활성이면 상점 공개 시간 중이라도 즉시 닫힘/ 0: 비활성, 1: 활성) |
| shop_filter_type |  |  | 상품 필터 출력 (None(0): 필터 미사용, Class(1): 영웅/스킨/무기에 대해 클래스로 필터, Character(2): 영웅/스킨/무기에 대해 영웅으로 필터) |
| shop_product_group_id |  |  | 상점 구성 상품의 그룹 id (ShopProductGroup.id 참조) |

