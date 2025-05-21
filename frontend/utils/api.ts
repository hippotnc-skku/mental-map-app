const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'api_key_mentalcentermap';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('API request failed:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

// 심리센터 목록 조회
export async function getCenters(lat: number, lng: number, radius: number = 2000) {
  return fetchApi(`/api/v1/centers?lat=${lat}&lng=${lng}&radius=${radius}`);
}

// 특정 심리센터 조회
export async function getCenter(centerId: number) {
  return fetchApi(`/api/v1/centers/${centerId}`);
} 