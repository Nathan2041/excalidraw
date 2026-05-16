import { useCallback, useRef } from "react"
import { Excalidraw, mutateElement, serializeAsJSON, loadFromBlob } from "@excalidraw/excalidraw"
import type { ExcalidrawImperativeAPI, AppState, BinaryFiles } from "@excalidraw/excalidraw/types"
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import { match } from "ts-pattern"

import "@excalidraw/excalidraw/index.css"

const NEAT_ROUGHNESS: number = 0
const STORAGE_KEY_THEME: string = "excalidraw-theme"
const STORAGE_KEY_DRAWING: string = "excalidraw-drawing"

type Theme = "light" | "dark"

function shouldNeatify(element: ExcalidrawElement): boolean {
  if (element.isDeleted) { return false }

  return match(element.type)
    .with("rectangle", () => true)
    .with("ellipse", () => true)
    .with("diamond", () => true)
    .with("line", () => true)
    .with("arrow", () => true)
    .with("freedraw", () => true)
    .otherwise(() => false)
}

function loadTheme(): Theme {
  let stored: string | null = localStorage.getItem(STORAGE_KEY_THEME)
  if (stored === "dark" || stored === "light") { return stored }
  return "light"
}

function loadInitialData(): object | null {
  let stored: string | null = localStorage.getItem(STORAGE_KEY_DRAWING)
  if (stored == null) { return null }
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export default function App(): JSX.Element {
  let excalidrawAPI = useRef<ExcalidrawImperativeAPI | null>(null)
  let isUpdating = useRef<boolean>(false)
  let saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  let handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles): void => {
      if (isUpdating.current) { return }
      if (excalidrawAPI.current == null) { return }

      let dirtyElements: ExcalidrawElement[] = (elements as ExcalidrawElement[]).filter(
        (el) => shouldNeatify(el) && (el as any).roughness !== NEAT_ROUGHNESS,
      )

      if (dirtyElements.length > 0) {
        isUpdating.current = true
        for (let element of dirtyElements) {
          mutateElement(element, { roughness: NEAT_ROUGHNESS }, false)
        }
        isUpdating.current = false
      }

      // Persist theme immediately (cheap)
      let theme: Theme = appState.theme === "dark" ? "dark" : "light"
      localStorage.setItem(STORAGE_KEY_THEME, theme)

      // Debounce drawing save (can be large)
      if (saveTimeout.current != null) { clearTimeout(saveTimeout.current) }
      saveTimeout.current = setTimeout(() => {
        if (excalidrawAPI.current == null) { return }
        let json: string = serializeAsJSON(
          elements as ExcalidrawElement[],
          appState,
          files,
          "local",
        )
        localStorage.setItem(STORAGE_KEY_DRAWING, json)
      }, 300)
    },
    [],
  )

  let setAPI = useCallback((api: ExcalidrawImperativeAPI): void => {
    excalidrawAPI.current = api
  }, [])

  let savedData: object | null = loadInitialData()
  let savedTheme: Theme = loadTheme()

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Excalidraw
        excalidrawAPI={setAPI}
        onChange={handleChange}
        initialData={{
          ...(savedData ?? {}),
          appState: {
            ...((savedData as any)?.appState ?? {}),
            currentItemRoughness: NEAT_ROUGHNESS,
            theme: savedTheme,
          },
        }}
      />
    </div>
  )
}