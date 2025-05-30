# 심리상담센터 위치 기반 서비스

## 주요 변경사항 (2024-05)

- 주변 심리센터(3개) + 전국 심리센터(지역별, 가로 아코디언) UI 제공
- 지도에서 검색 반경(최대 1000km) 자동 확대/축소 및 마커 표시
- 센터 전화번호 클릭 시 바로 전화 연결(tel: 링크)
- TypeScript 빌드 오류 대응 (API 응답 타입 단언)
- 프론트엔드 주요 페이지:
  - `/` : 메인 네비게이션
  - `/centers` : 주변 심리센터(20km반경조회 결과 -> 3개 노출) + 전국 심리센터(지역별, 가로 아코디언)
  - `/map` : 내 주변 심리센터 지도(검색 반경 자동, 마커, 반경별 API 요청)

## 기술 스택

### Backend

- Python
- FastAPI
- PostgreSQL with PostGIS
- Docker

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Kakao Maps API

## 프로젝트 구조

```
mental-map-app/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   └── database.py
│   ├── Dockerfile
│   ├── Dockerfile_postgis
│   ├── requirements.txt
│   └── env.dev
├── frontend/
│   ├── components/
│   │   └── Map.tsx
│   ├── pages/
│   │   └── index.tsx
│   ├── styles/
│   │   └── globals.css
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── env.local
│  
└── README.md
```

## 설치 및 실행 방법

### Backend 설정

1. Python 가상환경 생성 및 활성화

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. 의존성 설치

```bash
pip install -r requirements.txt
```

3. 환경 변수 설정

```bash
cp env.dev .env
```

4. 데이터베이스 설정

```bash
# PostgreSQL과 PostGIS가 설치되어 있어야 합니다
# 데이터베이스 생성 및 마이그레이션
# ./crawling/dockercompose.,yml 참고
```

5. 서버 실행

```bash
uvicorn app.main:app --reload
```

### Frontend 설정

1. 의존성 설치

```bash
cd frontend
npm install
```

2. 환경 변수 설정

- `.env.local` 파일 생성

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_KEY=api_key_mentalcentermap
NEXT_PUBLIC_KAKAO_MAP_KEY=your_kakao_map_key
```

3. 개발 서버 실행

```bash
npm run dev
```

## Docker를 이용한 실행

### Backend

```bash
cd backend
docker build -t mental-map-backend .
docker run -p 8002:8000 mental-map-backend
```

### Frontend

```bash
cd frontend
docker build -t mental-map-frontend .
docker run -p 8003:3000 mental-map-frontend
```

## 주요 기능

1. 현재 위치 기반 심리상담센터 검색
   - 사용자의 현재 위치를 자동으로 감지
   - 반경 내의 심리상담센터 표시

2. 지도 인터랙션
   - 지도 확대/축소에 따른 검색 반경 자동 조정
   - 센터 마커 클릭 시 상세 정보 표시
   - 센터 목록과 지도 연동

3. 센터 정보 표시
   - 센터명, 전화번호, 웹사이트
   - 현재 위치로부터의 거리
   - 마우스 오버 시 인포윈도우 표시

## API 엔드포인트

### GET /api/v1/centers

- 현재 위치 기반 심리상담센터 검색
- Query Parameters:
  - lat: 위도
  - lng: 경도
  - radius: 검색 반경 (미터)

## 환경 변수

### Backend (.env.dev)

```
DATABASE_URL=postgresql://user:password@localhost:5432/mental_map
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8003
NEXT_PUBLIC_KAKAO_MAP_KEY=your_kakao_map_key
```

## 개발 가이드

1. 코드 스타일
   - Backend: PEP 8 준수
   - Frontend: ESLint, Prettier 설정 사용

2. Git 커밋 메시지
   - feat: 새로운 기능
   - fix: 버그 수정
   - docs: 문서 수정
   - style: 코드 포맷팅
   - refactor: 코드 리팩토링
   - test: 테스트 코드
   - chore: 빌드 업무 수정

## 라이선스

MIT License

## Jenkins 배포 설정

### 1. Jenkins 파이프라인 생성

1. Jenkins 대시보드에서 "새로운 Item" 클릭
2. 이름 입력 (예: `mental-map-app`)
3. "Pipeline" 선택
4. "OK" 클릭

### 2. 파이프라인 기본 설정

1. "General" 섹션에서:
   - "This project is parameterized" 체크
   - "Add Parameter" > "Choice Parameter" 선택
   - Name: `DEPLOY_TARGET`
   - Choices:

     ```
     frontend
     backend
     both
     ```

   - Description: "Select deployment target"

### 3. 빌드 트리거 설정

1. "Build Triggers" 섹션에서:
   - "GitHub hook trigger for GITScm polling" 체크 (GitHub 웹훅 사용 시)
   - 또는 "Poll SCM" 체크하고 스케줄 설정 (예: `H/5 * * * *` - 5분마다)

### 4. 파이프라인 스크립트 설정

1. "Pipeline" 섹션에서:
   - "Pipeline script from SCM" 선택
   - SCM: "Git" 선택
   - Repository URL: `https://github.com/hippotnc-skku/mental-map-app.git`
   - Credentials: `github-token` 선택
   - Branch Specifier: `*/main` (또는 사용하는 브랜치)
   - Script Path: `Jenkinsfile`

### 5. Credentials 설정

1. "Manage Jenkins" > "Credentials" > "System" > "Global credentials" > "Add Credentials"
2. 프론트엔드 환경 변수:
   - Kind: "Secret text"
   - Scope: "Global"
   - ID: `mental-map-frontend-env-vars`
   - Secret:

     ```json
     {
         "NEXT_PUBLIC_API_URL": "https://adhd.hippotnc.kr:454",
         "KAKAO_API_KEY": "your-kakao-api-key"
     }
     ```

3. 백엔드 환경 변수:
   - Kind: "Secret text"
   - Scope: "Global"
   - ID: `mental-map-backend-env-vars`
   - Secret:

     ```json
     {
         "DATABASE_URL": "postgresql+asyncpg://postgres:postgres@localhost:5432/mental_map",
         "SECRET_KEY": "your-secret-key",
         "ALGORITHM": "HS256",
         "ACCESS_TOKEN_EXPIRE_MINUTES": 30
     }
     ```

### 6. 필요한 플러그인 설치

1. "Manage Jenkins" > "Plugins" > "Available" 탭
2. 다음 플러그인 설치:
   - Pipeline
   - Git
   - Credentials
   - NodeJS
   - Python

### 7. Node.js 설정

1. "Manage Jenkins" > "Global Tool Configuration"
2. "NodeJS" 섹션에서:
   - "Add NodeJS" 클릭
   - Name: `nodejs`
   - Version: 최신 LTS 버전 선택

### 8. Python 설정

1. "Manage Jenkins" > "Global Tool Configuration"
2. "Python" 섹션에서:
   - "Add Python" 클릭
   - Name: `python3.11`
   - Version: 3.11 선택

### 9. 시스템 설정

1. "Manage Jenkins" > "System"
2. "Global properties" 섹션에서:
   - "Environment variables" 체크
   - 필요한 환경 변수 추가

### 10. 파이프라인 실행

1. 파이프라인 페이지에서 "Build with Parameters" 클릭
2. `DEPLOY_ENV` 선택 (dev/staging/prod)
3. `DEPLOY_TARGET` 선택 (frontend/backend/both)
4. "Build" 클릭

### 11. 모니터링

1. 파이프라인 실행 중 "Console Output"에서 진행 상황 확인
2. "Blue Ocean" 뷰에서 시각적으로 파이프라인 진행 상황 확인 가능

### 주의사항

1. Jenkins 서버에 필요한 도구 설치:

   ```bash
   # Node.js
   curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Python
   sudo apt-get install python3.11 python3.11-venv

   # jq
   sudo apt-get install jq

   # PM2
   sudo npm install -g pm2
   ```

2. 권한 설정:
   - Jenkins 사용자가 필요한 디렉토리에 대한 쓰기 권한 필요
   - PM2 실행 권한 필요

3. 보안:
   - Credentials는 반드시 Jenkins Credentials Store에 저장
   - 민감한 정보는 환경 변수로 관리
   - GitHub 토큰은 최소한의 권한만 부여

# 심리상담센터 API 서버

이 프로젝트는 심리상담센터 정보를 제공하는 REST API 서버입니다.

## API 명세서

### 1. 테스트 서버(개발서버)
     - front        : http://3.38.5.248:8003
       - 주변심리센타 리스트 : 현재 위치에서 반경 20km 조회해서 3개만 출력
       - 내 주변 지도 : 검색 반경에 따라 센타 조회 후 지도 출력 
     - backend(API) : http://3.38.5.248:8002/docs  


### 1. 심리상담센터 목록 조회
- **엔드포인트**: `GET /api/v1/centers`
- **인증**: API Key 필요 (Authorization 헤더)
- **Query Parameters**:
  - `lat` (필수): 위도
  - `lng` (필수): 경도
  - `radius` (선택): 검색 반경 (미터 단위, 기본값: 20000m)
- **응답**: 
  ```json
  [
    {
      "id": "센터 ID",
      "name": "센터명",
      "phone": "전화번호",
      "website": "웹사이트",
      "description": "설명",
      "lat": "위도",
      "lng": "경도",
      "region": "지역",
      "distance_m": "거리(미터)"
    }
  ]
  ```

### 2. 심리상담센터 상세 조회
- **엔드포인트**: `GET /api/v1/centers/{center_id}`
- **인증**: API Key 필요 (Authorization 헤더)
- **Path Parameters**:
  - `center_id`: 조회할 센터의 ID
- **응답**: 
  ```json
  {
    "id": "센터 ID",
    "name": "센터명",
    "phone": "전화번호",
    "website": "웹사이트",
    "description": "설명",
    "lat": "위도",
    "lng": "경도",
    "region": "지역"
  }
  ```

## 인증
모든 API 요청에는 유효한 API Key가 필요합니다. API Key는 요청 헤더의 `Authorization` 필드에 포함되어야 합니다.

## 에러 응답
- 403: 잘못된 API Key
- 404: 요청한 리소스를 찾을 수 없음
