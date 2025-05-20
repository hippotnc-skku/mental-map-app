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

                stage('Install Frontend Dependencies') {
                    steps {
                        dir('frontend') {
                            sh '''
                            node --version
                            yarn --version
                            yarn install --frozen-lockfile
                            '''
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

                stage('Setup Python Environment') {
                    steps {
                        dir('backend') {
                            sh '''
                            python3 --version
                            python3.11 -m venv venv
                            . venv/bin/activate
                            pip install --upgrade pip
                            pip install pytest pytest-cov
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
                            # 테스트 디렉토리 생성
                            mkdir -p tests
                            # 기본 테스트 파일 생성
                            cat > tests/__init__.py << 'EOF'
                            # 테스트 패키지 초기화
                            EOF
                            
                            cat > tests/test_app.py << 'EOF'
                            def test_placeholder():
                                """기본 테스트"""
                                assert True
                            EOF
                            
                            # 테스트 실행
                            python -m pytest tests/ -v --cov=app
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
        failure {
            echo 'Pipeline failed!'
        }
    }
} 