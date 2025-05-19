pipeline {
    agent any

    parameters {
        choice(name: 'DEPLOY_TARGET', choices: ['frontend', 'backend', 'both'], description: 'Select deployment target')
    }

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-token',
                    url: 'https://github.com/hippotnc-skku/mental-map-app.git'
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
                            dir('frontend') {
                                sh '''
                                echo "${ENV_VARS_JSON}" > env.json
                                python3 -c "import json; f=open('env.json'); data=json.load(f); f.close(); f=open('.env.local', 'w'); [f.write(f'{k}={v}\\n') for k,v in data.items()]; f.close()"
                                rm env.json
                                '''
                            }
                        }
                    }
                }

                stage('Install Frontend Dependencies') {
                    steps {
                        dir('frontend') {
                            sh 'yarn install'
                        }
                    }
                }

                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'yarn build'
                        }
                    }
                }

                stage('Run Frontend with PM2') {
                    steps {
                        dir('frontend') {
                            sh '''
                            pm2 delete mental-map-frontend || true
                            pm2 start "yarn start" --name mental-map-frontend
                            pm2 save
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
                            dir('backend') {
                                sh '''
                                echo "${ENV_VARS_JSON}" > env.json
                                python3 -c "import json; f=open('env.json'); data=json.load(f); f.close(); f=open('.env.dev', 'w'); [f.write(f'{k}={v}\\n') for k,v in data.items()]; f.close()"
                                rm env.json
                                '''
                            }
                        }
                    }
                }

                stage('Setup Python Environment') {
                    steps {
                        dir('backend') {
                            sh '''
                            python3.11 -m venv venv
                            . venv/bin/activate
                            pip install --upgrade pip
                            pip install -r requirements.txt
                            '''
                        }
                    }
                }

                stage('Run Backend Tests') {
                    steps {
                        dir('backend') {
                            sh '''
                            . venv/bin/activate
                            python -m pytest
                            '''
                        }
                    }
                }

                stage('Run Backend with PM2') {
                    steps {
                        dir('backend') {
                            sh '''
                            pm2 delete mental-map-backend || true
                            pm2 start "python app/main.py" --name mental-map-backend
                            pm2 save
                            '''
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            dir('frontend') {
                sh 'rm -f .env.local'
            }
            dir('backend') {
                sh 'rm -f .env.dev'
            }
            cleanWs()
        }
    }
} 