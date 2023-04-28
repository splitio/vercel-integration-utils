# Vercel integration using Edge Config and Split SDK

## Overview

This package provides a Split Storage Wrapper for Vercel Edge Config, a low latency data storage used to store and retrieve feature flag definitions for running the Split SDK on the Edge.

Keeping feature flag definitions within an Edge Config instance enables the Split SDK to operate in [partial consumer mode](https://help.split.io/hc/en-us/articles/360058730852-Browser-SDK#sharing-state-with-a-pluggable-storage). This mode means that the SDK doesn't fetch feature flags from the Split backend, and instead relies on those stored in the Edge Config, thereby significantly reducing the latency during feature flag evaluations.

The package includes the storage wrapper module (`src/EdgeConfigWrapper.ts`), as well as an `example` folder to quickly get started with the integration.

The project overall architecture is ilustrated in the following diagram:

<p align="center">
  <img alt="Overview" src="./diagram.png" width="720">
</p>

## Setup

1. Install the [Split integration](https://TODO)
2. Install and setup the Split SDK in your application project
