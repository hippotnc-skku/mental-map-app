import requests
from typing import TypedDict, Optional
import os
import sys
import logging
from dotenv import load_dotenv

# 현재 파일의 디렉토리 경로
current_dir = os.path.dirname(os.path.abspath(__file__))
# 프로젝트 루트 디렉토리 경로
root_dir = os.path.dirname(current_dir)
# backend/app 디렉토리 경로
backend_app_dir = os.path.join(root_dir, 'backend', 'app')

# backend/app 디렉토리를 Python 경로에 추가
sys.path.append(backend_app_dir)

from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Coordinates(TypedDict):
    lat: float
    lng: float

def get_coordinates(address: str) -> Optional[Coordinates]:
    logger.info(f"Searching coordinates for address: {address}")
    try:
        kakao_api_key = settings.KAKAO_API_KEY
        kakao_api_url = "https://dapi.kakao.com/v2/local/search/address.json"
        
        headers = {
            "Authorization": f"KakaoAK {kakao_api_key}",
            "Content-Type": "application/json"
        }
        params = {
            "query": address,
            "size": 1
        }
        
        logger.info(f"Making request to Kakao API with headers: {headers}")
        logger.info(f"Request URL: {kakao_api_url}")
        logger.info(f"Request params: {params}")
        
        response = requests.get(kakao_api_url, headers=headers, params=params)
        
        # 응답 상태 코드 확인
        if response.status_code == 401:
            logger.error(f"Unauthorized: Please check your Kakao API key and application settings")
            logger.error(f"Response headers: {response.headers}")
            logger.error(f"Response body: {response.text}")
            return None
            
        response.raise_for_status()
        
        data = response.json()
        if not data.get('documents'):
            logger.warning(f"No results found for address: {address}")
            return None
            
        doc = data['documents'][0]
        coordinates = {
            'lat': float(doc['y']),
            'lng': float(doc['x'])
        }
        logger.info(f"Found coordinates: {coordinates}")
        return coordinates
    except requests.exceptions.RequestException as e:
        logger.error(f"API request error: {e}")
        if hasattr(e.response, 'text'):
            logger.error(f"Error response: {e.response.text}")
        return None
    except (KeyError, ValueError) as e:
        logger.error(f"Data processing error: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return None

# 사용 예시:
if __name__ == "__main__":
    test_address = "용인시 수지구 문정로 7번길 14 . 3층 허그맘"
    coordinates = get_coordinates(test_address)
    if coordinates:
        print(f"위도: {coordinates['lat']}, 경도: {coordinates['lng']}")
    else:
        print("좌표를 찾을 수 없습니다.")
