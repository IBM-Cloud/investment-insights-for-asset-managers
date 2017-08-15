#!/bin/bash

# The branch may use a custom manifest
MANIFEST=manifest.yml
PREFIX=""
if [ -f ${REPO_BRANCH}-manifest.yml ]; then
  MANIFEST=${REPO_BRANCH}-manifest.yml
  PREFIX=$REPO_BRANCH"-"
fi
echo "Using manifest file: $MANIFEST"
echo "Using prefix: $PREFIX"

################################################################
# Create services
################################################################
cf create-service discovery lite ${PREFIX}discovery
cf create-service fss-portfolio-service fss-portfolio-service-free-plan ${PREFIX}investment-portfolio
cf create-service fss-predictive-scenario-analytics-service fss-predictive-scenario-analytics-service-free-plan ${PREFIX}predictive-market-scenarios
cf create-service fss-scenario-analytics-service fss-scenario-analytics-service-free-plan ${PREFIX}simulated-instrument-analytics


################################################################
# Push app with blue/green deployment
################################################################
if ! cf app $CF_APP; then
  if [ -z "$CF_APP_HOSTNAME" ]; then
    cf push $CF_APP -f $MANIFEST --no-start
  else
    cf push $CF_APP -f $MANIFEST --hostname $CF_APP_HOSTNAME --no-start
  fi
  cf start $CF_APP
else
  OLD_CF_APP=${CF_APP}-OLD-$(date +"%s")
  rollback() {
    set +e
    if cf app $OLD_CF_APP; then
      cf logs $CF_APP --recent
      cf delete $CF_APP -f
      cf rename $OLD_CF_APP $CF_APP
    fi
    exit 1
  }
  set -e
  trap rollback ERR
  cf rename $CF_APP $OLD_CF_APP
  if [ -z "$CF_APP_HOSTNAME" ]; then
    cf push $CF_APP -f $MANIFEST --no-start
  else
    cf push $CF_APP -f $MANIFEST --hostname $CF_APP_HOSTNAME --no-start
  fi
  cf start $CF_APP
  cf delete $OLD_CF_APP -f
fi
