import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as auditLogsService from '../../api/auditLogsService'
import DataTable from '../../components/tables/DataTable'
import { formatDate } from '../../utils/formatDate'
// No heroicons import

const formatAction = (action) => {
  return action.replace(/_/g, ' ')
}

const AuditLogs = () => {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [selectedLog, setSelectedLog] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page, limit, search, filters],
    queryFn: () => auditLogsService.getAuditLogs({ page, limit, search, ...filters }),
    keepPreviousData: true
  })

  const columns = useMemo(() => [
    { 
      key: 'createdAt', 
      label: 'Timestamp', 
      render: val => <span className="text-[#94A3B8] text-sm whitespace-nowrap">{formatDate(val)}</span> 
    },
    { 
      key: 'user', 
      label: 'User', 
      render: val => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">{val?.name || 'System'}</div>
          {val?.role && <div className="text-xs text-[var(--text-muted)]">{val.role}</div>}
        </div>
      ) 
    },
    { 
      key: 'action', 
      label: 'Action', 
      render: val => <span className="px-2.5 py-1 bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-md text-xs font-medium uppercase tracking-wider">{formatAction(val)}</span> 
    },
    { 
      key: 'entity', 
      label: 'Entity', 
      render: (val, row) => (
        <div>
          <span className="font-medium text-[var(--text-primary)]">{val}</span>
          <div className="text-xs font-mono text-[var(--text-muted)] mt-0.5">#{row.entityId}</div>
        </div>
      ) 
    },
    { 
      key: 'description', 
      label: 'Description', 
      render: val => <span className="text-[var(--text-secondary)]">{val}</span> 
    },
    {
      key: 'actions',
      label: 'Details',
      align: 'right',
      render: (_, row) => (
        <button
          onClick={() => setSelectedLog(row)}
          className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[#94A3B8] hover:text-[var(--text-primary)] transition-colors"
          title="View Details"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </button>
      )
    }
  ], [])

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
          </svg>
          Audit Logs
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Track system activity and operational compliance
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        searchPlaceholder="Search logs..."
        searchValue={search}
        onSearchChange={setSearch}
        pagination={{
          page,
          limit,
          total: data?.meta?.total || 0,
          totalPages: data?.meta?.totalPages || 1,
          onPageChange: setPage,
          onLimitChange: setLimit
        }}
      />

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Audit Log Details</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">{formatDate(selectedLog.createdAt)}</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--bg-hover)] p-3 rounded-lg">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Actor</div>
                  <div className="font-medium text-[var(--text-primary)]">{selectedLog.user?.name || 'System'}</div>
                  <div className="text-sm text-[var(--text-secondary)]">{selectedLog.user?.role}</div>
                </div>
                <div className="bg-[var(--bg-hover)] p-3 rounded-lg">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Target Entity</div>
                  <div className="font-medium text-[var(--text-primary)]">{selectedLog.entity}</div>
                  <div className="text-sm font-mono text-[var(--text-secondary)]">#{selectedLog.entityId}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Description</div>
                <p className="text-[var(--text-primary)]">{selectedLog.description}</p>
              </div>

              {selectedLog.oldValue && (
                <div>
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Previous State</div>
                  <pre className="bg-[#111827] text-[#A7F3D0] p-4 rounded-lg overflow-x-auto text-xs font-mono border border-[var(--border)]">
                    {typeof selectedLog.oldValue === 'string' && selectedLog.oldValue.startsWith('{') 
                      ? JSON.stringify(JSON.parse(selectedLog.oldValue), null, 2)
                      : selectedLog.oldValue}
                  </pre>
                </div>
              )}

              {selectedLog.newValue && (
                <div>
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">New State</div>
                  <pre className="bg-[#111827] text-[#60A5FA] p-4 rounded-lg overflow-x-auto text-xs font-mono border border-[var(--border)]">
                    {typeof selectedLog.newValue === 'string' && selectedLog.newValue.startsWith('{')
                      ? JSON.stringify(JSON.parse(selectedLog.newValue), null, 2)
                      : selectedLog.newValue}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditLogs
