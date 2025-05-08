'use client'

import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'

interface Center {
  name: string
  phone: string
  website: string
  lat: number
  lng: number
  distance_m: number
}

interface UserLocation {
  lat: number
  lng: number
}

interface MarkerInfo {
  marker: any
  infowindow: any
}

declare global {
  interface Window {
    kakao: any
  }
}

export default function Map() {
  const [map, setMap] = useState<any>(null)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [centers, setCenters] = useState<Center[]>([])
  const [error, setError] = useState<string | null>(null)
  const [currentRadius, setCurrentRadius] = useState<number>(2000)
  const [hoveredCenter, setHoveredCenter] = useState<string | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<any[]>([])
  const infowindowsRef = useRef<any[]>([])
  const currentInfowindowRef = useRef<any>(null)
  const markersMapRef = useRef<Record<string, MarkerInfo>>({})

  // 거리를 km 단위로 변환하는 함수
  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`
    }
    return `${meters}m`
  }

  // 지도 레벨에 따른 반경 계산 함수
  const getRadiusByLevel = (level: number): number => {
    // 지도 레벨별 대략적인 반경 (미터 단위)
    const radiusMap: { [key: number]: number } = {
      1: 100,      // 100m
      2: 250,      // 250m
      3: 500,      // 500m
      4: 1000,     // 1km
      5: 2500,     // 2.5km
      6: 5000,     // 5km
      7: 10000,    // 10km
      8: 25000,    // 25km
      9: 50000,    // 50km
      10: 100000,  // 100km
      11: 250000,  // 250km
      12: 500000,  // 500km (서울-제주도 거리 포함)
      13: 1000000  // 1000km
    }
    return radiusMap[level] || 2000
  }

  // 마커 제거 함수
  const removeMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []
  }

  // 두 지점 간의 거리를 계산하는 함수 (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // 지구의 반지름 (미터)
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // 미터 단위 거리
  }

  // 검색 반경에 따른 마커 크기 계산 함수
  const getMarkerSize = (radius: number): number => {
    if (radius <= 1000) return 64;        // 1km 이하: 기본 크기
    if (radius <= 5000) return 48;        // 5km 이하: 약간 작게
    if (radius <= 10000) return 36;       // 10km 이하: 더 작게
    if (radius <= 50000) return 24;       // 50km 이하: 작게
    if (radius <= 100000) return 18;      // 100km 이하: 매우 작게
    if (radius <= 500000) return 12;      // 500km 이하: 아주 작게
    return 8;                             // 500km 초과: 가장 작게
  }

  useEffect(() => {
    const loadKakaoMap = () => {
      if (window.kakao && window.kakao.maps) {
        initMap()
        return
      }

      const script = document.createElement('script')
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=41c279bd2f87345514a0ad2b5bf91680&libraries=services&autoload=false`
      script.async = true

      script.onload = () => {
        window.kakao.maps.load(() => {
          console.log('Kakao map loaded')
          initMap()
        })
      }

      script.onerror = () => {
        setError('카카오맵을 불러오는데 실패했습니다.')
      }

      document.head.appendChild(script)
    }

    const initMap = () => {
      if (!navigator.geolocation) {
        setError('이 브라우저에서는 위치 정보를 사용할 수 없습니다.')
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setUserLocation({ lat, lng })

          if (!mapContainerRef.current) return

          const options = {
            center: new window.kakao.maps.LatLng(lat, lng),
            level: 7, // 초기 줌 레벨을 7로 설정 (10km 반경)
            minLevel: 1,
            maxLevel: 13  // 최대 줌 레벨을 13으로 설정 (1000km 반경)
          }

          const kakaoMap = new window.kakao.maps.Map(mapContainerRef.current, options)
          setMap(kakaoMap)

          // 사용자 위치 마커 추가
          new window.kakao.maps.Marker({
            map: kakaoMap,
            position: new window.kakao.maps.LatLng(lat, lng),
            title: '내 위치',
          })

          // 지도 확대/축소 이벤트 리스너 추가
          window.kakao.maps.event.addListener(kakaoMap, 'zoom_changed', () => {
            const level = kakaoMap.getLevel()
            const newRadius = getRadiusByLevel(level)
            setCurrentRadius(newRadius)
            
            // 항상 userLocation 기준으로 센터 정보 조회
            if (userLocation) {
              fetchCenters(userLocation.lat, userLocation.lng, newRadius, kakaoMap)
            }
          })

          // 초기 센터 정보 조회 (userLocation 기준)
          fetchCenters(lat, lng, currentRadius, kakaoMap)
        },
        (error) => {
          console.error('Error getting location:', error)
          setError('위치 정보를 가져오는데 실패했습니다.')
        }
      )
    }

    loadKakaoMap()
  }, [userLocation])

  const fetchCenters = async (lat: number, lng: number, radius: number, kakaoMap: any) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/centers`, {
        params: { lat, lng, radius },
      })
      
      // 각 센터의 거리 계산 (항상 내 위치 기준)
      const centersWithDistance = res.data.map((center: Center) => ({
        ...center,
        distance_m: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, center.lat, center.lng) : 0
      }));

      // 거리순으로 정렬
      centersWithDistance.sort((a: Center, b: Center) => a.distance_m - b.distance_m);
      
      setCenters(centersWithDistance)

      // 기존 마커와 인포윈도우 제거
      removeMarkers()
      infowindowsRef.current.forEach(infowindow => infowindow.close())
      infowindowsRef.current = []
      currentInfowindowRef.current = null
      markersMapRef.current = {}

      // 새로운 마커 추가
      centersWithDistance.forEach((center: Center) => {
        const marker = new window.kakao.maps.Marker({
          map: kakaoMap,
          position: new window.kakao.maps.LatLng(center.lat, center.lng),
          title: center.name
        })

        const content = `
          <div style="padding:5px;min-width:200px">
            <strong>${center.name}</strong><br/>
            <a href="tel:${center.phone.replace(/-/g, '')}" style="color: #007bff; text-decoration: none;">
              📞 ${center.phone}
            </a><br/>
            <a href="${center.website}" target="_blank" style="color: #007bff; text-decoration: none;">
              🌐 홈페이지
            </a><br/>
            거리: ${formatDistance(center.distance_m)}
          </div>
        `
        const infowindow = new window.kakao.maps.InfoWindow({
          content,
        })

        // 인포윈도우를 참조 배열에 추가
        infowindowsRef.current.push(infowindow)

        window.kakao.maps.event.addListener(marker, 'click', function () {
          // 현재 열려있는 인포윈도우가 있고, 클릭한 마커의 인포윈도우와 같다면 닫기
          if (currentInfowindowRef.current === infowindow) {
            infowindow.close()
            currentInfowindowRef.current = null
          } else {
            // 다른 인포윈도우가 열려있다면 닫기
            if (currentInfowindowRef.current) {
              currentInfowindowRef.current.close()
            }
            // 새로운 인포윈도우 열기
            infowindow.open(kakaoMap, marker)
            currentInfowindowRef.current = infowindow
          }
        })

        // 마커를 참조 배열에 추가
        markersRef.current.push(marker)
        // 마커를 Map에 저장 (센터 이름을 키로 사용)
        markersMapRef.current[center.name] = { marker, infowindow }
      })
    } catch (error) {
      console.error('Error fetching centers:', error)
      setError('센터 정보를 가져오는데 실패했습니다.')
    }
  }

  // 센터 목록 클릭 핸들러
  const handleCenterClick = (center: Center) => {
    if (!map || !userLocation) return

    const centerData = markersMapRef.current[center.name]
    if (!centerData) return

    const { marker, infowindow } = centerData

    // 지도 중심을 해당 센터로 이동
    map.setCenter(marker.getPosition())
    // 지도 레벨을 적절하게 조정
    map.setLevel(4)

    // 다른 인포윈도우가 열려있다면 닫기
    if (currentInfowindowRef.current) {
      currentInfowindowRef.current.close()
    }

    // 현재 위치 기준으로 거리 재계산
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      center.lat,
      center.lng
    )

    // 인포윈도우 내용 업데이트
    const content = `
      <div style="padding:5px;min-width:200px">
        <strong>${center.name}</strong><br/>
        <a href="tel:${center.phone.replace(/-/g, '')}" style="color: #007bff; text-decoration: none;">
          📞 ${center.phone}
        </a><br/>
        <a href="${center.website}" target="_blank" style="color: #007bff; text-decoration: none;">
          🌐 홈페이지
        </a><br/>
        거리: ${formatDistance(distance)}
      </div>
    `
    infowindow.setContent(content)

    // 인포윈도우 열기
    infowindow.open(map, marker)
    currentInfowindowRef.current = infowindow
  }

  // 센터 목록 마우스 오버 핸들러
  const handleCenterMouseEnter = (center: Center) => {
    if (!map) return

    const centerData = markersMapRef.current[center.name]
    if (!centerData) return

    const { marker, infowindow } = centerData

    // 다른 인포윈도우가 열려있다면 닫기
    if (currentInfowindowRef.current) {
      currentInfowindowRef.current.close()
    }

    // 인포윈도우 열기
    infowindow.open(map, marker)
    currentInfowindowRef.current = infowindow
    setHoveredCenter(center.name)
  }

  // 센터 목록 마우스 아웃 핸들러
  const handleCenterMouseLeave = () => {
    if (currentInfowindowRef.current) {
      currentInfowindowRef.current.close()
      currentInfowindowRef.current = null
    }
    setHoveredCenter(null)
  }

  if (error) {
    return (
      <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-center mb-2">내 주변 심리센터</h1>
      <div className="text-sm text-gray-600 text-center mb-2">
        현재 검색 반경: {formatDistance(currentRadius)}
      </div>
      <div 
        ref={mapContainerRef}
        id="map" 
        style={{ 
          width: '100%', 
          height: '500px', 
          border: '1px solid #ccc',
          backgroundColor: '#f5f5f5'
        }}
      ></div>
      <div className="p-2">
        <h2 className="font-semibold mt-4">센터 목록</h2>
        <ul>
          {centers.map((center, i) => (
            <li 
              key={i} 
              className={`mb-2 p-2 cursor-pointer rounded transition-all duration-200 ${
                hoveredCenter === center.name 
                  ? 'bg-blue-100 border-l-4 border-blue-500 shadow-md' 
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => handleCenterClick(center)}
              onMouseEnter={() => handleCenterMouseEnter(center)}
              onMouseLeave={handleCenterMouseLeave}
            >
              📍 {center.name} ({formatDistance(center.distance_m)})
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
} 