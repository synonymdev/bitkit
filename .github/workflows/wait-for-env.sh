#!/bin/bash
# wait for the colima env to be ready, restart if not ready after 60 seconds

ATTEMPTS=30

while true
do
  echo "::group::check ports"

  echo -n "Bitcoin port 43782 "
  bitcoin=false
  for i in $(seq 1 $ATTEMPTS)
  do
    nc -z '127.0.0.1' 43782 > /dev/null 2>&1
    if [ $? -eq 0 ]; then
      echo " success!"
      bitcoin=true
      break
    fi
    echo -n "."
    sleep 1
  done

  if [ "$bitcoin" = true ] ; then
    echo -n "electrum port 60001 "
    for i in $(seq 1 $ATTEMPTS)
    do
      nc -z '127.0.0.1' 60001 > /dev/null 2>&1
      if [ $? -eq 0 ]; then
        echo " success!"
        echo "::endgroup::"
        exit 0
      fi
      echo -n "."
      sleep 1
    done
  fi

  echo " failed!"
  echo "::endgroup::"

  echo "::group::docker-compose ps"
  docker-compose -f docker/docker-compose.yml ps
  echo "::endgroup::"

  echo "::group::colima restart"
  colima restart
  echo "::endgroup::"
done

