

# Jenkins 설정 가이드

## 개요

이 문서는 Mental Map App의 Jenkins CI/CD 파이프라인 설정과 Docker 환경 구성에 대한 가이드입니다.

## 사전 요구사항

- Docker
- Docker Compose
- Git

## Jenkins 컨테이너 설정

### 1. Jenkins 이미지 빌드

Jenkins 이미지는 다음 구성요소가 포함된 커스텀 이미지를 사용합니다:

- Jenkins LTS
- Docker CE
- Node.js 18.x
- Yarn
- PM2
- Python 3
- 기타 필요한 도구들

### 2. Docker Compose 설정

```yaml
version: '3.8'

services:
  jenkins:
    build:
      context: .
      dockerfile: Dockerfile.jenkins
    container_name: jenkins
    restart: unless-stopped
    ports:
      - "8180:8080"
      - "50000:50000"
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
      - /usr/bin/docker:/usr/bin/docker
    privileged: true
    environment:
      - TZ=Asia/Seoul
    networks:
      - jenkins_network
```

### 3. Jenkins 시작하기

```bash
# Jenkins 컨테이너 시작
docker-compose up -d

# 초기 관리자 비밀번호 확인
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

## CI/CD 파이프라인

### 1. 파이프라인 구성

- 프론트엔드와 백엔드를 Docker 컨테이너로 배포
- 환경 변수는 Jenkins Credentials로 관리
- 배포 대상 선택 가능 (frontend, backend, both)

### 2. 환경 변수 설정

Jenkins Credentials에 다음 두 가지 환경 변수 설정이 필요합니다:

1. `mental-map-frontend-env-vars`: 프론트엔드 환경 변수
2. `mental-map-backend-env-vars`: 백엔드 환경 변수

### 3. GitHub 연동

- GitHub 토큰을 Jenkins Credentials에 `github-token`으로 등록
- 웹훅 설정으로 자동 빌드 트리거 구성

## Docker 컨테이너 관리

### 1. 프론트엔드 컨테이너

- 포트: 8003
- 이미지: mental-map-frontend:latest
- 컨테이너 이름: mental-map-frontend

### 2. 백엔드 컨테이너

- 포트: 8002
- 이미지: mental-map-backend:latest
- 컨테이너 이름: mental-map-backend

### 3. 컨테이너 관리 명령어

```bash
# 컨테이너 상태 확인
docker ps

# 로그 확인
docker logs mental-map-frontend
docker logs mental-map-backend

# 컨테이너 재시작
docker restart mental-map-frontend
docker restart mental-map-backend
```

## 문제 해결

### 1. Docker 권한 문제

Jenkins 컨테이너에서 Docker 명령어 실행 시 권한 오류가 발생하는 경우:

```bash
# Jenkins 컨테이너 재시작
docker-compose restart jenkins
```

### 2. 환경 변수 문제

환경 변수 관련 오류가 발생하는 경우:

1. Jenkins Credentials에서 환경 변수 JSON 형식 확인
2. 파이프라인 로그에서 환경 변수 파싱 오류 확인

### 3. 빌드 실패

빌드 실패 시 다음 단계 확인:

1. Jenkins 파이프라인 로그 확인
2. Docker 이미지 빌드 로그 확인
3. 컨테이너 로그 확인

## 유지보수

### 1. Jenkins 업데이트

```bash
# Jenkins 이미지 재빌드
docker-compose build jenkins

# 컨테이너 재시작
docker-compose up -d
```

### 2. 볼륨 백업

```bash
# Jenkins 홈 디렉토리 백업
docker run --rm -v jenkins_home:/source -v $(pwd):/backup alpine tar -czf /backup/jenkins_home.tar.gz -C /source .
```

### 3. 로그 관리

```bash
# Jenkins 로그 확인
docker logs jenkins

# 파이프라인 로그 확인
# Jenkins 웹 인터페이스 > 파이프라인 > 빌드 번호 > Console Output
```


# Jenkins 배포 가이드 (최신 ECR/멀티환경/원격배포 반영)

## 최신 Jenkins 배포 구조

- 프론트엔드/백엔드 모두 **AWS ECR**에 도커 이미지를 push
- 각 환경(dev, staging, prod)별로 태그 관리
- 원격 서버(ubuntu)에 SSH로 접속해 ECR에서 이미지를 pull, 컨테이너 실행
- 환경 변수는 Jenkins Credentials(JSON)로 관리, 파이썬으로 .env 파일 생성
- ssh-private-key도 Jenkins Credentials로 관리

### Jenkinsfile 주요 단계

1. **Build & Push Frontend Image**
    - frontend 디렉토리에서 환경변수 파일 생성 (env.json → .env.local)
    - 도커 이미지 빌드 및 ECR push (frontend-<env>-<빌드시간> 태그)
2. **Build & Push Backend Image**
    - backend 디렉토리에서 환경변수 파일 생성 (env.json → .env.<env>)
    - 도커 이미지 빌드 및 ECR push (backend-<env>-<빌드시간> 태그)
3. **Deploy to Remote Server**
    - SSH로 원격 서버 접속, .env 파일 scp, ECR 로그인, 이미지 pull, 컨테이너 실행
    - ssh-keyscan으로 known_hosts 등록

### Jenkins Credentials 필요 목록
- AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
- ssh-private-key
- mental-map-frontend-env-vars (JSON)
- mental-map-backend-env-dev-vars, ... (환경별 JSON)

### 예시 스크립트 (핵심 부분)

```groovy
// 환경변수 파일 생성 (frontend)
writeFile file: 'env.json', text: ENV_VARS_JSON
sh '''
python3 -c '
import json
data = json.load(open("env.json"))
with open(".env.local", "w") as f:
    for k, v in data.items():
        f.write(f"{k}={v}\\n")'
rm env.json
'''

// 도커 빌드/푸시 (frontend)
sh """
docker build -t mental-map-frontend:${BUILD_TIME} . && \
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL && \
docker tag mental-map-frontend:${BUILD_TIME} $ECR_URL:frontend-${params.DEPLOY_ENV}-${BUILD_TIME} && \
docker push $ECR_URL:frontend-${params.DEPLOY_ENV}-${BUILD_TIME}
"""

// 원격 배포 (예시)
sh """
scp -i $SSH_KEY_FILE frontend/.env.local ubuntu@${TARGET_SERVER}:/home/ubuntu/ && \
ssh -i $SSH_KEY_FILE ubuntu@${TARGET_SERVER} "
  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL && 
  docker pull $ECR_URL:frontend-${params.DEPLOY_ENV}-${BUILD_TIME} && 
  docker stop mental-map-frontend || true && 
  docker rm mental-map-frontend || true && 
  docker run -d --name mental-map-frontend --restart unless-stopped -p 8003:3000 \
    --env-file /home/ubuntu/.env.local $ECR_URL:frontend-${params.DEPLOY_ENV}-${BUILD_TIME}"
"""
```

---