#!/bin/bash
cf create-service discovery lite discovery
cf create-service fss-portfolio-service fss-portfolio-service-free-plan investment-portfolio
cf create-service fss-predictive-scenario-analytics-service fss-predictive-scenario-analytics-service-free-plan predictive-market-scenarios
cf create-service fss-scenario-analytics-service fss-scenario-analytics-service-free-plan simulated-instrument-analytics
cf create-service AppID bronze appID