import { useEffect, useState } from 'react'
import { getCenters } from '../utils/api'
import Map from '../components/Map'
import Link from 'next/link'

export default function MapPage() {
  const [centers, setCenters] = useState([])
  const [userLocation, setUserLocation] = useState({ lat: 37.5665, lng: 126.9780 })
  const [currentRadius, setCurrentRadius] = useState(10000)
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
        const response = await getCenters(userLocation.lat, userLocation.lng, currentRadius)
        setCenters(response.data || [])
      } catch (err) {
        setError('센터 정보를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }
    fetchCentersWithLocation()
  }, [userLocation, currentRadius, locationLoaded])

  const handleRadiusChange = (radius) => setCurrentRadius(radius)

  return (
    <div className="flex h-screen">
      <div className="w-full">
        <div className="flex justify-between items-center p-4">
          <h1 className="text-2xl font-bold">내 주변 심리센터</h1>
          <Link href="/centers" className="text-blue-500 underline">리스트로 보기</Link>
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {loading ? <div>로딩 중...</div> : (
          <Map
            centers={centers}
            userLocation={userLocation}
            onRadiusChange={handleRadiusChange}
            currentRadius={currentRadius}
          />
        )}
      </div>
    </div>
  )
} 