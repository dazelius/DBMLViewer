# Passive / Perk 멀티키 규칙

## PassiveProperty 멀티키
- PassiveProperty는 **id + property_id** 조합이 멀티키
- 하나의 Passive 안에 여러 개의 PassiveProperty 행을 **id를 같게** 하여 연결
- 예: id=8001012, property_id=1 / id=8001012, property_id=2 → 같은 Passive에 2개 Property

## PerkEffect 멀티키
- PerkEffect는 **id + eff_id** 조합이 멀티키
- 하나의 Perk 안에 여러 개의 PerkEffect 행을 **id를 같게** 하여 연결
- 예: id=8001021, eff_id=1 / id=8001021, eff_id=2 / id=8001021, eff_id=3 → 같은 Perk에 3개 Effect

## 작업 순서
- 데이터 등록 전에 **매핑표를 아티팩트에 먼저 정리** → 확인 후 일괄 등록
- 등록 순서 (FK 순서): PassiveEffect → PassiveProperty → Passive / PerkEffect → Perk
