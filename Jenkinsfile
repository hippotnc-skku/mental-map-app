pipeline {
    agent any

    environment {
        AWS_ACCOUNT_ID = '794921296945'
        AWS_REGION = 'ap-northeast-2'
        AWS_ACCESS_KEY_ID = credentials('AWS_ACCESS_KEY_ID')
        AWS_SECRET_ACCESS_KEY = credentials('AWS_SECRET_ACCESS_KEY')
        ECR_REPO = 'hippotnc/mental-map-app'  
        ECR_URL = "794921296945.dkr.ecr.ap-northeast-2.amazonaws.com/${ECR_REPO}"
        BUILD_TIME = "${new Date().format('yyyyMMdd-HHmm', TimeZone.getTimeZone('Asia/Seoul'))}"
    }

    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['dev', 'staging', 'prod'], description: '배포 환경 선택')
        choice(name: 'DEPLOY_TARGET', choices: ['backend', 'frontend', 'both'], description: '배포 대상')
    }

    stages {
        stage('Build & Push Frontend Image') {
            when { expression { params.DEPLOY_TARGET == 'frontend' || params.DEPLOY_TARGET == 'both' } }
            steps {
                dir("frontend") {
                    withCredentials([string(credentialsId: 'mental-map-frontend-env-vars', variable: 'ENV_VARS_JSON')]) {
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
                    }
                    sh """
                    docker build -t mantal-map-frontend:${BUILD_TIME} . && \
                    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL && \
                    docker tag mantal-map-frontend:${BUILD_TIME} $ECR_URL:frontend-${params.DEPLOY_ENV}-${BUILD_TIME} && \
                    docker push $ECR_URL:frontend-${params.DEPLOY_ENV}-${BUILD_TIME}
                    """
                }
            }
        }

        stage('Build & Push Backend Image') {
            when { expression { params.DEPLOY_TARGET == 'backend' || params.DEPLOY_TARGET == 'both' } }
            steps {
                dir("backend") {
                    script {
                        def DEPLOY_ENV = params.DEPLOY_ENV
                        def backendEnvCredId = "mental-map-backend-env-${DEPLOY_ENV}-vars"

                        withCredentials([string(credentialsId: backendEnvCredId, variable: 'ENV_VARS_JSON')]) {
                            writeFile file: 'env.json', text: ENV_VARS_JSON
                            sh """
                            python3 -c '
import json
data = json.load(open("env.json"))
with open(".env.${DEPLOY_ENV}", "w") as f:
    for k, v in data.items():
        f.write(f"{k}={v}\\n")'
                            rm env.json
                            """
                        }

                        sh """
                        docker build -t mantal-map-backend:${BUILD_TIME} . && \
                        aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL && \
                        docker tag mantal-map-backend:${BUILD_TIME} $ECR_URL:backend-${DEPLOY_ENV}-${BUILD_TIME} && \
                        docker push $ECR_URL:backend-${DEPLOY_ENV}-${BUILD_TIME}
                        """
                    }
                }
            }
        }

        stage('Deploy to Remote Server') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'ssh-private-key', keyFileVariable: 'SSH_KEY_FILE')]) {
                    script {
                        def TARGET_SERVER = ""
                        def FRONT_ENV_FILE = ".env.local"
                        def BACK_ENV_FILE = ".env.${params.DEPLOY_ENV}"

                        if (params.DEPLOY_ENV == 'dev') {
                            TARGET_SERVER = '10.0.0.144'
                        } else if (params.DEPLOY_ENV == 'staging') {
                            TARGET_SERVER = '10.0.0.187'
                        } else if (params.DEPLOY_ENV == 'prod') {
                            TARGET_SERVER = '10.0.0.95'
                        }

                        // SSH known_hosts 등록
                        sh "ssh-keyscan -H ${TARGET_SERVER} >> ~/.ssh/known_hosts"

                        if (params.DEPLOY_TARGET == 'frontend' || params.DEPLOY_TARGET == 'both') {
                            sh """
                            scp -i $SSH_KEY_FILE frontend/${FRONT_ENV_FILE} ubuntu@${TARGET_SERVER}:/home/ubuntu/ && \
                            ssh -i $SSH_KEY_FILE ubuntu@${TARGET_SERVER} "
                              docker pull $ECR_URL:frontend-${params.DEPLOY_ENV}-${BUILD_TIME} && 
                              docker stop mantal-map-frontend || true && 
                              docker rm mantal-map-frontend || true && 
                              docker run -d --name mantal-map-frontend --restart unless-stopped -p 8003:3000 \\
                                --env-file /home/ubuntu/${FRONT_ENV_FILE} $ECR_URL:frontend-${params.DEPLOY_ENV}-${BUILD_TIME}"
                            """
                        }

                        if (params.DEPLOY_TARGET == 'backend' || params.DEPLOY_TARGET == 'both') {
                            sh """
                            scp -i $SSH_KEY_FILE backend/${BACK_ENV_FILE} ubuntu@${TARGET_SERVER}:/home/ubuntu/ && \
                            ssh -i $SSH_KEY_FILE ubuntu@${TARGET_SERVER} "
                              docker pull $ECR_URL:backend-${params.DEPLOY_ENV}-${BUILD_TIME} && 
                              docker stop mantal-map-backend || true && 
                              docker rm mantal-map-backend || true && 
                              docker run -d --name mantal-map-backend --restart unless-stopped -p 8002:8000 \\
                                --env ENVIRONMENT=${params.DEPLOY_ENV} \\
                                --env-file /home/ubuntu/${BACK_ENV_FILE} \\
                                $ECR_URL:backend-${params.DEPLOY_ENV}-${BUILD_TIME}"
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        failure {
            echo '배포 실패!'
        }
    }
}
