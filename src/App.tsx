import { useMemo, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import {
  CalendarDays,
  Check,
  Clock,
  Copy,
  ExternalLink,
  HeartHandshake,
  Landmark,
  MapPin,
  Send,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import './App.css'

const VENMO_USERNAME = 'mitpdt'
const ZELLE_EMAIL = 'phi-treasurer@mit.edu'
const NOTE_LIMIT = 280

const amountOptions = ['5', '10', '25', '50']

type CopiedState = 'note' | 'venmo' | 'zelle' | null

function App() {
  const [groupName, setGroupName] = useState('')
  const [pieTargets, setPieTargets] = useState('')
  const [amount, setAmount] = useState('10')
  const [copied, setCopied] = useState<CopiedState>(null)

  const donationNote = useMemo(() => {
    const group = groupName.trim() || '[group name]'
    const targets = pieTargets.trim() || '[names of people you want to pie]'
    return `Pie-${group}-${targets}`.slice(0, NOTE_LIMIT)
  }, [groupName, pieTargets])

  const normalizedAmount = useMemo(() => {
    const parsed = Number(amount)
    return Number.isFinite(parsed) && parsed > 0 ? parsed.toFixed(2) : ''
  }, [amount])

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

  const openZelle = () => {
    window.open('https://www.zellepay.com/get-started', '_blank', 'noopener,noreferrer')
    void copyText(zelleDetails, 'zelle')
  }

  return (
    <main className="page-shell">
      <header className="site-header" aria-label="Pie Delts navigation">
        <a className="brand" href="#top" aria-label="Pie Delts home">
          <span className="brand-mark">PD</span>
          <span>Pie Delts</span>
        </a>
        <nav>
          <a href="#donate">Donate</a>
          <a href="#impact">Impact</a>
          <a href="#faq">FAQ</a>
        </nav>
      </header>

      <section className="hero-section" id="top">
        <div className="hero-copy">
          <p className="eyebrow">MIT Phi Delts Community Service</p>
          <h1 className="cloud-title">Donate now for Pie Delts 2026</h1>
          <p className="hero-lede">
            Friday, May 1, 2026 from 5-8 PM on Kresge Oval. Donate with the
            description <strong>Pie-[group name]-[names of people you want to pie]</strong>.
          </p>

          <div className="event-strip" aria-label="Event details">
            <span>
              <CalendarDays aria-hidden="true" />
              Fri, May 1
            </span>
            <span>
              <Clock aria-hidden="true" />
              5-8 PM
            </span>
            <span>
              <MapPin aria-hidden="true" />
              Kresge Oval
            </span>
          </div>

          <div className="hero-actions">
            <a className="primary-link" href="#donate">
              <Send aria-hidden="true" />
              Build payment
            </a>
            <a className="secondary-link" href="#impact">
              <HeartHandshake aria-hidden="true" />
              Where it goes
            </a>
          </div>
        </div>

        <section className="donation-panel" id="donate" aria-labelledby="donate-heading">
          <div className="panel-heading">
            <p className="eyebrow">Payment layer</p>
            <h2 id="donate-heading">Make the note once.</h2>
            <p>
              Fill in the group and names, then send through Venmo or copy the same
              details into Zelle.
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
              <span>Donation amount</span>
              <div className="amount-row" aria-label="Donation amount quick picks">
                {amountOptions.map((value) => (
                  <button
                    className={amount === value ? 'is-selected' : ''}
                    key={value}
                    type="button"
                    onClick={() => setAmount(value)}
                  >
                    ${value}
                  </button>
                ))}
                <label className="custom-amount">
                  <span>$</span>
                  <input
                    aria-label="Custom donation amount"
                    inputMode="decimal"
                    min="1"
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="Other"
                    type="number"
                    value={amount}
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
              <ExternalLink aria-hidden="true" />
              Pay @mitpdt
            </a>
            <button
              className="pay-button zelle"
              type="button"
              onClick={openZelle}
            >
              <Landmark aria-hidden="true" />
              Open Zelle
            </button>
          </div>

          <div className="copy-row" aria-label="Copy payment details">
            <button type="button" onClick={() => void copyText(donationNote, 'note')}>
              {copied === 'note' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied === 'note' ? 'Copied note' : 'Copy note'}
            </button>
            <button type="button" onClick={() => void copyText(venmoDetails, 'venmo')}>
              {copied === 'venmo' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied === 'venmo' ? 'Copied Venmo' : 'Copy Venmo'}
            </button>
            <button type="button" onClick={() => void copyText(zelleDetails, 'zelle')}>
              {copied === 'zelle' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied === 'zelle' ? 'Copied Zelle' : 'Copy Zelle'}
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

      <section className="rules-band" aria-label="Fundraiser rules">
        <article>
          <Trophy aria-hidden="true" />
          <h2>Group challenge</h2>
          <p>
            The group with the most donations receives a matched donation to an
            organization of their choice and a special gift from the Community Service chairs.
          </p>
        </article>
        <article>
          <Users aria-hidden="true" />
          <h2>Brother challenge</h2>
          <p>
            The brother who raises the most pies will be pied by Sally Kornbluth.
          </p>
        </article>
        <article>
          <Sparkles aria-hidden="true" />
          <h2>Remote pies</h2>
          <p>
            If you cannot be there Friday, brothers can take custom videos or someone
            can pie in your place.
          </p>
        </article>
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
          <ExternalLink aria-hidden="true" />
        </a>
      </section>

      <section className="faq-section" id="faq">
        <p className="eyebrow">FAQ</p>
        <h2 className="cloud-subtitle">Cloud notes</h2>
        <div className="faq-list">
          <details>
            <summary>Can I use Zelle?</summary>
            <p>
              Yes. Send to <strong>{ZELLE_EMAIL}</strong> and paste the generated
              description into the memo field.
            </p>
          </details>
          <details>
            <summary>What does group mean?</summary>
            <p>
              Any club, team, living group, family, or friend group you want the
              donation counted toward.
            </p>
          </details>
          <details>
            <summary>Who do I contact?</summary>
            <p>
              Reach out to MIT Phi Delts with any questions. Happy Pie Delts.
            </p>
          </details>
        </div>
      </section>
    </main>
  )
}

export default App
