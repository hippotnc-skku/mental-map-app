import React from 'react'

interface Center {
  name: string
  lat: number
  lng: number
  phone: string
  website: string
}

interface CenterListProps {
  centers: Center[]
  onCenterClick: (center: Center) => void
  userLocation: { lat: number; lng: number } | null
}

const CenterList: React.FC<CenterListProps> = ({ centers, onCenterClick, userLocation }) => {
  return (
    <div className="p-4">
      <ul>
        {centers.map((center) => (
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
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CenterList 