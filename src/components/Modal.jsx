export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, minWidth: 320 }} onClick={(e) => e.stopPropagation()}>
        {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
        <div>{children}</div>
        {footer && <div style={{ marginTop: 12 }}>{footer}</div>}
      </div>
    </div>
  )
}
