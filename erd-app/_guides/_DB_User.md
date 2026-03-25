# User 관련 테이블

## AccountLevel — 계정 경험치 테이블
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| account_level |  |  | 계정 레벨(키 값) |
| required_exp |  |  | 요구 누적 경험치 |

## ProfileBanner — 프로필 배너 아이템
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 프로필 배너 ID |
| name_id |  |  | 아이템 이름 ID |
| desc_id |  |  | 아이템 설명 ID |
| icon |  |  | 아이템 아이콘 이미지 |
| profile_banner_asset |  |  | 프로필 배너 이미지 파일 |
| is_duplicatable |  |  | 중복 획득 가능 여부 |

## ProfileFrame — 프로필 테두리 아이템
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 프로필 테두리 ID |
| name_id |  |  | 아이템 이름 ID |
| desc_id |  |  | 아이템 설명 ID |
| icon |  |  | 아이템 아이콘 이미지 |
| profile_frame_asset |  |  | 프로필 테두리 이미지 파일 |
| is_duplicatable |  |  | 중복 획득 가능 여부 |

## ProfileIcon — 프로필 아이콘 아이템
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 프로필 아이콘 ID |
| name_id |  |  | 아이템 이름 ID |
| desc_id |  |  | 아이템 설명 ID |
| icon |  |  | 아이템 아이콘 이미지 |
| profile_icon_asset |  |  | 프로필 아이콘 이미지 파일 |
| is_duplicatable |  |  | 중복 획득 가능 여부 |

## SplashDamageProfile — 스플래쉬 대미지 거리 감쇠 프로파일용 파라미터
| 컬럼 | 타입 | 속성 | 설명 |
|---|---|---|---|
| id |  |  | 데이터 키값 |
| explosion_radius |  |  | 폭발 반경(cm) |
| falloff_start_radius |  |  | 폭발 대미지 저하 시작 반경(cm) |
| falloff_rate |  |  | 폭발 대미지 저하 시작 반경의 대미지 배율(만분율) |
| min_rate |  |  | 최소 대미지 배율(explosion damage지점에서의 대미지 배율)(만분율) |

