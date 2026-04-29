const SPREADSHEET_ID = '1yEqKEgDuustlwxYinGIzCGwybixrZIEMLFkTcDwCn5w'
const TOP_COUNT = 5
const REFRESH_MINUTES = 30

const SHEETS = {
  brothers: '0',
  groups: '1049888553',
}

function csvUrl(gid) {
  const params = new URLSearchParams({
    format: 'csv',
    gid,
    cacheBust: Date.now().toString(),
  })

  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?${params.toString()}`
}

async function fetchCsv(gid) {
  const response = await fetch(csvUrl(gid))

  if (!response.ok) {
    throw new Error(`Google Sheets returned ${response.status} for gid ${gid}`)
  }

  return response.text()
}

function parseCsv(csv) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index]
    const nextCharacter = csv[index + 1]

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        cell += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (character === ',' && !inQuotes) {
      row.push(cell)
      cell = ''
      continue
    }

    if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1
      }
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      continue
    }

    cell += character
  }

  row.push(cell)
  rows.push(row)

  return rows.filter((currentRow) =>
    currentRow.some((currentCell) => currentCell.trim().length > 0),
  )
}

function normalizeHeader(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function findColumn(headers, aliases) {
  return headers.findIndex((header) => aliases.includes(header))
}

function parsePieCount(value) {
  const match = value.replace(/,/g, '').match(/\d+(\.\d+)?/)
  return match ? Number(match[0]) : 0
}

function parseLeaderboard(csv, kind) {
  const rows = parseCsv(csv)

  if (rows.length < 2) {
    return []
  }

  const headers = rows[0].map(normalizeHeader)
  let nameIndex =
    kind === 'brothers'
      ? findColumn(headers, ['brother', 'brothers', 'name'])
      : findColumn(headers, ['group', 'groups', 'team', 'club', 'organization'])
  let piesIndex = findColumn(headers, ['total pies', 'pies', 'pie count', 'total', 'count'])

  if (nameIndex === -1) {
    nameIndex = 0
  }

  if (piesIndex === -1) {
    piesIndex = 1
  }

  if (nameIndex === -1 || piesIndex === -1) {
    return []
  }

  return rows
    .slice(1)
    .map((row, index) => ({
      name: (row[nameIndex] ?? '').trim(),
      pies: parsePieCount(row[piesIndex] ?? ''),
      sheetOrder: index,
    }))
    .filter((entry) => entry.name)
    .sort((first, second) => second.pies - first.pies || first.sheetOrder - second.sheetOrder)
    .slice(0, TOP_COUNT)
    .map(({ name, pies }) => ({ name, pies }))
}

exports.handler = async () => {
  try {
    const [brotherCsv, groupCsvResult] = await Promise.allSettled([
      fetchCsv(SHEETS.brothers),
      fetchCsv(SHEETS.groups),
    ])

    if (brotherCsv.status === 'rejected') {
      throw brotherCsv.reason
    }

    const groups = groupCsvResult.status === 'fulfilled'
      ? parseLeaderboard(groupCsvResult.value, 'groups')
      : []

    return {
      statusCode: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        updatedAt: new Date().toISOString(),
        refreshMinutes: REFRESH_MINUTES,
        brothers: parseLeaderboard(brotherCsv.value, 'brothers'),
        groups,
      }),
    }
  } catch (error) {
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Unable to load Pie Delts leaderboard data.',
        detail: error instanceof Error ? error.message : String(error),
      }),
    }
  }
}
