// Debug bake script - check why meshes are 0
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ERD_APP_DIR = join(__dirname, '..')
const ASSETS_DIR  = join(ERD_APP_DIR, '..', '..', 'unity_project', 'Client', 'Project_Aegis', 'Assets')

// Load GUID index (simplified - just check count)
import { readdirSync, statSync } from 'fs'
const guidIndex = new Map()
let metaCount = 0
const walkMeta = (dir, depth = 0) => {
  if (depth > 6) return
  try {
    for (const f of readdirSync(dir)) {
      const fp = join(dir, f)
      try {
        if (statSync(fp).isDirectory()) { walkMeta(fp, depth + 1); continue }
        if (!f.endsWith('.meta')) continue
        metaCount++
        const content = readFileSync(fp, 'utf-8')
        const m = content.match(/^guid:\s*([a-f0-9]+)/m)
        if (m) guidIndex.set(m[1], fp.replace(/\.meta$/, ''))
      } catch {}
    }
  } catch {}
}
console.log('Building GUID index...')
walkMeta(ASSETS_DIR)
console.log(`GUID index: ${guidIndex.size} entries from ${metaCount} meta files`)

// Test specific GUID
const testGuid = '19efb3166dbc0f74292851c95f174d9c'
const testPath = guidIndex.get(testGuid)
console.log(`Test GUID ${testGuid} → ${testPath}`)
console.log(`Exists: ${testPath ? existsSync(testPath) : 'N/A'}`)
console.log(`Is FBX: ${testPath ? /\.fbx$/i.test(testPath) : 'N/A'}`)

// Parse scene transforms
const scenePath = join(ASSETS_DIR, 'GameContents', 'Map', 'Erangel_01', 'tdm_erangel_02_shantytown.unity')
const sceneYaml = readFileSync(scenePath, 'utf-8')

// Check line endings
const hasCRLF = sceneYaml.includes('\r\n')
console.log(`\nScene file line endings: ${hasCRLF ? 'CRLF' : 'LF'}`)

// Count transform blocks
const tfMatches = [...sceneYaml.matchAll(/--- !u!4 &(\d+)/g)]
console.log(`Transform blocks (--- !u!4): ${tfMatches.length}`)

// Count MeshFilter blocks
const mfMatches = [...sceneYaml.matchAll(/--- !u!33 &(\d+)/g)]
console.log(`MeshFilter blocks (--- !u!33): ${mfMatches.length}`)

// Count PrefabInstance blocks
const piMatches = [...sceneYaml.matchAll(/--- !u!1001 &(\d+)/g)]
console.log(`PrefabInstance blocks (--- !u!1001): ${piMatches.length}`)

// Try parsing transforms with CRLF awareness
const tfMap = {}
let tfParsed = 0
for (const m of sceneYaml.matchAll(/--- !u!4 &(\d+)\r?\n([\s\S]*?)(?=\r?\n--- |\r?\n$|$)/g)) {
  const id = m[1]; const blk = m[2]
  const goM = blk.match(/m_GameObject:\s*\{.*?fileID:\s*(\d+)/)
  if (goM) { tfMap[id] = { id, goId: goM[1] }; tfParsed++ }
}
console.log(`Transforms parsed: ${tfParsed}`)

// Try parsing MeshFilters
let mfWithFbx = 0, mfSkipped = 0
for (const m of sceneYaml.matchAll(/--- !u!33 &(\d+)\r?\n([\s\S]*?)(?=\r?\n--- |\r?\n$|$)/g)) {
  const blk = m[2]
  const goM = blk.match(/m_GameObject:\s*\{.*?fileID:\s*(\d+)/)
  const mgM = blk.match(/m_Mesh:\s*\{.*?guid:\s*([a-f0-9]+)/)
  if (!goM || !mgM) { mfSkipped++; continue }
  const tfId = Object.keys(tfMap).find(k => tfMap[k].goId === goM[1])
  if (!tfId) { mfSkipped++; continue }
  const fbxAbs = guidIndex.get(mgM[1])
  if (fbxAbs && /\.fbx$/i.test(fbxAbs)) mfWithFbx++
}
console.log(`MeshFilters with FBX: ${mfWithFbx}, skipped: ${mfSkipped}`)

// Check first PrefabInstance
const piBlock = [...sceneYaml.matchAll(/--- !u!1001 &(\d+)\r?\n([\s\S]*?)(?=\r?\n--- |\r?\n$|$)/g)][0]
if (piBlock) {
  const blk = piBlock[2]
  const spM = blk.match(/m_SourcePrefab:\s*\{.*?guid:\s*([a-f0-9]+)/)
  if (spM) {
    const prefabGuid = spM[1]
    const prefabPath = guidIndex.get(prefabGuid)
    console.log(`\nFirst PrefabInstance GUID: ${prefabGuid}`)
    console.log(`Prefab path: ${prefabPath}`)
    console.log(`Exists: ${prefabPath ? existsSync(prefabPath) : 'N/A'}`)
  }
}
