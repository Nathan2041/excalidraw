import { useCallback, useRef } from "react"
import { Excalidraw, mutateElement } from "@excalidraw/excalidraw"
import type { ExcalidrawImperativeAPI, AppState, BinaryFiles } from "@excalidraw/excalidraw/types"
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import { match } from "ts-pattern"

import "@excalidraw/excalidraw/index.css"

const NEAT_ROUGHNESS: number = 0

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

export default function App(): JSX.Element {
  let excalidrawAPI = useRef<ExcalidrawImperativeAPI | null>(null)
  let isUpdating = useRef<boolean>(false)

  let handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], _appState: AppState, _files: BinaryFiles): void => {
      if (isUpdating.current) { return }
      if (excalidrawAPI.current == null) { return }

      let dirtyElements: ExcalidrawElement[] = (elements as ExcalidrawElement[]).filter(
        (el) => shouldNeatify(el) && (el as any).roughness !== NEAT_ROUGHNESS,
      )

      if (dirtyElements.length === 0) { return }

      isUpdating.current = true
      for (let element of dirtyElements) {
        mutateElement(element, { roughness: NEAT_ROUGHNESS }, false)
      }
      isUpdating.current = false
    },
    [],
  )

  let setAPI = useCallback((api: ExcalidrawImperativeAPI): void => {
    excalidrawAPI.current = api
  }, [])

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Excalidraw
        excalidrawAPI={setAPI}
        onChange={handleChange}
        initialData={{
          appState: {
            currentItemRoughness: NEAT_ROUGHNESS,
          },
        }}
      />
    </div>
  )
}
