import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info)
  }
  reset = () => this.setState({ hasError: false, error: null })
  clearAuth = () => {
    localStorage.removeItem('auth')
    this.reset()
    window.location.reload()
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f8f8f8', padding: 12, borderRadius: 6 }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={this.reset}>Try again</button>
            <button onClick={this.clearAuth}>Clear auth and reload</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
