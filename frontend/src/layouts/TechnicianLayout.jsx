import { Outlet } from 'react-router-dom'
const TechnicianLayout = () => (
  <div className='flex min-h-screen bg-gray-100'>
    <main className='flex-1 p-6'><Outlet /></main>
  </div>
)
export default TechnicianLayout
