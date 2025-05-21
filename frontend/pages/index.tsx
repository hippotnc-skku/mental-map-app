import { useEffect, useState } from 'react'
import { getCenters } from '../utils/api'
import Map from '../components/Map'
import CenterList from '../components/CenterList'

interface Center {
  name: string
  phone: string
  website: string
  description: string
  lat: number
  lng: number
  region: string
  distance_m: number
}

interface MapProps {
  centers: Center[];
  userLocation: { lat: number; lng: number } | null;
}

export default function Home() {
  const [centers, setCenters] = useState<Center[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 37.5665,
    lng: 126.9780
  })

  useEffect(() => {
    // 사용자 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('위치 정보 가져옴:', position.coords)
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('위치 정보 가져오기 실패:', error)
          // 위치 정보를 가져오지 못해도 기본 위치(서울)를 사용
          setUserLocation({
            lat: 37.5665,
            lng: 126.9780
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      )
    } else {
      console.log('Geolocation을 지원하지 않는 브라우저입니다.')
      // 기본 위치(서울) 사용
      setUserLocation({
        lat: 37.5665,
        lng: 126.9780
      })
    }
  }, [])

  useEffect(() => {
    async function fetchCenters() {
      setLoading(true)
      setError(null)

      try {
        const response = await getCenters(userLocation.lat, userLocation.lng)
        if (response.error) {
          throw new Error(response.error)
        }
        if (response.data) {
          setCenters(response.data as Center[])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '심리센터 정보를 가져오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchCenters()
  }, [userLocation])

  return (
    <div className="flex h-screen">
      <div className="w-1/3 p-4 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">주변 심리센터</h1>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {loading ? (
          <div>로딩 중...</div>
        ) : (
          <CenterList centers={centers} />
        )}
      </div>
      <div className="w-2/3">
        <Map centers={centers} userLocation={userLocation} />
      </div>
    </div>
  )
} 