import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center">
      지도를 불러오는 중...
    </div>
  ),
})

export default function Home() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <h1 className="text-4xl font-bold mb-8">Mental Map</h1>
      <p className="text-xl mb-8">정신건강 시설 지도 서비스</p>
      <div className="w-full max-w-4xl">
        {isClient && <Map />}
      </div>
    </main>
  )
} 