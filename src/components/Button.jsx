﻿export default function Button({ children, className = '', ...props }) {
  return (
    <button {...props} className={`btn ${className}`.trim()}>
      {children}
    </button>
  )
}
