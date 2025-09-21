export default function FavoriteToggle({ active, onToggle }) {
  const toggle = () => onToggle?.(!active)
  return (
    <button aria-label="favorite" onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>
      {active ? '❤️' : '🤍'}
    </button>
  )
}
