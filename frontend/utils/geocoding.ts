import axios from 'axios'

interface Coordinates {
  lat: number
  lng: number
}

export const getCoordinates = async (address: string): Promise<Coordinates | null> => {
  try {
    const response = await axios.get(
      `https://dapi.kakao.com/v2/local/search/address.json`,
      {
        params: {
          query: address,
        },
        headers: {
          Authorization: `KakaoAK ${process.env.NEXT_PUBLIC_KAKAO_API_KEY}`,
        },
      }
    )

    if (response.data.documents.length > 0) {
      const { x, y } = response.data.documents[0]
      return {
        lat: parseFloat(y),
        lng: parseFloat(x),
      }
    }
    return null
  } catch (error) {
    console.error('Error getting coordinates:', error)
    return null
  }
}

// 사용 예시:
// const coordinates = await getCoordinates('서울시 강남구 역삼동')
// if (coordinates) {
//   console.log(`위도: ${coordinates.lat}, 경도: ${coordinates.lng}`)
// } 