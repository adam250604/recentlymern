export default function Rating({ value = 0, onChange, max = 5 }) {
  const stars = []
  for (let i = 1; i <= max; i++) {
    const filled = i <= value
    stars.push(
      <span key={i} style={{ cursor: 'pointer', fontSize: 20 }} onClick={() => onChange?.(i)}>
        {filled ? '⭐' : '☆'}
      </span>
    )
  }
  return <div>{stars}</div>
}
