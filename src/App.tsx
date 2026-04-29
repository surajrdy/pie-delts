import { useEffect, useMemo, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import './App.css'

const VENMO_USERNAME = 'mitpdt'
const ZELLE_EMAIL = 'phi-treasurer@mit.edu'
const NOTE_LIMIT = 280
const LEADERBOARD_REFRESH_MINUTES = 30
const LEADERBOARD_REFRESH_MS = LEADERBOARD_REFRESH_MINUTES * 60 * 1000

const pieOptions = [
  { label: '1 pie', count: '1', helper: '$5' },
  { label: '3 pies', count: '3', helper: '$12' },
]

type CopiedState = 'note' | 'venmo' | 'zelle' | null

type LeaderboardEntry = {
  name: string
  pies: number
}

type LeaderboardData = {
  updatedAt: string
  refreshMinutes: number
  brothers: LeaderboardEntry[]
  groups: LeaderboardEntry[]
}

function formatPies(pies: number) {
  return `${pies} ${pies === 1 ? 'pie' : 'pies'}`
}

function LeaderboardList({
  entries,
  emptyLabel,
}: {
  entries: LeaderboardEntry[]
  emptyLabel: string
}) {
  if (!entries.length) {
    return <p className="leaderboard-empty">{emptyLabel}</p>
  }

  return (
    <ol className="leaderboard-list">
      {entries.map((entry, index) => (
        <li key={`${entry.name}-${index}`}>
          <span className="rank">{index + 1}</span>
          <strong>{entry.name}</strong>
          <span>{formatPies(entry.pies)}</span>
        </li>
      ))}
    </ol>
  )
}

function App() {
  const [groupName, setGroupName] = useState('')
  const [pieTargets, setPieTargets] = useState('')
  const [pieCount, setPieCount] = useState('1')
  const [copied, setCopied] = useState<CopiedState>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [leaderboardError, setLeaderboardError] = useState('')

  useEffect(() => {
    let isMounted = true
    let activeController: AbortController | null = null

    const loadLeaderboard = async () => {
      activeController?.abort()
      const controller = new AbortController()
      activeController = controller

      try {
        const response = await fetch(`/api/leaderboard?ts=${Date.now()}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Leaderboard request failed with ${response.status}`)
        }

        const data = (await response.json()) as LeaderboardData

        if (isMounted) {
          setLeaderboard(data)
          setLeaderboardError('')
        }
      } catch (error) {
        if (controller.signal.aborted || !isMounted) {
          return
        }

        console.error(error)
        setLeaderboardError('Leaderboard is temporarily unavailable.')
      }
    }

    void loadLeaderboard()
    const intervalId = window.setInterval(() => void loadLeaderboard(), LEADERBOARD_REFRESH_MS)

    return () => {
      isMounted = false
      activeController?.abort()
      window.clearInterval(intervalId)
    }
  }, [])

  const donationNote = useMemo(() => {
    const group = groupName.trim() || '[group name]'
    const targets = pieTargets.trim() || '[names of people you want to pie]'
    return `Pie-${group}-${targets}`.slice(0, NOTE_LIMIT)
  }, [groupName, pieTargets])

  const selectedPieCount = useMemo(() => {
    const parsed = Math.floor(Number(pieCount))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  }, [pieCount])

  const pieConversion = useMemo(() => {
    if (!selectedPieCount) {
      return {
        amount: '',
        description: 'Enter a pie count to calculate the donation.',
      }
    }

    const bundles = Math.floor(selectedPieCount / 3)
    const singles = selectedPieCount % 3
    const amount = bundles * 12 + singles * 5
    const pieces = [
      bundles ? `${bundles} x 3-pie ${bundles === 1 ? 'bundle' : 'bundles'}` : '',
      singles ? `${singles} ${singles === 1 ? 'single' : 'singles'}` : '',
    ].filter(Boolean)

    return {
      amount: amount.toFixed(2),
      description: `${selectedPieCount} ${selectedPieCount === 1 ? 'pie' : 'pies'} = $${amount} (${pieces.join(' + ')})`,
    }
  }, [selectedPieCount])

  const normalizedAmount = pieConversion.amount

  const leaderboardStatus = useMemo(() => {
    if (leaderboardError) {
      return leaderboard ? 'Using the last loaded totals.' : leaderboardError
    }

    if (!leaderboard) {
      return 'Loading live totals...'
    }

    const updatedAt = new Date(leaderboard.updatedAt)

    return `Updated ${new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(updatedAt)}. Refreshes every ${leaderboard.refreshMinutes} minutes.`
  }, [leaderboard, leaderboardError])

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
Pies: ${selectedPieCount || '[number of pies]'}
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

  const updatePieCount = (value: string) => {
    setPieCount(value.replace(/[^\d]/g, ''))
  }

  return (
    <main className="page-shell">
      <section className="hero-section" id="top">
        <div className="hero-copy">
          <h1 className="cloud-title">Pie Delts 2026</h1>
          <p className="hero-lede">
            Friday, May 1, 2026 from 5-8 PM on Kresge Oval. Donate with the
            description{' '}
            <strong>Pie-[group name]-[names of people you want to pie]</strong>.
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
                {pieOptions.map(({ label, count, helper }) => (
                  <button
                    className={pieCount === count ? 'is-selected' : ''}
                    key={label}
                    type="button"
                    onClick={() => setPieCount(count)}
                  >
                    <strong>{label}</strong>
                    <small>{helper}</small>
                  </button>
                ))}
                <label className="custom-amount">
                  <span>Pies</span>
                  <input
                    aria-label="Number of pies"
                    inputMode="numeric"
                    min="1"
                    onChange={(event) => updatePieCount(event.target.value)}
                    placeholder="Number"
                    step="1"
                    type="number"
                    value={pieCount}
                  />
                </label>
              </div>
              <strong className="conversion-result">{pieConversion.description}</strong>
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
              onClick={() => void copyText(ZELLE_EMAIL, 'zelle')}
            >
              {copied === 'zelle' ? 'Copied Zelle email' : 'Copy Zelle email'}
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

      <section className="leaderboard-section" id="leaderboard" aria-labelledby="leaderboard-heading">
        <div className="leaderboard-heading">
          <p className="eyebrow">Live totals</p>
          <h2 className="cloud-subtitle" id="leaderboard-heading">Leaderboard</h2>
          <p>{leaderboardStatus}</p>
        </div>

        <div className="leaderboard-grid">
          <article className="leaderboard-panel">
            <div className="leaderboard-panel-heading">
              <h3>Top Brothers</h3>
              <span>Most pies</span>
            </div>
            <LeaderboardList
              entries={leaderboard?.brothers ?? []}
              emptyLabel={leaderboardError || 'Waiting for brother totals.'}
            />
          </article>

          <article className="leaderboard-panel">
            <div className="leaderboard-panel-heading">
              <h3>Top Groups</h3>
              <span>Most donated</span>
            </div>
            <LeaderboardList
              entries={leaderboard?.groups ?? []}
              emptyLabel="Group totals will show here once they are listed."
            />
          </article>
        </div>
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
