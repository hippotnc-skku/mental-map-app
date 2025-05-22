import { useEffect, useState } from 'react'
import { getCenters } from '../utils/api'
import CenterList from '../components/CenterList'
import Link from 'next/link'

export default function CentersPage() {
  const [centers, setCenters] = useState([])
  const [userLocation, setUserLocation] = useState({ lat: 37.5665, lng: 126.9780 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationLoaded, setLocationLoaded] = useState(false)

  // 전국 센터
  const [allCenters, setAllCenters] = useState([])
  const [regionOpen, setRegionOpen] = useState<string | null>(null)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setLocationLoaded(true)
        },
        () => {
          setLocationLoaded(true)
        }
      )
    } else {
      setLocationLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!locationLoaded) return
    const fetchCentersWithLocation = async () => {
      setLoading(true)
      try {
        const response = await getCenters(userLocation.lat, userLocation.lng, 20000)
        setCenters((response.data as any[]) || [])
      } catch (err) {
        setError('센터 정보를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }
    fetchCentersWithLocation()
  }, [userLocation, locationLoaded])

  // 전국 센터 데이터(반경 1000km 등으로 요청)
  useEffect(() => {
    const fetchAllCenters = async () => {
      try {
        const response = await getCenters(37.5665, 126.9780, 1000000)
        setAllCenters((response.data as any[]) || [])
      } catch (err) {
        // 무시
      }
    }
    fetchAllCenters()
  }, [])

  // 거리순 정렬 후 3개만 추출
  const top3Centers = [...centers]
    .sort((a, b) => (a.distance_m ?? 0) - (b.distance_m ?? 0))
    .slice(0, 3)

  // 지역별 분류
  const regions = Array.from(new Set(allCenters.map(c => c.region).filter(Boolean)))
  const centersByRegion = regions.reduce((acc, region) => {
    acc[region] = allCenters.filter(c => c.region === region)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="flex flex-col h-screen">
      <div className="w-full p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">[주변 심리센터]</h1>
          <Link href="/map" className="text-blue-500 underline">내 주변 지도 보기</Link>
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {loading ? <div>로딩 중...</div> : <CenterList centers={top3Centers} />}

        {/* 전국 심리센터 섹션 */}
        <div className="mt-10">
          <h1 className="text-2xl font-bold">[전국 심리센터]</h1>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {regions.map(region => (
              
              <button
                key={region}
                className={`px-4 py-2 font-semibold rounded border ${regionOpen === region ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => setRegionOpen(regionOpen === region ? null : region)}
              >
                {region}
              </button>
            ))}
          </div>
          {regionOpen && (
            <div className="p-4">
              <CenterList centers={centersByRegion[regionOpen]} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 