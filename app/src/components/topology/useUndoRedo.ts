import { useCallback, useRef, useState } from 'react'
import type { Node, Edge } from '@xyflow/react'

export interface Snapshot {
    nodes: Node[]
    edges: Edge[]
}

const clone = (s: Snapshot): Snapshot => ({
    nodes: JSON.parse(JSON.stringify(s.nodes)),
    edges: JSON.parse(JSON.stringify(s.edges)),
})

/** تاريخ بسيط للتراجع/الإعادة: خُد snapshot قبل أي تعديل مهم. */
export function useUndoRedo() {
    const past = useRef<Snapshot[]>([])
    const future = useRef<Snapshot[]>([])
    const [history, setHistory] = useState({ past: 0, future: 0 })
    const syncHistory = () => setHistory({ past: past.current.length, future: future.current.length })

    const takeSnapshot = useCallback((current: Snapshot) => {
        past.current.push(clone(current))
        if (past.current.length > 100) past.current.shift()
        future.current = []
        syncHistory()
    }, [])

    const undo = useCallback((current: Snapshot): Snapshot | null => {
        const prev = past.current.pop()
        if (!prev) return null
        future.current.push(clone(current))
        syncHistory()
        return prev
    }, [])

    const redo = useCallback((current: Snapshot): Snapshot | null => {
        const next = future.current.pop()
        if (!next) return null
        past.current.push(clone(current))
        syncHistory()
        return next
    }, [])

    return {
        takeSnapshot,
        undo,
        redo,
        canUndo: history.past > 0,
        canRedo: history.future > 0,
    }
}
