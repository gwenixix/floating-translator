import { useEffect, useState } from 'react'

const LANGUAGES = [
  'English',
  'German',
  'French',
  'Italian',
  'Spanish',
  'Polish',
  'Swedish',
  'Danish',
  'Irish',
  'Arabic',
  'Chinese (Simplified)',
  'Japanese',
  'Korean'
]

function App(): React.JSX.Element {
  const [text, setText] = useState('')
  const [language, setLanguage] = useState('English')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pinned, setPinned] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [hasKey, setHasKey] = useState(true)

  useEffect(() => {
    window.api.hasApiKey().then((has) => {
      setHasKey(has)
      if (!has) setShowSettings(true)
    })
  }, [])

  const saveKey = async (): Promise<void> => {
    await window.api.setApiKey(keyInput)
    setKeyInput('')
    const has = await window.api.hasApiKey()
    setHasKey(has)
    setShowSettings(!has)
  }

  const togglePin = async (): Promise<void> => setPinned(await window.api.togglePin())

  const handleTranslate = async (): Promise<void> => {
    if (!text.trim() || loading) return
    setLoading(true)
    setError('')
    try {
      setOutput(await window.api.translate(text, language))
    } catch (e) {
      setOutput('')
      setError((e as Error).message.replace(/^Error invoking remote method '.*?': /, ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel">
      <div className="titlebar">
        <span className="title">Translator</span>
        <div className="controls">
          <button
            onClick={() => setShowSettings((s) => !s)}
            title="Settings"
            className={showSettings ? 'on' : ''}
          >
            ⚙
          </button>
          <button onClick={togglePin} title="Always on top" className={pinned ? 'on' : ''}>
            📌
          </button>
          <button onClick={() => window.api.minimizeWindow()} title="Minimize">
            –
          </button>
          <button onClick={() => window.api.closeWindow()} title="Close">
            ✕
          </button>
        </div>
      </div>
      {showSettings ? (
        <div className="settings">
          <label>Anthropic API key</label>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={hasKey ? 'Key saved (enter a new one to replace)' : 'sk-ant-...'}
          />
          <p className="hint">
            Stored encrypted on this computer. Leave empty and save to remove it.
          </p>
          <button className="primary" onClick={saveKey}>
            Save
          </button>
        </div>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleTranslate()
            }}
            placeholder="Type or paste text to translate…"
          />
          <div className="row">
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <button
              className="primary"
              onClick={handleTranslate}
              disabled={loading || !text.trim()}
            >
              {loading ? 'Translating…' : 'Translate'}
            </button>
          </div>
          <div dir="auto" className={`result${error ? ' error' : ''}`}>
            {error || output || <span className="placeholder">Translation appears here</span>}
          </div>
        </>
      )}
    </div>
  )
}

export default App
