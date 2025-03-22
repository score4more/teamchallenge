pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = "karthik4895/teamchallenge-backend"
        DOCKER_IMAGE_FRONTEND = "karthik4895/teamchallenge-frontend"
    }

    stages {
        stage('Build Backend') {
            steps {
                script {
                    sh 'docker build -t $DOCKER_IMAGE_BACKEND ./backend'
                    sh 'docker push $DOCKER_IMAGE_BACKEND'
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                script {
                    sh 'docker build -t $DOCKER_IMAGE_FRONTEND ./frontend'
                    sh 'docker push $DOCKER_IMAGE_FRONTEND'
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh 'kubectl apply -f k8s/'
            }
        }
    }
}
