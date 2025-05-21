pipeline {
    agent any

    parameters {
        choice(
            name: 'DEPLOY_TARGET',
            choices: ['backend', 'frontend', 'both'],
            description: 'Select deployment target'
        )
    }

    stages {
        // stage('Clone Repository') {
        //     steps {
        //         // 작업 디렉토리 생성
        //         sh 'mkdir -p ${WORKSPACE}'
                
        //         // Git 저장소 클론
        //         dir("${WORKSPACE}") {
        //             checkout([
        //                 $class: 'GitSCM',
        //                 branches: [[name: '*/main']],
        //                 extensions: [[$class: 'CleanBeforeCheckout']],
        //                 userRemoteConfigs: [[
        //                     credentialsId: 'github-key for jenkins',
        //                     url: 'https://github.com/hippotnc-skku/mental-map-app.git'
        //                 ]]
        //             ])
        //         }
        //     }
        // }

        stage('Deploy Frontend') {
            when {
                expression { params.DEPLOY_TARGET == 'frontend' || params.DEPLOY_TARGET == 'both' }
            }
            stages {
                stage('Setup Frontend Environment') {
                    steps {
                        withCredentials([string(credentialsId: 'mental-map-frontend-env-vars', variable: 'ENV_VARS_JSON')]) {
                            dir("${WORKSPACE}/frontend") {
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
                        dir("${WORKSPACE}/frontend") {
                            sh '''
                            docker build -t mental-map-frontend:latest .
                            '''
                        }
                    }
                }

                stage('Run Frontend Container') {
                    steps {
                        dir("${WORKSPACE}/frontend") {
                            sh '''
                            # 기존 컨테이너 중지 및 삭제
                            docker stop mental-map-frontend || true
                            docker rm mental-map-frontend || true
                            
                            # 새 컨테이너 실행
                            docker run -d \
                                --name mental-map-frontend \
                                --restart unless-stopped \
                                -p 8003:3000 \
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
                            dir("${WORKSPACE}/backend") {
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
                        dir("${WORKSPACE}/backend") {
                            sh '''
                            docker build -t mental-map-backend:latest .
                            '''
                        }
                    }
                }

                stage('Run Backend Container') {
                    steps {
                        dir("${WORKSPACE}/backend") {
                            sh '''
                            # 기존 컨테이너 중지 및 삭제
                            docker stop mental-map-backend || true
                            docker rm mental-map-backend || true
                            
                            # 새 컨테이너 실행
                            docker run -d \
                                --name mental-map-backend \
                                --restart unless-stopped \
                                -p 8002:8000 \
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
            dir("${WORKSPACE}/frontend") {
                sh 'rm -f .env.local'
            }
            dir("${WORKSPACE}/backend") {
                sh 'rm -f .env.dev'
            }
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
