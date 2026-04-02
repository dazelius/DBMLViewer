// Quick FBX test
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

global.document = {
  createElementNS: (_, tag) => tag === 'canvas' ? { getContext: () => null, width: 0, height: 0, style: {} } : { style: {} },
  createElement: (tag) => tag === 'canvas' ? { getContext: () => null, width: 0, height: 0 } : { style: {} },
}
global.window = global; global.self = global
try { Object.defineProperty(global, 'navigator', { value: { userAgent: 'node.js' }, configurable: true, writable: true }) } catch {}

const { default: THREE } = await import('three')
global.THREE = THREE
const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js')

// Find a real FBX file
const ASSETS = 'C:/TableMaster/unity_project/Client/Project_Aegis/Assets'
const fbxPath = ASSETS + "/DevAssets(not packed)/_DevArt/Reference/ExtreamObjectExport/00_Baltic/Baltic_Garbage_Bag_Baltic_Garbage_Bag.FBX"
console.log('Testing FBX:', fbxPath)

const buf = readFileSync(fbxPath)
const loader = new FBXLoader()
const group = loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '')
group.updateMatrixWorld(true)

let meshCount = 0
group.traverse(c => {
  console.log(`  obj: ${c.type} | name: ${c.name} | isMesh: ${c.isMesh} | hasGeo: ${!!c.geometry}`)
  if (c.isMesh) {
    meshCount++
    const cnt = c.geometry?.attributes?.position?.count ?? 0
    console.log(`    --> verts: ${cnt}`)
  }
})
console.log('Total meshes:', meshCount)
console.log('Group type:', group.type, 'children:', group.children.length)
