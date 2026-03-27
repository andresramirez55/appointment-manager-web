import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { consultoriosApi, type Consultorio } from '../api/client'

interface ConsultorioContextType {
  consultorios: Consultorio[]
  selected: Consultorio | null
  setSelected: (c: Consultorio) => void
  reload: () => void
}

const ConsultorioContext = createContext<ConsultorioContextType>({
  consultorios: [],
  selected: null,
  setSelected: () => {},
  reload: () => {},
})

export function ConsultorioProvider({ children }: { children: ReactNode }) {
  const [consultorios, setConsultorios] = useState<Consultorio[]>([])
  const [selected, setSelectedState] = useState<Consultorio | null>(null)

  function load() {
    consultoriosApi.getAll().then((data) => {
      setConsultorios(data)
      const savedId = localStorage.getItem('consultorio_id')
      const found = savedId ? data.find((c) => c.id === Number(savedId)) : null
      setSelectedState(found ?? data[0] ?? null)
    }).catch(() => {})
  }

  useEffect(() => { load() }, [])

  function setSelected(c: Consultorio) {
    setSelectedState(c)
    localStorage.setItem('consultorio_id', String(c.id))
  }

  return (
    <ConsultorioContext.Provider value={{ consultorios, selected, setSelected, reload: load }}>
      {children}
    </ConsultorioContext.Provider>
  )
}

export function useConsultorio() {
  return useContext(ConsultorioContext)
}
