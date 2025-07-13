import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx'
import { Hitter } from "@/components/hitter-card"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPercent(value: number, precision = 1): string {
  return `${value.toFixed(precision)}%`
}

export function formatAverage(value: number): string {
  return value.toFixed(3).toString().substring(1)
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function exportHittersToExcel(hitters: Hitter[]) {
  // Transform hitter data into a flat structure for Excel
  const data = hitters.map(hitter => ({
    'Name': hitter.name,
    'Team': hitter.team.name,
    'PA': hitter.paCount,
    'AVG': hitter.avg,
    'OBP': hitter.obp,
    'SLG': hitter.slg,
    'OPS': hitter.ops,
    'K Rate': `${hitter.kRate.toFixed(1)}%`,
    'BB Rate': `${hitter.bbRate.toFixed(1)}%`,
    'GB%': `${Math.round(hitter.gbPercent)}%`,
    'LD%': `${Math.round(hitter.ldPercent)}%`,
    'FB%': `${Math.round(hitter.fbPercent)}%`,
    'Hits': hitter.hits,
    'Doubles': hitter.doubles,
    'Triples': hitter.triples,
    'Home Runs': hitter.homeRuns,
    'Walks': hitter.walks,
    'Strikeouts': hitter.strikeouts,
  }))

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)

  // Set column widths
  const colWidths = [
    { wch: 20 }, // Name
    { wch: 15 }, // Team
    { wch: 8 },  // PA
    { wch: 8 },  // AVG
    { wch: 8 },  // OBP
    { wch: 8 },  // SLG
    { wch: 8 },  // OPS
    { wch: 8 },  // K Rate
    { wch: 8 },  // BB Rate
    { wch: 8 },  // GB%
    { wch: 8 },  // LD%
    { wch: 8 },  // FB%
    { wch: 8 },  // Hits
    { wch: 8 },  // Doubles
    { wch: 8 },  // Triples
    { wch: 10 }, // Home Runs
    { wch: 8 },  // Walks
    { wch: 10 }, // Strikeouts
  ]
  ws['!cols'] = colWidths

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Hitters')

  // Generate Excel file
  XLSX.writeFile(wb, 'hitters.xlsx')
}

export function formatPlayerName(name: string): string {
  // Check if the name is likely abbreviated (two single letters separated by space)
  const abbreviatedPattern = /^[A-Z]\s[A-Z]$/;
  
  if (abbreviatedPattern.test(name)) {
    // Format as "A. L." instead of "A L"
    const parts = name.split(' ');
    return `${parts[0]}. ${parts[1]}.`;
  }
  
  // Check if it's a single letter (like "K" for strikeout)
  if (/^[A-Z]$/.test(name)) {
    return `${name}.`;
  }
  
  return name;
}

export function isAbbreviatedName(name: string): boolean {
  // Check if the name is likely abbreviated
  const abbreviatedPattern = /^[A-Z]\s[A-Z]$/;
  const singleLetterPattern = /^[A-Z]$/;
  
  return abbreviatedPattern.test(name) || singleLetterPattern.test(name);
}

export function getMappedPlayerName(name: string): string {
  try {
    const savedMappings = localStorage.getItem('playerNameMappings')
    if (savedMappings) {
      const mappings = JSON.parse(savedMappings)
      const mapping = mappings.find((m: any) => m.abbreviated === name.toUpperCase())
      if (mapping) {
        return mapping.fullName
      }
    }
  } catch (error) {
    console.error('Failed to load name mappings:', error)
  }
  
  return formatPlayerName(name)
}
