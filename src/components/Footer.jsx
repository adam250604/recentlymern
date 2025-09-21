export default function Footer() {
  return (
    <footer style={{ marginTop: 32, color: '#888', borderTop: '1px solid #444', padding: '1rem 0', textAlign: 'center', background: 'transparent' }}>
      {new Date().getFullYear()} Recipes App
    </footer>
  )
}
