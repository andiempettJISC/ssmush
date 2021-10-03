install node, yarn and docker

install dependencies

    yarn install

start localstack

    docker run --rm -it -e "SERVICES=ssm" -p 4566:4566 -p 4571:4571 localstack/localstack

build and run

    yarn build
    yarn main

