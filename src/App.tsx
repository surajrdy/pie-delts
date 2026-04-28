import { useMemo, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import './App.css'

const VENMO_USERNAME = 'mitpdt'
const ZELLE_EMAIL = 'phi-treasurer@mit.edu'
const NOTE_LIMIT = 280

const pieOptions = [
  { label: '1 pie', amount: '5', helper: '$5' },
  { label: '3 pies', amount: '12', helper: '$12' },
  { label: '6 pies', amount: '24', helper: '$4 each' },
]

type CopiedState = 'note' | 'venmo' | 'zelle' | null

function App() {
  const [groupName, setGroupName] = useState('')
  const [pieTargets, setPieTargets] = useState('')
  const [presetAmount, setPresetAmount] = useState('10')
  const [customAmount, setCustomAmount] = useState('')
  const [copied, setCopied] = useState<CopiedState>(null)

  const donationNote = useMemo(() => {
    const group = groupName.trim() || '[group name]'
    const targets = pieTargets.trim() || '[names of people you want to pie]'
    return `Pie-${group}-${targets}`.slice(0, NOTE_LIMIT)
  }, [groupName, pieTargets])

  const normalizedAmount = useMemo(() => {
    const amount = customAmount.trim() || presetAmount
    const parsed = Number(amount)
    return Number.isFinite(parsed) && parsed > 0 ? parsed.toFixed(2) : ''
  }, [customAmount, presetAmount])

  const venmoUrl = useMemo(() => {
    const params = new URLSearchParams({
      txn: 'pay',
      note: donationNote,
    })

    if (normalizedAmount) {
      params.set('amount', normalizedAmount)
    }

    return `https://venmo.com/${VENMO_USERNAME}?${params.toString()}`
  }, [donationNote, normalizedAmount])

  const venmoDetails = `Venmo: @${VENMO_USERNAME}
Amount: ${normalizedAmount ? `$${normalizedAmount}` : '[your amount]'}
Description: ${donationNote}`

  const zelleDetails = `Zelle recipient: ${ZELLE_EMAIL}
Amount: ${normalizedAmount ? `$${normalizedAmount}` : '[your amount]'}
Description: ${donationNote}`

  const writeClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }

    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.setAttribute('readonly', '')
    textArea.style.position = 'fixed'
    textArea.style.top = '-999px'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }

  const copyText = async (text: string, target: Exclude<CopiedState, null>) => {
    await writeClipboard(text)
    setCopied(target)
    window.setTimeout(() => setCopied(null), 1800)
  }

  const selectPresetAmount = (value: string) => {
    setPresetAmount(value)
    setCustomAmount('')
  }

  const updateCustomAmount = (value: string) => {
    setPresetAmount('')
    setCustomAmount(value)
  }

  return (
    <main className="page-shell">
      <section className="hero-section" id="top">
        <div className="hero-copy">
          <h1 className="cloud-title">Pie Delts 2026</h1>
          <p className="hero-lede">
            Friday, May 1, 2026 from 5-8 PM on Kresge Oval. Donate with the
            description <strong>Pie-[group name]-[names of people you want to pie]</strong>.
          </p>

          <div className="event-strip" aria-label="Event details">
            <span>Friday, May 1</span>
            <span>5-8 PM</span>
            <span>Kresge Oval</span>
          </div>
        </div>

        <section className="donation-panel" id="donate" aria-labelledby="donate-heading">
          <div className="panel-heading">
            <h2 className="cloud-subtitle" id="donate-heading">DONATE NOW!</h2>
            <p>
              Fill in the group and names, pick a pie amount, then send through
              Venmo or copy the same details for Zelle.
            </p>
          </div>

          <form className="donation-form">
            <label>
              Group name
              <input
                type="text"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="Club, living group, family..."
                autoComplete="organization"
              />
            </label>

            <label>
              People to pie
              <input
                type="text"
                value={pieTargets}
                onChange={(event) => setPieTargets(event.target.value)}
                placeholder="Names of brothers to pie"
                autoComplete="off"
              />
            </label>

            <div className="amount-field">
              <span>Pie conversion</span>
              <p className="pricing-note">$5 for 1 pie / $12 for 3 pies</p>
              <div className="amount-row" aria-label="Donation amount quick picks">
                {pieOptions.map(({ label, amount, helper }) => (
                  <button
                    className={presetAmount === amount && !customAmount ? 'is-selected' : ''}
                    key={label}
                    type="button"
                    onClick={() => selectPresetAmount(amount)}
                  >
                    <strong>{label}</strong>
                    <small>{helper}</small>
                  </button>
                ))}
                <label className="custom-amount">
                  <span>$</span>
                  <input
                    aria-label="Custom donation amount"
                    inputMode="decimal"
                    min="1"
                    onChange={(event) => updateCustomAmount(event.target.value)}
                    placeholder="Other"
                    type="number"
                    value={customAmount}
                  />
                </label>
              </div>
            </div>

            <div className="note-box">
              <span>Payment description</span>
              <strong>{donationNote}</strong>
              <small>{donationNote.length}/{NOTE_LIMIT} Venmo characters</small>
            </div>
          </form>

          <div className="payment-grid">
            <a className="pay-button venmo" href={venmoUrl} rel="noreferrer" target="_blank">
              Pay @mitpdt
            </a>
            <button
              className="pay-button zelle"
              type="button"
              onClick={() => void copyText(zelleDetails, 'zelle')}
            >
              {copied === 'zelle' ? 'Copied Zelle details' : 'Copy Zelle details'}
            </button>
          </div>

          <div className="copy-row" aria-label="Copy payment details">
            <button type="button" onClick={() => void copyText(donationNote, 'note')}>
              {copied === 'note' ? 'Copied note' : 'Copy note'}
            </button>
            <button type="button" onClick={() => void copyText(venmoDetails, 'venmo')}>
              {copied === 'venmo' ? 'Copied Venmo' : 'Copy Venmo'}
            </button>
          </div>

          <div className="qr-row">
            <div className="qr-tile">
              <QRCodeCanvas value={venmoUrl} size={104} marginSize={1} />
              <span>Venmo QR</span>
            </div>
            <div className="zelle-recipient">
              <span>Zelle recipient</span>
              <strong>{ZELLE_EMAIL}</strong>
            </div>
          </div>
        </section>
      </section>

      <section className="impact-section" id="impact">
        <div className="impact-copy">
          <p className="eyebrow">All proceeds go to</p>
          <h2 className="cloud-subtitle">The @7uicefoundation</h2>
          <p>
            Led by Celtics superstar Jaylen Brown, the 7uice Foundation partners with
            institutions, organizations, and social change leaders to bridge the
            opportunity gap for youth in traditionally underserved communities.
          </p>
          <p>
            Its work concentrates on education, socio-economic mobility, health, STEM
            programs, mentorship, and financial literacy initiatives.
          </p>
        </div>
        <a
          className="foundation-link"
          href="https://www.instagram.com/7uicefoundation/"
          rel="noreferrer"
          target="_blank"
        >
          @7uicefoundation
        </a>
      </section>
    </main>
  )
}

export default App
