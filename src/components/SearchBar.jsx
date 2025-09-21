export default function SearchBar({ value, onChange }) {
  return <input placeholder="Search recipes..." value={value} onChange={(e) => onChange?.(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #ddd' }} />
}
