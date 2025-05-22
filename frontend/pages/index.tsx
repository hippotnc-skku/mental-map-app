import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold mb-8">심리센터 서비스</h1>
      <div className="space-x-4">
        <Link href="/centers" className="text-blue-500 underline text-xl">주변 심리센터 리스트</Link>
        <br />
        <Link href="/map" className="text-blue-500 underline text-xl">내 주변 지도</Link>
      </div>
    </div>
  )
} 