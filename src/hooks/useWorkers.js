import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function useWorkers() {
  const [workers, setWorkers] = useState([])
  const [intersections, setIntersections] = useState([])
  const [selectedIntersection, setSelectedIntersection] = useState(null)
  const [loading, setLoading] = useState(true)

  // Cargar cruces al montar
  useEffect(() => {
    async function loadIntersections() {
      const { data } = await supabase.from('traffic_intersections').select('*')
      if (data?.length) {
        setIntersections(data)
        setSelectedIntersection(data[0])
      }
    }
    loadIntersections()
  }, [])

  // Cargar trabajadores cuando cambia el cruce
  useEffect(() => {
    if (!selectedIntersection) return
    async function loadWorkers() {
      setLoading(true)
      const { data } = await supabase
        .from('street_workers')
        .select('*, traffic_intersections(name, district, hazard_level)')
        .eq('intersection_id', selectedIntersection.id)
      setWorkers(data || [])
      setLoading(false)
    }
    loadWorkers()
  }, [selectedIntersection])

  // Agregar trabajador al estado local sin recargar
  const addWorker = (newWorker, intersectionObj) => {
    setWorkers(prev => [...prev, {
      ...newWorker,
      traffic_intersections: intersectionObj,
    }])
  }

  return {
    workers,
    intersections,
    selectedIntersection,
    setSelectedIntersection,
    loading,
    addWorker,
  }
}