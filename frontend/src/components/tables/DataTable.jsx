import { useMemo } from 'react'
import clsx from 'clsx'

const SKELETON_ROWS = 5

const thClass =
  'text-left text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-[#5A6A85] py-[10px] px-5 bg-[#131720] border-b border-[#1F2A40]'

const tdClass =
  'py-3 px-5 text-[0.8125rem] text-[#94A3B8] border-b border-[#1A2235] align-middle'

const LoadingSkeleton = ({ columnCount }) => (
  <table className="w-full border-collapse">
    <tbody>
      {Array.from({ length: SKELETON_ROWS }).map((_, rowIdx) => (
        <tr key={rowIdx}>
          {Array.from({ length: columnCount }).map((_, colIdx) => (
            <td key={colIdx} className={tdClass}>
              <div className="h-4 rounded bg-[#1F2A40] animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
)

const DataTable = ({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No records found.',
  searchTerm,
  loading = false,
  rowClassName,
}) => {
  const filteredData = useMemo(() => {
    if (!searchTerm) return data
    const term = searchTerm.toLowerCase()
    return data.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(term))
    )
  }, [data, searchTerm])

  return (
    <div className="w-full overflow-x-auto">
      {loading ? (
        <LoadingSkeleton columnCount={columns.length} />
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={thClass}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child_td]:border-b-0">
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-[0.8125rem] text-[#5A6A85]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  onClick={() => onRowClick?.(row)}
                  className={clsx(
                    onRowClick && 'cursor-pointer hover:[&_td]:bg-[#1A2235]',
                    rowClassName && rowClassName(row)
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={clsx(
                        tdClass,
                        col.primary && 'text-[#E2E8F0] font-medium'
                      )}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default DataTable
