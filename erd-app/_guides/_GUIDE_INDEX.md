# Code Guide Index — Project Aegis
> Auto-generated: 2026-02-25 13:31

Use the `read_guide` tool with the guide names below.

## ⭐ 추천 읽기 순서

### 처음 시작할 때
1. `_OVERVIEW` — 전체 아키텍처, 시스템 연결 맵, 핵심 코드 경로
2. `_DB_OVERVIEW` — 전체 테이블 관계, FK 맵, SQL 패턴, Enum 목록

### 질문 유형별 가이드

| 질문 주제 | DB 가이드 | 코드 가이드 |
|-----------|----------|------------|
| 캐릭터 능력치/스탯 | `_DB_Character` | `_Character` |
| 무기/사격/RPM | `_DB_Weapon` | `_Weapon` |
| 스킬/궁극기 | `_DB_Skill` | `_Skill` |
| 데미지/전투 | `_DB_Character` | `_Combat` |
| AI/봇 행동 | `_DB_Misc` | `_AI` |
| StatusEffect/버프 | `_DB_Misc` | `_Combat` |
| 맵/오브젝트 | `_DB_Stage` | `_Map` |
| 아이템/장비 | `_DB_Item` | `_Item` |
| Enum/코드값 | `_DB_Enums` | — |
| UI/로비 | — | `_UI` |
| 네트워크/패킷 | — | `_Network` |
| 매니저 전반 | — | `_Manager` |
| 이펙트/VFX | — | `_Effect` |
| 카메라/에임 | — | `_Camera` |
| 사운드 | — | `_Audio` |
| 애니메이션 | — | `_Animation` |

## 전체 가이드 목록

### DB/게임데이터 가이드
- `_DB_OVERVIEW` — ⭐ 전체 테이블 관계 맵, FK, SQL 패턴, Enum (최우선)
- `_DB_Character` — 캐릭터 관련 9개 테이블 상세 (컬럼 설명 포함)
- `_DB_Skill` — 스킬/패시브 10개 테이블 상세
- `_DB_Weapon` — 무기 5개 테이블 상세
- `_DB_Item` — 아이템 4개 테이블
- `_DB_Stage` — 맵/미션 5개 테이블
- `_DB_Misc` — 기타 (봇, StatusEffect, 카드, 상호작용 등)
- `_DB_Enums` — Enum 전체 값 상세
- `_DB_Quest` — 업적 테이블
- `_DB_Shop` — 보상 테이블
- `_DB_User` — 계정/프로필 테이블

### C# 코드 가이드
- `_OVERVIEW` — ⭐ 전체 아키텍처, 폴더 구조, 시스템 맵 (최우선)
- `_Character` — 캐릭터 시스템 (286 files): Character.cs, FSM, IK, Stat
- `_Combat` — 전투 시스템 (155 files): DamageCalculator, StatusEffect
- `_Skill` — 스킬 시스템 (151 files): SkillHandler, Passive
- `_AI` — AI 시스템 (147 files): AIActionBrainV2, 봇 행동
- `_Network` — 네트워크 (565 files): FishNet, 패킷, 게임모드
- `_UI` — UI 시스템 (378 files): CUIManager, 로비, 인게임 HUD
- `_Manager` — 매니저 (273 files): UserData, Asset, ContentUnlock
- `_Data` — 데이터 (313 files): ReferenceTable, Schema
- `_Weapon` — 무기 (77 files): GunBase, Projectile, Equipment
- `_Effect` — 이펙트 (89 files): EffectManager, MaterialEffect
- `_Item` — 아이템 (57 files): Gear, Consumable
- `_Map` — 맵 (103 files): MapObject, SafetyZone, Building
- `_Camera` — 카메라 (20 files): CCameraController, AimAssist
- `_Audio` — 오디오 (18 files): SoundManager
- `_Animation` — 애니메이션 (17 files): AnimationEvent

## Usage
```
read_guide  name="_DB_OVERVIEW"   (DB 관계 + SQL 패턴)
read_guide  name="_OVERVIEW"      (코드 아키텍처)
read_guide  name="_DB_Character"  (캐릭터 테이블 상세)
read_guide  name="_Skill"         (스킬 코드 상세)
read_guide  name=""               (전체 목록)
```
