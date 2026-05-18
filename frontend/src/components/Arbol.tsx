import React, { useEffect, useState, useRef, useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import { getPersonas, getPersonaById } from '../api/personas';
import type { Persona } from '../api/personas';
import { DetallesPersona } from './detalles_persona'; // Importación del modal

// ----------------------------------------------------------------------
// Tipos y constantes
// ----------------------------------------------------------------------
interface NodoArbol {
  persona: Persona;
  hijos: NodoArbol[];
}

interface Posicion {
  x: number;
  y: number;
}

const VERTICAL_SPACING = 140;
const CARD_WIDTH = 140;
const HORIZONTAL_GAP = 24;
const BLOCK_GAP = 48;
const RECT_HEIGHT = 30;

const COLOR_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#06B6D4', '#84CC16',
  '#F97316', '#14B8A6', '#0EA5E9', '#F43F5E', '#2563EB',
  '#059669', '#D97706', '#0891B2', '#65A30D', '#EA580C',
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getFotoUrl = (foto: string | undefined | null): string => {
  if (!foto) return '';
  if (foto.startsWith('http')) return foto;
  const baseSinApp = API_BASE.replace('/app', '');
  return `${baseSinApp}${foto}`;
};

const getColorFromKey = (key: string): string => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
};

const construirGrafo = (personas: Persona[]): Map<number, NodoArbol> => {
  const mapa = new Map<number, NodoArbol>();
  personas.forEach(p => mapa.set(p.id, { persona: p, hijos: [] }));
  personas.forEach(p => {
    const nodo = mapa.get(p.id)!;
    if (p.padre && mapa.has(p.padre)) mapa.get(p.padre)!.hijos.push(nodo);
    if (p.madre && mapa.has(p.madre)) mapa.get(p.madre)!.hijos.push(nodo);
  });
  return mapa;
};

const calcularNiveles = (mapa: Map<number, NodoArbol>): Map<number, number> => {
  const nivel = new Map<number, number>();
  for (const [id, nodo] of mapa) {
    const tienePadre = (nodo.persona.padre && mapa.has(nodo.persona.padre)) ||
                       (nodo.persona.madre && mapa.has(nodo.persona.madre));
    if (!tienePadre) nivel.set(id, 0);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const [id, nodo] of mapa) {
      if (nivel.has(id)) continue;
      let maxParentNivel = -1;
      if (nodo.persona.padre && mapa.has(nodo.persona.padre) && nivel.has(nodo.persona.padre))
        maxParentNivel = Math.max(maxParentNivel, nivel.get(nodo.persona.padre)!);
      if (nodo.persona.madre && mapa.has(nodo.persona.madre) && nivel.has(nodo.persona.madre))
        maxParentNivel = Math.max(maxParentNivel, nivel.get(nodo.persona.madre)!);
      if (maxParentNivel !== -1) {
        nivel.set(id, maxParentNivel + 1);
        changed = true;
      }
    }
  }
  for (const [id] of mapa) if (!nivel.has(id)) nivel.set(id, 0);
  // Ajustar parejas
  let parejasAjustadas = true;
  while (parejasAjustadas) {
    parejasAjustadas = false;
    for (const nodo of mapa.values()) {
      const pId = nodo.persona.padre, mId = nodo.persona.madre;
      if (pId && mId && mapa.has(pId) && mapa.has(mId)) {
        const maxNivel = Math.max(nivel.get(pId)!, nivel.get(mId)!);
        if (nivel.get(pId)! !== maxNivel) { nivel.set(pId, maxNivel); parejasAjustadas = true; }
        if (nivel.get(mId)! !== maxNivel) { nivel.set(mId, maxNivel); parejasAjustadas = true; }
      }
    }
  }
  changed = true;
  while (changed) {
    changed = false;
    for (const [id, nodo] of mapa) {
      let maxParentNivel = -1;
      if (nodo.persona.padre && mapa.has(nodo.persona.padre))
        maxParentNivel = Math.max(maxParentNivel, nivel.get(nodo.persona.padre)!);
      if (nodo.persona.madre && mapa.has(nodo.persona.madre))
        maxParentNivel = Math.max(maxParentNivel, nivel.get(nodo.persona.madre)!);
      const nuevoNivel = maxParentNivel + 1;
      if (maxParentNivel !== -1 && nivel.get(id) !== nuevoNivel) {
        nivel.set(id, nuevoNivel);
        changed = true;
      }
    }
  }
  return nivel;
};

interface Pareja { padreId: number; madreId: number; hijos: Persona[]; nivel: number; }
interface Bloque { tipo: 'pareja' | 'individual'; ids: number[]; hijos: Persona[]; xInicio: number; }

const obtenerParejasYSolteros = (personas: Persona[], nivelMap: Map<number, number>) => {
  const parejasMap = new Map<string, Pareja>();
  const involucrados = new Set<number>();
  personas.forEach(persona => {
    const pId = persona.padre, mId = persona.madre;
    if (pId && mId) {
      const key = `${Math.min(pId, mId)}-${Math.max(pId, mId)}`;
      if (!parejasMap.has(key)) {
        parejasMap.set(key, { padreId: pId, madreId: mId, hijos: [], nivel: Math.max(nivelMap.get(pId)!, nivelMap.get(mId)!) });
      }
      parejasMap.get(key)!.hijos.push(persona);
      involucrados.add(pId); involucrados.add(mId);
    }
  });
  const parejas = Array.from(parejasMap.values());
  const solteros = personas.map(p => p.id).filter(id => !involucrados.has(id));
  return { parejas, solteros };
};

const asignarPosicionesBase = (mapa: Map<number, NodoArbol>, nivelMap: Map<number, number>): Map<number, Posicion> => {
  const personasList = Array.from(mapa.values()).map(n => n.persona);
  const { parejas, solteros } = obtenerParejasYSolteros(personasList, nivelMap);
  const niveles = new Map<number, { parejas: Pareja[]; solteros: number[] }>();
  for (const pareja of parejas) {
    const nivel = pareja.nivel;
    if (!niveles.has(nivel)) niveles.set(nivel, { parejas: [], solteros: [] });
    niveles.get(nivel)!.parejas.push(pareja);
  }
  for (const soltero of solteros) {
    const nivel = nivelMap.get(soltero)!;
    if (!niveles.has(nivel)) niveles.set(nivel, { parejas: [], solteros: [] });
    niveles.get(nivel)!.solteros.push(soltero);
  }
  const finalPos = new Map<number, Posicion>();
  const deseadoX = new Map<number, number>();
  const nivelesOrdenados = Array.from(niveles.keys()).sort((a, b) => a - b);
  for (const nivel of nivelesOrdenados) {
    const { parejas: parejasNivel, solteros: solterosNivel } = niveles.get(nivel)!;
    const bloques: Bloque[] = [];
    for (const pareja of parejasNivel) bloques.push({ tipo: 'pareja', ids: [pareja.padreId, pareja.madreId], hijos: pareja.hijos, xInicio: 0 });
    for (const id of solterosNivel) bloques.push({ tipo: 'individual', ids: [id], hijos: [], xInicio: 0 });
    bloques.sort((a, b) => a.ids[0] - b.ids[0]);
    let currentX = 0;
    for (const bloque of bloques) {
      bloque.xInicio = currentX;
      const ancho = bloque.tipo === 'pareja' ? 2 * CARD_WIDTH + HORIZONTAL_GAP : CARD_WIDTH;
      currentX += ancho + BLOCK_GAP;
    }
    for (const bloque of bloques) {
      if (bloque.tipo === 'pareja') {
        const [padreId, madreId] = bloque.ids;
        const xPadre = bloque.xInicio;
        const xMadre = bloque.xInicio + CARD_WIDTH + HORIZONTAL_GAP;
        deseadoX.set(padreId, xPadre);
        deseadoX.set(madreId, xMadre);
        const centroBloque = xPadre + (2 * CARD_WIDTH + HORIZONTAL_GAP) / 2;
        for (const hijo of bloque.hijos) deseadoX.set(hijo.id, centroBloque);
      } else {
        deseadoX.set(bloque.ids[0], bloque.xInicio);
      }
    }
  }
  for (const [id, x] of deseadoX) finalPos.set(id, { x, y: nivelMap.get(id)! * VERTICAL_SPACING });
  return finalPos;
};

const centrarNodos = (
  posiciones: Map<number, Posicion>,
  mapa: Map<number, NodoArbol>,
  nivelMap: Map<number, number>
): Map<number, Posicion> => {
  let nuevasPos = new Map(posiciones);
  let cambiado = true;
  let iter = 0;
  const maxIter = 10;
  while (cambiado && iter < maxIter) {
    cambiado = false;
    iter++;
    const nivelesOrdenados = Array.from(new Set(Array.from(nivelMap.values()))).sort((a, b) => a - b);
    for (const nivel of nivelesOrdenados) {
      for (const [id, nodo] of mapa) {
        if (nivelMap.get(id) !== nivel) continue;
        const pId = nodo.persona.padre;
        const mId = nodo.persona.madre;
        let nuevaX = nuevasPos.get(id)!.x;
        if (pId && mId && mapa.has(pId) && mapa.has(mId)) {
          const xPadre = nuevasPos.get(pId)?.x;
          const xMadre = nuevasPos.get(mId)?.x;
          if (xPadre !== undefined && xMadre !== undefined) {
            const promedio = (xPadre + xMadre) / 2;
            if (Math.abs(nuevaX - promedio) > 0.1) {
              nuevaX = promedio;
              cambiado = true;
            }
          }
        } else if (pId && mapa.has(pId)) {
          const xPadre = nuevasPos.get(pId)?.x;
          if (xPadre !== undefined && Math.abs(nuevaX - xPadre) > 0.1) {
            nuevaX = xPadre;
            cambiado = true;
          }
        } else if (mId && mapa.has(mId)) {
          const xMadre = nuevasPos.get(mId)?.x;
          if (xMadre !== undefined && Math.abs(nuevaX - xMadre) > 0.1) {
            nuevaX = xMadre;
            cambiado = true;
          }
        }
        nuevasPos.set(id, { x: nuevaX, y: nuevasPos.get(id)!.y });
      }
    }
  }
  let minX = Infinity, maxX = -Infinity;
  for (const pos of nuevasPos.values()) {
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x);
  }
  const offsetX = -(minX + maxX) / 2;
  for (const [id, pos] of nuevasPos) {
    nuevasPos.set(id, { x: pos.x + offsetX, y: pos.y });
  }
  return nuevasPos;
};

const asignarPosicionesConBloques = (mapa: Map<number, NodoArbol>, nivelMap: Map<number, number>): Map<number, Posicion> => {
  const posBase = asignarPosicionesBase(mapa, nivelMap);
  const posCentradas = centrarNodos(posBase, mapa, nivelMap);
  return posCentradas;
};

// ----------------------------------------------------------------------
// Función auxiliar para normalizar IDs de padre/madre
// ----------------------------------------------------------------------
const normalizeId = (parent: any): number | null => {
  if (!parent) return null;
  if (typeof parent === 'object' && parent !== null) return parent.id;
  if (typeof parent === 'number') return parent;
  return null;
};

// ----------------------------------------------------------------------
// Función para obtener una persona y todos sus ancestros hasta abuelos
// ----------------------------------------------------------------------
const fetchPersonAndAncestors = async (personaId: number): Promise<Persona[]> => {
  const personasMap = new Map<number, Persona>();
  const idsToFetch = new Set<number>();
  idsToFetch.add(personaId);

  while (idsToFetch.size > 0) {
    const currentId = idsToFetch.values().next().value as number;
    idsToFetch.delete(currentId);
    if (personasMap.has(currentId)) continue;

    try {
      const persona = await getPersonaById(currentId);
      personasMap.set(currentId, persona);

      // Normalizar IDs de padre y madre
      const padreId = normalizeId(persona.padre);
      const madreId = normalizeId(persona.madre);

      if (padreId !== null) {
        if (!personasMap.has(padreId)) idsToFetch.add(padreId);
        const padre = await getPersonaById(padreId);
        const abueloPId = normalizeId(padre.padre);
        const abuelaPId = normalizeId(padre.madre);
        if (abueloPId !== null && !personasMap.has(abueloPId)) idsToFetch.add(abueloPId);
        if (abuelaPId !== null && !personasMap.has(abuelaPId)) idsToFetch.add(abuelaPId);
      }

      if (madreId !== null) {
        if (!personasMap.has(madreId)) idsToFetch.add(madreId);
        const madre = await getPersonaById(madreId);
        const abueloMId = normalizeId(madre.padre);
        const abuelaMId = normalizeId(madre.madre);
        if (abueloMId !== null && !personasMap.has(abueloMId)) idsToFetch.add(abueloMId);
        if (abuelaMId !== null && !personasMap.has(abuelaMId)) idsToFetch.add(abuelaMId);
      }
    } catch (error) {
      console.error(`Error fetching persona ${currentId}:`, error);
    }
  }
  return Array.from(personasMap.values());
};

// ----------------------------------------------------------------------
// Componente principal
// ----------------------------------------------------------------------
export const Arbol: React.FC = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [posiciones, setPosiciones] = useState<Map<number, Posicion> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const svgRef = useRef<SVGSVGElement | null>(null);
  const redrawTimeout = useRef<number | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Persona | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Cargar ancestros cuando se selecciona una persona
  useEffect(() => {
    if (!selectedPersonId) {
      setPersonas([]);
      setPosiciones(null);
      return;
    }
    const loadTree = async () => {
      setLoading(true);
      try {
        const ancestors = await fetchPersonAndAncestors(selectedPersonId);
        setPersonas(ancestors);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadTree();
  }, [selectedPersonId]);

  // Construir el árbol cuando cambian las personas
  useEffect(() => {
    if (personas.length === 0) {
      setPosiciones(null);
      return;
    }
    const grafo = construirGrafo(personas);
    const niveles = calcularNiveles(grafo);
    const pos = asignarPosicionesConBloques(grafo, niveles);
    setPosiciones(pos);
  }, [personas]);

  const drawLines = useCallback(() => {
    if (!posiciones || !containerRef.current) return;
    const svg = svgRef.current;
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const containerRect = containerRef.current.getBoundingClientRect();
    svg.setAttribute('width', `${containerRect.width}`);
    svg.setAttribute('height', `${containerRect.height}`);

    const gruposPadres = new Map<string, { padreId: number; madreId: number; hijos: Persona[] }>();
    personas.forEach(persona => {
      const pId = persona.padre, mId = persona.madre;
      if (pId && mId && cardRefs.current.has(pId) && cardRefs.current.has(mId)) {
        const key = `${Math.min(pId, mId)}-${Math.max(pId, mId)}`;
        if (!gruposPadres.has(key)) gruposPadres.set(key, { padreId: pId, madreId: mId, hijos: [] });
        gruposPadres.get(key)!.hijos.push(persona);
      }
    });

    for (const [key, grupo] of gruposPadres.entries()) {
      const padreDiv = cardRefs.current.get(grupo.padreId);
      const madreDiv = cardRefs.current.get(grupo.madreId);
      if (!padreDiv || !madreDiv) continue;
      const color = getColorFromKey(key);
      const padreRect = padreDiv.getBoundingClientRect();
      const madreRect = madreDiv.getBoundingClientRect();
      const padreX = padreRect.left + padreRect.width / 2 - containerRect.left;
      const madreX = madreRect.left + madreRect.width / 2 - containerRect.left;
      const padreY = padreRect.bottom - containerRect.top;
      const madreY = madreRect.bottom - containerRect.top;
      const topY = Math.min(padreY, madreY);
      const bottomY = topY + RECT_HEIGHT;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      path.setAttribute('points', `${padreX},${topY} ${madreX},${topY} ${madreX},${bottomY} ${padreX},${bottomY}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '2.5');
      svg.appendChild(path);
      const centroX = (padreX + madreX) / 2;
      for (const hijo of grupo.hijos) {
        const hijoDiv = cardRefs.current.get(hijo.id);
        if (!hijoDiv) continue;
        const hijoRect = hijoDiv.getBoundingClientRect();
        const hijoTopX = hijoRect.left + hijoRect.width / 2 - containerRect.left;
        const hijoTopY = hijoRect.top - containerRect.top;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', centroX.toString());
        line.setAttribute('y1', bottomY.toString());
        line.setAttribute('x2', hijoTopX.toString());
        line.setAttribute('y2', hijoTopY.toString());
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
      }
    }

    const grafo = construirGrafo(personas);
    for (const [id, nodo] of grafo.entries()) {
      const padreDiv = cardRefs.current.get(id);
      if (!padreDiv) continue;
      const padreRect = padreDiv.getBoundingClientRect();
      const padreCenterX = padreRect.left + padreRect.width / 2 - containerRect.left;
      const padreBottomY = padreRect.bottom - containerRect.top;
      for (const hijo of nodo.hijos) {
        const yaDibujado = Array.from(gruposPadres.values()).some(g =>
          g.hijos.some(h => h.id === hijo.persona.id) && (g.padreId === id || g.madreId === id)
        );
        if (yaDibujado) continue;
        const hijoDiv = cardRefs.current.get(hijo.persona.id);
        if (!hijoDiv) continue;
        const hijoRect = hijoDiv.getBoundingClientRect();
        const hijoCenterX = hijoRect.left + hijoRect.width / 2 - containerRect.left;
        const hijoTopY = hijoRect.top - containerRect.top;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', padreCenterX.toString());
        line.setAttribute('y1', padreBottomY.toString());
        line.setAttribute('x2', hijoCenterX.toString());
        line.setAttribute('y2', hijoTopY.toString());
        line.setAttribute('stroke', '#9CA3AF');
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
      }
    }
  }, [posiciones, personas]);

  const scheduleRedraw = useCallback(() => {
    if (redrawTimeout.current) clearTimeout(redrawTimeout.current);
    redrawTimeout.current = window.setTimeout(() => drawLines(), 80);
  }, [drawLines]);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => scheduleRedraw());
    resizeObserver.observe(containerRef.current);
    window.addEventListener('scroll', scheduleRedraw, true);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('scroll', scheduleRedraw, true);
      if (redrawTimeout.current) clearTimeout(redrawTimeout.current);
    };
  }, [scheduleRedraw]);

  useEffect(() => {
    if (!posiciones) return;
    requestAnimationFrame(() => drawLines());
  }, [posiciones, drawLines]);

  const setCardRef = (id: number, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(id, el);
      const img = el.querySelector('img');
      if (img && !img.complete) img.addEventListener('load', () => scheduleRedraw());
      else if (img && img.complete) scheduleRedraw();
    } else {
      cardRefs.current.delete(id);
    }
  };

  // Cargar opciones para AsyncSelect desde el servidor
  const loadOptions = async (inputValue: string) => {
    try {
      const result = await getPersonas(1, { search: inputValue });
      const options = (result.results || []).map((p: Persona) => ({
        value: p.id,
        label: `${p.nombre} ${p.apellido1 || ''} ${p.apellido2 || ''}`.trim(),
      }));
      return options;
    } catch (error) {
      console.error('Error buscando personas:', error);
      return [];
    }
  };

  const handlePersonChange = (option: { value: number; label: string } | null) => {
    setSelectedPersonId(option ? option.value : null);
  };

  const handleCardClick = (persona: Persona) => {
    setSelectedPerson(persona);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedPerson(null);
  };

  if (loading) return <div className="text-center py-8 text-white font-bold text-2xl">Cargando árbol...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

  return (
    <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow-xl p-6 overflow-auto">
      <h2 className="text-2xl font-bold text-green-800 mb-4 text-center">Árbol Genealógico</h2>
      <div className="mb-6 flex justify-center">
        <AsyncSelect
          className="w-80"
          loadOptions={loadOptions}
          onChange={handlePersonChange}
          placeholder="Buscar persona..."
          isClearable
          noOptionsMessage={() => "No se encontraron personas"}
          value={
            selectedPersonId && personas.find(p => p.id === selectedPersonId)
              ? {
                  value: selectedPersonId,
                  label: `${personas.find(p => p.id === selectedPersonId)!.nombre} ${
                    personas.find(p => p.id === selectedPersonId)!.apellido1 || ''
                  }`.trim(),
                }
              : null
          }
        />
      </div>

      {selectedPersonId === null && (
        <div className="text-center py-8 text-gray-600">Selecciona una persona para ver su árbol genealógico.</div>
      )}
      {selectedPersonId !== null && personas.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-600">No se encontraron ancestros (padres o abuelos) para esta persona.</div>
      )}
      {posiciones && posiciones.size > 0 && (
        (() => {
          let minX = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const pos of posiciones.values()) {
            minX = Math.min(minX, pos.x);
            maxX = Math.max(maxX, pos.x);
            maxY = Math.max(maxY, pos.y);
          }
          const treeWidth = maxX - minX;
          const totalWidth = treeWidth + CARD_WIDTH + 60;
          const totalHeight = maxY + VERTICAL_SPACING + 40;
          return (
            <div className="flex justify-center">
              <div ref={containerRef} className="relative" style={{ width: totalWidth, minHeight: totalHeight }}>
                <svg ref={svgRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
                {Array.from(posiciones.entries())
                  .filter(([id]) => personas.some(p => p.id === id))
                  .map(([id, pos]) => {
                    const persona = personas.find(p => p.id === id);
                    if (!persona) return null;
                    const nombreCompleto = `${persona.nombre} ${persona.apellido1 || ''} ${persona.apellido2 || ''}`.trim();
                    const fotoUrl = getFotoUrl(persona.foto);
                    const leftPos = pos.x + totalWidth / 2;
                    return (
                      <div
                        key={id}
                        ref={el => setCardRef(id, el)}
                        onClick={() => handleCardClick(persona)}
                        className="absolute bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-200 cursor-pointer transition-transform hover:scale-150 hover:border-gray-600"
                        style={{ width: CARD_WIDTH, left: leftPos, top: pos.y, transform: 'translateX(-50%)' }}
                      >
                        <div className="flex flex-col items-center p-3">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mb-2">
                            {fotoUrl ? (
                              <img
                                src={fotoUrl}
                                alt={nombreCompleto}
                                className="w-full h-full object-cover"
                                onLoad={scheduleRedraw}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  scheduleRedraw();
                                }}
                              />
                            ) : null}
                            <div className="text-gray-400 text-3xl" style={{ display: fotoUrl ? 'none' : 'flex' }}>👤</div>
                          </div>
                          <div className="text-sm font-semibold text-gray-800 text-center">{nombreCompleto}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })()
      )}
      {showDetails && <DetallesPersona persona={selectedPerson} onClose={handleCloseDetails} />}
    </div>
  );
};