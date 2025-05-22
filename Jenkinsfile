pipeline {
    agent any

    environment {
        AWS_ACCOUNT_ID = '794921296945'
        AWS_REGION = 'ap-northeast-2'
        ECR_REPO = 'hippotnc/mantal-map-app'
        ECR_URL = '794921296945.dkr.ecr.ap-northeast-2.amazonaws.com/hippotnc/mantal-map-app'
        AWS_ACCESS_KEY_ID = credentials('AWS_ACCESS_KEY_ID')
        AWS_SECRET_ACCESS_KEY = credentials('AWS_SECRET_ACCESS_KEY')
    }

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
    with open("env.json", "r") as f:
        data = json.load(f)
    with open(".env.local", "w") as f:
        for k, v in data.items():
            f.write(f'{k}={v}\\n')
except json.JSONDecodeError as e:
    print(f'JSON 파싱 오류: {e}', file=sys.stderr)
    print('env.json 내용:', file=sys.stderr)
    with open("env.json", "r") as f:
        print(f.read(), file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"오류 발생: {e}", file=sys.stderr)
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
                            docker build -t mantal-map-frontend:latest .
                            '''
                        }
                    }
                }

                stage('Push Frontend Image to ECR') {
                    steps {
                        dir("${WORKSPACE}/frontend") {
                            sh '''
                            aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
                            aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
                            aws configure set default.region $AWS_REGION
                            aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL
                            docker tag mantal-map-frontend:latest $ECR_URL:frontend-latest
                            docker push $ECR_URL:frontend-latest
                            '''
                        }
                    }
                }

                stage('Run Frontend Container') {
                    steps {
                        dir("${WORKSPACE}/frontend") {
                            sh '''
                            docker stop mantal-map-frontend || true
                            docker rm mantal-map-frontend || true

                            docker pull $ECR_URL:frontend-latest

                            docker run -d \
                                --name mantal-map-frontend \
                                --restart unless-stopped \
                                -p 8003:3000 \
                                --env-file .env.local \
                                $ECR_URL:frontend-latest
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
                                python3 -c '
import json
import sys
try:
    with open("env.json", "r") as f:
        data = json.load(f)
    with open(".env.dev", "w") as f:
        for k, v in data.items():
            f.write(f"{k}={v}\\n")
except json.JSONDecodeError as e:
    print(f"JSON 파싱 오류: {e}", file=sys.stderr)
    print("env.json 내용:", file=sys.stderr)
    with open("env.json", "r") as f:
        print(f.read(), file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"오류 발생: {e}", file=sys.stderr)
    sys.exit(1)
'
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
                            docker build -t mantal-map-backend:latest .
                            '''
                        }
                    }
                }

                stage('Push Backend Image to ECR') {
                    steps {
                        dir("${WORKSPACE}/backend") {
                            sh '''
                            aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
                            aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
                            aws configure set default.region $AWS_REGION
                            aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL
                            docker tag mantal-map-backend:latest $ECR_URL:backend-latest
                            docker push $ECR_URL:backend-latest
                            '''
                        }
                    }
                }

                stage('Run Backend Container') {
                    steps {
                        dir("${WORKSPACE}/backend") {
                            sh '''
                            docker stop mantal-map-backend || true
                            docker rm mantal-map-backend || true

                            docker pull $ECR_URL:backend-latest

                            docker run -d \
                                --name mantal-map-backend \
                                --restart unless-stopped \
                                -p 0.0.0.0:8002:8000 \
                                --env-file .env.dev \
                                $ECR_URL:backend-latest
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
