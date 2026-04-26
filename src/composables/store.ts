import {
  File,
  mergeImportMap,
  compileFile as originalCompileFile,
  useStore as useReplStore,
  type ImportMap,
  type Store as ReplStore,
  type StoreState,
} from '@vue/repl'
import { objectOmit } from '@vueuse/core'
import { IS_DEV } from '@/constants'
import {
  genCdnLink,
  genCompilerSfcLink,
  genImportMap,
} from '@/utils/dependency'
import { atou, utoa } from '@/utils/encode'
import mainCode from '../template/main.vue?raw'
import tsconfigCode from '../template/tsconfig.json?raw'
import welcomeCode from '../template/welcome.vue?raw'
import xCode from '../template/x.js?raw'

export interface Initial {
  serializedState?: string
  initialized?: () => void
}
export type VersionKey = 'vue' | 'antdvNextX' | 'typescript'
export type Versions = Record<VersionKey, string>
export interface UserOptions {
  styleSource?: string
  showHidden?: boolean
  vueVersion?: string
  tsVersion?: string
  xVersion?: string
  antdvVersion?: string
  vuePr?: string
}
export type SerializeState = Record<string, string> & {
  _o?: UserOptions
}

const MAIN_FILE = 'src/PlaygroundMain.vue'
const APP_FILE = 'src/App.vue'
const X_FILE = 'src/x.js'
const LEGACY_IMPORT_MAP = 'src/import_map.json'
export const IMPORT_MAP = 'import-map.json'
export const TSCONFIG = 'tsconfig.json'

export const useStore = (initial: Initial) => {
  const saved: SerializeState | undefined = initial.serializedState
    ? deserialize(initial.serializedState)
    : undefined
  const pr =
    new URLSearchParams(location.search).get('pr') ||
    saved?._o?.styleSource?.match(/@antdv-next\/x@([^/]+)/)?.[1]
  const prUrl = `https://raw.esm.sh/pr/@antdv-next/x@${pr}/dist`
  const vuePr =
    new URLSearchParams(location.search).get('vue') || saved?._o?.vuePr
  const vuePrUrl = `https://esm.sh/pr`

  const versions = reactive<Versions>({
    vue: saved?._o?.vueVersion ?? 'latest',
    antdvNextX: pr ? 'preview' : (saved?._o?.xVersion ?? 'latest'),
    typescript: saved?._o?.tsVersion ?? 'latest',
  })
  const userOptions: UserOptions = {}
  if (pr) {
    Object.assign(userOptions, {
      showHidden: true,
    })
  }
  if (vuePr) {
    Object.assign(userOptions, {
      vuePr,
    })
  }
  Object.assign(userOptions, {
    vueVersion: saved?._o?.vueVersion,
    tsVersion: saved?._o?.tsVersion,
    xVersion: saved?._o?.xVersion ?? saved?._o?.antdvVersion,
    styleSource: saved?._o?.styleSource,
  })
  const hideFile = !IS_DEV && !userOptions.showHidden

  if (pr) useWorker(pr)
  const builtinImportMap = computed<ImportMap>(() => {
    let importMap = genImportMap(versions)
    if (pr)
      importMap = mergeImportMap(importMap, {
        imports: {
          '@antdv-next/x': `${prUrl}/index.esm.js`,
          '@antdv-next/x/': `https://raw.esm.sh/pr/@antdv-next/x@${pr}/`,
        },
      })

    if (vuePr)
      importMap = mergeImportMap(importMap, {
        imports: {
          vue: `${vuePrUrl}/vue@${vuePr}`,
          '@vue/shared': `${vuePrUrl}/@vue/shared@${vuePr}`,
        },
      })

    return importMap
  })

  const storeState: Partial<StoreState> = toRefs(
    reactive({
      files: initFiles(),
      mainFile: MAIN_FILE,
      activeFilename: APP_FILE,
      vueVersion: computed(() => versions.vue),
      typescriptVersion: versions.typescript,
      builtinImportMap,
      template: {
        welcomeSFC: mainCode,
      },
      sfcOptions: {
        script: {
          propsDestructure: true,
        },
      },
    }),
  )
  const store = useReplStore(storeState)
  store.files[X_FILE].hidden = hideFile
  store.files[MAIN_FILE].hidden = hideFile
  setVueVersion(versions.vue).then(() => {
    initial.initialized?.()
  })

  watch(
    () => versions.antdvNextX,
    (version) => {
      store.files[X_FILE].code = generateXCode(
        version,
        userOptions.styleSource,
      ).trim()
      compileFile(store, store.files[X_FILE]).then(
        (errs) => (store.errors = errs),
      )
    },
  )
  watch(
    builtinImportMap,
    (newBuiltinImportMap) => {
      const importMap = JSON.parse(store.files[IMPORT_MAP].code)
      store.files[IMPORT_MAP].code = JSON.stringify(
        mergeImportMap(importMap, newBuiltinImportMap),
        undefined,
        2,
      )
    },
    { deep: true },
  )

  function init() {
    watchEffect(() => {
      compileFile(store, store.activeFile).then((errs) => (store.errors = errs))
    })
    for (const [filename, file] of Object.entries(store.files)) {
      if (filename === store.activeFilename) continue
      compileFile(store, file).then((errs) => store.errors.push(...errs))
    }

    watch(
      () => [
        store.files[TSCONFIG]?.code,
        store.typescriptVersion,
        store.locale,
        store.dependencyVersion,
        store.vueVersion,
      ],
      useDebounceFn(() => store.reloadLanguageTools?.(), 300),
      { deep: true },
    )
  }
  function serialize() {
    const state: SerializeState = { ...store.getFiles() }
    state._o = userOptions
    return utoa(JSON.stringify(state))
  }
  function deserialize(text: string): SerializeState {
    const state = JSON.parse(atou(text))
    return state
  }
  function initFiles() {
    const files: Record<string, File> = Object.create(null)
    if (saved) {
      for (let [filename, file] of Object.entries(objectOmit(saved, ['_o']))) {
        if (
          ![IMPORT_MAP, TSCONFIG].includes(filename) &&
          !filename.startsWith('src/')
        ) {
          filename = `src/${filename}`
        }
        if (filename === LEGACY_IMPORT_MAP) {
          filename = IMPORT_MAP
        }
        if (filename === 'src/antdv-next.js') {
          filename = X_FILE
        }
        files[filename] = new File(filename, file as string)
      }
    } else {
      files[APP_FILE] = new File(APP_FILE, welcomeCode)
    }
    if (!files[X_FILE]) {
      files[X_FILE] = new File(
        X_FILE,
        generateXCode(versions.antdvNextX, userOptions.styleSource),
      )
    }
    if (!files[TSCONFIG]) {
      files[TSCONFIG] = new File(TSCONFIG, tsconfigCode)
    }
    return files
  }
  async function setVueVersion(version: string) {
    store.compiler = await import(
      /* @vite-ignore */ genCompilerSfcLink(version)
    )
    versions.vue = version
  }
  async function setVersion(key: VersionKey, version: string) {
    switch (key) {
      case 'vue':
        userOptions.vueVersion = version
        await setVueVersion(version)
        break
      case 'antdvNextX':
        versions.antdvNextX = version
        userOptions.xVersion = version
        break
      case 'typescript':
        store.typescriptVersion = version
        userOptions.tsVersion = version
        break
    }
  }
  const resetFiles = () => {
    const { files, addFile } = store

    const isRandomFile = (filename: string) =>
      ![MAIN_FILE, TSCONFIG, IMPORT_MAP, X_FILE].includes(filename)
    for (const filename of Object.keys(files))
      if (isRandomFile(filename)) delete files[filename]

    const appFile = new File(APP_FILE, welcomeCode, false)
    addFile(appFile)
  }

  const utils = {
    versions,
    pr,
    setVersion,
    serialize,
    init,
    vuePr,
    resetFiles,
  }
  Object.assign(store, utils)

  return store as typeof store & typeof utils
}

function replaceCssImports(code: string, importMap: ImportMap, forSSR = false) {
  let result = ''
  let lastIndex = 0
  const cssImportRE = /import\s+(['"])([^'"]+\.css)\1;?/g

  for (const match of code.matchAll(cssImportRE)) {
    const [statement, , specifier] = match
    const index = match.index ?? 0
    result += code.slice(lastIndex, index)
    lastIndex = index + statement.length

    if (forSSR) continue

    const href = resolveImport(specifier, importMap)
    result += `await new Promise((resolve, reject) => {
  const href = ${JSON.stringify(href)}
  if ([...document.querySelectorAll('link[data-repl-css]')].some((link) => link.dataset.replCss === href)) return resolve(undefined)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.dataset.replCss = href
  link.addEventListener('load', resolve)
  link.addEventListener('error', reject)
  document.head.append(link)
});`
  }

  return result + code.slice(lastIndex)
}

function resolveImport(specifier: string, importMap: ImportMap) {
  const imports = importMap.imports ?? {}
  const match = Object.keys(imports).reduce<string | undefined>(
    (matched, key) => {
      if (
        key !== specifier &&
        (!key.endsWith('/') || !specifier.startsWith(key))
      ) {
        return matched
      }

      return !matched || key.length > matched.length ? key : matched
    },
    undefined,
  )

  if (!match) return specifier

  const value = imports[match]
  if (!value) return specifier

  return match.endsWith('/') ? value + specifier.slice(match.length) : value
}

async function compileFile(store: ReplStore, file: File) {
  const errors = await originalCompileFile(store, file)
  const importMap = store.getImportMap()

  file.compiled.js = replaceCssImports(file.compiled.js, importMap)
  file.compiled.ssr = replaceCssImports(file.compiled.ssr, importMap, true)

  return errors
}

function generateXCode(_version: string, styleSource?: string) {
  const style = styleSource
    ? styleSource.replace('#VERSION#', 'latest')
    : genCdnLink('antdv-next', 'latest', '/dist/antd.css')
  const resetStyle = genCdnLink('antdv-next', 'latest', '/dist/reset.css')
  return xCode.replace('#STYLE#', style).replace('#RESETSTYLE#', resetStyle)
}

function useWorker(pr: string) {
  const _worker = globalThis.Worker
  globalThis.Worker = class extends _worker {
    constructor(url: URL | string, options?: WorkerOptions) {
      if (typeof url === 'string' && url.includes('vue.worker')) {
        url = `${url}?pr=${pr}`
      }
      super(url, options)
    }
  }
}

export type Store = ReturnType<typeof useStore>
