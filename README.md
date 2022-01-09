install node, yarn and docker

install dependencies

    yarn install

start localstack

    docker-compose up -d localstack

build and run

    export NODE_AUTH_TOKEN=<github_PAT>

    yarn build
    yarn main

    yarn setup web

## K8s

install minikube and start

    minikube start

setup minikube cluster local docker registry

    eval $(minikube -p minikube docker-env)

build and push the container

    export NODE_AUTH_TOKEN=<github_PAT>

    yarn build
    yarn docker

enable ingress controller in minikube

    minikube addons enable ingress

add a line to /etc/hosts. Use minikube commands to find its ip.

    minikube ip

    <minikube cluster ip> ssmush.org

create and install a self signed ssl/tls cert. the domain is `ssmush.org`

    openssl req -nodes -new -x509 -keyout key.pem -out cert.pem
    kubectl -n kube-system create secret tls mkcert --key key.pem --cert cert.pem

export secret env vars for the app

    export GOOGLE_CLIENT_SECRET=xxxxxx
    export GOOGLE_CLIENT_ID=xxxxxx

create a namespace for the app

    kubectl create namespace ssmush-web

deploy the app to the cluster

    helm install ssmush-web -f values-dev.yaml --set env.GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID} --set env.GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET} --namespace ssmush-web .

visit `https://ssmush.org`

