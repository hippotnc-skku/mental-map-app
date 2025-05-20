FROM node:18-alpine

WORKDIR /app

# 필요한 시스템 패키지 설치
RUN apk add --no-cache python3 make g++

# 패키지 파일 복사 및 의존성 설치
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# 소스 코드 복사
COPY . .

# 빌드
RUN yarn build

# 포트 노출
EXPOSE 3000

# 애플리케이션 실행
CMD ["yarn", "start"] 