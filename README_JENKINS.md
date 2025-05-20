# Jenkins 설정 및 사용 가이드

## 1. Jenkins 설치 및 실행

### 1.1 사전 요구사항
- Docker
- Docker Compose

### 1.2 설치 및 실행
```bash
# Jenkins 컨테이너 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

### 1.3 초기 설정
1. 브라우저에서 `http://3.38.5.248:8180` 접속
2. 초기 관리자 비밀번호 확인:
```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```
3. 추천 플러그인 설치 선택
4. 관리자 계정 생성

## 2. 필수 플러그인 설치
1. Jenkins 관리 > 플러그인 관리 > 설치 가능
2. 다음 플러그인 검색 및 설치:
   - Git Integration
   - Pipeline
   - Credentials
   - Docker Pipeline
   - NodeJS

## 3. Credentials 설정
### 3.1 GitHub 토큰 설정
1. Jenkins 관리 > Credentials > System > Global credentials
2. "Add Credentials" 클릭
3. 종류: Secret text
4. ID: github-token
5. Secret: GitHub Personal Access Token 입력

### 3.2 환경 변수 설정
1. Jenkins 관리 > Credentials > System > Global credentials
2. "Add Credentials" 클릭
3. 종류: Secret text
4. ID: mental-map-frontend-env-vars
5. Secret: 프론트엔드 환경 변수 JSON 형식으로 입력
6. 동일한 방법으로 `mental-map-backend-env-vars` 생성

## 4. 파이프라인 설정
### 4.1 새 파이프라인 생성
1. Jenkins 대시보드 > 새 Item
2. 이름 입력 (예: mental-map-app)
3. Pipeline 선택
4. OK 클릭

### 4.2 파이프라인 설정
1. Pipeline 섹션에서 "Pipeline script from SCM" 선택
2. SCM: Git
3. Repository URL: https://github.com/hippotnc-skku/mental-map-app.git
4. Credentials: github-token 선택
5. Branch Specifier: */main
6. Script Path: Jenkinsfile

## 5. 파이프라인 실행
### 5.1 수동 실행
1. 파이프라인 페이지에서 "Build with Parameters" 클릭
2. DEPLOY_TARGET 선택:
   - frontend: 프론트엔드만 배포
   - backend: 백엔드만 배포
   - both: 전체 배포

### 5.2 자동 실행 (GitHub Webhook)
1. GitHub 저장소 설정 > Webhooks
2. Add webhook 클릭
3. Payload URL: http://[JENKINS_URL]/github-webhook/
4. Content type: application/json
5. Events: Push events 선택

## 6. 모니터링
### 6.1 파이프라인 상태 확인
- Jenkins 대시보드에서 파이프라인 상태 확인
- 각 단계별 로그 확인 가능

### 6.2 PM2 모니터링
```bash
# Jenkins 컨테이너 접속
docker exec -it jenkins /bin/bash

# PM2 상태 확인
pm2 status

# 로그 확인
pm2 logs
```

## 7. 문제 해결
### 7.1 일반적인 문제
1. 권한 문제
```bash
# Jenkins 컨테이너 내부에서
sudo chown -R jenkins:jenkins /var/jenkins_home
```

2. Docker 권한 문제
```bash
# 호스트 시스템에서
sudo usermod -aG docker jenkins
```

### 7.2 로그 확인
```bash
# Jenkins 로그
docker-compose logs -f jenkins

# PM2 로그
docker exec jenkins pm2 logs
```

## 8. 백업 및 복구
### 8.1 Jenkins 홈 디렉토리 백업
```bash
# 백업
docker run --rm --volumes-from jenkins -v $(pwd):/backup ubuntu tar cvf /backup/jenkins_home.tar /var/jenkins_home

# 복구
docker run --rm --volumes-from jenkins -v $(pwd):/backup ubuntu tar xvf /backup/jenkins_home.tar
```

## 9. 보안 설정
1. Jenkins 관리 > Configure Global Security
2. Enable security 체크
3. Jenkins' own user database 선택
4. Matrix-based security 선택
5. 필요한 권한 설정

## 10. 유지보수
### 10.1 컨테이너 업데이트
```bash
# 이미지 재빌드
docker-compose build

# 컨테이너 재시작
docker-compose up -d
```

### 10.2 디스크 공간 관리
```bash
# 사용하지 않는 이미지 삭제
docker image prune -a

# 사용하지 않는 볼륨 삭제
docker volume prune
``` 