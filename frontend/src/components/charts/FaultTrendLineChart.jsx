import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function FaultTrendLineChart({
  data,
  height = 220,
  color = '#3B72F6',
  dataKey = 'faults',
  xKey = 'day'
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid stroke="#1F2A40" strokeDasharray="0" />
        <XAxis dataKey={xKey} tick={{ fill: '#5A6A85', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#5A6A85', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: '#1F2A40', border: '1px solid #2A3450' }} itemStyle={{ color: '#94A3B8' }} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
