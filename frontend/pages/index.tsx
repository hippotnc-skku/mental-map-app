import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import CenterList from '../components/CenterList'

interface Center {
  name: string
  lat: number
  lng: number
  phone: string
  website: string
  region?: string
}

const MapComponent = dynamic<{
  userLocation: { lat: number; lng: number } | null
  centers: Center[]
  onCenterClick: (center: Center) => void
}>(() => import('../components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center">
      지도를 불러오는 중...
    </div>
  ),
})

export default function Home() {
  const [isClient, setIsClient] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>({
    lat: 37.5665,
    lng: 126.9780,
  })
  const [centers, setCenters] = useState<Center[]>([
    {
      name: '서울 상담센터',
      lat: 37.5665,
      lng: 126.9780,
      phone: '02-1234-5678',
      website: 'https://example.com',
      region: '서울',
    },
    {
      name: '부산 상담센터',
      lat: 35.1796,
      lng: 129.0756,
      phone: '051-1234-5678',
      website: 'https://example.com',
      region: '부산',
    },
    {
      name: '대구 상담센터',
      lat: 35.8714,
      lng: 128.6014,
      phone: '053-1234-5678',
      website: 'https://example.com',
      region: '대구',
    },
  ])
  const [activeMenu, setActiveMenu] = useState('list')

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleCenterClick = (center: Center) => {
    // Implement the logic to handle center click
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex justify-center space-x-4 p-4 bg-gray-100">
        <button
          className={`px-4 py-2 rounded ${activeMenu === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveMenu('list')}
        >
          상담 센터 목록
        </button>
        <button
          className={`px-4 py-2 rounded ${activeMenu === 'map' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveMenu('map')}
        >
          현재 상담센터 지도
        </button>
      </div>
      {activeMenu === 'map' ? (
        <div className="flex-1 relative">
          <MapComponent
            userLocation={userLocation}
            centers={centers}
            onCenterClick={handleCenterClick}
          />
        </div>
      ) : (
        <div className="h-2/5 overflow-y-auto">
          <CenterList
            centers={centers}
            onCenterClick={handleCenterClick}
            userLocation={userLocation}
          />
        </div>
      )}
    </div>
  )
} 