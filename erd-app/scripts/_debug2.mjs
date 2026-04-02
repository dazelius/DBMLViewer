// Debug: test FBX loading in same context as bake-scene.mjs
import { readFileSync } from 'fs'

// Same polyfills as bake-scene.mjs
if (typeof global.document === 'undefined') {
  global.document = {
    createElementNS: (_, tag) => tag === 'canvas' ? { getContext: () => null, width: 0, height: 0, style: {} } : { style: {} },
    createElement:   (tag) => tag === 'canvas' ? { getContext: () => null, width: 0, height: 0 } : { style: {} },
  }
}
if (typeof global.window === 'undefined') global.window = global
if (typeof global.self   === 'undefined') global.self   = global
try {
  Object.defineProperty(global, 'navigator', {
    value: { userAgent: 'node.js', platform: 'node' },
    configurable: true, writable: true,
  })
} catch {}

const { default: THREE } = await import('three')
global.THREE = THREE
const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js')

const fbxPath = 'C:/TableMaster/unity_project/Client/Project_Aegis/Assets/DevAssets(not packed)/_DevArt/Reference/ExtreamObjectExport/00_Baltic/Baltic_Garbage_Bag_Baltic_Garbage_Bag.FBX'

console.log('Testing FBX loading...')
try {
  const buf = readFileSync(fbxPath)
  const loader = new FBXLoader()
  const group = loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '')
  group.updateMatrixWorld(true)
  let cnt = 0
  group.traverse(c => { if (c.isMesh) cnt++ })
  console.log('SUCCESS: meshes =', cnt)
} catch (e) {
  console.log('FAIL:', e.message)
}

// Also test a failing one
const failPath = 'C:/TableMaster/unity_project/Client/Project_Aegis/Assets/DevAssets(not packed)/_DevArt/Reference/ExtreamObjectExport/00_Baltic/SM_Baltic_WindowBars_K.FBX'
console.log('\nTesting failing FBX...')
try {
  const buf = readFileSync(failPath)
  const loader = new FBXLoader()
  const group = loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '')
  group.updateMatrixWorld(true)
  let cnt = 0
  group.traverse(c => { if (c.isMesh) cnt++ })
  console.log('SUCCESS: meshes =', cnt)
} catch (e) {
  console.log('FAIL:', e.message)
  console.log('Stack:', e.stack?.split('\n').slice(0,3).join('\n'))
}
