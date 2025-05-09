import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import CenterList from '../components/CenterList'

const MapComponent = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center">
      지도를 불러오는 중...
    </div>
  ),
})

export default function Home() {
  const [isClient, setIsClient] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [centers, setCenters] = useState([])

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleCenterClick = (center) => {
    // Implement the logic to handle center click
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 relative">
        <MapComponent
          userLocation={userLocation}
          centers={centers}
          onCenterClick={handleCenterClick}
        />
      </div>
      <div className="h-2/5 overflow-y-auto">
        <CenterList
          centers={centers}
          onCenterClick={handleCenterClick}
          userLocation={userLocation}
        />
      </div>
    </div>
  )
} 