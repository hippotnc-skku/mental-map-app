import React from 'react'

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

interface CenterListProps {
  centers: Center[]
}

const CenterList: React.FC<CenterListProps> = ({ centers }) => {
  return (
    <div className="space-y-4">
      {centers.map((center, index) => (
        <div key={index} className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold">{center.name}</h2>
          {/* <p className="text-gray-600">{center.region}</p>
          <p className="text-sm text-gray-500">
            {center.distance_m ? `${Math.round(center.distance_m)}m` : '거리 정보 없음'}
          </p> */}
          <div className="mt-2 space-y-1">
            <p className="text-sm">
              <span className="font-medium">전화:</span> {center.phone ? (
                <a href={`tel:${center.phone.replace(/-/g, '')}`} className="text-blue-600 underline ml-1">{center.phone}</a>
              ) : '정보 없음'}
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