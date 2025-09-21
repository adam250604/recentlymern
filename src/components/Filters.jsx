export default function Filters({ filters, onChange, sorting, onSortChange }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
      <select value={filters.category || ''} onChange={(e) => onChange?.({ ...filters, category: e.target.value })}>
        <option value="">All Categories</option>
        <option value="breakfast">Breakfast</option>
        <option value="lunch">Lunch</option>
        <option value="dinner">Dinner</option>
      </select>
      <select value={sorting || 'recent'} onChange={(e) => onSortChange?.(e.target.value)}>
        <option value="recent">Most Recent</option>
        <option value="rating">Highest Rated</option>
        <option value="popular">Most Popular</option>
      </select>
    </div>
  )
}
