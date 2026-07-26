'use client';

import { FiSearch, FiX } from 'react-icons/fi';

interface CourseFiltersProps {
  query: string;
  level: string;
  category: string;
  sort: string;
  categories: string[];
  onQueryChange: (v: string) => void;
  onLevelChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onSortChange: (v: string) => void;
  onClear: () => void;
  resultCount: number;
}

export function CourseFilters({
  query,
  level,
  category,
  sort,
  categories,
  onQueryChange,
  onLevelChange,
  onCategoryChange,
  onSortChange,
  onClear,
  resultCount,
}: CourseFiltersProps) {
  const hasFilters = query || level || category || sort !== 'newest';

  return (
    <div className="space-y-4">
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar cursos..."
          className="input pl-12 pr-12 py-3 text-base"
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
          >
            <FiX size={18} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={level}
          onChange={(e) => onLevelChange(e.target.value)}
          className="input py-2 text-sm w-auto min-w-[140px]"
        >
          <option value="">Todos los niveles</option>
          <option value="BEGINNER">Principiante</option>
          <option value="INTERMEDIATE">Intermedio</option>
          <option value="ADVANCED">Avanzado</option>
        </select>

        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="input py-2 text-sm w-auto min-w-[160px]"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="input py-2 text-sm w-auto min-w-[160px]"
        >
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguos</option>
          <option value="popular">Más populares</option>
        </select>

        {hasFilters && (
          <button
            onClick={onClear}
            className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
          >
            <FiX size={14} />
            Limpiar filtros
          </button>
        )}

        <span className="text-sm text-dark-500 ml-auto">
          {resultCount} {resultCount === 1 ? 'curso' : 'cursos'}
        </span>
      </div>
    </div>
  );
}
