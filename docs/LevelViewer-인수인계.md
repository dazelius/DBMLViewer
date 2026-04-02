# 🗺️ Unity Scene / Level Viewer 인수인계 문서

> **최종 업데이트**: 2026-03-10  
> **프로젝트 위치**: `C:\TableMaster\DBMLViewer`  
> **Unity 프로젝트**: `C:\TableMaster\unity_project\Client\Project_Aegis`

---

## 📋 목차

1. [시스템 개요](#1-시스템-개요)
2. [아키텍처](#2-아키텍처)
3. [주요 파일 목록](#3-주요-파일-목록)
4. [데이터 파이프라인 (Bake Flow)](#4-데이터-파이프라인-bake-flow)
5. [서버 API 엔드포인트](#5-서버-api-엔드포인트)
6. [bake-scene.mjs — 씬 베이크 스크립트](#6-bake-scenemjs--씬-베이크-스크립트)
7. [SceneViewer.tsx — 클라이언트 렌더러](#7-sceneviewertsx--클라이언트-렌더러)
8. [vite-git-plugin.ts — API 서버 / SSE 중계](#8-vite-git-plugints--api-서버--sse-중계)
9. [씬 캐시 구조](#9-씬-캐시-구조)
10. [배치 베이크 (일괄 처리)](#10-배치-베이크-일괄-처리)
11. [Unity Asset Browser (UnityPage)](#11-unity-asset-browser-unitypage)
12. [SceneMeshExporter.cs — 원본 참조](#12-scenemeshexportercs--원본-참조)
13. [서버 시작 방법](#13-서버-시작-방법)
14. [알려진 이슈 및 제한사항](#14-알려진-이슈-및-제한사항)
15. [트러블슈팅 가이드](#15-트러블슈팅-가이드)

---

## 1. 시스템 개요

Unity 씬(`.unity`) 파일을 웹 브라우저에서 3D로 시각화하는 시스템입니다.

**핵심 아이디어**:
- Unity Editor 없이 씬의 FBX 메시를 월드 좌표로 변환해 JSON으로 캐싱
- 브라우저에서 Three.js를 사용해 캐싱된 메시 데이터를 렌더링
- `SceneMeshExporter.cs` (Unity Editor 스크립트)와 동일한 `localToWorldMatrix` 변환 방식 적용

**기술 스택**:
| 계층 | 기술 |
|------|------|
| 프론트엔드 | React + Three.js (MeshPhongMaterial, BufferGeometry) |
| 서버 | Vite Preview Server + 커스텀 미들웨어 (vite-git-plugin.ts) |
| 베이크 | Node.js 독립 스크립트 (bake-scene.mjs) + Three.js FBXLoader |
| 캐시 | 로컬 파일시스템 (`scene-cache/`) |

---

## 2. 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│  브라우저 (SceneViewer.tsx)                                       │
│  ┌───────────────┐   EventSource (SSE)   ┌───────────────────┐  │
│  │ Three.js 렌더  │◄─────────────────────│ 진행률 표시 UI     │  │
│  │ - BufferGeom   │                       │ - 스피너/진행바    │  │
│  │ - PhongMat     │                       └───────────────────┘  │
│  │ - OrbitCtrl    │                                               │
│  └───────┬───────┘                                               │
│          │ ① GET /api/assets/bake-scene?path=...                 │
└──────────┼───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Vite Preview Server (vite-git-plugin.ts)                        │
│                                                                   │
│  ② 캐시 확인 → 있으면 즉시 SSE done 이벤트로 반환               │
│  ③ 없으면 child_process.spawn → bake-scene.mjs                   │
│  ④ stdout JSON-line → SSE 이벤트로 브라우저에 중계               │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  bake-scene.mjs (독립 Node.js 프로세스)                           │
│                                                                   │
│  ⑤ .unity YAML 파싱 → Transform 계층 구축                       │
│  ⑥ GUID 인덱스 → .meta 파일에서 FBX 경로 해석                   │
│  ⑦ Three.js FBXLoader (Node.js 폴리필) → 메시 추출              │
│  ⑧ localToWorldMatrix 적용 → 월드 좌표 버텍스                   │
│  ⑨ scene-cache/<sceneName>/meshes.json + scene_info.json 저장    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. 주요 파일 목록

| 파일 | 역할 |
|------|------|
| `erd-app/scripts/bake-scene.mjs` | **핵심** — Unity 씬 베이크 스크립트 (독립 실행) |
| `erd-app/src/components/SceneViewer.tsx` | **핵심** — Three.js 기반 씬 렌더러 컴포넌트 |
| `erd-app/vite-git-plugin.ts` | API 엔드포인트 정의 (bake-scene SSE 중계, 캐시 서빙) |
| `bake-all-scenes.bat` | 전체 씬 일괄 베이크 배치 파일 |
| `SceneMeshExporter.cs` | Unity Editor 원본 스크립트 (참조용) |
| `erd-app/src/pages/UnityPage.tsx` | Unity Asset Browser 페이지 |
| `scene-cache/` | 베이크 결과 캐시 디렉토리 |
| `start.bat` | 서버 시작 스크립트 |

---

## 4. 데이터 파이프라인 (Bake Flow)

### 4.1 전체 흐름

```
Unity .unity 파일 (YAML)
       │
       ├── Transform 블록 파싱 (--- !u!4)
       │     → tfMap: { id, goId, parentId, lpos, lrot, lscl }
       │
       ├── MeshFilter 블록 파싱 (--- !u!33)
       │     → meshGuid 추출 → GUID 인덱스로 FBX 경로 해석
       │
       ├── PrefabInstance 블록 파싱 (--- !u!1001)
       │     → SourcePrefab GUID → 중첩 프리팹 재귀 탐색 → FBX 경로 해석
       │
       ├── 월드 트랜스폼 계산
       │     → getWorldTf(): 부모→자식 재귀로 쿼터니언 회전 + 스케일 적용
       │
       └── FBX 로드 + 월드 버텍스 변환
             → FBXLoader.parse() → child.matrixWorld 적용
             → applyWorldTf() → Z축 부호 반전 (v.z → -v.z)
             → meshObjects[] 배열 저장
```

### 4.2 좌표계 변환

Unity는 **왼손 좌표계** (Y-up, Z-forward), Three.js는 **오른손 좌표계** (Y-up, Z-backward)입니다.

변환 과정:
1. FBXLoader가 FBX 내부 좌표를 Three.js 좌표계로 변환 (`child.matrixWorld`)
2. `applyWorldTf()`로 Unity 씬의 월드 트랜스폼(pos, rot, scale) 적용
3. **Z축 부호 반전**: `v.z = -v.z` (bake-scene.mjs 325행)

```javascript
// bake-scene.mjs — 핵심 변환 로직
for (let i = 0; i < posAttr.count; i++) {
  v3.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i))
  v3.applyMatrix4(child.matrixWorld)          // FBX 내부 변환
  localVerts.push({ x: v3.x, y: v3.y, z: -v3.z })  // Z축 반전
}
const worldVerts = applyWorldTf(localVerts, wt)  // Unity 월드 변환
```

### 4.3 월드 트랜스폼 계산 (getWorldTf)

SceneMeshExporter.cs의 `localToWorldMatrix`와 동일한 로직:

```javascript
// 부모-자식 계층을 재귀적으로 순회
const getWorldTf = (tfId) => {
  const tf = tfMap[tfId]
  if (tf.parentId === '0') return { pos: tf.lpos, rot: tf.lrot, scale: tf.lscl }
  
  const parent = getWorldTf(tf.parentId)
  // 1. 쿼터니언 회전으로 로컬 위치를 부모 공간으로 변환
  // 2. 부모 스케일 적용
  // 3. 부모 위치 더하기
  // 4. 부모-자식 쿼터니언 곱 (회전 합성)
  // 5. 스케일 곱 (누적)
}
```

---

## 5. 서버 API 엔드포인트

### 5.1 베이크 관련

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/api/assets/bake-scene?path=...&force=0\|1` | GET | SSE 스트림으로 베이크 진행/결과 반환 |
| `/api/assets/cache-scene` | POST | 클라이언트 베이크 결과를 서버에 캐싱 (레거시) |

### 5.2 캐시 서빙

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/api/assets/map-list` | GET | 캐시된 씬 목록 반환 |
| `/api/assets/map-meshes?map=씬이름` | GET | meshes.json 서빙 |
| `/api/assets/map-scene-info?map=씬이름` | GET | scene_info.json 서빙 |
| `/api/assets/map-texture?map=씬이름&file=텍스처파일` | GET | 캐시된 텍스처 서빙 |
| `/api/assets/map-thumb?map=씬이름` | GET | 썸네일 (미구현, 404) |

### 5.3 에셋 브라우징

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/api/assets/browse?path=GameContents` | GET | 에셋 디렉토리 탐색 |
| `/api/assets/file?path=경로` | GET | 에셋 파일 직접 서빙 (FBX, PNG 등) |
| `/api/assets/scene?path=...&max=N` | GET | 씬 YAML 파싱 결과 (오브젝트/컴포넌트 정보) |
| `/api/assets/prefab?path=...&max=N` | GET | 프리팹 YAML 파싱 결과 |

### 5.4 SSE 이벤트 형식

`/api/assets/bake-scene` 응답:

```
data: {"type":"progress","current":10,"total":100,"msg":"GUID 인덱스 구축 중..."}

data: {"type":"progress","current":50,"total":100,"msg":"FBX 처리 중... 40/78"}

data: {"type":"done","data":{"status":"done","sceneName":"OldTown","meshObjects":[...],"bounds":{...},"hierarchy":[]}}

data: {"type":"error","msg":"씬 파일 없음: ..."}
```

---

## 6. bake-scene.mjs — 씬 베이크 스크립트

### 6.1 위치 및 실행

```bash
# 단일 씬 베이크
node erd-app/scripts/bake-scene.mjs --path GameContents/Map/OldTown.unity

# 캐시 무시 강제 재베이크
node erd-app/scripts/bake-scene.mjs --path GameContents/Map/OldTown.unity --force
```

### 6.2 처리 단계

| 단계 | 진행률 | 작업 |
|------|--------|------|
| 1 | 0~2% | 캐시 확인 (있으면 즉시 종료) |
| 2 | 2~10% | GUID 인덱스 구축 (.meta 파일 전수 스캔) |
| 3 | 10~12% | .unity YAML 파싱 → Transform 맵 구축 |
| 4 | 12~15% | MeshFilter / PrefabInstance 오브젝트 수집 |
| 5 | 15~95% | FBX 로드 + 월드 버텍스 변환 |
| 6 | 95~100% | Bounds 계산 → meshes.json / scene_info.json 저장 |

### 6.3 Node.js 폴리필

Three.js FBXLoader는 브라우저용으로 설계되어 있어 Node.js 환경에서 실행하려면 폴리필이 필요합니다:

```javascript
// 필수 폴리필 목록
global.document     // createElementNS, createElement (canvas, img)
global.window       // = global
global.self         // = global
global.navigator    // Object.defineProperty 사용 (Node.js v24+ getter-only)
global.Image        // ImagePolyfill 클래스 (addEventListener 포함)
global.HTMLImageElement
global.THREE        // FBXLoader 내부 참조용
```

> ⚠️ **중요**: `import * as THREE from 'three'`를 사용해야 합니다. Three.js는 default export가 없어 `import { default as THREE }`는 `undefined`가 됩니다.

### 6.4 GUID 인덱스

Unity 에셋은 GUID로 참조됩니다. `.meta` 파일에서 GUID를 추출해 실제 파일 경로와 매핑합니다.

```
Assets/
├── Character/
│   ├── Player.fbx        ← 실제 파일
│   └── Player.fbx.meta   ← guid: a1b2c3d4...
```

```javascript
// guidIndex: Map<guid, absolutePath>
// "a1b2c3d4..." → "C:\...\Assets\Character\Player.fbx"
```

### 6.5 FBX 캐시

동일한 FBX가 여러 PrefabInstance에서 참조될 수 있으므로 `fbxCache`로 중복 로드를 방지합니다:

```javascript
const fbxCache = new Map()  // key: fbxAbsolutePath, value: parsedFBXGroup
```

---

## 7. SceneViewer.tsx — 클라이언트 렌더러

### 7.1 컴포넌트 구조

```tsx
<SceneViewer scenePath="/api/assets/scene?path=GameContents/Map/OldTown.unity" height={600} />
```

**Props**:
- `scenePath`: 씬 경로 (URL 형태, `path=` 쿼리 파라미터에서 추출)
- `height`: 뷰어 높이 (기본 600px)

### 7.2 상태 머신

```
idle → baking → done
              → error → (다시 시도) → baking → ...
```

| 상태 | UI |
|------|-----|
| `idle` | 초기 상태, 3D 캔버스만 표시 |
| `baking` | 스피너 + 진행바 + 진행 메시지 오버레이 |
| `done` | 3D 씬 렌더링 + 메시 카운트 표시 |
| `error` | 에러 메시지 + "다시 시도" 버튼 |

### 7.3 메시 빌드 함수 (buildMesh)

`collaborative_map_viewer.html`의 `createMesh`를 포팅한 함수입니다:

```tsx
function buildMesh(obj: MeshObject): THREE.Mesh | null {
  const geo = new THREE.BufferGeometry()
  // vertices → Float32Array → position attribute
  // triangles → index
  // normals (없으면 computeVertexNormals)
  // uvs
  
  const mat = new THREE.MeshPhongMaterial({
    color,
    side: THREE.DoubleSide,
    flatShading: true,
    transparent: true,
    opacity: 0.88,
  })
  
  return new THREE.Mesh(geo, mat)
}
```

### 7.4 카메라 자동 맞춤 (fitCamera)

Bounds 데이터를 기반으로 카메라를 자동 배치합니다:

```
카메라 거리 = (maxSize / 2 / tan(FOV/2)) × 1.6
카메라 위치 = center + (dist×0.6, dist×0.5, dist×0.6)
FOG = (dist×0.8, dist×5)
```

### 7.5 자동 재베이크 로직

캐시된 데이터의 meshObjects가 빈 배열(0 메시)이면 자동으로 강제 재베이크를 시도합니다:

```tsx
if (data.status === 'cached' && (!data.meshObjects?.length) && forceIfEmpty) {
  // 빈 캐시 감지 → 자동 강제 재베이크
  setTimeout(() => {
    const url = `/api/assets/bake-scene?path=...&force=1`
    const es = new EventSource(url)
    // ...
  }, 100)
}
```

### 7.6 툴바

| 버튼 | 기능 |
|------|------|
| ☰ | 하이어라키 패널 토글 |
| 🔄 | 재로드 (캐시 사용) |
| ⚡ | 강제 재베이크 (캐시 무시) |

---

## 8. vite-git-plugin.ts — API 서버 / SSE 중계

### 8.1 bake-scene SSE 중계 흐름

```
브라우저 GET /api/assets/bake-scene?path=...
    │
    ▼
[캐시 확인] ─── 있음 ──→ SSE done 이벤트 전송 → res.end()
    │
    │ 없음 (또는 force=1)
    ▼
child_process.spawn('node', ['scripts/bake-scene.mjs', '--path', ...])
    │
    │ child.stdout → JSON-line 파싱 → SSE 이벤트로 변환
    │ child.stderr → 서버 로그에 기록
    │
    ▼
child 종료 시 → meshes.json / scene_info.json 읽어서 SSE done 전송 → res.end()
```

### 8.2 핵심 코드 위치

`vite-git-plugin.ts` 내 주요 코드 블록:

| 라인 범위 (대략) | 내용 |
|------------------|------|
| 2043~2080 | `/api/assets/browse` — 에셋 디렉토리 탐색 |
| 2086~2170 | `/api/assets/map-*` — 캐시 서빙 엔드포인트들 |
| 2176~2269 | `/api/assets/bake-scene` — SSE 중계 (child_process.spawn) |
| 2627~2670 | `/api/assets/cache-scene` — 클라이언트 베이크 결과 저장 (레거시) |
| 2698~3500+ | `/api/assets/scene`, `/api/assets/prefab` — YAML 파싱 |

### 8.3 child_process.spawn 사용 이유

**문제**: 초기에는 vite-git-plugin.ts 내부에서 FBX 로딩을 직접 수행했으나, FBXLoader의 동기적 파싱이 메인 이벤트 루프를 완전히 블로킹하여 서버 전체가 응답 불능 상태가 됨.

**해결**: 무거운 베이크 작업을 별도 프로세스(`bake-scene.mjs`)로 분리. 메인 서버는 stdout만 파이프로 읽어 SSE로 중계.

```typescript
const child = spawnChild(process.execPath, [scriptPath, '--path', scenePath], {
  cwd: process.cwd(),
  env: process.env,
})
// child.stdout → SSE
// child.stderr → 서버 로그
// req.on('close') → child.kill()
```

---

## 9. 씬 캐시 구조

### 9.1 디렉토리

```
C:\TableMaster\DBMLViewer\scene-cache\
├── OldTown/
│   ├── meshes.json        # 메시 데이터 (버텍스, 인덱스, 머티리얼)
│   └── scene_info.json    # 메타데이터 (씬이름, 메시수, 바운드, 시간)
├── Biozone/
│   ├── meshes.json
│   └── scene_info.json
├── ...
```

### 9.2 meshes.json 형식

```json
{
  "meshObjects": [
    {
      "name": "Building_01",
      "path": "Building_01",
      "geometry": {
        "vertices": [
          {"x": 1.0, "y": 2.5, "z": -3.0},
          ...
        ],
        "triangles": [0, 1, 2, 2, 3, 0, ...]
      },
      "material": {
        "color": {"r": 0.8, "g": 0.6, "b": 0.4}
      }
    },
    ...
  ]
}
```

### 9.3 scene_info.json 형식

```json
{
  "sceneName": "OldTown",
  "meshCount": 78,
  "exportTime": "2026-03-10T04:30:00.000Z",
  "source": "bake-scene-script",
  "bounds": {
    "min": {"x": -500, "y": -10, "z": -500},
    "max": {"x": 500, "y": 200, "z": 500},
    "center": {"x": 0, "y": 95, "z": 0},
    "size": {"x": 1000, "y": 210, "z": 1000}
  }
}
```

### 9.4 현재 캐시 현황 (2026-03-10 기준)

| 씬 이름 | 메시 수 | 소스 | 비고 |
|---------|---------|------|------|
| tdm_erangel_02_shantytown | 1,312 | bake-scene-script | ✅ 정상 |
| pc_mirama_13_powergrid | 1,798 | client-bake | ✅ 이전 방식 캐시 |
| Village_02 | 879 | client-bake | ✅ 이전 방식 캐시 |
| Village_01 | 220 | client-bake | ✅ |
| Neo_OldTown | 88 | bake-scene-script | ✅ |
| OldTown | 78 | bake-scene-script | ⚠️ 메시 수 적음 |
| Lab | 59 | bake-scene-script | ✅ |
| pc_mirama_12_distillery | 46 | client-bake | ✅ |
| Undercore | 46 | bake-scene-script | ✅ |
| pc_mirama_18_hillside | 40 | bake-scene-script | ✅ |
| Biozone | 2 | bake-scene-script | ⚠️ 대부분 프리팹 미해석 가능성 |
| Factory | 2 | bake-scene-script | ⚠️ 동일 |
| c_OldTown_01_Hanok | 0 | server-bake | ❌ 구버전 캐시, 재베이크 필요 |
| Ingame | 0 | server-bake | ❌ 구버전 캐시, 재베이크 필요 |
| OldTown_Result | 0 | bake-scene-script | ❌ 빈 씬 또는 해석 실패 |
| pc_taego_08_hanok | 0 | server-bake | ❌ 구버전 캐시, 재베이크 필요 |

> `source: "server-bake"`는 구버전 서버 인라인 베이크에서 생성된 것으로, 대부분 불완전합니다. `--force`로 재베이크 권장.

---

## 10. 배치 베이크 (일괄 처리)

### 10.1 전체 씬 일괄 베이크

```batch
C:\TableMaster\DBMLViewer\bake-all-scenes.bat
```

이 배치 파일은 Unity Assets 디렉토리를 재귀 탐색해 모든 `.unity` 파일을 찾아 베이크합니다.

### 10.2 단일 씬 베이크

```batch
C:\TableMaster\DBMLViewer\bake-all-scenes.bat GameContents/Map/OldTown.unity
```

### 10.3 PowerShell에서 직접 실행

```powershell
cd C:\TableMaster\DBMLViewer\erd-app
node scripts\bake-scene.mjs --path "GameContents/Map/OldTown.unity" --force
```

### 10.4 여러 씬 연속 베이크 예시

```powershell
cd C:\TableMaster\DBMLViewer\erd-app
$scenes = @(
  "GameContents/Map/OldTown.unity",
  "GameContents/Map/Mirama_01/Biozone.unity",
  "GameContents/Map/Ingame.unity"
)
foreach ($s in $scenes) {
  $name = $s.Split('/')[-1].Replace('.unity', '')
  Write-Host "Baking $name..."
  node scripts\bake-scene.mjs --path $s --force
}
```

---

## 11. Unity Asset Browser (UnityPage)

### 11.1 접근 경로

```
http://localhost:5173/TableMaster/unity
```

DataMaster 드롭다운 메뉴 → "Unity" 항목으로도 접근 가능

### 11.2 지원 에셋 타입

| 타입 | 확장자 | 뷰어 |
|------|--------|------|
| FBX | `.fbx` | Three.js FBXLoader (FbxViewer 컴포넌트) |
| Prefab | `.prefab` | SceneViewer (YAML 파싱 + 3D) |
| Scene | `.unity` | SceneViewer (bake-scene 기반) |
| C# | `.cs` | 코드 뷰어 (Syntax Highlight) |
| Texture | `.png`, `.jpg`, `.tga` | 이미지 뷰어 |
| Animation | `.anim` | 텍스트 뷰어 |
| Material | `.mat` | 텍스트 뷰어 |

### 11.3 에셋 API

```
GET /api/assets/browse?path=GameContents
→ { dirs: [{name, path, count}], files: [{name, path, size, modified}] }

GET /api/assets/file?path=GameContents/Character/Player.fbx
→ 바이너리 파일 직접 서빙
```

---

## 12. SceneMeshExporter.cs — 원본 참조

`C:\TableMaster\DBMLViewer\SceneMeshExporter.cs`는 Unity Editor에서 실행되는 원본 스크립트입니다.

### 12.1 핵심 데이터 구조

```csharp
class MeshObjectData {
  string name, path, layer, tag;
  TransformData transform;     // position, rotation, scale
  GeometryData geometry;       // vertices (월드좌표), triangles, uvs
  MaterialData material;       // color, mainTextureId, tiling, offset
}
```

### 12.2 bake-scene.mjs와의 대응

| SceneMeshExporter.cs | bake-scene.mjs |
|----------------------|----------------|
| `go.transform.localToWorldMatrix` | `getWorldTf()` + `applyWorldTf()` |
| `ltw.MultiplyPoint3x4(v)` | `applyWorldTf(localVerts, wt)` |
| `mesh.vertices` | `posAttr.getX/Y/Z(i)` |
| `mesh.triangles` | `geo.index.array` |
| `renderer.sharedMaterial.color` | `child.material.color` |
| `ExportSplitJsonFiles` | `writeFileSync(meshPath, ...)` |

### 12.3 bake-scene.mjs에 미구현된 항목

- ❌ NavMesh 추출 (`navmesh.json`)
- ❌ 텍스처 추출/임베딩 (`ExportTexturesToFiles`)
- ❌ Lightmap 지원
- ❌ UV 데이터 (현재 FBXLoader에서 추출 가능하나 미저장)
- ❌ Mesh Simplification (정점 수 제한)
- ❌ Collider 시각화
- ❌ Spawn Point / Capture Point 마커

---

## 13. 서버 시작 방법

### 13.1 일반 시작

```batch
C:\TableMaster\DBMLViewer\start.bat
```

이 스크립트는:
1. 바이블테이블링 서버 (포트 8100) 시작
2. TableMaster 웹 서버 (포트 5173) 시작
3. 서버 종료 시 재시작 옵션 제공

### 13.2 새 컴퓨터에서 환경 설정

```bash
# 1. Node.js 설치 (v18+)
# 2. Python 3.10+ 설치 (바이블테이블링용)

# 3. 프론트엔드 의존성
cd C:\TableMaster\DBMLViewer\erd-app
npm install

# 4. Python 의존성
cd bible-tabling
pip install -r requirements.txt

# 5. .env 파일 설정
# erd-app/.env 에 CLAUDE_API_KEY, GITLAB_TOKEN 등 설정

# 6. 빌드
cd ..
npm run build

# 7. 시작
cd ..
start.bat
```

### 13.3 Unity 프로젝트 경로

베이크 스크립트는 아래 경로에 Unity 프로젝트가 있다고 가정합니다:

```
C:\TableMaster\unity_project\Client\Project_Aegis\Assets\
```

경로가 다를 경우 `bake-scene.mjs`의 `ASSETS_DIR` 수정 필요.

---

## 14. 알려진 이슈 및 제한사항

### 14.1 메시 수가 적은 씬

일부 씬에서 실제보다 메시 수가 적게 나오는 원인:

1. **PrefabInstance의 중첩 Prefab 해석 깊이 제한** (`depth > 6`)
2. **MeshFilter 없는 오브젝트** — SkinnedMeshRenderer, ProBuilder 등은 미지원
3. **GUID 해석 실패** — .meta 파일이 없거나 FBX가 아닌 에셋 참조
4. **FBX 로드 실패** — Node.js 폴리필 한계로 일부 FBX 파싱 실패

### 14.2 Node.js FBXLoader 제한

- 텍스처 로딩 불가 (Image 폴리필은 no-op)
- Skinned Mesh 미지원
- 일부 FBX 버전/형식에서 파싱 오류 가능

### 14.3 좌표계 관련

- Unity Y-up 왼손 → Three.js Y-up 오른손 변환 시 Z축 부호 반전이 핵심
- FBXLoader 내부의 좌표 보정과 Unity 월드 변환이 이중 적용되지 않도록 주의

### 14.4 캐시 관련

- `source: "server-bake"` 캐시는 구버전으로 대부분 불완전
- 캐시 삭제 후 재베이크: 해당 `scene-cache/<이름>/` 폴더 삭제 후 웹에서 ⚡ 버튼
- 0 메시 캐시는 SceneViewer가 자동 재베이크 시도

---

## 15. 트러블슈팅 가이드

### "0 메시 렌더링됨"

1. `scene-cache/<씬이름>/scene_info.json` 확인 → `meshCount`, `source` 확인
2. `source: "server-bake"`이면 구버전 → `--force`로 재베이크
3. PowerShell에서 직접 실행해 stderr 확인:
   ```powershell
   cd C:\TableMaster\DBMLViewer\erd-app
   node scripts\bake-scene.mjs --path "씬경로.unity" --force 2>&1
   ```

### "서버 연결 중..." 멈춤

- 서버가 5173 포트에서 실행 중인지 확인
- 5174 등 다른 포트에서 실행되고 있을 수 있음 (포트 충돌)
- `netstat -ano | findstr ":5173 "` 로 확인

### "씬 파일 없음" 오류

- `scenePath`가 Unity Assets 기준 상대 경로인지 확인
- 예: `GameContents/Map/OldTown.unity` (✅)
- 예: `C:\...\Assets\GameContents\Map\OldTown.unity` (❌ 절대 경로 불가)

### EventSource MIME type 오류

```
EventSource's response has a MIME type ("application/json") 
that is not "text/event-stream". Aborting the connection.
```
→ 서버가 SSE 대신 JSON을 반환하고 있음. 빌드가 최신인지 확인 (`npm run build`)

### FBX 로드 실패 (Node.js)

stderr에 다음 오류가 나타나면:
- `Cannot read properties of undefined (reading 'Vector3')` → `global.THREE = THREE` 누락
- `navigator ... only a getter` → `Object.defineProperty` 사용 필요
- `image.addEventListener is not a function` → Image 폴리필 누락

---

## 부록: 의존성

### npm 패키지 (erd-app)

```
three                    → FBXLoader, BufferGeometry, MeshPhongMaterial
three/examples/jsm/...   → FBXLoader, OrbitControls, TGALoader
react, react-dom         → UI
vite                     → 빌드/서버
```

### 시스템 요구사항

- Node.js v18+ (v24에서 navigator getter-only 이슈 대응 완료)
- Windows 10+ (배치 파일 기준)
- Unity 프로젝트 로컬 체크아웃 필요 (`C:\TableMaster\unity_project\...`)

---

*이 문서는 TableMaster 프로젝트의 Unity Scene/Level Viewer 시스템 전체에 대한 인수인계 문서입니다.*
