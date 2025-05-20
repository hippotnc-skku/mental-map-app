pipeline {
    agent any

    parameters {
        choice(
            name: 'DEPLOY_TARGET',
            choices: ['frontend', 'backend', 'both'],
            description: '배포할 대상을 선택하세요'
        )
    }

    stages {
        stage('Clone Repository') {
            steps {
                // 작업 디렉토리 생성 및 이동
                sh '''
                    cd /var/jenkins_home/workspace
                    rm -rf mental-map-app
                    mkdir mental-map-app
                    cd mental-map-app
                    git clone https://github.com/hippotnc-skku/mental-map-app.git .
                    git checkout main
                '''
            }
        }

        stage('Deploy Frontend') {
            when {
                expression { params.DEPLOY_TARGET == 'frontend' || params.DEPLOY_TARGET == 'both' }
            }
            stages {
                stage('Setup Frontend Environment') {
                    steps {
                        withCredentials([string(credentialsId: 'mental-map-frontend-env-vars', variable: 'ENV_VARS_JSON')]) {
                            dir('/var/jenkins_home/workspace/mental-map-app/frontend') {
                                sh '''
                                echo "${ENV_VARS_JSON}" > env.json
                                python3 -c "
import json
import sys
try:
    with open('env.json', 'r') as f:
        data = json.load(f)
    with open('.env.local', 'w') as f:
        for k, v in data.items():
            f.write(f'{k}={v}\\n')
except json.JSONDecodeError as e:
    print(f'JSON 파싱 오류: {e}', file=sys.stderr)
    print('env.json 내용:', file=sys.stderr)
    with open('env.json', 'r') as f:
        print(f.read(), file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f'오류 발생: {e}', file=sys.stderr)
    sys.exit(1)
"
                                rm env.json
                                '''
                            }
                        }
                    }
                }

                stage('Build Frontend Docker Image') {
                    steps {
                        dir('/var/jenkins_home/workspace/mental-map-app/frontend') {
                            sh '''
                            docker build -t mental-map-frontend:latest .
                            '''
                        }
                    }
                }

                stage('Run Frontend Container') {
                    steps {
                        dir('/var/jenkins_home/workspace/mental-map-app/frontend') {
                            sh '''
                            # 기존 컨테이너 중지 및 삭제
                            docker stop mental-map-frontend || true
                            docker rm mental-map-frontend || true
                            
                            # 새 컨테이너 실행
                            docker run -d \
                                --name mental-map-frontend \
                                --restart unless-stopped \
                                -p 3000:3000 \
                                --env-file .env.local \
                                mental-map-frontend:latest
                            '''
                        }
                    }
                }
            }
        }

        stage('Deploy Backend') {
            when {
                expression { params.DEPLOY_TARGET == 'backend' || params.DEPLOY_TARGET == 'both' }
            }
            stages {
                stage('Setup Backend Environment') {
                    steps {
                        withCredentials([string(credentialsId: 'mental-map-backend-env-vars', variable: 'ENV_VARS_JSON')]) {
                            dir('/var/jenkins_home/workspace/mental-map-app/backend') {
                                sh '''
                                echo "${ENV_VARS_JSON}" > env.json
                                python3 -c "
import json
import sys
try:
    with open('env.json', 'r') as f:
        data = json.load(f)
    with open('.env.dev', 'w') as f:
        for k, v in data.items():
            f.write(f'{k}={v}\\n')
except json.JSONDecodeError as e:
    print(f'JSON 파싱 오류: {e}', file=sys.stderr)
    print('env.json 내용:', file=sys.stderr)
    with open('env.json', 'r') as f:
        print(f.read(), file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f'오류 발생: {e}', file=sys.stderr)
    sys.exit(1)
"
                                rm env.json
                                '''
                            }
                        }
                    }
                }

                stage('Build Backend Docker Image') {
                    steps {
                        dir('/var/jenkins_home/workspace/mental-map-app/backend') {
                            sh '''
                            docker build -t mental-map-backend:latest .
                            '''
                        }
                    }
                }

                stage('Run Backend Container') {
                    steps {
                        dir('/var/jenkins_home/workspace/mental-map-app/backend') {
                            sh '''
                            # 기존 컨테이너 중지 및 삭제
                            docker stop mental-map-backend || true
                            docker rm mental-map-backend || true
                            
                            # 새 컨테이너 실행
                            docker run -d \
                                --name mental-map-backend \
                                --restart unless-stopped \
                                -p 8000:8000 \
                                --env-file .env.dev \
                                mental-map-backend:latest
                            '''
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            dir('/var/jenkins_home/workspace/mental-map-app/frontend') {
                sh 'rm -f .env.local'
            }
            dir('/var/jenkins_home/workspace/mental-map-app/backend') {
                sh 'rm -f .env.dev'
            }
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
