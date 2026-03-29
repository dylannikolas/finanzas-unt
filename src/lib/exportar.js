import * as XLSX from 'xlsx'

export const exportarCSV = (transacciones) => {
  const rows = transacciones.map(t => ({
    Fecha:       t.fecha,
    Tipo:        t.tipo,
    Monto:       t.monto,
    Metodo:      t.metodo,
    Categoria:   t.categoria,
    Descripcion: t.descripcion || '',
    Recurrente:  t.recurrente,
  }))

  const header = Object.keys(rows[0]).join(',')
  const body = rows.map(r => Object.values(r).map(v => `"${v}"`).join(',')).join('\n')
  const csv = `${header}\n${body}`

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `finanzas_${new Date().toISOString().slice(0,7)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export const exportarExcel = (transacciones) => {
  const rows = transacciones.map(t => ({
    Fecha:       t.fecha,
    Tipo:        t.tipo,
    Monto:       t.monto,
    Metodo:      t.metodo,
    Categoria:   t.categoria,
    Descripcion: t.descripcion || '',
    Recurrente:  t.recurrente,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Transacciones')
  XLSX.writeFile(wb, `finanzas_${new Date().toISOString().slice(0,7)}.xlsx`)
}
