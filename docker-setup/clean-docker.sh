docker stop $(docker ps -aq)
docker rm -f $(docker ps -aq)
docker rmi -f $(docker images -aq)
docker volume rm $(docker volume ls -q)
docker system prune -a --volumes -f
docker ps -a
docker images
docker volume ls
docker compose up --build -d