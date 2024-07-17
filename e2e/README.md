# End-to-End (E2E) Tests

## Purpose

This directory contains end-to-end (E2E) tests for Bitkit. These tests are designed to verify the functionality of the application, ensuring that it behaves as expected from the user's perspective. Using a local regtest environment, greater control and reproducibility is achieved compared to the mainnet for reliable and consistent testing outcomes.

## Triggering Tests on Pull Requests

E2E tests are automatically triggered on pull requests for this repository. When a new pull request is created or updated, the E2E tests run to ensure that the changes do not introduce any regressions. The results of these tests are displayed in the pull request checks, and merging is prevented if any test failures occur. This ensures that only code that passes all tests is integrated into the main codebase.

## Running E2E Tests

You can run the end-to-end (E2E) tests locally if the correct environment is set up:

- Docker must be installed.
- For iOS Tests:
  - The host must be running macOS.
  - iOS Simulator must be installed, which comes with Xcode.
- For Android Tests:
  - An Android Virtual Device (AVD) must be set up.
  - The Android Debug Bridge (ADB) must be installed.

Additionally, you may need to update the `devices.emulator.device.avdName` and/or `devices.simulator.device.type` values in the .detoxrc.js configuration file to match your environment.

### Bash script

You can run the E2E tests locally with the `e2e/run.sh` script.

    Usage: run.sh <platform> <build|skip-build> [debug|release]
    Where <platform> is either 'android' or 'ios'
          <build|skip-build> specifies whether to build or skip the build step
          [debug|release] is an optional argument for the build type, defaulting to 'release'

### Using `act`

Alternatively, you can run the E2E tests using the [`act`](https://github.com/nektos/act) tool. This allows you to run the GitHub Actions workflows locally.

```sh
act -W .github/workflows/e2e-ios.yml -j e2e -P self-hosted=-self-hosted

act -W .github/workflows/e2e-android.yml -j e2e -P self-hosted=-self-hosted
```

## Contributing

We welcome contributions to improve our E2E tests. If you have any suggestions or find any issues, please open an issue or submit a pull request.
