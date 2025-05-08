import requests
from bs4 import BeautifulSoup
import json
import time
from typing import List, Dict
import logging
import sys
import os
import csv
from datetime import datetime

# backend/app 디렉토리를 Python 경로에 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend', 'app'))
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HugMomCenterCrawler:
    def __init__(self):
        self.base_url = "https://www.hugmom.co.kr/hugmom/center/index.html"
        self.kakao_api_key = settings.KAKAO_API_KEY
        self.kakao_api_url = "https://dapi.kakao.com/v2/local/search/address.json"
        
    def get_page_url(self, page: int) -> str:
        return f"{self.base_url}?page={page}&plist=&find_field=jijumname&find_word=&find_state=&find_ordby=&conf=&jijum_uid=&areainfo=&city=#branchAnchor"

    def get_coordinates(self, address: str) -> tuple:
        try:
            headers = {
                "Authorization": f"KakaoAK {self.kakao_api_key}"
            }
            params = {
                "query": address,
                "analyze_type": "similar"
            }
            response = requests.get(self.kakao_api_url, headers=headers, params=params)
            response.raise_for_status()
            
            result = response.json()
            if result["documents"]:
                location = result["documents"][0]
                return float(location["y"]), float(location["x"])
            return None, None
            
        except Exception as e:
            logger.error(f"Error getting coordinates for address {address}: {str(e)}")
            return None, None

    def get_centers_from_page(self, page: int) -> List[Dict]:
        url = self.get_page_url(page)
        try:
            response = requests.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            centers = []
            center_items = soup.select('ul.branch_search_list li.item')
            
            print(f"page: {page} - found {len(center_items)} centers")
            
            for item in center_items:
                try:
                    name = item.select_one('p.tit').text.strip()
                    phone = item.select_one('p.tel').text.strip()
                    address = item.select_one('p.add').text.strip().split('\n')[0]
                    detail_link = item.select_one('a.btn')
                    detail_url = detail_link['href'] if detail_link else None
                    
                    # 카카오 API로 좌표 가져오기
                    lat, lng = self.get_coordinates(address)
                    if lat and lng:
                        print(f"Got coordinates for {name}: {lat}, {lng}")
                    else:
                        print(f"Failed to get coordinates for {name}")
                    
                    center_info = {
                        "name": name,
                        "phone": phone,
                        "address": address,
                        "detail_url": detail_url,
                        "lat": lat,
                        "lng": lng
                    }
                    centers.append(center_info)
                    print(f"Added center: {name}")
                    
                    # API 호출 제한을 위한 딜레이
                    time.sleep(0.1)
                    
                except Exception as e:
                    logger.error(f"Error parsing center info: {str(e)}")
                    continue
                    
            return centers
            
        except Exception as e:
            logger.error(f"Error fetching page {page}: {str(e)}")
            return []

    def crawl_all_centers(self) -> List[Dict]:
        all_centers = []
        for page in range(1, 6):
            logger.info(f"Crawling page {page}...")
            centers = self.get_centers_from_page(page)
            all_centers.extend(centers)
            time.sleep(1)
        return all_centers

    def save_to_json(self, centers: List[Dict], filename: str = "hugmom_centers.json"):
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(centers, f, ensure_ascii=False, indent=2)
        logger.info(f"Saved {len(centers)} centers to {filename}")

    def save_to_csv(self, centers: List[Dict], filename: str = None):
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"hugmom_centers_{timestamp}.csv"
            
        with open(filename, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=["name", "phone", "address", "detail_url", "lat", "lng"])
            writer.writeheader()
            writer.writerows(centers)
        logger.info(f"Saved {len(centers)} centers to {filename}")

if __name__ == "__main__":
    crawler = HugMomCenterCrawler()
    centers = crawler.crawl_all_centers()
    crawler.save_to_json(centers)
    crawler.save_to_csv(centers)
