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
        setCenters(response.data || [])
      } catch (err) {
        setError('센터 정보를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }
    fetchCentersWithLocation()
  }, [userLocation, locationLoaded])

  // 거리순 정렬 후 3개만 추출
  const top3Centers = [...centers]
    .sort((a, b) => (a.distance_m ?? 0) - (b.distance_m ?? 0))
    .slice(0, 3)

  return (
    <div className="flex h-screen">
      <div className="w-full p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">주변 심리센터</h1>
          <Link href="/map" className="text-blue-500 underline">내 주변 지도 보기</Link>
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {loading ? <div>로딩 중...</div> : <CenterList centers={top3Centers} />}
      </div>
    </div>
  )
} 