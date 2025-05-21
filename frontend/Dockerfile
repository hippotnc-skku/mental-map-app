FROM node:18-alpine

WORKDIR /app

# 필요한 시스템 패키지 설치
RUN apk add --no-cache python3 make g++

# package.json만 먼저 복사
COPY package.json ./

# yarn.lock 파일이 있으면 복사, 없으면 무시
COPY yarn.lock* ./

# 의존성 설치
RUN yarn install

# 소스 코드 복사
COPY . .

# 빌드
RUN yarn build

# 포트 설정
EXPOSE 3000

# 실행
CMD ["yarn", "start"] 