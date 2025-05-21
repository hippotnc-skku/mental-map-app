import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface Center {
  name: string
  lat: number
  lng: number
  phone: string
  website: string
  region?: string // 시도 정보 추가
  description?: string // 설명 필드 추가
  distance_m: number
}

interface CenterListProps {
  centers: Center[]
  onCenterClick: (center: Center) => void
  userLocation: { lat: number; lng: number } | null
}

// 두 지점 간의 거리를 계산하는 함수 (km 단위)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371 // 지구 반경 (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const CenterList: React.FC<CenterListProps> = ({ centers, onCenterClick, userLocation }) => {
  const [apiCenters, setApiCenters] = useState<Center[]>([])

  useEffect(() => {
    const fetchCenters = async () => {
      if (userLocation) {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/centers`, {
            params: { lat: userLocation.lat, lng: userLocation.lng, radius: 500000 },
          })
          setApiCenters(res.data)
        } catch (error) {
          console.error('Error fetching centers:', error)
        }
      }
    }

    fetchCenters()
  }, [userLocation])

  // 현재 위치 반경 10km 내 상담센터 필터링
  const nearbyCenters = userLocation
    ? apiCenters.filter((center) => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          center.lat,
          center.lng
        )
        return distance <= 10
      })
    : []

  // 시도별 상담센터 그룹화
  const centersByRegion = apiCenters.reduce((acc, center) => {
    const region = center.region || '기타'
    if (!acc[region]) {
      acc[region] = []
    }
    acc[region].push(center)
    return acc
  }, {} as { [key: string]: Center[] })

  // 조회 결과 콘솔 출력
  useEffect(() => {
    console.log('내 주변 상담센터(반경 10km):', nearbyCenters)
    console.log('시도별 상담센터:', centersByRegion)
  }, [nearbyCenters, centersByRegion])

  const renderCenterItem = (center: Center) => (
    <li
      key={center.name}
      className="mb-2 p-2 border rounded cursor-pointer hover:bg-gray-100"
      onClick={() => onCenterClick(center)}
    >
      <strong>{center.name}</strong>
      <br />
      <a href={`tel:${center.phone.replace(/-/g, '')}`} className="text-blue-500">
        📞 {center.phone}
      </a>
      <br />
      <a href={center.website} target="_blank" rel="noopener noreferrer" className="text-blue-500">
        🌐 홈페이지
      </a>
      {center.description && (
        <>
          <br />
          <p className="text-sm text-gray-600 mt-1">{center.description}</p>
        </>
      )}
    </li>
  )

  return (
    <div className="space-y-4">
      {nearbyCenters.map((center, index) => (
        <div key={index} className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold">{center.name}</h2>
          <p className="text-gray-600">{center.region}</p>
          <p className="text-sm text-gray-500">
            {center.distance_m ? `${Math.round(center.distance_m)}m` : '거리 정보 없음'}
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-sm">
              <span className="font-medium">전화:</span> {center.phone || '정보 없음'}
            </p>
            {center.website && (
              <p className="text-sm">
                <span className="font-medium">웹사이트:</span>{' '}
                <a
                  href={center.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {center.website}
                </a>
              </p>
            )}
            {center.description && (
              <p className="text-sm text-gray-600 mt-2">{center.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default CenterList 